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
    public void init(ReadableArray args, String instanceName, Promise promise) {
        this.impl.init(args, instanceName, promise);
    }

    @ReactMethod
    public void setLoggingEnabled(ReadableArray args, String instanceName) {
        this.impl.setLoggingEnabled(args, instanceName);
    }

    @ReactMethod
    public void isLoggingEnabled(String instanceName, final Promise promise) {
        this.impl.isLoggingEnabled(instanceName, promise);
    }

    @ReactMethod
    public void isInitialized(String instanceName, Promise promise) {
        this.impl.isInitialized(instanceName, promise);
    }

    @ReactMethod
    public void getCurrentDeviceId(String instanceName, Promise promise) {
        this.impl.getCurrentDeviceId(instanceName, promise);
    }

    @ReactMethod
    public void getDeviceIDType(String instanceName, Promise promise) {
        this.impl.getDeviceIDType(instanceName, promise);
    }

    @ReactMethod
    public void changeDeviceId(ReadableArray args, String instanceName) {
        this.impl.changeDeviceId(args, instanceName);
    }

    @ReactMethod
    public void setHttpPostForced(ReadableArray args, String instanceName) {
        this.impl.setHttpPostForced(args, instanceName);
    }

    @ReactMethod
    public void pinnedCertificates(ReadableArray args, String instanceName) {
        this.impl.pinnedCertificates(args, instanceName);
    }

    @ReactMethod
    public void setLocation(ReadableArray args, String instanceName) {
        this.impl.setLocation(args, instanceName);
    }

    @ReactMethod
    public void disableLocation(String instanceName) {
        this.impl.disableLocation(instanceName);
    }

    @ReactMethod
    public void addCrashLog(ReadableArray args, String instanceName) {
        this.impl.addCrashLog(args, instanceName);
    }

    @ReactMethod
    public void recordMetrics(ReadableArray args, String instanceName) {
        this.impl.recordMetrics(args, instanceName);
    }

    @ReactMethod
    public void startSession(String instanceName) {
        this.impl.startSession(instanceName);
    }

    @ReactMethod
    public void updateSession(String instanceName) {
        this.impl.updateSession(instanceName);
    }

    @ReactMethod
    public void endSession(String instanceName) {
        this.impl.endSession(instanceName);
    }

    @ReactMethod
    public void logException(ReadableArray args, String instanceName) {
        this.impl.logException(args, instanceName);
    }

    @ReactMethod
    public void logJSException(String err, String message, String stack, String instanceName) {
        this.impl.logJSException(err, message, stack, instanceName);
    }

    @ReactMethod
    public void setCustomCrashSegments(ReadableArray args, String instanceName) {
        this.impl.setCustomCrashSegments(args, instanceName);
    }

    @ReactMethod
    public void recordEvent(ReadableMap args, String instanceName) {
        this.impl.recordEvent(args, instanceName);
    }

    @ReactMethod
    public void startEvent(ReadableArray args, String instanceName) {
        this.impl.startEvent(args, instanceName);
    }

    @ReactMethod
    public void cancelEvent(ReadableArray args, String instanceName) {
        this.impl.cancelEvent(args, instanceName);
    }

    @ReactMethod
    public void endEvent(ReadableMap args, String instanceName) {
        this.impl.endEvent(args, instanceName);
    }

    @ReactMethod
    public void recordView(ReadableArray args, String instanceName) {
        this.impl.recordView(args, instanceName);
    }

    @ReactMethod
    public void startAutoStoppedView(ReadableArray args, String instanceName, Promise promise) {
        this.impl.startAutoStoppedView(args, instanceName, promise);
    }

    @ReactMethod
    public void startView(ReadableArray args, String instanceName, Promise promise) {
        this.impl.startView(args, instanceName, promise);
    }

    @ReactMethod
    public void stopViewWithName(ReadableArray args, String instanceName) {
        this.impl.stopViewWithName(args, instanceName);
    }

    @ReactMethod
    public void stopViewWithID(ReadableArray args, String instanceName) {
        this.impl.stopViewWithID(args, instanceName);
    }

    @ReactMethod
    public void stopAllViews(ReadableArray args, String instanceName) {
        this.impl.stopAllViews(args, instanceName);
    }

    @ReactMethod
    public void pauseViewWithID(ReadableArray args, String instanceName) {
        this.impl.pauseViewWithID(args, instanceName);
    }

    @ReactMethod
    public void resumeViewWithID(ReadableArray args, String instanceName) {
        this.impl.resumeViewWithID(args, instanceName);
    }

    @ReactMethod
    public void addSegmentationToViewWithID(ReadableArray args, String instanceName) {
        this.impl.addSegmentationToViewWithID(args, instanceName);
    }

    @ReactMethod
    public void addSegmentationToViewWithName(ReadableArray args, String instanceName) {
        this.impl.addSegmentationToViewWithName(args, instanceName);
    }

    @ReactMethod
    public void setGlobalViewSegmentation(ReadableArray args, String instanceName) {
        this.impl.setGlobalViewSegmentation(args, instanceName);
    }

    @ReactMethod
    public void updateGlobalViewSegmentation(ReadableArray args, String instanceName) {
        this.impl.updateGlobalViewSegmentation(args, instanceName);
    }

    @ReactMethod
    public void setUserData(ReadableArray args, String instanceName, Promise promise) {
        this.impl.setUserData(args, instanceName, promise);
    }

    @ReactMethod
    public void sendPushToken(ReadableArray args, String instanceName) {
        this.impl.sendPushToken(args, instanceName);
    }

    @ReactMethod
    public void registerForNotification(ReadableArray args, String instanceName) {
        this.impl.registerForNotification(args, instanceName);
    }

    @ReactMethod
    public void askForNotificationPermission(ReadableArray args, String instanceName) {
        this.impl.askForNotificationPermission(args, instanceName);
    }

    @ReactMethod
    public void userData_setProperty(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_setProperty(args, instanceName, promise);
    }

    @ReactMethod
    public void userData_increment(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_increment(args, instanceName, promise);
    }

    @ReactMethod
    public void userData_incrementBy(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_incrementBy(args, instanceName, promise);
    }

    @ReactMethod
    public void userData_multiply(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_multiply(args, instanceName, promise);
    }

    @ReactMethod
    public void userData_saveMax(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_saveMax(args, instanceName, promise);
    }

    @ReactMethod
    public void userData_saveMin(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_saveMin(args, instanceName, promise);
    }

    @ReactMethod
    public void userData_setOnce(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_setOnce(args, instanceName, promise);
    }

    @ReactMethod
    public void userData_pushUniqueValue(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_pushUniqueValue(args, instanceName, promise);
    }

    @ReactMethod
    public void userData_pushValue(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_pushValue(args, instanceName, promise);
    }

    @ReactMethod
    public void userData_pullValue(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_pullValue(args, instanceName, promise);
    }

    @ReactMethod
    public void userDataBulk_setUserProperties(ReadableMap userData, String instanceName, Promise promise) {
        this.impl.userDataBulk_setUserProperties(userData, instanceName, promise);
    }

    @ReactMethod
    public void userDataBulk_save(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_save(args, instanceName, promise);
    }

    @ReactMethod
    public void userDataBulk_setProperty(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_setProperty(args, instanceName, promise);
    }

    @ReactMethod
    public void userDataBulk_increment(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_increment(args, instanceName, promise);
    }

    @ReactMethod
    public void userDataBulk_incrementBy(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_incrementBy(args, instanceName, promise);
    }

    @ReactMethod
    public void userDataBulk_multiply(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_multiply(args, instanceName, promise);
    }

    @ReactMethod
    public void userDataBulk_saveMax(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_saveMax(args, instanceName, promise);
    }

    @ReactMethod
    public void userDataBulk_saveMin(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_saveMin(args, instanceName, promise);
    }

    @ReactMethod
    public void userDataBulk_setOnce(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_setOnce(args, instanceName, promise);
    }

    @ReactMethod
    public void userDataBulk_pushUniqueValue(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_pushUniqueValue(args, instanceName, promise);
    }

    @ReactMethod
    public void userDataBulk_pushValue(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_pushValue(args, instanceName, promise);
    }

    @ReactMethod
    public void userDataBulk_pullValue(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_pullValue(args, instanceName, promise);
    }

    @ReactMethod
    public void giveConsent(ReadableArray featureNames, String instanceName) {
        this.impl.giveConsent(featureNames, instanceName);
    }

    @ReactMethod
    public void removeConsent(ReadableArray featureNames, String instanceName) {
        this.impl.removeConsent(featureNames, instanceName);
    }

    @ReactMethod
    public void giveAllConsent(String instanceName) {
        this.impl.giveAllConsent(instanceName);
    }

    @ReactMethod
    public void removeAllConsent(String instanceName) {
        this.impl.removeAllConsent(instanceName);
    }

    @ReactMethod
    public void remoteConfigUpdate(ReadableArray args, String instanceName, final Callback myCallback) {
        this.impl.remoteConfigUpdate(args, instanceName, myCallback);
    }

    @ReactMethod
    public void updateRemoteConfigForKeysOnly(ReadableArray args, String instanceName, final Callback myCallback) {
        this.impl.updateRemoteConfigForKeysOnly(args, instanceName, myCallback);
    }

    @ReactMethod
    public void updateRemoteConfigExceptKeys(ReadableArray args, String instanceName, final Callback myCallback) {
        this.impl.updateRemoteConfigExceptKeys(args, instanceName, myCallback);
    }

    @ReactMethod
    public void getRemoteConfigValueForKey(ReadableArray args, String instanceName, final Callback myCallback) {
        this.impl.getRemoteConfigValueForKey(args, instanceName, myCallback);
    }

    @ReactMethod
    public void getRemoteConfigValueForKeyP(String keyName, String instanceName, Promise promise) {
        this.impl.getRemoteConfigValueForKeyP(keyName, instanceName, promise);
    }

    @ReactMethod
    public void remoteConfigClearValues(String instanceName, Promise promise) {
        this.impl.remoteConfigClearValues(instanceName, promise);
    }

    @ReactMethod
    public void showStarRating(ReadableArray args, String instanceName, final Callback callback) {
        this.impl.showStarRating(args, instanceName, callback);
    }

    @ReactMethod
    public void presentRatingWidgetWithID(ReadableArray args, String instanceName) {
        this.impl.presentRatingWidgetWithID(args, instanceName);
    }

    @ReactMethod
    public void presentNPS(ReadableArray args, String instanceName) {
        this.impl.presentNPS(args, instanceName);
    }

    @ReactMethod
    public void presentSurvey(ReadableArray args, String instanceName) {
        this.impl.presentSurvey(args, instanceName);
    }

    @ReactMethod
    public void presentRating(ReadableArray args, String instanceName) {
        this.impl.presentRating(args, instanceName);
    }

    @ReactMethod
    public void getFeedbackWidgets(String instanceName, final Promise promise) {
        this.impl.getFeedbackWidgets(instanceName, promise);
    }

    @ReactMethod
    public void getFeedbackWidgetData(ReadableArray args, String instanceName, final Promise promise) {
        this.impl.getFeedbackWidgetData(args, instanceName, promise);
    }

    @ReactMethod
    public void reportFeedbackWidgetManually(ReadableArray args, String instanceName, final Promise promise) {
        this.impl.reportFeedbackWidgetManually(args, instanceName, promise);
    }

    @ReactMethod
    public void getAvailableFeedbackWidgets(String instanceName, final Promise promise) {
        this.impl.getAvailableFeedbackWidgets(instanceName, promise);
    }

    @ReactMethod
    public void presentFeedbackWidget(ReadableArray args, String instanceName, final Promise promise) {
        this.impl.presentFeedbackWidget(args, instanceName, promise);
    }

    @ReactMethod
    public void replaceAllAppKeysInQueueWithCurrentAppKey(String instanceName) {
        this.impl.replaceAllAppKeysInQueueWithCurrentAppKey(instanceName);
    }

    @ReactMethod
    public void removeDifferentAppKeysFromQueue(String instanceName) {
        this.impl.removeDifferentAppKeysFromQueue(instanceName);
    }

    @ReactMethod
    public void setEventSendThreshold(ReadableArray args, String instanceName) {
        this.impl.setEventSendThreshold(args, instanceName);
    }

    @ReactMethod
    public void addCustomNetworkRequestHeaders(ReadableArray args, String instanceName) {
        this.impl.addCustomNetworkRequestHeaders(args, instanceName);
    }

    @ReactMethod
    public void startTrace(ReadableArray args, String instanceName) {
        this.impl.startTrace(args, instanceName);
    }

    @ReactMethod
    public void cancelTrace(ReadableArray args, String instanceName) {
        this.impl.cancelTrace(args, instanceName);
    }

    @ReactMethod
    public void clearAllTraces(ReadableArray args, String instanceName) {
        this.impl.clearAllTraces(args, instanceName);
    }

    @ReactMethod
    public void endTrace(ReadableArray args, String instanceName) {
        this.impl.endTrace(args, instanceName);
    }

    @ReactMethod
    public void recordNetworkTrace(ReadableArray args, String instanceName) {
        this.impl.recordNetworkTrace(args, instanceName);
    }

    @ReactMethod
    public void recordIndirectAttribution(ReadableArray args, String instanceName) {
        this.impl.recordIndirectAttribution(args, instanceName);
    }

    @ReactMethod
    public void recordDirectAttribution(ReadableArray args, String instanceName) {
        this.impl.recordDirectAttribution(args, instanceName);
    }

    @ReactMethod
    public void appLoadingFinished(String instanceName) {
        this.impl.appLoadingFinished(instanceName);
    }

    @ReactMethod
    public void enableRequestCapture(String instanceName, Promise promise) {
        this.impl.enableRequestCapture(instanceName, promise);
    }

    @ReactMethod
    public void getCapturedRequests(String instanceName, Promise promise) {
        this.impl.getCapturedRequests(instanceName, promise);
    }

    @ReactMethod
    public void getRequestQueue(String instanceName, Promise promise) {
        this.impl.getRequestQueue(instanceName, promise);
    }

    @ReactMethod
    public void getEventQueue(String instanceName, Promise promise) {
        this.impl.getEventQueue(instanceName, promise);
    }

    @ReactMethod
    public void halt(String instanceName, Promise promise) {
        this.impl.halt(instanceName, promise);
    }

    @ReactMethod
    public void removeInstance(String instanceName, Promise promise) {
        this.impl.removeInstance(instanceName, promise);
    }

    @ReactMethod
    public void haltAllInstances(Promise promise) {
        this.impl.haltAllInstances(promise);
    }

    @ReactMethod
    public void enterContentZone(String instanceName) {
        this.impl.enterContentZone(instanceName);
    }

    @ReactMethod
    public void refreshContentZone(String instanceName) {
        this.impl.refreshContentZone(instanceName);
    }

    @ReactMethod
    public void previewContent(ReadableArray args, String instanceName) {
        this.impl.previewContent(args, instanceName);
    }

    @ReactMethod
    public void exitContentZone(String instanceName) {
        this.impl.exitContentZone(instanceName);
    }

    @ReactMethod
    public void setID(String newDeviceID, String instanceName) {
        this.impl.setID(newDeviceID, instanceName);
    }

    @ReactMethod
    public void setCustomMetrics(ReadableArray args, String instanceName) {
        this.impl.setCustomMetrics(args, instanceName);
    }

    @ReactMethod
    public void addListener(String eventType) {
        this.impl.addListener(eventType);
    }

    @ReactMethod
    public void removeListeners(double id) {
        this.impl.removeListeners(id);
    }
}
