import parseErrorStackLib from '../react-native/Libraries/Core/Devtools/parseErrorStack.js';
import * as L from './Logger.js';

const DeviceIdType = {
    DEVELOPER_SUPPLIED: 'DEVELOPER_SUPPLIED',
    SDK_GENERATED: 'SDK_GENERATED',
    TEMPORARY_ID: 'TEMPORARY_ID',
};

/**
 *
 * internal countly function that converts String to DeviceIdType.
 *
 * @return {DeviceIdType || null} deviceIdType e.g DeviceIdType.DEVELOPER_SUPPLIED, DeviceIdType.TEMPORARY_ID, DeviceIdType.SDK_GENERATED.
 */
function stringToDeviceIDType(deviceIdType) {
    let result = null;
    switch (deviceIdType) {
        case 'DS':
            result = DeviceIdType.DEVELOPER_SUPPLIED;
            break;
        case 'TID':
            result = DeviceIdType.TEMPORARY_ID;
            break;
        case 'SG':
            result = DeviceIdType.SDK_GENERATED;
            break;
    }
    if (result == null) {
        L.e(`_getDeviceIdType, ` + `unexpected deviceIdType [${deviceIdType}] from native side`);
        return null;
    }
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
    L.d('configToJson, Converting config to json');
    const json = {};
    try {
        json['serverURL'] = config.serverURL;
        json['appKey'] = config.appKey;
        json['deviceID'] = config.deviceID;

        if (config.loggingEnabled) {
            json['loggingEnabled'] = config.loggingEnabled;
        }
        if (config.crashReporting) {
            json['crashReporting'] = config.crashReporting;
        }
        if (config.shouldRequireConsent) {
            json['shouldRequireConsent'] = config.shouldRequireConsent;
        }
        if (config.consents) {
            json['consents'] = config.consents;
        }
        if (config.locationCountryCode) {
            json['locationCountryCode'] = config.locationCountryCode;
        }
        if (config.locationCity) {
            json['locationCity'] = config.locationCity;
        }
        if (config.locationGpsCoordinates) {
            json['locationGpsCoordinates'] = config.locationGpsCoordinates;
        }
        if (config.locationIpAddress) {
            json['locationIpAddress'] = config.locationIpAddress;
        }
        if (config.tamperingProtectionSalt) {
            json['tamperingProtectionSalt'] = config.tamperingProtectionSalt;
        }
        if (config.enableApm) {
            json['enableApm'] = config.enableApm;
        }
        if (config.disableAdditionalIntentRedirectionChecks) {
            json['disableAdditionalIntentRedirectionChecks'] = config.disableAdditionalIntentRedirectionChecks;
        }
        const pushNotification = {};
        if (config.tokenType) {
            pushNotification['tokenType'] = config.tokenType;
        }
        if (config.channelName) {
            pushNotification['channelName'] = config.channelName;
        }
        if (config.channelDescription) {
            pushNotification['channelDescription'] = config.channelDescription;
        }
        if (config.accentColor) {
            pushNotification['accentColor'] = config.accentColor;
        }
        json['pushNotification'] = pushNotification;
        if (config.allowedIntentClassNames) {
            json['allowedIntentClassNames'] = config.allowedIntentClassNames;
        }
        if (config.allowedIntentPackageNames) {
            json['allowedIntentPackageNames'] = config.allowedIntentPackageNames;
        }
        if (config.starRatingTextTitle) {
            json['starRatingTextTitle'] = config.starRatingTextTitle;
        }
        if (config.starRatingTextMessage) {
            json['starRatingTextMessage'] = config.starRatingTextMessage;
        }
        if (config.starRatingTextDismiss) {
            json['starRatingTextDismiss'] = config.starRatingTextDismiss;
        }
        if (config.campaignType) {
            json['campaignType'] = config.campaignType;
            json['campaignData'] = config.campaignData;
        }
        if (config.attributionValues) {
            json['attributionValues'] = config.attributionValues;
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
        if (Platform.hasOwnProperty('constants')) {
            // RN version >= 0.63
            if (Platform.constants.reactNativeVersion.minor >= 64) {
                // RN version >= 0.64
                jsStackTrace = parseErrorStackLib(e.stack);
            }
            // RN version == 0.63
            else {
                jsStackTrace = parseErrorStackLib(e);
            }
        }
        // RN version < 0.63
        else {
            jsStackTrace = parseErrorStackLib(e);
        }
    } catch (e) {
        // L.e('getStackTrace', e.message);
    }
    return jsStackTrace;
}

export { configToJson, stringToDeviceIDType, DeviceIdType, getStackTrace };
