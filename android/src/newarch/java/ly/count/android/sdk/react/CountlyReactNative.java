package ly.count.android.sdk.react;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Callback;

/*
init(ReadableArray args, Promise promise)
setLoggingEnabled(ReadableArray args)
isLoggingEnabled(final Promise promise)
isInitialized(Promise promise)
hasBeenCalledOnStart(Promise promise)
getCurrentDeviceId(Promise promise)
getDeviceIDType(Promise promise)
changeDeviceId(ReadableArray args)
setHttpPostForced(ReadableArray args)
enableParameterTamperingProtection(ReadableArray args)
pinnedCertificates(ReadableArray args)
setLocationInit(ReadableArray args)
setLocation(ReadableArray args)
disableLocation()
enableCrashReporting()
addCrashLog(ReadableArray args)
logException(ReadableArray args)
logJSException(String err, String message, String stack)
setCustomCrashSegments(ReadableArray args)
recordEvent(ReadableMap args)
startEvent(ReadableArray args)
cancelEvent(ReadableArray args)
endEvent(ReadableMap args)
recordView(ReadableArray args)
setUserData(ReadableArray args, Promise promise)
sendPushToken(ReadableArray args)
pushTokenType(ReadableArray args)
onNotification(Map<String, String> notification)
registerForNotification(ReadableArray args)
askForNotificationPermission(ReadableArray args)
configureIntentRedirectionCheck(ReadableArray intentClassNames, ReadableArray intentPackageNames, boolean useAdditionalIntentRedirectionChecks)
userData_setProperty(ReadableArray args, Promise promise)
userData_increment(ReadableArray args, Promise promise)
userData_incrementBy(ReadableArray args, Promise promise)
userData_multiply(ReadableArray args, Promise promise)
userData_saveMax(ReadableArray args, Promise promise)
userData_saveMin(ReadableArray args, Promise promise)
userData_setOnce(ReadableArray args, Promise promise)
userData_pushUniqueValue(ReadableArray args, Promise promise)
userData_pushValue(ReadableArray args, Promise promise)
userData_pullValue(ReadableArray args, Promise promise)
userDataBulk_setUserProperties(ReadableMap userData, Promise promise)
userDataBulk_save(ReadableArray args, Promise promise)
userDataBulk_setProperty(ReadableArray args, Promise promise)
userDataBulk_increment(ReadableArray args, Promise promise)
userDataBulk_incrementBy(ReadableArray args, Promise promise)
userDataBulk_multiply(ReadableArray args, Promise promise)
userDataBulk_saveMax(ReadableArray args, Promise promise)
userDataBulk_saveMin(ReadableArray args, Promise promise)
userDataBulk_setOnce(ReadableArray args, Promise promise)
userDataBulk_pushUniqueValue(ReadableArray args, Promise promise)
userDataBulk_pushValue(ReadableArray args, Promise promise)
userDataBulk_pullValue(ReadableArray args, Promise promise)
setRequiresConsent(ReadableArray args)
giveConsentInit(ReadableArray featureNames)
giveConsent(ReadableArray featureNames)
removeConsent(ReadableArray featureNames)
giveAllConsent()
removeAllConsent()
remoteConfigUpdate(ReadableArray args, final Callback myCallback)
updateRemoteConfigForKeysOnly(ReadableArray args, final Callback myCallback)
updateRemoteConfigExceptKeys(ReadableArray args, final Callback myCallback)
getRemoteConfigValueForKey(ReadableArray args, final Callback myCallback)
getRemoteConfigValueForKeyP(String keyName, Promise promise)
remoteConfigClearValues(Promise promise)
setStarRatingDialogTexts(ReadableArray args)
showStarRating(ReadableArray args, final Callback callback)
presentRatingWidgetWithID(ReadableArray args)
getFeedbackWidgets(final Promise promise)
getFeedbackWidget(String widgetId)
getFeedbackWidgetData(ReadableArray args, final Promise promise)
reportFeedbackWidgetManually(ReadableArray args, final Promise promise)
getAvailableFeedbackWidgets(final Promise promise)
presentFeedbackWidget(ReadableArray args, final Promise promise)
replaceAllAppKeysInQueueWithCurrentAppKey()
removeDifferentAppKeysFromQueue()
setEventSendThreshold(ReadableArray args)
startTrace(ReadableArray args)
cancelTrace(ReadableArray args)
clearAllTraces(ReadableArray args)
endTrace(ReadableArray args)
recordNetworkTrace(ReadableArray args)
enableApm(ReadableArray args)
recordAttributionID(ReadableArray args)
recordIndirectAttribution(ReadableArray args)
recordDirectAttribution(ReadableArray args)
appLoadingFinished()
enterContentZone()
exitContentZone()
setID(String newDeviceID)
setCustomMetrics(ReadableArray args)
 */

public class CountlyReactNative extends NativeCountlyReactNativeSpec {
    private final CountlyReactNativeImpl impl;

    CountlyReactNative(ReactApplicationContext context) {
        super(context);
        this.impl = new CountlyReactNativeImpl(context);
    }

    @Override
    @NonNull
    public String getName() {
      return CountlyReactNativeImpl.NAME;
    }

    @Override
    public void init(ReadableArray args, Promise promise) {
        this.impl.init(args, promise);
    }

    @Override
    public void setLoggingEnabled(ReadableArray args) {
        this.impl.setLoggingEnabled(args);
    }

    @Override
    public void isLoggingEnabled(final Promise promise) {
        this.impl.isLoggingEnabled(promise);
    }

    @Override
    public void isInitialized(Promise promise) {
        this.impl.isInitialized(promise);
    }

    @Override
    public void hasBeenCalledOnStart(Promise promise) {
        this.impl.hasBeenCalledOnStart(promise);
    }

    @Override
    public void getCurrentDeviceId(Promise promise) {
        this.impl.getCurrentDeviceId(promise);
    }

    @Override
    public void getDeviceIDType(Promise promise) {
        this.impl.getDeviceIDType(promise);
    }

    @Override
    public void changeDeviceId(ReadableArray args) {
        this.impl.changeDeviceId(args);
    }

    @Override
    public void setHttpPostForced(ReadableArray args) {
        this.impl.setHttpPostForced(args);
    }

    @Override
    public void enableParameterTamperingProtection(ReadableArray args) {
        this.impl.enableParameterTamperingProtection(args);
    }

    @Override
    public void pinnedCertificates(ReadableArray args) {
        this.impl.pinnedCertificates(args);
    }

    @Override
    public void setLocationInit(ReadableArray args) {
        this.impl.setLocationInit(args);
    }

    @Override
    public void setLocation(ReadableArray args) {
        this.impl.setLocation(args);
    }

    @Override
    public void disableLocation() {
        this.impl.disableLocation();
    }

    @Override
    public void enableCrashReporting() {
        this.impl.enableCrashReporting();
    }

    @Override
    public void addCrashLog(ReadableArray args) {
        this.impl.addCrashLog(args);
    }

    @Override
    public void logException(ReadableArray args) {
        this.impl.logException(args);
    }

    @Override
    public void logJSException(String err, String message, String stack) {
        this.impl.logJSException(err, message, stack);
    }

    @Override
    public void setCustomCrashSegments(ReadableArray args) {
        this.impl.setCustomCrashSegments(args);
    }

    @Override
    public void recordEvent(ReadableMap args) {
        this.impl.recordEvent(args);
    }

    @Override
    public void startEvent(ReadableArray args) {
        this.impl.startEvent(args);
    }

    @Override
    public void cancelEvent(ReadableArray args) {
        this.impl.cancelEvent(args);
    }

    @Override
    public void endEvent(ReadableMap args) {
        this.impl.endEvent(args);
    }

    @Override
    public void recordView(ReadableArray args) {
        this.impl.recordView(args);
    }

    @Override
    public void setUserData(ReadableArray args, Promise promise) {
        this.impl.setUserData(args, promise);
    }

    @Override
    public void sendPushToken(ReadableArray args) {
        this.impl.sendPushToken(args);
    }

    @Override
    public void pushTokenType(ReadableArray args) {
        this.impl.pushTokenType(args);
    }

    // public static void onNotification(Map<String, String> notification) {
    //     CountlyReactNativeImpl.onNotification(notification);
    // }

    @Override
    public void registerForNotification(ReadableArray args) {
        this.impl.registerForNotification(args);
    }

    @Override
    public void askForNotificationPermission(ReadableArray args) {
        this.impl.askForNotificationPermission(args);
    }

    @Override
    public void configureIntentRedirectionCheck(ReadableArray intentClassNames, ReadableArray intentPackageNames, boolean useAdditionalIntentRedirectionChecks) {
        this.impl.configureIntentRedirectionCheck(intentClassNames, intentPackageNames, useAdditionalIntentRedirectionChecks);
    }

    @Override
    public void userData_setProperty(ReadableArray args, Promise promise) {
        this.impl.userData_setProperty(args, promise);
    }

    @Override
    public void userData_increment(ReadableArray args, Promise promise) {
        this.impl.userData_increment(args, promise);
    }

    @Override
    public void userData_incrementBy(ReadableArray args, Promise promise) {
        this.impl.userData_incrementBy(args, promise);
    }

    @Override
    public void userData_multiply(ReadableArray args, Promise promise) {
        this.impl.userData_multiply(args, promise);
    }

    @Override
    public void userData_saveMax(ReadableArray args, Promise promise) {
        this.impl.userData_saveMax(args, promise);
    }

    @Override
    public void userData_saveMin(ReadableArray args, Promise promise) {
        this.impl.userData_saveMin(args, promise);
    }

    @Override
    public void userData_setOnce(ReadableArray args, Promise promise) {
        this.impl.userData_setOnce(args, promise);
    }

    @Override
    public void userData_pushUniqueValue(ReadableArray args, Promise promise) {
        this.impl.userData_pushUniqueValue(args, promise);
    }

    @Override
    public void userData_pushValue(ReadableArray args, Promise promise) {
        this.impl.userData_pushValue(args, promise);
    }

    @Override
    public void userData_pullValue(ReadableArray args, Promise promise) {
        this.impl.userData_pullValue(args, promise);
    }

    @Override
    public void userDataBulk_setUserProperties(ReadableMap userData, Promise promise) {
        this.impl.userDataBulk_setUserProperties(userData, promise);
    }

    @Override
    public void userDataBulk_save(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_save(args, promise);
    }

    @Override
    public void userDataBulk_setProperty(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_setProperty(args, promise);
    }

    @Override
    public void userDataBulk_increment(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_increment(args, promise);
    }

    @Override
    public void userDataBulk_incrementBy(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_incrementBy(args, promise);
    }

    @Override
    public void userDataBulk_multiply(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_multiply(args, promise);
    }

    @Override
    public void userDataBulk_saveMax(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_saveMax(args, promise);
    }

    @Override
    public void userDataBulk_saveMin(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_saveMin(args, promise);
    }

    @Override
    public void userDataBulk_setOnce(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_setOnce(args, promise);
    }

    @Override
    public void userDataBulk_pushUniqueValue(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_pushUniqueValue(args, promise);
    }

    @Override
    public void userDataBulk_pushValue(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_pushValue(args, promise);
    }

    @Override
    public void userDataBulk_pullValue(ReadableArray args, Promise promise) {
        this.impl.userDataBulk_pullValue(args, promise);
    }

    @Override
    public void setRequiresConsent(ReadableArray args) {
        this.impl.setRequiresConsent(args);
    }

    @Override
    public void giveConsentInit(ReadableArray featureNames) {
        this.impl.giveConsentInit(featureNames);
    }

    @Override
    public void giveConsent(ReadableArray featureNames) {
        this.impl.giveConsent(featureNames);
    }

    @Override
    public void giveAllConsent() {
        this.impl.giveAllConsent();
    }

    @Override
    public void removeAllConsent() {
        this.impl.removeAllConsent();
    }

    @Override
    public void removeConsent(ReadableArray featureNames) {
        this.impl.removeConsent(featureNames);
    }

    @Override
    public void remoteConfigUpdate(ReadableArray args, final Callback myCallback) {
        this.impl.remoteConfigUpdate(args, myCallback);
    }

    @Override
    public void updateRemoteConfigForKeysOnly(ReadableArray args, final Callback myCallback) {
        this.impl.updateRemoteConfigForKeysOnly(args, myCallback);
    }

    @Override
    public void updateRemoteConfigExceptKeys(ReadableArray args, final Callback myCallback) {
        this.impl.updateRemoteConfigExceptKeys(args, myCallback);
    }

    @Override
    public void getRemoteConfigValueForKey(ReadableArray args, final Callback myCallback) {
        this.impl.getRemoteConfigValueForKey(args, myCallback);
    }

    @Override
    public void getRemoteConfigValueForKeyP(String keyName, Promise promise) {
        this.impl.getRemoteConfigValueForKeyP(keyName, promise);
    }

    @Override
    public void remoteConfigClearValues(Promise promise) {
        this.impl.remoteConfigClearValues(promise);
    }

    @Override
    public void setStarRatingDialogTexts(ReadableArray args) {
        this.impl.setStarRatingDialogTexts(args);
    }

    @Override
    public void showStarRating(ReadableArray args, final Callback callback) {
        this.impl.showStarRating(args, callback);
    }

    @Override
    public void presentRatingWidgetWithID(ReadableArray args) {
        this.impl.presentRatingWidgetWithID(args);
    }

    @Override
    public void getFeedbackWidgets(final Promise promise) {
        this.impl.getFeedbackWidgets(promise);
    }

    @Override
    public void getFeedbackWidgetData(ReadableArray args, final Promise promise) {
        this.impl.getFeedbackWidgetData(args, promise);
    }
    @Override
    public void reportFeedbackWidgetManually(ReadableArray args, final Promise promise) {
        this.impl.reportFeedbackWidgetManually(args, promise);
    }

    @Override
    public void getAvailableFeedbackWidgets(final Promise promise) {
        this.impl.getAvailableFeedbackWidgets(promise);
    }

    @Override
    public void presentFeedbackWidget(ReadableArray args, final Promise promise) {
        this.impl.presentFeedbackWidget(args, promise);
    }

    @Override
    public void replaceAllAppKeysInQueueWithCurrentAppKey() {
        this.impl.replaceAllAppKeysInQueueWithCurrentAppKey();
    }

    @Override
    public void removeDifferentAppKeysFromQueue() {
        this.impl.removeDifferentAppKeysFromQueue();
    }

    @Override
    public void setEventSendThreshold(ReadableArray args) {
        this.impl.setEventSendThreshold(args);
    }

    @Override
    public void startTrace(ReadableArray args) {
        this.impl.startTrace(args);
    }

    @Override
    public void cancelTrace(ReadableArray args) {
        this.impl.cancelTrace(args);
    }

    @Override
    public void clearAllTraces(ReadableArray args) {
        this.impl.clearAllTraces(args);
    }

    @Override
    public void endTrace(ReadableArray args) {
        this.impl.endTrace(args);
    }

    @Override
    public void recordNetworkTrace(ReadableArray args) {
        this.impl.recordNetworkTrace(args);
    }

    @Override
    public void enableApm(ReadableArray args) {
        this.impl.enableApm(args);
    }

    @Override
    public void recordAttributionID(ReadableArray args) {
        this.impl.recordAttributionID(args);
    }

    @Override
    public void recordIndirectAttribution(ReadableArray args) {
        this.impl.recordIndirectAttribution(args);
    }

    @Override
    public void recordDirectAttribution(ReadableArray args) {
        this.impl.recordDirectAttribution(args);
    }

    @Override
    public void appLoadingFinished() {
        this.impl.appLoadingFinished();
    }

    @Override
    public void enterContentZone() {
        this.impl.enterContentZone();
    }

    @Override
    public void exitContentZone() {
        this.impl.exitContentZone();
    }

    @Override
    public void setID(String newDeviceID) {
        this.impl.setID(newDeviceID);
    }

    @Override
    public void setCustomMetrics(ReadableArray args) {
        this.impl.setCustomMetrics(args);
    }
}
