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
        }
        if (config.crashReporting) {
            json.crashReporting = config.crashReporting;
        }
        if (config.shouldRequireConsent) {
            json.shouldRequireConsent = config.shouldRequireConsent;
        }
        if (config.consents) {
            json.consents = config.consents;
        }
        if (config.locationCountryCode) {
            json.locationCountryCode = config.locationCountryCode;
        }
        if (config.locationCity) {
            json.locationCity = config.locationCity;
        }
        if (config.locationGpsCoordinates) {
            json.locationGpsCoordinates = config.locationGpsCoordinates;
        }
        if (config.locationIpAddress) {
            json.locationIpAddress = config.locationIpAddress;
        }
        if (config.tamperingProtectionSalt) {
            json.tamperingProtectionSalt = config.tamperingProtectionSalt;
        }
        // APM ------------------------------------------------
        if (config.apm.enableForegroundBackground) {
            json.enableForegroundBackground = config.apm.enableForegroundBackground;
        }
        if (config.apm.enableManualAppLoaded) {
            json.enableManualAppLoaded = config.apm.enableManualAppLoaded;
        }
        if (config.apm.startTSOverride) {
            json.startTSOverride = config.apm.startTSOverride;
        }
        if (config.apm.trackAppStartTime) {
            json.trackAppStartTime = config.apm.trackAppStartTime;
        }
        // Legacy APM
        if (config.enableApm) {
            json.enableApm = config.enableApm;
        }
        // APM END --------------------------------------------
        if (config.disableAdditionalIntentRedirectionChecks) {
            json["disableAdditionalIntentRedirectionChecks"] = config.disableAdditionalIntentRedirectionChecks;
        }
        const pushNotification = {};
        if (config.tokenType) {
            pushNotification.tokenType = config.tokenType;
        }
        if (config.channelName) {
            pushNotification.channelName = config.channelName;
        }
        if (config.channelDescription) {
            pushNotification.channelDescription = config.channelDescription;
        }
        if (config.accentColor) {
            pushNotification.accentColor = config.accentColor;
        }
        json.pushNotification = pushNotification;
        if (config.allowedIntentClassNames) {
            json.allowedIntentClassNames = config.allowedIntentClassNames;
        }
        if (config.allowedIntentClassNames) {
            json.allowedIntentPackageNames = config.allowedIntentPackageNames;
        }
        if (config.starRatingTextTitle) {
            json.starRatingTextTitle = config.starRatingTextTitle;
        }
        if (config.starRatingTextMessage) {
            json.starRatingTextMessage = config.starRatingTextMessage;
        }
        if (config.starRatingTextDismiss) {
            json.starRatingTextDismiss = config.starRatingTextDismiss;
        }
        if (config.campaignType) {
            json.campaignType = config.campaignType;
            json.campaignData = config.campaignData;
        }
        if (config.attributionValues) {
            json.attributionValues = config.attributionValues;
        }
        // Limits -----------------------------------------------
        if (config.sdkInternalLimits.maxKeyLength) {
            if (config.sdkInternalLimits.maxKeyLength < 1) {
                L.w(`configToJson, Provided value for maxKeyLength is invalid!`)
            } else {
                json.maxKeyLength = config.sdkInternalLimits.maxKeyLength;
            }
        }
        if (config.sdkInternalLimits.maxValueSize) {
            if (config.sdkInternalLimits.maxValueSize < 1) {
                L.w(`configToJson, Provided value for maxValueSize is invalid!`)
            } else {
                json.maxValueSize = config.sdkInternalLimits.maxValueSize;
            }
        }
        if (config.sdkInternalLimits.maxSegmentationValues) {
            if (config.sdkInternalLimits.maxSegmentationValues < 1) {
                L.w(`configToJson, Provided value for maxSegmentationValues is invalid!`)
            } else {
                json.maxSegmentationValues = config.sdkInternalLimits.maxSegmentationValues;
            }
        }
        if (config.sdkInternalLimits.maxBreadcrumbCount) {
            if (config.sdkInternalLimits.maxBreadcrumbCount < 1) {
                L.w(`configToJson, Provided value for maxBreadcrumbCount is invalid!`)
            } else {
                json.maxBreadcrumbCount = config.sdkInternalLimits.maxBreadcrumbCount;
            }
        }
        if (config.sdkInternalLimits.maxStackTraceLinesPerThread) {
            if (config.sdkInternalLimits.maxStackTraceLinesPerThread < 1) {
                L.w(`configToJson, Provided value for maxStackTraceLinesPerThread is invalid!`)
            } else {
                json.maxStackTraceLinesPerThread = config.sdkInternalLimits.maxStackTraceLinesPerThread;
            }
        }
        if (config.sdkInternalLimits.maxStackTraceLineLength) {
            if (config.sdkInternalLimits.maxStackTraceLineLength < 1) {
                L.w(`configToJson, Provided value for maxStackTraceLineLength is invalid!`)
            } else {
                json.maxStackTraceLineLength = config.sdkInternalLimits.maxStackTraceLineLength;
            }
        }
        // Limits End --------------------------------------------
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
