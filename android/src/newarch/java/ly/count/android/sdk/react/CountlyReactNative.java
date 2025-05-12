package ly.count.android.sdk.react;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

/*
 * public void init(ReadableArray args, Promise promise)
public void setLoggingEnabled(ReadableArray args)
public void isLoggingEnabled(final Promise promise)
public void isInitialized(Promise promise)
public void hasBeenCalledOnStart(Promise promise)
public void getCurrentDeviceId(Promise promise)
public void getDeviceIDType(Promise promise)
public void changeDeviceId(ReadableArray args)
public void setHttpPostForced(ReadableArray args)
public void enableParameterTamperingProtection(ReadableArray args)
public void pinnedCertificates(ReadableArray args)
public void setLocationInit(ReadableArray args)
public void setLocation(ReadableArray args)
public void disableLocation()
public void enableCrashReporting()
public void addCrashLog(ReadableArray args)
public void logException(ReadableArray args)
public void logJSException(String err, String message, String stack)
public void setCustomCrashSegments(ReadableArray args)
public void recordEvent(ReadableMap args)
public void startEvent(ReadableArray args)
public void cancelEvent(ReadableArray args)
public void endEvent(ReadableMap args)
public void recordView(ReadableArray args)
public void setUserData(ReadableArray args, Promise promise)
public void sendPushToken(ReadableArray args)
public void pushTokenType(ReadableArray args)
public static void onNotification(Map<String, String> notification)
public void registerForNotification(ReadableArray args)
public void askForNotificationPermission(ReadableArray args)
public void configureIntentRedirectionCheck(ReadableArray intentClassNames, ReadableArray intentPackageNames, boolean useAdditionalIntentRedirectionChecks)
public void userData_setProperty(ReadableArray args, Promise promise)
public void userData_increment(ReadableArray args, Promise promise)
public void userData_incrementBy(ReadableArray args, Promise promise)
public void userData_multiply(ReadableArray args, Promise promise)
public void userData_saveMax(ReadableArray args, Promise promise)
public void userData_saveMin(ReadableArray args, Promise promise)
public void userData_setOnce(ReadableArray args, Promise promise)
public void userData_pushUniqueValue(ReadableArray args, Promise promise)
public void userData_pushValue(ReadableArray args, Promise promise)
public void userData_pullValue(ReadableArray args, Promise promise)
public void userDataBulk_setUserProperties(ReadableMap userData, Promise promise)
public void userDataBulk_save(ReadableArray args, Promise promise)
public void userDataBulk_setProperty(ReadableArray args, Promise promise)
public void userDataBulk_increment(ReadableArray args, Promise promise)
public void userDataBulk_incrementBy(ReadableArray args, Promise promise)
public void userDataBulk_multiply(ReadableArray args, Promise promise)
public void userDataBulk_saveMax(ReadableArray args, Promise promise)
public void userDataBulk_saveMin(ReadableArray args, Promise promise)
public void userDataBulk_setOnce(ReadableArray args, Promise promise)
public void userDataBulk_pushUniqueValue(ReadableArray args, Promise promise)
public void userDataBulk_pushValue(ReadableArray args, Promise promise)
public void userDataBulk_pullValue(ReadableArray args, Promise promise)
public void setRequiresConsent(ReadableArray args)
public void giveConsentInit(ReadableArray featureNames)
public void giveConsent(ReadableArray featureNames)
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
}
