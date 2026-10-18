import { Platform } from "react-native";

import * as L from "./Logger.js";
import * as Validate from "./Validators.js";
import parseErrorStackLib from "react-native/Libraries/Core/Devtools/parseErrorStack.js";

const PUSH_TOKEN_TYPE_CODES = {
    DEVELOPMENT: "1",
    PRODUCTION: "0",
    ADHOC: "2",
    1: "1",
    0: "0",
    2: "2",
};

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
 * Converts direct attribution campaign data to the JSON text the native SDKs expect.
 *
 * @param {String | Object} campaignData campaign data as JSON text or as an object
 * @return {String | null} the campaign data as JSON text, or null when it is missing or not text or an object
 */
function toCampaignDataText(campaignData) {
    if (typeof campaignData === "string") {
        return campaignData.length > 0 ? campaignData : null;
    }
    if (campaignData && typeof campaignData === "object" && !Array.isArray(campaignData)) {
        try {
            return JSON.stringify(campaignData);
        } catch (error) {
            L.e(`toCampaignDataText, campaign data could not be converted to JSON: ${error}`);
        }
    }
    return null;
}

/**
 * Converts indirect attribution values to the text values the native SDKs expect, skipping null and undefined values.
 *
 * @param {Object} attributionValues attribution values as key/value pairs
 * @return {Object | null} the attribution values with text values, or null when the input is not an object
 */
function toAttributionValues(attributionValues) {
    if (!attributionValues || typeof attributionValues !== "object" || Array.isArray(attributionValues)) {
        return null;
    }
    const textValues = {};
    for (const key in attributionValues) {
        const value = attributionValues[key];
        if (value === null || value === undefined) {
            continue;
        }
        textValues[key] = typeof value === "object" ? JSON.stringify(value) : String(value);
    }
    return textValues;
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
        if (typeof config.deviceID === "string" && config.deviceID.length > 0) {
            json.deviceID = config.deviceID;
        }

        if (config.loggingEnabled !== undefined && config.loggingEnabled !== null) {
            json.loggingEnabled = Boolean(config.loggingEnabled);
            if (json.loggingEnabled) {
                L.i(`init configuration, Enabled logging in ${__DEV__ ? "development" : "production"} mode`);
            }
        }
        if (config._crashReporting) {
            json.crashReporting = true;
            L.i("init configuration, Enabled crash reporting");
        }
        if (config.shouldRequireConsent) {
            json.shouldRequireConsent = config.shouldRequireConsent;
            L.i("init configuration, Require consent");
        }
        if (config.consents !== undefined && config.consents !== null) {
            const consents = Validate.normalizeFeatureNames(config.consents);
            if (consents === null) {
                L.e("init configuration, consents should be a feature name or a list of feature names, skipping them");
            } else {
                json.consents = consents;
                L.i(`init configuration, Consents: ${JSON.stringify(consents)}`);
            }
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
        if (config.content.webViewDisplayOption) {
            json.webViewDisplayOption = config.content.webViewDisplayOption;
            L.i(`init configuration, WebView display option: ${config.content.webViewDisplayOption}`);
        }
        if (config._disableIntentRedirectionCheck) {
            json.disableAdditionalIntentRedirectionChecks = true;
            L.i("init configuration, Disabled additional intent redirection checks");
        }
        const pushNotification = {};
        if (config.tokenType !== undefined && config.tokenType !== null && config.tokenType !== "") {
            const tokenTypeKey = typeof config.tokenType === "string" ? config.tokenType.trim().toUpperCase() : null;
            if (tokenTypeKey !== null && Object.prototype.hasOwnProperty.call(PUSH_TOKEN_TYPE_CODES, tokenTypeKey)) {
                pushNotification.tokenType = PUSH_TOKEN_TYPE_CODES[tokenTypeKey];
                L.i(`init configuration, Token type: ${config.tokenType}`);
            } else {
                L.e(`init configuration, push token type [${config.tokenType}] is not supported, use a Countly.messagingMode value`);
            }
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
        if (Object.keys(pushNotification).length > 0) {
            json.pushNotification = pushNotification;
        }
        if (config.allowedIntentClassNames) {
            json.allowedIntentClassNames = config.allowedIntentClassNames;
            L.i(`init configuration, Allowed intent class names: ${config.allowedIntentClassNames}`);
        }
        if (config.allowedIntentPackageNames) {
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
        if (config.campaignType !== undefined || config.campaignData !== undefined) {
            const campaignData = toCampaignDataText(config.campaignData);
            if (typeof config.campaignType === "string" && config.campaignType.length > 0 && campaignData) {
                json.campaignType = config.campaignType;
                json.campaignData = campaignData;
                L.i(`init configuration, Campaign type: ${config.campaignType}, Campaign data: ${campaignData}`);
            } else {
                L.e("init configuration, direct attribution needs a campaign type and campaign data, skipping it");
            }
        }
        if (config._requestTimeoutDuration) {
            json.requestTimeoutDuration = config._requestTimeoutDuration;
            L.i(`init configuration, Request timeout duration: ${config._requestTimeoutDuration}`);
        }
        if (config._enableAutomaticViewTracking) {
            json.enableAutomaticViewTracking = true;
            L.i("init configuration, Enabled automatic view tracking");
        }
        if (config._automaticViewTrackingExclusionList) {
            json.automaticViewTrackingExclusionList = config._automaticViewTrackingExclusionList;
            L.i(`init configuration, Automatic view tracking exclusion list: ${JSON.stringify(config._automaticViewTrackingExclusionList)}`);
        }
        if (config._globalViewSegmentation) {
            json.globalViewSegmentation = config._globalViewSegmentation;
            L.i(`init configuration, Global view segmentation: ${JSON.stringify(config._globalViewSegmentation)}`);
        }
        if (config._manualSessionControl) {
            json.manualSessionHandling = true;
            L.i("init configuration, Enabled manual session control");
        }
        if (config._manualSessionControlHybridMode) {
            json.enableManualSessionControlHybridMode = true;
            L.i("init configuration, Enabled hybrid manual session control");
        }
        if (config._customNetworkRequestHeaders) {
            json.customNetworkRequestHeaders = config._customNetworkRequestHeaders;
            L.i(`init configuration, Custom network request headers: ${JSON.stringify(config._customNetworkRequestHeaders)}`);
        }
        if (config.attributionValues !== undefined && config.attributionValues !== null) {
            const attributionValues = toAttributionValues(config.attributionValues);
            if (attributionValues) {
                json.attributionValues = attributionValues;
                L.i(`init configuration, Attribution values: ${JSON.stringify(attributionValues)}`);
            } else {
                L.e("init configuration, indirect attribution values must be an object of text values, skipping them");
            }
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
        if (config._disableGradualRequestCleaner) {
            L.i("init configuration, disabled gradual request cleaner");
            json.disableGradualRequestCleaner = true;
        }
        if (config._disableViewRestartForManualRecording) {
            L.i("init configuration, disabled view restart for manual recordings");
            json.disableViewRestartForManualRecording = true;
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
        if (Object.prototype.hasOwnProperty.call(Platform, "constants")) {
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

export { configToJson, intToDeviceIDType, DeviceIdType, getStackTrace, toCampaignDataText, toAttributionValues };
