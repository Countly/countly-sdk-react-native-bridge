package ly.count.android.sdk.react;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Callback;

public class CountlyReactNative extends ReactContextBaseJavaModule {
    private final CountlyReactNativeImpl impl;

    CountlyReactNative(ReactApplicationContext reactContext) {
        super(reactContext);
        this.impl = new CountlyReactNativeImpl(reactContext);
    }

    @Override
    public String getName() {
        return CountlyReactNativeImpl.NAME;
    }

    @ReactMethod
    public void init(ReadableArray args, Promise promise) {
        this.impl.init(args, promise);
    }

    @ReactMethod
    public void setLoggingEnabled(ReadableArray args) {
        this.impl.setLoggingEnabled(args);
    }

    @ReactMethod
    public void isLoggingEnabled(final Promise promise) {
        this.impl.isLoggingEnabled(promise);
    }

    @ReactMethod
    public void isInitialized(Promise promise) {
        this.impl.isInitialized(promise);
    }

    @ReactMethod
    public void hasBeenCalledOnStart(Promise promise) {
        this.impl.hasBeenCalledOnStart(promise);
    }

    @ReactMethod
    public void getCurrentDeviceId(Promise promise) {
        this.impl.getCurrentDeviceId(promise);
    }

    @ReactMethod
    public void getDeviceIDType(Promise promise) {
        this.impl.getDeviceIDType(promise);
    }

    @ReactMethod
    public void changeDeviceId(ReadableArray args) {
        this.impl.changeDeviceId(args);
    }

    @ReactMethod
    public void setHttpPostForced(ReadableArray args) {
        this.impl.setHttpPostForced(args);
    }

    @ReactMethod
    public void enableParameterTamperingProtection(ReadableArray args) {
        this.impl.enableParameterTamperingProtection(args);
    }

    @ReactMethod
    public void pinnedCertificates(ReadableArray args) {
        this.impl.pinnedCertificates(args);
    }

    @ReactMethod
    public void setLocationInit(ReadableArray args) {
        this.impl.setLocationInit(args);
    }

    @ReactMethod
    public void setLocation(ReadableArray args) {
        this.impl.setLocation(args);
    }

    @ReactMethod
    public void disableLocation() {
        this.impl.disableLocation();
    }

    @ReactMethod
    public void enableCrashReporting() {
        this.impl.enableCrashReporting();
    }

    @ReactMethod
    public void addCrashLog(ReadableArray args) {
        this.impl.addCrashLog(args);
    }

    @ReactMethod
    public void logException(ReadableArray args) {
        this.impl.logException(args);
    }

    @ReactMethod
    public void logJSException(String err, String message, String stack) {
        this.impl.logJSException(err, message, stack);
    }

    @ReactMethod
    public void setCustomCrashSegments(ReadableArray args) {
        this.impl.setCustomCrashSegments(args);
    }

    @ReactMethod
    public void recordEvent(ReadableMap args) {
        this.impl.recordEvent(args);
    }

    @ReactMethod
    public void startEvent(ReadableArray args) {
        this.impl.startEvent(args);
    }

    @ReactMethod
    public void cancelEvent(ReadableArray args) {
        this.impl.cancelEvent(args);
    }

    @ReactMethod
    public void endEvent(ReadableMap args) {
        this.impl.endEvent(args);
    }

    @ReactMethod
    public void recordView(ReadableArray args) {
        this.impl.recordView(args);
    }

    @ReactMethod
    public void setUserData(ReadableArray args, Promise promise) {
        this.impl.setUserData(args, promise);
    }

    @ReactMethod
    public void sendPushToken(ReadableArray args) {
        this.impl.sendPushToken(args);
    }

    @ReactMethod
    public void pushTokenType(ReadableArray args) {
        this.impl.pushTokenType(args);
    }

    // public static void onNotification(Map<String, String> notification) {
    //     CountlyReactNativeImpl.onNotification(notification);
    // }

    @ReactMethod
    public void registerForNotification(ReadableArray args) {
        this.impl.registerForNotification(args);
    }

    @ReactMethod
    public void askForNotificationPermission(ReadableArray args) {
        this.impl.askForNotificationPermission(args);
    }

    @ReactMethod
    public void configureIntentRedirectionCheck(ReadableArray intentClassNames, ReadableArray intentPackageNames, boolean useAdditionalIntentRedirectionChecks) {
        this.impl.configureIntentRedirectionCheck(intentClassNames, intentPackageNames, useAdditionalIntentRedirectionChecks);
    }

    @ReactMethod
    public void userData_setProperty(ReadableArray args, Promise promise) {
        this.impl.userData_setProperty(args, promise);
    }

    @ReactMethod
    public void userData_increment(ReadableArray args, Promise promise) {
        this.impl.userData_increment(args, promise);
    }

    @ReactMethod
    public void userData_incrementBy(ReadableArray args, Promise promise) {
        this.impl.userData_incrementBy(args, promise);
    }

    @ReactMethod
    public void userData_multiply(ReadableArray args, Promise promise) {
        this.impl.userData_multiply(args, promise);
    }

    @ReactMethod
    public void userData_saveMax(ReadableArray args, Promise promise) {
        this.impl.userData_saveMax(args, promise);
    }

    @ReactMethod
    public void userData_saveMin(ReadableArray args, Promise promise) {
        this.impl.userData_saveMin(args, promise);
    }

    @ReactMethod
    public void userData_setOnce(ReadableArray args, Promise promise) {
        this.impl.userData_setOnce(args, promise);
    }

    @ReactMethod
    public void userData_pushUniqueValue(ReadableArray args, Promise promise) {
        this.impl.userData_pushUniqueValue(args, promise);
    }

    @ReactMethod
    public void userData_pushValue(ReadableArray args, Promise promise) {
        this.impl.userData_pushValue(args, promise);
    }

    @ReactMethod
    public void userData_pullValue(ReadableArray args, Promise promise) {
        this.impl.userData_pullValue(args, promise);
    }

    @ReactMethod
    public void userDataBulk_setUserProperties(ReadableMap userData, Promise promise) {
        this.impl.userDataBulk_setUserProperties(userData, promise);
    }

    @ReactMethod
    public void userDataBulk_save(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_save(args, promise);
    }

    @ReactMethod
    public void userDataBulk_setProperty(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_setProperty(args, promise);
    }

    @ReactMethod
    public void userDataBulk_increment(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_increment(args, promise);
    }

    @ReactMethod
    public void userDataBulk_incrementBy(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_incrementBy(args, promise);
    }

    @ReactMethod
    public void userDataBulk_multiply(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_multiply(args, promise);
    }

    @ReactMethod
    public void userDataBulk_saveMax(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_saveMax(args, promise);
    }

    @ReactMethod
    public void userDataBulk_saveMin(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_saveMin(args, promise);
    }

    @ReactMethod
    public void userDataBulk_setOnce(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_setOnce(args, promise);
    }

    @ReactMethod
    public void userDataBulk_pushUniqueValue(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_pushUniqueValue(args, promise);
    }

    @ReactMethod
    public void userDataBulk_pushValue(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_pushValue(args, promise);
    }

    @ReactMethod
    public void userDataBulk_pullValue(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_pullValue(args, promise);
    }

    @ReactMethod
    public void setRequiresConsent(ReadableArray args) {
        this.impl.setRequiresConsent(args);
    }

    @ReactMethod
    public void giveConsentInit(ReadableArray featureNames) {
        this.impl.giveConsentInit(featureNames);
    }

    @ReactMethod
    public void giveConsent(ReadableArray featureNames) {
        this.impl.giveConsent(featureNames);
    }

    
    @ReactMethod
    public void giveAllConsent() {
        this.impl.giveAllConsent();
    }

    @ReactMethod
    public void removeAllConsent() {
        this.impl.removeAllConsent();
    }

    @ReactMethod
    public void removeConsent(ReadableArray featureNames) {
        this.impl.removeConsent(featureNames);
    }

    @ReactMethod
    public void remoteConfigUpdate(ReadableArray args, final Callback myCallback) {
        this.impl.remoteConfigUpdate(args, myCallback);
    }

    @ReactMethod
    public void updateRemoteConfigForKeysOnly(ReadableArray args, final Callback myCallback) {
        this.impl.updateRemoteConfigForKeysOnly(args, myCallback);
    }

    @ReactMethod
    public void updateRemoteConfigExceptKeys(ReadableArray args, final Callback myCallback) {
        this.impl.updateRemoteConfigExceptKeys(args, myCallback);
    }

    @ReactMethod
    public void getRemoteConfigValueForKey(ReadableArray args, final Callback myCallback) {
        this.impl.getRemoteConfigValueForKey(args, myCallback);
    }

    @ReactMethod
    public void getRemoteConfigValueForKeyP(String keyName, Promise promise) {
        this.impl.getRemoteConfigValueForKeyP(keyName, promise);
    }

    @ReactMethod
    public void remoteConfigClearValues(Promise promise) {
        this.impl.remoteConfigClearValues(promise);
    }

    @ReactMethod
    public void setStarRatingDialogTexts(ReadableArray args) {
        this.impl.setStarRatingDialogTexts(args);
    }

    @ReactMethod
    public void showStarRating(ReadableArray args, final Callback callback) {
        this.impl.showStarRating(args, callback);
    }

    @ReactMethod
    public void presentRatingWidgetWithID(ReadableArray args) {
        this.impl.presentRatingWidgetWithID(args);
    }

    @ReactMethod
    public void getFeedbackWidgets(final Promise promise) {
        this.impl.getFeedbackWidgets(promise);
    }


    @ReactMethod
    public void getFeedbackWidgetData(ReadableArray args, final Promise promise) {
        this.impl.getFeedbackWidgetData(args, promise);
    }
    @ReactMethod
    public void reportFeedbackWidgetManually(ReadableArray args, final Promise promise) {
        this.impl.reportFeedbackWidgetManually(args, promise);
    }

    @ReactMethod
    public void getAvailableFeedbackWidgets(final Promise promise) {
        this.impl.getAvailableFeedbackWidgets(promise);
    }

    @ReactMethod
    public void presentFeedbackWidget(ReadableArray args, final Promise promise) {
        this.impl.presentFeedbackWidget(args, promise);
    }

    @ReactMethod
    public void replaceAllAppKeysInQueueWithCurrentAppKey() {
        this.impl.replaceAllAppKeysInQueueWithCurrentAppKey();
    }

    @ReactMethod
    public void removeDifferentAppKeysFromQueue() {
        this.impl.removeDifferentAppKeysFromQueue();
    }

    @ReactMethod
    public void setEventSendThreshold(ReadableArray args) {
        this.impl.setEventSendThreshold(args);
    }

    @ReactMethod
    public void startTrace(ReadableArray args) {
        this.impl.startTrace(args);
    }

    @ReactMethod
    public void cancelTrace(ReadableArray args) {
        this.impl.cancelTrace(args);
    }

    @ReactMethod
    public void clearAllTraces(ReadableArray args) {
        this.impl.clearAllTraces(args);
    }

    @ReactMethod
    public void endTrace(ReadableArray args) {
        this.impl.endTrace(args);
    }

    @ReactMethod
    public void recordNetworkTrace(ReadableArray args) {
        this.impl.recordNetworkTrace(args);
    }

    @ReactMethod
    public void enableApm(ReadableArray args) {
        this.impl.enableApm(args);
    }

    @ReactMethod
    public void recordAttributionID(ReadableArray args) {
        this.impl.recordAttributionID(args);
    }

    @ReactMethod
    public void recordIndirectAttribution(ReadableArray args) {
        this.impl.recordIndirectAttribution(args);
    }

    @ReactMethod
    public void recordDirectAttribution(ReadableArray args) {
        this.impl.recordDirectAttribution(args);
    }

    @ReactMethod
    public void appLoadingFinished() {
        this.impl.appLoadingFinished();
    }

    @ReactMethod
    public void enterContentZone() {
        this.impl.enterContentZone();
    }

    @ReactMethod
    public void exitContentZone() {
        this.impl.exitContentZone();
    }

    @ReactMethod
    public void setID(String newDeviceID) {
        this.impl.setID(newDeviceID);
    }

    @ReactMethod
    public void setCustomMetrics(ReadableArray args) {
        this.impl.setCustomMetrics(args);
    }
}