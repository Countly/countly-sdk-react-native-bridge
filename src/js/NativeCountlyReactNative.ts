import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

/*
 * 
public void init(ReadableArray args, Promise promise)
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
export interface Spec extends TurboModule {
    init(args: Array<UnsafeObject>): Promise<void>;
    setLoggingEnabled(args: Array<boolean>): void;
    isLoggingEnabled(): Promise<boolean>;
    isInitialized(): Promise<boolean>;
    hasBeenCalledOnStart(): Promise<boolean>;
    getCurrentDeviceId(): Promise<string>;
    getDeviceIDType(): Promise<string>;
    changeDeviceId(args: Array<string>): void;
    setHttpPostForced(args: Array<boolean>): void;
    enableParameterTamperingProtection(args: Array<string>): void;
    pinnedCertificates(args: Array<string>): void;
    setLocationInit(args: Array<string | null>): void;
    setLocation(args: Array<number>): void;
    disableLocation(): void;
    enableCrashReporting(): void;
    addCrashLog(args: Array<string>): void;
    logException(args: Array<UnsafeObject>): void;
    logJSException(err: string, message: string, stack: string): void;
    setCustomCrashSegments(args: Array<UnsafeObject>): void;
    recordEvent(args: UnsafeObject): void;
    startEvent(args: Array<string>): void;
    cancelEvent(args: Array<string>): void;
    endEvent(args: UnsafeObject): void;
    recordView(args: Array<string>): void;
    setUserData(args: Array<UnsafeObject>): Promise<void>;
    sendPushToken(args: Array<string>): void;
    pushTokenType(args: Array<string>): void;
    registerForNotification(args: Array<UnsafeObject>): void;
    askForNotificationPermission(args: Array<UnsafeObject>): void;
    configureIntentRedirectionCheck(intentClassNames: Array<string>, intentPackageNames: Array<string>, useAdditionalIntentRedirectionChecks: boolean): void;
    userData_setProperty(args: Array<UnsafeObject>): Promise<void>;
    userData_increment(args: Array<string>): Promise<void>;
    userData_incrementBy(args: Array<string | number>): Promise<void>;
    userData_multiply(args: Array<string | number>): Promise<void>;
    userData_saveMax(args: Array<string | number>): Promise<void>;
    userData_saveMin(args: Array<string | number>): Promise<void>;
    userData_setOnce(args: Array<string | number>): Promise<void>;
    userData_pushUniqueValue(args: Array<string | number | boolean>): Promise<void>;
    userData_pushValue(args: Array<string | number | boolean>): Promise<void>;
    userData_pullValue(args: Array<string | number | boolean>): Promise<void>;
    userDataBulk_setUserProperties(userData: UnsafeObject): Promise<void>;
    userDataBulk_save(args: Array<UnsafeObject>): Promise<void>;
    userDataBulk_setProperty(args: Array<UnsafeObject>): Promise<void>;
    userDataBulk_increment(args: Array<string>): Promise<void>;
    userDataBulk_incrementBy(args: Array<string | number>): Promise<void>;
    userDataBulk_multiply(args: Array<string | number>): Promise<void>;
    userDataBulk_saveMax(args: Array<string | number>): Promise<void>;
    userDataBulk_saveMin(args: Array<string | number>): Promise<void>;
    userDataBulk_setOnce(args: Array<string | number>): Promise<void>;
    userDataBulk_pushUniqueValue(args: Array<string | number | boolean>): Promise<void>;
    userDataBulk_pushValue(args: Array<string | number | boolean>): Promise<void>;
    userDataBulk_pullValue(args: Array<string | number | boolean>): Promise<void>;
    setRequiresConsent(args: Array<string>): void;
    giveConsentInit(featureNames: Array<string>): void;
    giveConsent(featureNames: Array<string>): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>("CountlyReactNative");