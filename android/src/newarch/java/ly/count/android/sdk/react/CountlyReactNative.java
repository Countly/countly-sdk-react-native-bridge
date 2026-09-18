package ly.count.android.sdk.react;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Callback;


public class CountlyReactNative extends NativeCountlyReactNativeSpec {
    private final CountlyReactNativeImpl impl;

    CountlyReactNative(ReactApplicationContext context) {
        super(context);
        this.impl = new CountlyReactNativeImpl(context);
    }


    @Override
    public void init(ReadableArray args, String instanceName, Promise promise) {
        this.impl.init(args, instanceName, promise);
    }

    @Override
    public void setLoggingEnabled(ReadableArray args, String instanceName) {
        this.impl.setLoggingEnabled(args, instanceName);
    }

    @Override
    public void isLoggingEnabled(String instanceName, final Promise promise) {
        this.impl.isLoggingEnabled(instanceName, promise);
    }

    @Override
    public void isInitialized(String instanceName, Promise promise) {
        this.impl.isInitialized(instanceName, promise);
    }

    @Override
    public void getCurrentDeviceId(String instanceName, Promise promise) {
        this.impl.getCurrentDeviceId(instanceName, promise);
    }

    @Override
    public void getDeviceIDType(String instanceName, Promise promise) {
        this.impl.getDeviceIDType(instanceName, promise);
    }

    @Override
    public void changeDeviceId(ReadableArray args, String instanceName) {
        this.impl.changeDeviceId(args, instanceName);
    }

    @Override
    public void setHttpPostForced(ReadableArray args, String instanceName) {
        this.impl.setHttpPostForced(args, instanceName);
    }

    @Override
    public void pinnedCertificates(ReadableArray args, String instanceName) {
        this.impl.pinnedCertificates(args, instanceName);
    }

    @Override
    public void setLocation(ReadableArray args, String instanceName) {
        this.impl.setLocation(args, instanceName);
    }

    @Override
    public void disableLocation(String instanceName) {
        this.impl.disableLocation(instanceName);
    }

    @Override
    public void addCrashLog(ReadableArray args, String instanceName) {
        this.impl.addCrashLog(args, instanceName);
    }

    @Override
    public void recordMetrics(ReadableArray args, String instanceName) {
        this.impl.recordMetrics(args, instanceName);
    }

    @Override
    public void startSession(String instanceName) {
        this.impl.startSession(instanceName);
    }

    @Override
    public void updateSession(String instanceName) {
        this.impl.updateSession(instanceName);
    }

    @Override
    public void endSession(String instanceName) {
        this.impl.endSession(instanceName);
    }

    @Override
    public void logException(ReadableArray args, String instanceName) {
        this.impl.logException(args, instanceName);
    }

    @Override
    public void logJSException(String err, String message, String stack, String instanceName) {
        this.impl.logJSException(err, message, stack, instanceName);
    }

    @Override
    public void setCustomCrashSegments(ReadableArray args, String instanceName) {
        this.impl.setCustomCrashSegments(args, instanceName);
    }

    @Override
    public void recordEvent(ReadableMap args, String instanceName) {
        this.impl.recordEvent(args, instanceName);
    }

    @Override
    public void startEvent(ReadableArray args, String instanceName) {
        this.impl.startEvent(args, instanceName);
    }

    @Override
    public void cancelEvent(ReadableArray args, String instanceName) {
        this.impl.cancelEvent(args, instanceName);
    }

    @Override
    public void endEvent(ReadableMap args, String instanceName) {
        this.impl.endEvent(args, instanceName);
    }

    @Override
    public void recordView(ReadableArray args, String instanceName) {
        this.impl.recordView(args, instanceName);
    }

    @Override
    public void startAutoStoppedView(ReadableArray args, String instanceName, Promise promise) {
        this.impl.startAutoStoppedView(args, instanceName, promise);
    }

    @Override
    public void startView(ReadableArray args, String instanceName, Promise promise) {
        this.impl.startView(args, instanceName, promise);
    }

    @Override
    public void stopViewWithName(ReadableArray args, String instanceName) {
        this.impl.stopViewWithName(args, instanceName);
    }

    @Override
    public void stopViewWithID(ReadableArray args, String instanceName) {
        this.impl.stopViewWithID(args, instanceName);
    }

    @Override
    public void stopAllViews(ReadableArray args, String instanceName) {
        this.impl.stopAllViews(args, instanceName);
    }

    @Override
    public void pauseViewWithID(ReadableArray args, String instanceName) {
        this.impl.pauseViewWithID(args, instanceName);
    }

    @Override
    public void resumeViewWithID(ReadableArray args, String instanceName) {
        this.impl.resumeViewWithID(args, instanceName);
    }

    @Override
    public void addSegmentationToViewWithID(ReadableArray args, String instanceName) {
        this.impl.addSegmentationToViewWithID(args, instanceName);
    }

    @Override
    public void addSegmentationToViewWithName(ReadableArray args, String instanceName) {
        this.impl.addSegmentationToViewWithName(args, instanceName);
    }

    @Override
    public void setGlobalViewSegmentation(ReadableArray args, String instanceName) {
        this.impl.setGlobalViewSegmentation(args, instanceName);
    }

    @Override
    public void updateGlobalViewSegmentation(ReadableArray args, String instanceName) {
        this.impl.updateGlobalViewSegmentation(args, instanceName);
    }

    @Override
    public void setUserData(ReadableArray args, String instanceName, Promise promise) {
        this.impl.setUserData(args, instanceName, promise);
    }

    @Override
    public void sendPushToken(ReadableArray args, String instanceName) {
        this.impl.sendPushToken(args, instanceName);
    }

    @Override
    public void registerForNotification(ReadableArray args, String instanceName) {
        this.impl.registerForNotification(args, instanceName);
    }

    @Override
    public void askForNotificationPermission(ReadableArray args, String instanceName) {
        this.impl.askForNotificationPermission(args, instanceName);
    }

    @Override
    public void userData_setProperty(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_setProperty(args, instanceName, promise);
    }

    @Override
    public void userData_increment(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_increment(args, instanceName, promise);
    }

    @Override
    public void userData_incrementBy(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_incrementBy(args, instanceName, promise);
    }

    @Override
    public void userData_multiply(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_multiply(args, instanceName, promise);
    }

    @Override
    public void userData_saveMax(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_saveMax(args, instanceName, promise);
    }

    @Override
    public void userData_saveMin(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_saveMin(args, instanceName, promise);
    }

    @Override
    public void userData_setOnce(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_setOnce(args, instanceName, promise);
    }

    @Override
    public void userData_pushUniqueValue(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_pushUniqueValue(args, instanceName, promise);
    }

    @Override
    public void userData_pushValue(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_pushValue(args, instanceName, promise);
    }

    @Override
    public void userData_pullValue(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userData_pullValue(args, instanceName, promise);
    }

    @Override
    public void userDataBulk_setUserProperties(ReadableMap userData, String instanceName, Promise promise) {
        this.impl.userDataBulk_setUserProperties(userData, instanceName, promise);
    }

    @Override
    public void userDataBulk_save(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_save(args, instanceName, promise);
    }

    @Override
    public void userDataBulk_setProperty(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_setProperty(args, instanceName, promise);
    }

    @Override
    public void userDataBulk_increment(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_increment(args, instanceName, promise);
    }

    @Override
    public void userDataBulk_incrementBy(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_incrementBy(args, instanceName, promise);
    }

    @Override
    public void userDataBulk_multiply(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_multiply(args, instanceName, promise);
    }

    @Override
    public void userDataBulk_saveMax(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_saveMax(args, instanceName, promise);
    }

    @Override
    public void userDataBulk_saveMin(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_saveMin(args, instanceName, promise);
    }

    @Override
    public void userDataBulk_setOnce(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_setOnce(args, instanceName, promise);
    }

    @Override
    public void userDataBulk_pushUniqueValue(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_pushUniqueValue(args, instanceName, promise);
    }

    @Override
    public void userDataBulk_pushValue(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_pushValue(args, instanceName, promise);
    }

    @Override
    public void userDataBulk_pullValue(ReadableArray args, String instanceName, Promise promise) {
        this.impl.userDataBulk_pullValue(args, instanceName, promise);
    }

    @Override
    public void giveConsent(ReadableArray featureNames, String instanceName) {
        this.impl.giveConsent(featureNames, instanceName);
    }

    @Override
    public void removeConsent(ReadableArray featureNames, String instanceName) {
        this.impl.removeConsent(featureNames, instanceName);
    }

    @Override
    public void giveAllConsent(String instanceName) {
        this.impl.giveAllConsent(instanceName);
    }

    @Override
    public void removeAllConsent(String instanceName) {
        this.impl.removeAllConsent(instanceName);
    }

    @Override
    public void remoteConfigUpdate(ReadableArray args, String instanceName, final Callback myCallback) {
        this.impl.remoteConfigUpdate(args, instanceName, myCallback);
    }

    @Override
    public void updateRemoteConfigForKeysOnly(ReadableArray args, String instanceName, final Callback myCallback) {
        this.impl.updateRemoteConfigForKeysOnly(args, instanceName, myCallback);
    }

    @Override
    public void updateRemoteConfigExceptKeys(ReadableArray args, String instanceName, final Callback myCallback) {
        this.impl.updateRemoteConfigExceptKeys(args, instanceName, myCallback);
    }

    @Override
    public void getRemoteConfigValueForKey(ReadableArray args, String instanceName, final Callback myCallback) {
        this.impl.getRemoteConfigValueForKey(args, instanceName, myCallback);
    }

    @Override
    public void getRemoteConfigValueForKeyP(String keyName, String instanceName, Promise promise) {
        this.impl.getRemoteConfigValueForKeyP(keyName, instanceName, promise);
    }

    @Override
    public void remoteConfigClearValues(String instanceName, Promise promise) {
        this.impl.remoteConfigClearValues(instanceName, promise);
    }

    @Override
    public void showStarRating(ReadableArray args, String instanceName, final Callback callback) {
        this.impl.showStarRating(args, instanceName, callback);
    }

    @Override
    public void presentRatingWidgetWithID(ReadableArray args, String instanceName) {
        this.impl.presentRatingWidgetWithID(args, instanceName);
    }

    @Override
    public void presentNPS(ReadableArray args, String instanceName) {
        this.impl.presentNPS(args, instanceName);
    }

    @Override
    public void presentSurvey(ReadableArray args, String instanceName) {
        this.impl.presentSurvey(args, instanceName);
    }

    @Override
    public void presentRating(ReadableArray args, String instanceName) {
        this.impl.presentRating(args, instanceName);
    }

    @Override
    public void getFeedbackWidgets(String instanceName, final Promise promise) {
        this.impl.getFeedbackWidgets(instanceName, promise);
    }

    @Override
    public void getFeedbackWidgetData(ReadableArray args, String instanceName, final Promise promise) {
        this.impl.getFeedbackWidgetData(args, instanceName, promise);
    }

    @Override
    public void reportFeedbackWidgetManually(ReadableArray args, String instanceName, final Promise promise) {
        this.impl.reportFeedbackWidgetManually(args, instanceName, promise);
    }

    @Override
    public void getAvailableFeedbackWidgets(String instanceName, final Promise promise) {
        this.impl.getAvailableFeedbackWidgets(instanceName, promise);
    }

    @Override
    public void presentFeedbackWidget(ReadableArray args, String instanceName, final Promise promise) {
        this.impl.presentFeedbackWidget(args, instanceName, promise);
    }

    @Override
    public void replaceAllAppKeysInQueueWithCurrentAppKey(String instanceName) {
        this.impl.replaceAllAppKeysInQueueWithCurrentAppKey(instanceName);
    }

    @Override
    public void removeDifferentAppKeysFromQueue(String instanceName) {
        this.impl.removeDifferentAppKeysFromQueue(instanceName);
    }

    @Override
    public void setEventSendThreshold(ReadableArray args, String instanceName) {
        this.impl.setEventSendThreshold(args, instanceName);
    }

    @Override
    public void addCustomNetworkRequestHeaders(ReadableArray args, String instanceName) {
        this.impl.addCustomNetworkRequestHeaders(args, instanceName);
    }

    @Override
    public void startTrace(ReadableArray args, String instanceName) {
        this.impl.startTrace(args, instanceName);
    }

    @Override
    public void cancelTrace(ReadableArray args, String instanceName) {
        this.impl.cancelTrace(args, instanceName);
    }

    @Override
    public void clearAllTraces(ReadableArray args, String instanceName) {
        this.impl.clearAllTraces(args, instanceName);
    }

    @Override
    public void endTrace(ReadableArray args, String instanceName) {
        this.impl.endTrace(args, instanceName);
    }

    @Override
    public void recordNetworkTrace(ReadableArray args, String instanceName) {
        this.impl.recordNetworkTrace(args, instanceName);
    }

    @Override
    public void recordIndirectAttribution(ReadableArray args, String instanceName) {
        this.impl.recordIndirectAttribution(args, instanceName);
    }

    @Override
    public void recordDirectAttribution(ReadableArray args, String instanceName) {
        this.impl.recordDirectAttribution(args, instanceName);
    }

    @Override
    public void appLoadingFinished(String instanceName) {
        this.impl.appLoadingFinished(instanceName);
    }

    @Override
    public void enableRequestCapture(String instanceName, Promise promise) {
        this.impl.enableRequestCapture(instanceName, promise);
    }

    @Override
    public void getCapturedRequests(String instanceName, Promise promise) {
        this.impl.getCapturedRequests(instanceName, promise);
    }

    @Override
    public void getRequestQueue(String instanceName, Promise promise) {
        this.impl.getRequestQueue(instanceName, promise);
    }

    @Override
    public void getEventQueue(String instanceName, Promise promise) {
        this.impl.getEventQueue(instanceName, promise);
    }

    @Override
    public void halt(String instanceName, Promise promise) {
        this.impl.halt(instanceName, promise);
    }

    @Override
    public void removeInstance(String instanceName, Promise promise) {
        this.impl.removeInstance(instanceName, promise);
    }

    @Override
    public void haltAllInstances(Promise promise) {
        this.impl.haltAllInstances(promise);
    }

    @Override
    public void enterContentZone(String instanceName) {
        this.impl.enterContentZone(instanceName);
    }

    @Override
    public void refreshContentZone(String instanceName) {
        this.impl.refreshContentZone(instanceName);
    }

    @Override
    public void previewContent(ReadableArray args, String instanceName) {
        this.impl.previewContent(args, instanceName);
    }

    @Override
    public void exitContentZone(String instanceName) {
        this.impl.exitContentZone(instanceName);
    }

    @Override
    public void setID(String newDeviceID, String instanceName) {
        this.impl.setID(newDeviceID, instanceName);
    }

    @Override
    public void setCustomMetrics(ReadableArray args, String instanceName) {
        this.impl.setCustomMetrics(args, instanceName);
    }

    @Override
    public void addListener(String eventType) {
        this.impl.addListener(eventType);
    }

    @Override
    public void removeListeners(double id) {
        this.impl.removeListeners(id);
    }
}
