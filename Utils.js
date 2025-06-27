import * as L from "./Logger.js";
import parseErrorStackLib from "react-native/Libraries/Core/Devtools/parseErrorStack.js";

const DeviceIdType = {
    DEVELOPER_SUPPLIED: "DEVELOPER_SUPPLIED",
    SDK_GENERATED: "SDK_GENERATED",
    TEMPORARY_ID: "TEMPORARY_ID",
};

/**
 *
 * internal countly function that converts int to DeviceIdType.
 * @param {number} deviceIdType device id type as int
 *
 * @return {DeviceIdType} deviceIdType e.g DeviceIdType.DEVELOPER_SUPPLIED, DeviceIdType.TEMPORARY_ID, DeviceIdType.SDK_GENERATED.
 */
function intToDeviceIDType(deviceIdType) {
    let result = null;
    switch (deviceIdType) {
    case 10101:
        result = DeviceIdType.SDK_GENERATED;
        break;
    case 20202:
        result = DeviceIdType.DEVELOPER_SUPPLIED;
        break;
    case 30303:
        result = DeviceIdType.TEMPORARY_ID;
        break;
    default:
        L.e("_getDeviceIdType, " + `unexpected deviceIdType [${deviceIdType}] from native side`);
        result = DeviceIdType.SDK_GENERATED;
        break;
    }
    L.d(`_getDeviceIdType, DeviceIDType: ${result}`);
    return result;
}

/**
 *
 * Converts countly config object to JSON
 *
 * @param {Object} countlyConfig config
 * @return {Object} json
 */
function configToJson(config) {
    L.d("configToJson, Converting config to json");
    const json = {};
    try {
        json.serverURL = config.serverURL;
        json.appKey = config.appKey;
        json.deviceID = config.deviceID;

        if (config.loggingEnabled) {
            json.loggingEnabled = config.loggingEnabled;
            L.i(`init configuration, Enabled logging in ${__DEV__ ? "development" : "production"} mode`);
        }
        if (config._crashReporting) {
            json.crashReporting = true;
            L.i("init configuration, Enabled crash reporting");
        }
        if (config.shouldRequireConsent) {
            json.shouldRequireConsent = config.shouldRequireConsent;
            L.i("init configuration, Require consent");
        }
        if (config.consents) {
            json.consents = config.consents;
            L.i(`init configuration, Consents: ${JSON.stringify(config.consents)}`);
        }
        if (config.locationCountryCode) {
            json.locationCountryCode = config.locationCountryCode;
            L.i(`init configuration, Location country code: ${config.locationCountryCode}`);
        }
        if (config.locationCity) {
            json.locationCity = config.locationCity;
            L.i(`init configuration, Location city: ${config.locationCity}`);
        }
        if (config.locationGpsCoordinates) {
            json.locationGpsCoordinates = config.locationGpsCoordinates;
            L.i(`init configuration, Location gps coordinates: ${config.locationGpsCoordinates}`);
        }
        if (config.locationIpAddress) {
            json.locationIpAddress = config.locationIpAddress;
            L.i(`init configuration, Location ip address: ${config.locationIpAddress}`);
        }
        if (config.tamperingProtectionSalt) {
            json.tamperingProtectionSalt = config.tamperingProtectionSalt;
            L.i(`init configuration, Tampering protection salt: ${config.tamperingProtectionSalt}`);
        }
        // APM ------------------------------------------------
        if (config.apm.foregroundBackground) {
            json.enableForegroundBackground = true;
            L.i("init configuration, APM enabled foreground background");
        }
        if (config.apm.manualAppLoaded) {
            json.enableManualAppLoaded = true;
            L.i("init configuration, APM enabled manual app loaded");
        }
        if (config.apm.startTSOverride) {
            json.startTSOverride = config.apm.startTSOverride;
            L.i(`init configuration, APM start timestamp override: ${config.apm.startTSOverride}`);
        }
        if (config.apm.trackAppStartTime) {
            json.trackAppStartTime = config.apm.trackAppStartTime;
            L.i("init configuration, APM track app start time");
        }
        // Legacy APM
        if (config._apmLegacy) {
            json.enableApm = true;
            L.i("init configuration, APM start time recording enabled");
        }
        // APM END --------------------------------------------
        if (config.experimental.previousNameRecording) {
            json.enablePreviousNameRecording = true;
            L.i("init configuration, Enabled previous name recording");
        }
        if (config.experimental.visibilityTracking) {
            json.enableVisibilityTracking = true;
            L.i("init configuration, Enabled visibility tracking");
        }
        if (config.content.timerInterval) {
            json.setZoneTimerInterval = config.content.timerInterval;
            L.i(`init configuration, Set zone timer interval to ${config.content.timerInterval}`);
        }
        if (config.content.contentCallback) {
            json.setGlobalContentCallback = true;
            L.i("init configuration, Set global content callback");
        }
        if (config._disableIntentRedirectionCheck) {
            json.disableAdditionalIntentRedirectionChecks = true;
            L.i("init configuration, Disabled additional intent redirection checks");
        }
        const pushNotification = {};
        if (config.tokenType) {
            pushNotification.tokenType = config.tokenType;
            L.i(`init configuration, Token type: ${config.tokenType}`);
        }
        if (config.channelName) {
            pushNotification.channelName = config.channelName;
            L.i(`init configuration, Channel name: ${config.channelName}`);
        }
        if (config.channelDescription) {
            pushNotification.channelDescription = config.channelDescription;
            L.i(`init configuration, Channel description: ${config.channelDescription}`);
        }
        if (config.accentColor) {
            pushNotification.accentColor = config.accentColor;
            L.i(`init configuration, Accent color: ${config.accentColor}`);
        }
        json.pushNotification = pushNotification;
        if (config.allowedIntentClassNames) {
            json.allowedIntentClassNames = config.allowedIntentClassNames;
            L.i(`init configuration, Allowed intent class names: ${config.allowedIntentClassNames}`);
        }
        if (config.allowedIntentClassNames) {
            json.allowedIntentPackageNames = config.allowedIntentPackageNames;
            L.i(`init configuration, Allowed intent package names: ${config.allowedIntentPackageNames}`);
        }
        if (config.starRatingTextTitle) {
            json.starRatingTextTitle = config.starRatingTextTitle;
            L.i(`init configuration, Star rating text title: ${config.starRatingTextTitle}`);
        }
        if (config.starRatingTextMessage) {
            json.starRatingTextMessage = config.starRatingTextMessage;
            L.i(`init configuration, Star rating text message: ${config.starRatingTextMessage}`);
        }
        if (config.starRatingTextDismiss) {
            json.starRatingTextDismiss = config.starRatingTextDismiss;
            L.i(`init configuration, Star rating text dismiss: ${config.starRatingTextDismiss}`);
        }
        if (config.campaignType) {
            json.campaignType = config.campaignType;
            json.campaignData = config.campaignData;
            L.i(`init configuration, Campaign type: ${config.campaignType}, Campaign data: ${config.campaignData}`);
        }
        if (config.attributionValues) {
            json.attributionValues = config.attributionValues;
            L.i(`init configuration, Attribution values: ${config.attributionValues}`);
        }
        // Limits -----------------------------------------------
        if (config.sdkInternalLimits.maxKeyLength) {
            if (config.sdkInternalLimits.maxKeyLength < 1) {
                L.w("configToJson, Provided value for maxKeyLength is invalid!");
            } else {
                json.maxKeyLength = config.sdkInternalLimits.maxKeyLength;
                L.i(`init configuration, Max key length: ${config.sdkInternalLimits.maxKeyLength}`);
            }
        }
        if (config.sdkInternalLimits.maxValueSize) {
            if (config.sdkInternalLimits.maxValueSize < 1) {
                L.w("configToJson, Provided value for maxValueSize is invalid!");
            } else {
                json.maxValueSize = config.sdkInternalLimits.maxValueSize;
                L.i(`init configuration, Max value size: ${config.sdkInternalLimits.maxValueSize}`);
            }
        }
        if (config.sdkInternalLimits.maxSegmentationValues) {
            if (config.sdkInternalLimits.maxSegmentationValues < 1) {
                L.w("configToJson, Provided value for maxSegmentationValues is invalid!");
            } else {
                json.maxSegmentationValues = config.sdkInternalLimits.maxSegmentationValues;
                L.i(`init configuration, Max segmentation values: ${config.sdkInternalLimits.maxSegmentationValues}`);
            }
        }
        if (config.sdkInternalLimits.maxBreadcrumbCount) {
            if (config.sdkInternalLimits.maxBreadcrumbCount < 1) {
                L.w("configToJson, Provided value for maxBreadcrumbCount is invalid!");
            } else {
                json.maxBreadcrumbCount = config.sdkInternalLimits.maxBreadcrumbCount;
                L.i(`init configuration, Max breadcrumb count: ${config.sdkInternalLimits.maxBreadcrumbCount}`);
            }
        }
        if (config.sdkInternalLimits.maxStackTraceLinesPerThread) {
            if (config.sdkInternalLimits.maxStackTraceLinesPerThread < 1) {
                L.w("configToJson, Provided value for maxStackTraceLinesPerThread is invalid!");
            } else {
                json.maxStackTraceLinesPerThread = config.sdkInternalLimits.maxStackTraceLinesPerThread;
                L.i(`init configuration, Max stack trace lines per thread: ${config.sdkInternalLimits.maxStackTraceLinesPerThread}`);
            }
        }
        if (config.sdkInternalLimits.maxStackTraceLineLength) {
            if (config.sdkInternalLimits.maxStackTraceLineLength < 1) {
                L.w("configToJson, Provided value for maxStackTraceLineLength is invalid!");
            } else {
                json.maxStackTraceLineLength = config.sdkInternalLimits.maxStackTraceLineLength;
                L.i(`init configuration, Max stack trace line length: ${config.sdkInternalLimits.maxStackTraceLineLength}`);
            }
        }
        // Limits End --------------------------------------------
        if (config._disableSDKBehaviorSettingsUpdates) {
            L.i("init configuration, disabled SDK behavior settings updates");
            json.disableSDKBehaviorSettingsUpdates = true;
        }
        if (config._disableBackoff) {
            L.i("init configuration, disabled backoff mechanism");
            json.disableBackoffMechanism = true;
        }
        if (config._sdkBehaviorSettings) {
            L.i(`init configuration, SDK behavior settings: ${JSON.stringify(config._sdkBehaviorSettings)}`);
            json.sdkBehaviorSettings = config._sdkBehaviorSettings;
        }
    } catch (err) {
        L.e(`configToJson, Exception occured during converting config to json.${err.toString()}`);
    }
    return json;
}

/**
 *
 * Get stack trace of an exception
 *
 * @param {any} e exception
 * @return {StackTrace || null} stack trace or null
 */
function getStackTrace(e) {
    let jsStackTrace = null;
    try {
        if (Platform.hasOwnProperty("constants")) {
            // RN version >= 0.63
            if (Platform.constants.reactNativeVersion.minor >= 64) {
                // RN version >= 0.64
                jsStackTrace = parseErrorStackLib(e.stack);
            } else {
                // RN version == 0.63
                jsStackTrace = parseErrorStackLib(e);
            }
        } else {
            // RN version < 0.63
            jsStackTrace = parseErrorStackLib(e);
        }
    } catch (err) {
        // L.e('getStackTrace', err.message);
    }
    return jsStackTrace;
}

export { configToJson, intToDeviceIDType, DeviceIdType, getStackTrace };
