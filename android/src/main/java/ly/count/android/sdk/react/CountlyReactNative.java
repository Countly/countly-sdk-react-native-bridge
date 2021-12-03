package ly.count.android.sdk.react;

import android.app.Activity;
import android.util.Log;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.JavaScriptModule;


import android.content.Context;
import ly.count.android.sdk.Countly;
import ly.count.android.sdk.CountlyConfig;
import ly.count.android.sdk.DeviceId;
import ly.count.android.sdk.RemoteConfigCallback;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.Arrays;
import java.util.Map;
import java.util.HashMap;

//Push Plugin
import android.os.Build;
import android.app.NotificationManager;
import android.app.NotificationChannel;

import ly.count.android.sdk.StarRatingCallback;
import ly.count.android.sdk.messaging.CountlyPush;


import org.json.JSONObject;

import ly.count.android.sdk.ModuleFeedback.*;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.InstanceIdResult;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.firebase.FirebaseApp;


class CountlyReactException extends Exception {
    private String jsError;
    private String jsStack;
    private String jsMessage;
    CountlyReactException(String err, String message, String stack){
        jsError = err;
        jsStack = stack;
        jsMessage = message;
    }
    public String toString(){
        return "[React] " + jsError + ": " + jsMessage + "\n" + jsStack + "\n\nJava Stack:";
    }
}

public class CountlyReactNative extends ReactContextBaseJavaModule implements LifecycleEventListener {

    public static final String TAG = "CountlyRNPlugin";
    private String COUNTLY_RN_SDK_VERSION_STRING = "20.11.11";
    private String COUNTLY_RN_SDK_NAME = "js-rnb-android";

    private static CountlyConfig config = new CountlyConfig();
    private static Countly.CountlyMessagingMode messagingMode = Countly.CountlyMessagingMode.PRODUCTION;
    private static String channelName = "Default Name";
    private static String channelDescription = "Default Description";
    private static CCallback notificationListener = null;
    private static String lastStoredNotification = null;
    protected static boolean loggingEnabled = false;

    private boolean isOnResumeBeforeInit = false;
    private Boolean isSessionStarted_ = false;

    private ReactApplicationContext _reactContext;

    private final Set<String> validConsentFeatureNames = new HashSet<String>(Arrays.asList(
            Countly.CountlyFeatureNames.sessions,
            Countly.CountlyFeatureNames.events,
            Countly.CountlyFeatureNames.views,
            Countly.CountlyFeatureNames.location,
            Countly.CountlyFeatureNames.crashes,
            Countly.CountlyFeatureNames.attribution,
            Countly.CountlyFeatureNames.users,
            Countly.CountlyFeatureNames.push,
            Countly.CountlyFeatureNames.starRating,
            Countly.CountlyFeatureNames.apm,
            Countly.CountlyFeatureNames.feedback,
            Countly.CountlyFeatureNames.remoteConfig
    ));

    public CountlyReactNative(ReactApplicationContext reactContext) {
        super(reactContext);
        _reactContext = reactContext;
        this.config.enableManualAppLoadedTrigger();
        this.config.enableManualForegroundBackgroundTriggerAPM();
        reactContext.addLifecycleEventListener(this);
    }
    @Override
    public String getName() {
        return "CountlyReactNative";
    }

    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @ReactMethod
    public void init(ReadableArray args, Promise promise){
        log("Initializing...", LogLevel.DEBUG);
        String serverUrl = args.getString(0);
        String appKey = args.getString(1);
        String deviceId = args.getString(2);
        this.config.setServerURL(serverUrl);
        this.config.setAppKey(appKey);

        Countly.sharedInstance().COUNTLY_SDK_NAME = COUNTLY_RN_SDK_NAME;
        Countly.sharedInstance().COUNTLY_SDK_VERSION_STRING = COUNTLY_RN_SDK_VERSION_STRING;

        this.config.setContext(_reactContext);
        Activity activity = getActivity();
        if (activity != null) {
            this.config.setApplication(activity.getApplication());
        }
        else {
            log("init, Activity is null, some features will not work", LogLevel.WARNING);
        }
        if(deviceId == null || "".equals(deviceId)){
        }else{
            if(deviceId.equals("TemporaryDeviceID")){
                this.config.enableTemporaryDeviceIdMode();
            }else{
                this.config.setDeviceId(deviceId);
            }
        }
        Countly.sharedInstance().init(this.config);
        if(isOnResumeBeforeInit) {
            isOnResumeBeforeInit = false;
            Countly.sharedInstance().apm().triggerForeground();
        }
        promise.resolve("Success");
    }

    @ReactMethod
    public void setLoggingEnabled(ReadableArray args){
        Boolean enabled = args.getBoolean(0);
        this.config.setLoggingEnabled(enabled);
        loggingEnabled = enabled;
    }

    @ReactMethod
    public void isLoggingEnabled(final Promise promise){
        Boolean result = loggingEnabled;
        promise.resolve(result);
    }

    @ReactMethod
    public void isInitialized(Promise promise){
        Boolean result = Countly.sharedInstance().isInitialized();
        promise.resolve(result);
    }

    @ReactMethod
    public void hasBeenCalledOnStart(Promise promise){
        Boolean result = Countly.sharedInstance().hasBeenCalledOnStart();
        promise.resolve(result);
    }

    @ReactMethod
    public void getCurrentDeviceId(Promise promise){
        String deviceID = Countly.sharedInstance().getDeviceID();
        if (deviceID == null) {
            log("getCurrentDeviceId, deviceIdNotFound", LogLevel.DEBUG);
            promise.resolve("deviceIdNotFound");
        }
        else {
            log("getCurrentDeviceId: " + deviceID, LogLevel.DEBUG);
            promise.resolve(deviceID);
        }
    }

    @ReactMethod
    public void getDeviceIdAuthor(ReadableArray args, final Callback myCallback){
        DeviceId.Type deviceIDType = Countly.sharedInstance().getDeviceIDType();
        if (deviceIDType == null) {
            log("getDeviceIdAuthor, deviceIdAuthorNotFound", LogLevel.DEBUG);
            myCallback.invoke("deviceIdAuthorNotFound");
        }
        else {
            log("getDeviceIdAuthor: " + deviceIDType, LogLevel.DEBUG);
            if(deviceIDType == DeviceId.Type.DEVELOPER_SUPPLIED){
                myCallback.invoke("developerProvided");
            }else{
                myCallback.invoke("sdkGenerated");
            }
        }
    }

    @ReactMethod
    public void changeDeviceId(ReadableArray args){
        String newDeviceID = args.getString(0);
        String onServerString = args.getString(1);
        if(newDeviceID.equals("TemporaryDeviceID")){
            Countly.sharedInstance().enableTemporaryIdMode();
        }else{
            if ("1".equals(onServerString)) {
                Countly.sharedInstance().changeDeviceIdWithMerge(newDeviceID);
            } else {
                Countly.sharedInstance().changeDeviceIdWithoutMerge(DeviceId.Type.DEVELOPER_SUPPLIED, newDeviceID);
            }
        }
    }

    @ReactMethod
    public void setHttpPostForced(ReadableArray args){
        int isEnabled = Integer.parseInt(args.getString(0));
        if(isEnabled == 1){
            this.config.setHttpPostForced(true);
        }else{
            this.config.setHttpPostForced(false);
        }
    }

    @ReactMethod
    public void enableParameterTamperingProtection(ReadableArray args){
        String salt = args.getString(0);
        this.config.setParameterTamperingProtectionSalt(salt);
    }

    @ReactMethod
    public void pinnedCertificates(ReadableArray args){
        String certificateName = args.getString(0);
        this.config.enablePublicKeyPinning(this.readCertificate(certificateName));
    }

    public String [] readCertificate(String certificateName){
        String certificateString = "";
        BufferedReader reader = null;
        try {
            reader = new BufferedReader(
                    new InputStreamReader(this._reactContext.getAssets().open(certificateName)));

            // do reading, usually loop until end of file reading
            String mLine;
            while ((mLine = reader.readLine()) != null) {
                certificateString += mLine;
            }
            String certificateArray[] = new String[] {certificateString};
            return certificateArray;
        } catch (IOException e) {
            //log the exception
        } finally {
            if (reader != null) {
                try {
                    reader.close();
                } catch (IOException e) {
                    //log the exception
                }
            }
        }
        log("Certificate failed.", LogLevel.INFO);
        return new String[]{};
    }

    @ReactMethod
    public void setLocationInit(ReadableArray args){
        String countryCode = args.getString(0);
        String city = args.getString(1);
        String location = args.getString(2);
        String ipAddress = args.getString(3);
        if("null".equals(countryCode)){
            countryCode = null;
        }
        if("null".equals(city)){
            city = null;
        }
        if("null".equals(location)){
            location = null;
        }
        if("null".equals(ipAddress)){
            ipAddress = null;
        }
        this.config.setLocation(countryCode, city, location, ipAddress);
    }

    @ReactMethod
    public void setLocation(ReadableArray args){
        String countryCode = args.getString(0);
        String city = args.getString(1);
        String location = args.getString(2);
        String ipAddress = args.getString(3);
        if("null".equals(countryCode)){
            countryCode = null;
        }
        if("null".equals(city)){
            city = null;
        }
        if("null".equals(location)){
            location = null;
        }
        if("null".equals(ipAddress)){
            ipAddress = null;
        }
        Countly.sharedInstance().setLocation(countryCode, city, location, ipAddress);
    }

    @ReactMethod
    public void disableLocation(){
        Countly.sharedInstance().disableLocation();
    }

    @ReactMethod
    public void enableCrashReporting(){
        this.config.enableCrashReporting();
    }

    @ReactMethod
    public void addCrashLog(ReadableArray args){
        String record = args.getString(0);
        Countly.sharedInstance().crashes().addCrashBreadcrumb(record);
    }
    @ReactMethod
    public void logException(ReadableArray args){
        String exceptionString = args.getString(0);
        Exception exception = new Exception(exceptionString);

        Countly.sharedInstance().crashes().recordHandledException(exception);
    }
    @ReactMethod
    public void logJSException(String err, String message, String stack){
        Countly.sharedInstance().crashes().addCrashBreadcrumb(stack);
        Countly.sharedInstance().crashes().recordHandledException(new CountlyReactException(err, message, stack));
    }

    @ReactMethod
    public void setCustomCrashSegments(ReadableArray args){
        Map<String, Object> segments = new HashMap<String, Object>();
        for(int i=0,il=args.size();i<il;i+=2){
            segments.put(args.getString(i), args.getString(i+1));
        }
        this.config.setCustomCrashSegment(segments);
    }

    @ReactMethod
    public void event(ReadableArray args){
        String eventType = args.getString(0);
        if("event".equals(eventType)){
            String eventName = args.getString(1);
            int eventCount= Integer.parseInt(args.getString(2));
            Countly.sharedInstance().events().recordEvent(eventName, eventCount);
        }
        else if ("eventWithSum".equals(eventType)) {
            String eventName = args.getString(1);
            int eventCount= Integer.parseInt(args.getString(2));
            float eventSum= new Float(args.getString(3)).floatValue();
            Countly.sharedInstance().events().recordEvent(eventName, eventCount, eventSum);
        }
        else if ("eventWithSegment".equals(eventType)) {
            String eventName = args.getString(1);
            int eventCount= Integer.parseInt(args.getString(2));
            HashMap<String, Object> segmentation = new HashMap<String, Object>();
            for(int i=3,il=args.size();i<il;i+=2){
                segmentation.put(args.getString(i), args.getString(i+1));
            }
            Countly.sharedInstance().events().recordEvent(eventName, segmentation, eventCount);
        }
        else if ("eventWithSumSegment".equals(eventType)) {
            String eventName = args.getString(1);
            int eventCount= Integer.parseInt(args.getString(2));
            float eventSum= new Float(args.getString(3)).floatValue();
            HashMap<String, Object> segmentation = new HashMap<String, Object>();
            for(int i=4,il=args.size();i<il;i+=2){
                segmentation.put(args.getString(i), args.getString(i+1));
            }
            Countly.sharedInstance().events().recordEvent(eventName, segmentation, eventCount,eventSum);
        }
        else{
        }
    }

    @ReactMethod
    public void startEvent(ReadableArray args){
        String startEvent = args.getString(0);
        Countly.sharedInstance().events().startEvent(startEvent);
    }

    @ReactMethod
    public void cancelEvent(ReadableArray args){
        String cancelEvent = args.getString(0);
        Countly.sharedInstance().events().cancelEvent(cancelEvent);
    }

    @ReactMethod
    public void endEvent(ReadableArray args){
        String eventType = args.getString(0);
        if("event".equals(eventType)){
            String eventName = args.getString(1);
            Countly.sharedInstance().events().endEvent(eventName);
        }
        else if ("eventWithSum".equals(eventType)) {
            String eventName = args.getString(1);
            int eventCount= Integer.parseInt(args.getString(2));
            float eventSum= new Float(args.getString(3)).floatValue();
            Countly.sharedInstance().events().endEvent(eventName, null, eventCount,eventSum);
        }
        else if ("eventWithSegment".equals(eventType)) {
            String eventName = args.getString(1);
            int eventCount= Integer.parseInt(args.getString(2));
            HashMap<String, Object> segmentation = new HashMap<String, Object>();
            for(int i=4,il=args.size();i<il;i+=2){
                segmentation.put(args.getString(i), args.getString(i+1));
            }
            Countly.sharedInstance().events().endEvent(eventName, segmentation, eventCount,0);
        }
        else if ("eventWithSumSegment".equals(eventType)) {
            String eventName = args.getString(1);
            int eventCount= Integer.parseInt(args.getString(2));
            float eventSum= new Float(args.getString(3)).floatValue();
            HashMap<String, Object> segmentation = new HashMap<String, Object>();
            for(int i=4,il=args.size();i<il;i+=2){
                segmentation.put(args.getString(i), args.getString(i+1));
            }
            Countly.sharedInstance().events().endEvent(eventName, segmentation, eventCount,eventSum);
        }
        else{
        }
    }

    @ReactMethod
    public void recordView(ReadableArray args){
        String viewName = args.getString(0);
        HashMap<String, Object> segmentation = new HashMap<String, Object>();
        for(int i=1,il=args.size();i<il;i+=2){
            segmentation.put(args.getString(i), args.getString(i+1));
        }
        Countly.sharedInstance().recordView(viewName, segmentation);
    }

    @ReactMethod
    public void setUserData(ReadableArray args){
        Countly.sharedInstance();
        ReadableMap userData = args.getMap(0);
        Map<String, Object> userDataObjectMap = userData.toHashMap();
        Map<String,String> userDataMap =new HashMap<String,String>();
        for (Map.Entry<String, Object> entry : userDataObjectMap.entrySet()) {
            Object value = entry.getValue();
            if(value instanceof String){
                userDataMap.put(entry.getKey(), (String) value);
            }
        }

        Countly.userData.setUserData(userDataMap);
        Countly.userData.save();
    }

    @ReactMethod
    public void sendPushToken(ReadableArray args){
        String pushToken = args.getString(0);
        CountlyPush.onTokenRefresh(pushToken);
    }

    @ReactMethod
    public void pushTokenType(ReadableArray args) {
        int messagingMode = Integer.parseInt(args.getString(0));
        this.channelName = args.getString(1);
        this.channelDescription = args.getString(2);
        log("pushTokenType [" + messagingMode + "][" + this.channelName + "][" + this.channelDescription + "]", LogLevel.INFO);

        if (messagingMode == 0) {
            this.messagingMode = Countly.CountlyMessagingMode.PRODUCTION;
        } else {
            this.messagingMode = Countly.CountlyMessagingMode.TEST;
        }
    }

    @ReactMethod
    public static void onNotification(Map<String, String> notification){
        JSONObject json = new JSONObject(notification);
        String notificationString = json.toString();
        log("onNotification [" + notificationString + "]", LogLevel.INFO);

        if(notificationListener != null){
            //there is a listener for notifications, send the just received notification to it
            log("onNotification, listener exists", LogLevel.INFO);
            notificationListener.callback(notificationString);
        }else{
            //there is no listener for notifications. Store this notification for when a listener is created
            log("onNotification, listener does not exist", LogLevel.INFO);
            lastStoredNotification = notificationString;
        }
    }

    public interface CCallback {
        void callback(String result);
    }
    @ReactMethod
    public void registerForNotification(ReadableArray args){
        final Context context = this._reactContext;
        notificationListener = new CCallback(){
            @Override
            public void callback(String result) {
                log("registerForNotification callback result [" + result + "]", LogLevel.WARNING);
                ((ReactApplicationContext) context)
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onCountlyPushNotification", result);
            }
        };
        log("registerForNotification theCallback", LogLevel.INFO);
        if(lastStoredNotification != null){
            notificationListener.callback(lastStoredNotification);
            lastStoredNotification = null;
        }
    }

    @ReactMethod
    public void askForNotificationPermission(ReadableArray args){
        Activity activity = this.getActivity();
        if (activity == null) {
            log("askForNotificationPermission failed, Activity is null", LogLevel.ERROR);
            return;
        }
        Context context = this._reactContext;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                NotificationChannel channel = new NotificationChannel(CountlyPush.CHANNEL_ID, channelName, NotificationManager.IMPORTANCE_DEFAULT);
                channel.setDescription(channelDescription);
                notificationManager.createNotificationChannel(channel);
            }
        }
        CountlyPush.useAdditionalIntentRedirectionChecks = true;
        CountlyPush.init(activity.getApplication(), messagingMode);
        try{
            FirebaseApp.initializeApp(context);
            FirebaseInstanceId firebaseInstanceId = FirebaseInstanceId.getInstance();
            if(firebaseInstanceId == null) {
                log("askForNotificationPermission, firebaseInstanceId is null", LogLevel.WARNING);
                return;
            }
            Task<InstanceIdResult> instanceIdResultTask = firebaseInstanceId.getInstanceId();
            if(instanceIdResultTask == null) {
                log("askForNotificationPermission, instanceIdResultTask is null", LogLevel.WARNING);
                return;
            }
            instanceIdResultTask.addOnCompleteListener(new OnCompleteListener<InstanceIdResult>() {
                @Override
                public void onComplete(Task<InstanceIdResult> task) {
                    if (!task.isSuccessful()) {
                        log("askForNotificationPermission, getInstanceId failed", task.getException(), LogLevel.WARNING);
                        return;
                    }
                    String token = task.getResult().getToken();
                    CountlyPush.onTokenRefresh(token);
                }
            });
        }catch(Exception exception){
            log("askForNotificationPermission, Firebase exception",exception, LogLevel.WARNING);
        }
    }

    @ReactMethod
    public void start(){
        if (isSessionStarted_) {
            log("session already started", LogLevel.INFO);
            return;
        }
        Activity activity = this.getActivity();
        if (activity == null) {
            log("While calling 'start', Activity is null", LogLevel.WARNING);
        }
        Countly.sharedInstance().onStart(activity);
        isSessionStarted_ = true;
    }

    @ReactMethod
    public void stop(){
        if (!isSessionStarted_) {
            log("must call Start before Stop", LogLevel.INFO);
            return;
        }
        Countly.sharedInstance().onStop();
        isSessionStarted_ = false;
    }

    @ReactMethod
    public void userData_setProperty(ReadableArray args){
        Countly.sharedInstance();
        String keyName = args.getString(0);
        String keyValue = args.getString(1);
        Countly.userData.setProperty(keyName, keyValue);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_increment(ReadableArray args){
        Countly.sharedInstance();
        String keyName = args.getString(0);
        Countly.userData.increment(keyName);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_incrementBy(ReadableArray args){
        Countly.sharedInstance();
        String keyName = args.getString(0);
        int keyIncrement = Integer.parseInt(args.getString(1));
        Countly.userData.incrementBy(keyName, keyIncrement);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_multiply(ReadableArray args){
        Countly.sharedInstance();
        String keyName = args.getString(0);
        int multiplyValue = Integer.parseInt(args.getString(1));
        Countly.userData.multiply(keyName, multiplyValue);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_saveMax(ReadableArray args){
        Countly.sharedInstance();
        String keyName = args.getString(0);
        int maxScore = Integer.parseInt(args.getString(1));
        Countly.userData.saveMax(keyName, maxScore);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_saveMin(ReadableArray args){
        Countly.sharedInstance();
        String keyName = args.getString(0);
        int minScore = Integer.parseInt(args.getString(1));
        Countly.userData.saveMin(keyName, minScore);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_setOnce(ReadableArray args){
        Countly.sharedInstance();
        String keyName = args.getString(0);
        String minScore = args.getString(1);
        Countly.userData.setOnce(keyName, minScore);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_pushUniqueValue(ReadableArray args){
        Countly.sharedInstance();
        String keyName = args.getString(0);
        String keyValue = args.getString(1);
        Countly.userData.pushUniqueValue(keyName, keyValue);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_pushValue(ReadableArray args){
        Countly.sharedInstance();
        String keyName = args.getString(0);
        String keyValue = args.getString(1);
        Countly.userData.pushValue(keyName, keyValue);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_pullValue(ReadableArray args){
        Countly.sharedInstance();
        String keyName = args.getString(0);
        String keyValue = args.getString(1);
        Countly.userData.pullValue(keyName, keyValue);
        Countly.userData.save();
    }

    // GDPR
    @ReactMethod
    public void setRequiresConsent(ReadableArray args){
        Boolean consentFlag = args.getBoolean(0);
        this.config.setRequiresConsent(consentFlag);
    }

    @ReactMethod
    public void giveConsentInit(ReadableArray featureNames){
        List<String> features = new ArrayList<>();
        for (int i = 0; i < featureNames.size(); i++) {
            String featureName = featureNames.getString(i);
            if (validConsentFeatureNames.contains(featureName)) {
                features.add(featureName);
            }
            else {
                log("Not a valid consent feature to add: " + featureName, LogLevel.DEBUG);
            }
        }
        this.config.setConsentEnabled(features.toArray(new String[features.size()]));
    }

    @ReactMethod
    public void giveConsent(ReadableArray featureNames){
        List<String> features = new ArrayList<>();
        for (int i = 0; i < featureNames.size(); i++) {
            String featureName = featureNames.getString(i);
            if (validConsentFeatureNames.contains(featureName)) {
                features.add(featureName);
            }
            else {
                log("Not a valid consent feature to add: " + featureName, LogLevel.DEBUG);
            }
        }
        Countly.sharedInstance().consent().giveConsent(features.toArray(new String[features.size()]));
    }

    @ReactMethod
    public void removeConsent(ReadableArray featureNames){
        List<String> features = new ArrayList<>();
        for (int i = 0; i < featureNames.size(); i++) {
            String featureName = featureNames.getString(i);
            if (validConsentFeatureNames.contains(featureName)) {
                features.add(featureName);
            }
            else {
                log("Not a valid consent feature to remove: " + featureName, LogLevel.DEBUG);
            }
        }
        Countly.sharedInstance().consent().removeConsent(features.toArray(new String[features.size()]));
    }

    @ReactMethod
    public void giveAllConsent(){
        Countly.sharedInstance().consent().giveConsentAll();
    }

    @ReactMethod
    public void removeAllConsent(){
        Countly.sharedInstance().consent().removeConsentAll();
    }


    @ReactMethod
    public void remoteConfigUpdate(ReadableArray args, final Callback myCallback){
        Countly.sharedInstance().remoteConfig().update(new RemoteConfigCallback() {
            String resultString = "";
            @Override
            public void callback(String error) {
                if(error == null) {
                    resultString = "Remote Config is updated and ready to use!";
                } else {
                    resultString = "There was an error while updating Remote Config: " + error;
                }
                myCallback.invoke(resultString);
            }
        });
    }

    @ReactMethod
    public void updateRemoteConfigForKeysOnly(ReadableArray args, final Callback myCallback){
        String[] newArray = new String[args.size()];
        for(int cnt=0;cnt<args.size();cnt++)
        {
            newArray[cnt] = args.getString(cnt);
        }
        Countly.sharedInstance().remoteConfig().updateForKeysOnly(newArray, new RemoteConfigCallback() {
            String resultString = "";
            @Override
            public void callback(String error) {
                if(error == null) {
                    resultString = "Remote Config is updated only for given keys and ready to use!";
                } else {
                    resultString = "There was an error while updating Remote Config: " + error;
                }
                myCallback.invoke(resultString);
            }
        });
    }


    @ReactMethod
    public void updateRemoteConfigExceptKeys(ReadableArray args, final Callback myCallback){
        String[] newArray = new String[args.size()];
        for(int cnt=0;cnt<args.size();cnt++)
        {
            newArray[cnt] = args.getString(cnt);
        }
        Countly.sharedInstance().remoteConfig().updateExceptKeys(newArray, new RemoteConfigCallback() {
            String resultString = "";
            @Override
            public void callback(String error) {
                if (error == null) {
                    resultString = "Remote Config is updated except for given keys and ready to use !";
                } else {
                    resultString = "There was an error while updating Remote Config: " + error;
                }
                myCallback.invoke(resultString);
            }
        });
    }

    @ReactMethod
    public void getRemoteConfigValueForKey(ReadableArray args, final Callback myCallback){
        String keyName = args.getString(0);
        Object keyValue = Countly.sharedInstance().remoteConfig().getValueForKey(keyName);
        if (keyValue == null) {
            log("getRemoteConfigValueForKey, [" + keyName + "]: ConfigKeyNotFound", LogLevel.DEBUG);
            myCallback.invoke("ConfigKeyNotFound");
        }
        else {
            String resultString = (keyValue).toString();
            log("getRemoteConfigValueForKey, [" + keyName + "]: " + resultString, LogLevel.DEBUG);
            myCallback.invoke(resultString);
        }
    }

    @ReactMethod
    public void getRemoteConfigValueForKeyP(String keyName, Promise promise){
        Object keyValue = Countly.sharedInstance().remoteConfig().getValueForKey(keyName);
        if (keyValue == null) {
            log("getRemoteConfigValueForKeyP, [" + keyName + "]: ConfigKeyNotFound", LogLevel.DEBUG);
            promise.reject("ConfigKeyNotFound", null, null, null);
        }
        else {
            String resultString = (keyValue).toString();
            log("getRemoteConfigValueForKeyP, [" + keyName + "]: " + resultString, LogLevel.DEBUG);
            promise.resolve(resultString);
        }
    }

    @ReactMethod
    public void remoteConfigClearValues(Promise promise){
        Countly.sharedInstance().remoteConfig().clearStoredValues();
        promise.resolve("Remote Config Cleared.");
    }
    @ReactMethod
    public void setStarRatingDialogTexts(ReadableArray args) {
        this.config.setStarRatingTextTitle(args.getString(0));
        this.config.setStarRatingTextMessage(args.getString(1));
        this.config.setStarRatingTextDismiss(args.getString(2));
    }
    @ReactMethod
    public void showStarRating(ReadableArray args, final Callback callback){
        Activity activity = getActivity();
        if (activity == null) {
            log("showStarRating failed, Activity is null", LogLevel.ERROR);
            return;
        }
        Countly.sharedInstance().ratings().showStarRating(activity, new StarRatingCallback(){

            @Override
            public void onRate(int rating) {
                callback.invoke("Rating: "+rating);
            }

            @Override
            public void onDismiss() {
                callback.invoke("User canceled");
            }
        });

    }

    @ReactMethod
    public void showFeedbackPopup(ReadableArray args){
        Activity activity = getActivity();
        if (activity == null) {
            log("showFeedbackPopup failed, Activity is null", LogLevel.ERROR);
            return;
        }
        String widgetId = args.getString(0);
        String closeFeedBackButton = args.getString(1);
        Countly.sharedInstance().ratings().showFeedbackPopup( widgetId, closeFeedBackButton, activity, null);
    }

    @ReactMethod
    public void getFeedbackWidgets(final Promise promise)
    {
        Countly.sharedInstance().feedback().getAvailableFeedbackWidgets(new RetrieveFeedbackWidgets() {
            @Override
            public void onFinished(List<CountlyFeedbackWidget> retrievedWidgets, String error) {
                if(error != null) {
                    promise.reject("getFeedbackWidgets", error);
                    return;
                }
                WritableArray retrievedWidgetsArray = new WritableNativeArray();
                for (CountlyFeedbackWidget presentableFeedback : retrievedWidgets) {
                    WritableMap feedbackWidget = new WritableNativeMap();
                    feedbackWidget.putString("id", presentableFeedback.widgetId);
                    feedbackWidget.putString("type", presentableFeedback.type.name());
                    feedbackWidget.putString("name", presentableFeedback.name);
                    retrievedWidgetsArray.pushMap(feedbackWidget);
                }
                promise.resolve(retrievedWidgetsArray);
            }
        });
    }

    @ReactMethod
    public void getAvailableFeedbackWidgets(final Promise promise)
    {
        Countly.sharedInstance().feedback().getAvailableFeedbackWidgets(new RetrieveFeedbackWidgets() {
            @Override
            public void onFinished(List<CountlyFeedbackWidget> retrievedWidgets, String error) {
                if(error != null) {
                    promise.reject("getAvailableFeedbackWidgets", error);
                    return;
                }
                WritableMap retrievedWidgetsMap = new WritableNativeMap();
                for (CountlyFeedbackWidget presentableFeedback : retrievedWidgets) {
                    retrievedWidgetsMap.putString(presentableFeedback.type.name(), presentableFeedback.widgetId);
                }
                promise.resolve(retrievedWidgetsMap);
            }
        });
    }

    @ReactMethod
    public void presentFeedbackWidget(ReadableArray args, final Promise promise) {
        Activity activity = getActivity();
        if (activity == null) {
            log("presentFeedbackWidget failed : Activity is null", LogLevel.ERROR);
            promise.reject("presentFeedbackWidget Failed", "Activity is null");
            return;
        }
        String widgetId = args.getString(0);
        String type = args.getString(1);
        String name = args.getString(2);
        String closeBtnText = args.getString(3);

        CountlyFeedbackWidget presentableFeedback = new CountlyFeedbackWidget();
        presentableFeedback.widgetId = widgetId;
        presentableFeedback.type = FeedbackWidgetType.valueOf(type);
        presentableFeedback.name = name;
        Countly.sharedInstance().feedback().presentFeedbackWidget(presentableFeedback, activity, closeBtnText, new FeedbackCallback() {
            @Override
            public void onFinished(String error) {
                if(error != null) {
                    promise.reject("presentFeedbackWidget", error);
                }
                else {
                    promise.resolve("presentFeedbackWidget success");
                }
            }
        });
    }


    @ReactMethod
    public void replaceAllAppKeysInQueueWithCurrentAppKey() {
        Countly.sharedInstance().requestQueueOverwriteAppKeys();
    }

    @ReactMethod
    public void removeDifferentAppKeysFromQueue() {
        Countly.sharedInstance().requestQueueEraseAppKeysRequests();
    }

    @ReactMethod
    public void setEventSendThreshold(ReadableArray args){
        int size = Integer.parseInt(args.getString(0));
        this.config.setEventQueueSizeToSend(size);
        // Countly.sharedInstance().setEventQueueSizeToSend(size);
    }

    @ReactMethod
    public void startTrace(ReadableArray args){
        String traceKey = args.getString(0);
        Countly.sharedInstance().apm().startTrace(traceKey);
    }

    @ReactMethod
    public void cancelTrace(ReadableArray args){
        String traceKey = args.getString(0);
        Countly.sharedInstance().apm().cancelTrace(traceKey);
    }

    @ReactMethod
    public void clearAllTraces(ReadableArray args){
        Countly.sharedInstance().apm().cancelAllTraces();
    }

    @ReactMethod
    public void endTrace(ReadableArray args){
        String traceKey = args.getString(0);
        HashMap<String, Integer> customMetric = new HashMap<String, Integer>();
        for (int i = 1, il = args.size(); i < il; i += 2) {
            try{
                customMetric.put(args.getString(i), Integer.parseInt(args.getString(i + 1)));
            }catch(Exception exception){
                log("endTrace, could not parse metrics, skipping it. ", LogLevel.ERROR);
            }
        }
        Countly.sharedInstance().apm().endTrace(traceKey, customMetric);
    }

    @ReactMethod
    public void recordNetworkTrace(ReadableArray args){
        try{
            String networkTraceKey = args.getString(0);
            int responseCode = Integer.parseInt(args.getString(1));
            int requestPayloadSize = Integer.parseInt(args.getString(2));
            int responsePayloadSize = Integer.parseInt(args.getString(3));
            long startTime = Long.parseLong(args.getString(4));
            long endTime = Long.parseLong(args.getString(5));
            Countly.sharedInstance().apm().recordNetworkTrace(networkTraceKey, responseCode, requestPayloadSize, responsePayloadSize, startTime, endTime);
        }catch(Exception exception){
            log("Exception occured at recordNetworkTrace method: " + exception.toString(), LogLevel.ERROR);
        }
    }

    @ReactMethod
    public void enableApm(ReadableArray args){
        this.config.setRecordAppStartTime(true);
    }

    @ReactMethod
    public void enableAttribution(){
        this.config.setEnableAttribution(true);
    }

    @ReactMethod
    public void recordAttributionID(ReadableArray args){
        String attributionID = args.getString(0);
        log("recordAttributionID: Not implemented for Android", LogLevel.DEBUG);
    }

    @ReactMethod
    public void appLoadingFinished(){
        Countly.sharedInstance().apm().setAppIsLoaded();
    }

    @ReactMethod
    public void setCustomMetrics(ReadableArray args){
        Map<String, String> customMetric = new HashMap<>();
        for (int i = 0, il = args.size(); i < il; i += 2) {
            try{
                if(i+1 < il) {
                    customMetric.put(args.getString(i), args.getString(i + 1));
                }
            }catch(Exception exception){
                log("setCustomMetrics, could not parse metrics, skipping it. ", LogLevel.ERROR);
            }
        }
        this.config.setMetricOverride(customMetric);
    }

    enum LogLevel {INFO, DEBUG, VERBOSE, WARNING, ERROR}
    static void log(String message, LogLevel logLevel)  {
        log(message, null, logLevel);
    }

    static void log(String message, Throwable tr, LogLevel logLevel)  {
        if(!loggingEnabled) {
            return;
        }
        switch (logLevel) {
            case INFO:
                Log.i(TAG, message, tr);
                break;
            case DEBUG:
                Log.d(TAG, message, tr);
                break;
            case WARNING:
                Log.w(TAG, message, tr);
                break;
            case ERROR:
                Log.e(TAG, message, tr);
                break;
            case VERBOSE:
                Log.v(TAG, message, tr);
                break;
        }
    }

    Activity getActivity() {
        Activity activity = getCurrentActivity();
        if(activity == null && _reactContext != null)
        {
            activity = _reactContext.getCurrentActivity();
        }
        return activity;
    }

    @Override
    public void onHostResume() {
        if(Countly.sharedInstance().isInitialized()) {
            if (isSessionStarted_) {
                Activity activity = getActivity();
                Countly.sharedInstance().onStart(activity);
            }
            Countly.sharedInstance().apm().triggerForeground();
        }
        else {
            isOnResumeBeforeInit = true;
        }
    }

    @Override
    public void onHostPause() {
        if(Countly.sharedInstance().isInitialized()) {
            if (isSessionStarted_) {
                Countly.sharedInstance().onStop();
            }
            Countly.sharedInstance().apm().triggerBackground();
        }
    }

    @Override
    public void onHostDestroy() {

    }

}
