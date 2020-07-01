package ly.count.android.sdk.react;

import android.app.Activity;
import android.util.Log;

import com.facebook.react.bridge.Callback;
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

public class CountlyReactNative extends ReactContextBaseJavaModule {
    private static CountlyConfig config = new CountlyConfig();
    private static Countly.CountlyMessagingMode messagingMode = Countly.CountlyMessagingMode.PRODUCTION;
    private static String channelName = "Default Name";
    private static String channelDescription = "Default Description";
    private static CCallback notificationListener = null;
    private static String lastStoredNotification = null;

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
            Countly.CountlyFeatureNames.starRating
    ));

    public CountlyReactNative(ReactApplicationContext reactContext) {
        super(reactContext);
        _reactContext = reactContext;
    }
    @Override
    public String getName() {
        return "CountlyReactNative";
    }

    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @ReactMethod
    public void init(ReadableArray args){
        Log.d(Countly.TAG, "[CountlyReactNative] Initializing...");
        String serverUrl = args.getString(0);
        String appKey = args.getString(1);
        String deviceId = args.getString(2);
        // String ratingTitle = args.getString(4);
        // String ratingMessage = args.getString(5);
        // String ratingButton = args.getString(6);
        // Boolean consentFlag = args.getBoolean(7);
        // int ratingLimit = Integer.parseInt(args.getString(3));
        this.config.setServerURL(serverUrl);
        this.config.setAppKey(appKey);
        this.config.setContext(_reactContext);
        if("".equals(deviceId)){
        }else{
            if(deviceId.equals("TemporaryDeviceID")){
                this.config.enableTemporaryDeviceIdMode();
            }else{
                this.config.setDeviceId(deviceId);
            }
        }
        Countly.sharedInstance().init(this.config);
        // Countly.sharedInstance().setRequiresConsent(consentFlag);
        // Countly.sharedInstance()
        //         .init(_reactContext, serverUrl, appKey, deviceId, DeviceId.Type.OPEN_UDID, ratingLimit, null, ratingTitle, ratingMessage, ratingButton);
    }

    @ReactMethod
    public void setLoggingEnabled(ReadableArray args){
        Boolean enabled = args.getBoolean(0);
        this.config.setLoggingEnabled(enabled);
        // Countly.sharedInstance().setLoggingEnabled(enabled);
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
        Log.i(Countly.TAG, "[CountlyReactNative] Certificate failed.");
        return new String[]{};
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

        // Boolean nonfatal = args.getBoolean(1);

        // HashMap<String, Object> segments = new HashMap<String, Object>();
        // for(int i=2,il=args.size();i<il;i+=2){
        //     segments.put(args.getString(i), args.getString(i+1));
        // }
        // segments.put("nonfatal", nonfatal.toString());
        // this.config.setCustomCrashSegment(segments);
        // Countly.sharedInstance().setCustomCrashSegments(segments);

        Countly.sharedInstance().crashes().recordHandledException(exception);
    }
    @ReactMethod
    public void logJSException(String err, String message, String stack){
        Countly.sharedInstance().crashes().addCrashBreadcrumb(stack);
        Countly.sharedInstance().crashes().recordHandledException(new CountlyReactException(err, message, stack));
    }
    /*
    @ReactMethod
    public void testCrash() throws Exception{
       testCrashAux1(42);
    }
    private void testCrashAux1(int x) throws Exception{
        testCrashAux2(x*2, "test");
    }
    private void testCrashAux2(int x, String s) throws Exception{
        Countly.sharedInstance().logException(new Exception("Some test exception"));
    }
    */
    @ReactMethod
    public void setCustomCrashSegments(ReadableArray args){
        Map<String, Object> segments = new HashMap<String, Object>();
        for(int i=0,il=args.size();i<il;i++){
            segments.put(args.getString(i), args.getString(i));
        }
        this.config.setCustomCrashSegment(segments);
        // Countly.sharedInstance().setCustomCrashSegments(segments);
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
    public void setViewTracking(ReadableArray args){
        String flag = args.getString(0);
        if("true".equals(flag)){
            this.config.setViewTracking(true);
            // Countly.sharedInstance().setViewTracking(true);
        }else{
            this.config.setViewTracking(false);
            // Countly.sharedInstance().setViewTracking(false);
        }
    }

    @ReactMethod
    public void setUserData(ReadableArray args){
        Map<String, String> bundle = new HashMap<String, String>();
        bundle.put("name", args.getString(0));
        bundle.put("username", args.getString(1));
        bundle.put("email", args.getString(2));
        bundle.put("organization", args.getString(3));
        bundle.put("phone", args.getString(4));
        bundle.put("picture", args.getString(5));
        bundle.put("picturePath", args.getString(6));
        bundle.put("gender", args.getString(7));
        bundle.put("byear", String.valueOf(args.getInt(8)));
        Countly.userData.setUserData(bundle);
        Countly.userData.save();
    }

    @ReactMethod
    public void sendPushToken(ReadableArray args){
        String pushToken = args.getString(0);
        int messagingMode = Integer.parseInt(args.getString(1));

        Countly.CountlyMessagingMode mode = null;
        if(messagingMode == 0){
            mode = Countly.CountlyMessagingMode.PRODUCTION;
        }
        else{
            mode = Countly.CountlyMessagingMode.TEST;
        }
        Countly.sharedInstance().onRegistrationId(pushToken, mode);
    }

    @ReactMethod
    public void pushTokenType(ReadableArray args){
        int messagingMode = Integer.parseInt(args.getString(0));
        this.channelName = args.getString(1);
        this.channelDescription = args.getString(2);

        if(messagingMode == 0){
            this.messagingMode = Countly.CountlyMessagingMode.PRODUCTION;
        }
        else{
            this.messagingMode = Countly.CountlyMessagingMode.TEST;
        }
    }

    @ReactMethod
    public static void onNotification(Map<String, String> notification){
        JSONObject json = new JSONObject(notification);
        String notificationString = json.toString();
        Log.i(Countly.TAG, "[CountlyReactNative] onNotification [" + notificationString + "]");
        if(notificationListener != null){
            notificationListener.callback(notificationString);
        }else{
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
                Log.w(Countly.TAG, "[CountlyReactNative] registerForNotification callback result [" + result + "]");
                ((ReactApplicationContext) context)
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onCountlyPushNotification", result);
            }
        };
        Log.i(Countly.TAG, "[CountlyReactNative] registerForNotification theCallback");
        if(lastStoredNotification != null){
            notificationListener.callback(lastStoredNotification);
            lastStoredNotification = null;
        }
    }

    @ReactMethod
    public void askForNotificationPermission(ReadableArray args){
        Activity activity = this._reactContext.getCurrentActivity();
        Context context = this._reactContext;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                NotificationChannel channel = new NotificationChannel(CountlyPush.CHANNEL_ID, channelName, NotificationManager.IMPORTANCE_DEFAULT);
                channel.setDescription(channelDescription);
                notificationManager.createNotificationChannel(channel);
            }
        }
        CountlyPush.init(activity.getApplication(), messagingMode);
        FirebaseApp.initializeApp(context);
        FirebaseInstanceId.getInstance().getInstanceId()
                .addOnCompleteListener(new OnCompleteListener<InstanceIdResult>() {
                    @Override
                    public void onComplete(Task<InstanceIdResult> task) {
                        if (!task.isSuccessful()) {
                            Log.w(Countly.TAG, "[CountlyReactNative] getInstanceId failed", task.getException());
                            return;
                        }
                        String token = task.getResult().getToken();
                        CountlyPush.onTokenRefresh(token);
                    }
                });
    }

    @ReactMethod
    public void start(){
        Countly.sharedInstance().onStart(getCurrentActivity());
    }

    @ReactMethod
    public void stop(){
        Countly.sharedInstance().onStop();
    }

    @ReactMethod
    public void userData_setProperty(ReadableArray args){
        String keyName = args.getString(0);
        String keyValue = args.getString(1);
        Countly.userData.setProperty(keyName, keyValue);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_increment(ReadableArray args){
        String keyName = args.getString(0);
        Countly.userData.increment(keyName);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_incrementBy(ReadableArray args){
        String keyName = args.getString(0);
        int keyIncrement = Integer.parseInt(args.getString(1));
        Countly.userData.incrementBy(keyName, keyIncrement);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_multiply(ReadableArray args){
        String keyName = args.getString(0);
        int multiplyValue = Integer.parseInt(args.getString(1));
        Countly.userData.multiply(keyName, multiplyValue);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_saveMax(ReadableArray args){
        String keyName = args.getString(0);
        int maxScore = Integer.parseInt(args.getString(1));
        Countly.userData.saveMax(keyName, maxScore);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_saveMin(ReadableArray args){
        String keyName = args.getString(0);
        int minScore = Integer.parseInt(args.getString(1));
        Countly.userData.saveMin(keyName, minScore);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_setOnce(ReadableArray args){
        String keyName = args.getString(0);
        String minScore = args.getString(1);
        Countly.userData.setOnce(keyName, minScore);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_pushUniqueValue(ReadableArray args){
        String keyName = args.getString(0);
        String keyValue = args.getString(1);
        Countly.userData.pushUniqueValue(keyName, keyValue);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_pushValue(ReadableArray args){
        String keyName = args.getString(0);
        String keyValue = args.getString(1);
        Countly.userData.pushValue(keyName, keyValue);
        Countly.userData.save();
    }

    @ReactMethod
    public void userData_pullValue(ReadableArray args){
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
        // Countly.sharedInstance().setRequiresConsent(consentFlag);
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
                Log.d(Countly.TAG, "[CountlyReactNative] Not a valid consent feature to add: " + featureName);
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
                Log.d(Countly.TAG, "[CountlyReactNative] Not a valid consent feature to remove: " + featureName);
            }
        }
        Countly.sharedInstance().consent().removeConsent(features.toArray(new String[features.size()]));
    }

    @ReactMethod
    public void giveAllConsent(){
        Countly.sharedInstance().consent().giveConsent(validConsentFeatureNames.toArray(new String[validConsentFeatureNames.size()]));
    }

    @ReactMethod
    public void removeAllConsent(){
        Countly.sharedInstance().consent().removeConsent(validConsentFeatureNames.toArray(new String[validConsentFeatureNames.size()]));
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
            Log.d(Countly.TAG, "[CountlyReactNative] getRemoteConfigValueForKey, [" + keyName + "]: ConfigKeyNotFound");
            myCallback.invoke("ConfigKeyNotFound");
        }
        else {
            String resultString = (keyValue).toString();
            Log.d(Countly.TAG, "[CountlyReactNative] getRemoteConfigValueForKey, [" + keyName + "]: " + resultString);
            myCallback.invoke(resultString);
        }
    }

    @ReactMethod
    public void getRemoteConfigValueForKeyP(String keyName, Promise promise){
        Object keyValue = Countly.sharedInstance().remoteConfig().getValueForKey(keyName);
        if (keyValue == null) {
            Log.d(Countly.TAG, "[CountlyReactNative] getRemoteConfigValueForKeyP, [" + keyName + "]: ConfigKeyNotFound");
            promise.reject("ConfigKeyNotFound", null, null, null);
        }
        else {
            String resultString = (keyValue).toString();
            Log.d(Countly.TAG, "[CountlyReactNative] getRemoteConfigValueForKeyP, [" + keyName + "]: " + resultString);
            promise.resolve(resultString);
        }
    }

    @ReactMethod
    public void remoteConfigClearValues(Promise promise){
        Countly.sharedInstance().remoteConfig().clearStoredValues();
        promise.resolve("Remote Config Cleared.");
    }

    @ReactMethod
    public void showStarRating(ReadableArray args, final Callback callback){
        Activity activity = getCurrentActivity();
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
        String widgetId = args.getString(0);
        String closeFeedBackButton = args.getString(1);
        Activity activity = getCurrentActivity();
        Countly.sharedInstance().ratings().showFeedbackPopup( widgetId, closeFeedBackButton, activity, null);
    }

    @ReactMethod
    public void setEventSendThreshold(ReadableArray args){
        int size = Integer.parseInt(args.getString(0));
        this.config.setEventQueueSizeToSend(size);
        // Countly.sharedInstance().setEventQueueSizeToSend(size);
    }

    /*
    @ReactMethod
    public void initNative(){
            CountlyNative.initNative(getReactApplicationContext());
    }

    @ReactMethod
    public void testCrash(){
            CountlyNative.crash();
    }
    */

}
