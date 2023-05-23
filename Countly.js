/**
 * Countly SDK React Native Bridge
 * https://github.com/Countly/countly-sdk-react-native-bridge
 * @Countly
 */

import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import parseErrorStackLib from '../react-native/Libraries/Core/Devtools/parseErrorStack.js';
import CountlyConfig from './CountlyConfig.js';

const { CountlyReactNative } = NativeModules;
const eventEmitter = new NativeEventEmitter(CountlyReactNative);

const Countly = {};
Countly.serverUrl = '';
Countly.appKey = '';
let _isInitialized = false;
let _isPushInitialized = false;
const DeviceIdType = {
    DEVELOPER_SUPPLIED: 'DEVELOPER_SUPPLIED',
    SDK_GENERATED: 'SDK_GENERATED',
    TEMPORARY_ID: 'TEMPORARY_ID',
};

/*
 * Listener for rating widget callback, when callback recieve we will remove the callback using listener.
 */
let _ratingWidgetListener;
/*
 * Callback to be executed when feedback widget is displayed
 */
let _widgetShownCallback;

/*
 * Callback to be executed when feedback widget is closed
 */
let _widgetClosedCallback;

const widgetShownCallbackName = 'widgetShownCallback';
const widgetClosedCallbackName = 'widgetClosedCallback';
const ratingWidgetCallbackName = 'ratingWidgetCallback';
const pushNotificationCallbackName = 'pushNotificationCallback';

Countly.messagingMode = { 'DEVELOPMENT': '1', 'PRODUCTION': '0', 'ADHOC': '2' };
if (Platform.OS.match('android')) {
    Countly.messagingMode.DEVELOPMENT = '2';
}
Countly.TemporaryDeviceIDString = 'TemporaryDeviceID';

/**
 * Initialize Countly
 *
 * @deprecated in 23.02.0 : use 'initWithConfig' intead of 'init'.
 *
 * @function Countly.init should be used to initialize countly
 */
// countly initialization
Countly.init = async function (serverUrl, appKey, deviceId) {
    Countly.logError('init is deprecated, use initWithConfig instead');
    const countlyConfig = new CountlyConfig(serverUrl, appKey).setDeviceID(deviceId);
    Countly.initWithConfig(countlyConfig);
};

/**
 * Initialize Countly
 *
 * @function Countly.initWithConfig should be used to initialize countly with config
 */
// countly initialization with config
Countly.initWithConfig = async function (countlyConfig) {
    if (_isInitialized) {
        Countly.logError('init', 'SDK is already initialized');
        return;
    }
    if (countlyConfig.deviceID == '') {
        Countly.logError('init', "Device ID during init can't be an empty string. Value will be ignored.");
        countlyConfig.deviceId = null;
    }
    if (countlyConfig.serverURL == '') {
        Countly.logError('init', "Server URL during init can't be an empty string");
        return;
    }
    if (countlyConfig.appKey == '') {
        Countly.logError('init', "App Key during init can't be an empty string");
        return;
    }

    const args = [];
    const argsMap = _configToJson(countlyConfig);
    const argsString = JSON.stringify(argsMap);
    args.push(argsString);
    await CountlyReactNative.init(args);
    _isInitialized = true;
};

_configToJson = function (config) {
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
        if (config.tokenType) {
            const pushNotification = {};
            pushNotification['tokenType'] = config.tokenType;
            pushNotification['channelName'] = config.channelName;
            pushNotification['channelDescription'] = config.channelDescription;
            json['pushNotification'] = pushNotification;
        }
        if (config.allowedIntentClassNames) {
            json['allowedIntentClassNames'] = config.allowedIntentClassNames;
        }
        if (config.allowedIntentClassNames) {
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
        Countly.logError('_configToJson', 'Exception occured during converting config to json.' + err.toString());
    }
    return json;
};

Countly.isInitialized = async function () {
    // returns a promise
    _isInitialized = await CountlyReactNative.isInitialized();
    return _isInitialized;
};

Countly.hasBeenCalledOnStart = function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'hasBeenCalledOnStart'";
        Countly.logError('hasBeenCalledOnStart', message);
        return message;
    }
    return CountlyReactNative.hasBeenCalledOnStart();
};

// countly sending various types of events
Countly.sendEvent = function (options) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'sendEvent'";
        Countly.logError('sendEvent', message);
        return message;
    }
    const args = [];
    let eventType = 'event'; // event, eventWithSum, eventWithSegment, eventWithSumSegment
    let segments = {};

    if (options.eventSum) {
        eventType = 'eventWithSum';
    }
    if (options.segments) {
        eventType = 'eventWithSegment';
    }
    if (options.segments && options.eventSum) {
        eventType = 'eventWithSumSegment';
    }

    args.push(eventType);

    if (options.eventName) {
        args.push(options.eventName.toString());
    } else {
        args.push('');
    }
    if (options.eventCount) {
        args.push(options.eventCount.toString());
    } else {
        args.push('1');
    }

    if (options.eventSum) {
        options.eventSum = options.eventSum.toString();
        if (options.eventSum.indexOf('.') == -1) {
            options.eventSum = parseFloat(options.eventSum).toFixed(2);
            args.push(options.eventSum);
        } else {
            args.push(options.eventSum);
        }
    }

    if (options.segments) {
        segments = options.segments;
    }
    for (const event in segments) {
        args.push(event);
        args.push(segments[event]);
    }
    CountlyReactNative.event(args);
};

/**
 * Enable or disable automatic view tracking
 *
 * @deprecated in 20.04.6
 *
 */
Countly.setViewTracking = async function (boolean) {
    if (await CountlyReactNative.isLoggingEnabled()) {
        console.log('[CountlyReactNative] setViewTracking is deprecated.');
    }
};

/**
 * Record custom view to Countly.
 *
 * @param {string} recordView - name of the view
 * @param {Map} segments - allows to add optional segmentation,
 * Supported data type for segments values are String, int, double and bool
 */
Countly.recordView = async function (recordView, segments) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'recordView'";
        Countly.logError('recordView', msg);
        return msg;
    }
    const message = await Countly.validateString(recordView, 'view name', 'recordView');
    if (message) {
        return message;
    }

    const args = [];
    args.push(String(recordView));
    if (!segments) {
        segments = {};
    }
    for (const key in segments) {
        args.push(key);
        args.push(segments[key]);
    }
    CountlyReactNative.recordView(args);
};

/**
 * Disable push notifications feature, by default it is enabled.
 * Currently implemented for iOS only
 * Should be called before Countly init
 */
Countly.disablePushNotifications = function () {
    if (!Platform.OS.match('ios')) {
        return 'disablePushNotifications : To be implemented';
    }
    CountlyReactNative.disablePushNotifications();
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.pushTokenType' intead of 'pushTokenType'.
 *
 * Set messaging mode for push notifications
 * Should be called before Countly init
 */
Countly.pushTokenType = async function (tokenType, channelName, channelDescription) {
    const message = await Countly.validateString(tokenType, 'tokenType', 'pushTokenType');
    if (message) {
        return message;
    }

    const args = [];
    args.push(tokenType);
    args.push(channelName || '');
    args.push(channelDescription || '');
    CountlyReactNative.pushTokenType(args);
};
Countly.sendPushToken = function (options) {
    const args = [];
    args.push(options.token || '');
    CountlyReactNative.sendPushToken(args);
};

/**
 * This method will ask for permission, enables push notification and send push token to countly server.
 *
 * @param {string} customSoundPath - name of custom sound for push notifications (Only for Android)
 * Custom sound should be place at 'your_project_root/android/app/src/main/res/raw'
 * Should be called after Countly init
 *
 */
Countly.askForNotificationPermission = function (customSoundPath = 'null') {
    if (!_isInitialized) {
        const message = "'init' must be called before 'askForNotificationPermission'";
        Countly.logError('askForNotificationPermission', message);
        return message;
    }
    CountlyReactNative.askForNotificationPermission([customSoundPath]);
    _isPushInitialized = true;
};

/**
 *
 * Set callback to receive push notifications
 * @param {callback listener } theListener
 */
Countly.registerForNotification = function (theListener) {
    const event = eventEmitter.addListener(pushNotificationCallbackName, theListener);
    CountlyReactNative.registerForNotification([]);
    return event;
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.configureIntentRedirectionCheck' intead of 'configureIntentRedirectionCheck'.
 *
 * Configure intent redirection checks for push notification
 * Should be called before Countly "askForNotificationPermission"
 *
 * @param {array of allowed class names } allowedIntentClassNames set allowed intent class names
 * @param {array of allowed package names } allowedIntentClassNames set allowed intent package names
 * @param {bool to check additional intent checks} useAdditionalIntentRedirectionChecks by default its true
 */
Countly.configureIntentRedirectionCheck = function (allowedIntentClassNames = [], allowedIntentPackageNames = [], useAdditionalIntentRedirectionChecks = true) {
    if (Platform.OS.match('ios')) {
        return 'configureIntentRedirectionCheck : not required for iOS';
    }

    if (_isPushInitialized) {
        var message = "'configureIntentRedirectionCheck' must be called before 'askForNotificationPermission'";
        Countly.logError('configureIntentRedirectionCheck', message);
        return message;
    }
    if (!Array.isArray(allowedIntentClassNames)) {
        Countly.logWarning('configureIntentRedirectionCheck', `Ignoring, unsupported data type '${typeof allowedIntentClassNames}' 'allowedIntentClassNames' should be an array of String`);
        allowedIntentClassNames = [];
    }
    if (!Array.isArray(allowedIntentPackageNames)) {
        Countly.logWarning('configureIntentRedirectionCheck', `Ignoring, unsupported data type '${typeof allowedIntentPackageNames}' 'allowedIntentPackageNames' should be an array of String`);
        allowedIntentPackageNames = [];
    }

    if (typeof useAdditionalIntentRedirectionChecks !== 'boolean') {
        Countly.logWarning('configureIntentRedirectionCheck', `Ignoring, unsupported data type '${typeof useAdditionalIntentRedirectionChecks}' 'useAdditionalIntentRedirectionChecks' should be a boolean`);
        useAdditionalIntentRedirectionChecks = true;
    }

    const _allowedIntentClassNames = [];
    for (const className of allowedIntentClassNames) {
        var message = Countly.validateString(className, 'class name', 'configureIntentRedirectionCheck');
        if (message == null) {
            _allowedIntentClassNames.push(className);
        }
    }

    const _allowedIntentPackageNames = [];
    for (const packageName of allowedIntentPackageNames) {
        var message = Countly.validateString(packageName, 'package name', 'configureIntentRedirectionCheck');
        if (message == null) {
            _allowedIntentPackageNames.push(packageName);
        }
    }

    CountlyReactNative.configureIntentRedirectionCheck(_allowedIntentClassNames, _allowedIntentPackageNames, useAdditionalIntentRedirectionChecks);
};

// countly start for android
Countly.start = function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'start'";
        Countly.logError('start', message);
        return message;
    }
    CountlyReactNative.start();
};

// countly stop for android
Countly.stop = function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'stop'";
        Countly.logError('stop', message);
        return message;
    }
    CountlyReactNative.stop();
};

/**
 * Enable countly internal debugging logs
 * Should be called before Countly init
 *
 * @deprecated in 20.04.6
 *
 * @function Countly.setLoggingEnabled should be used to enable/disable countly internal debugging logs
 */

Countly.enableLogging = function () {
    CountlyReactNative.setLoggingEnabled([true]);
};

/**
 * Disable countly internal debugging logs
 *
 * @deprecated in 20.04.6
 *
 * @function Countly.setLoggingEnabled should be used to enable/disable countly internal debugging logs
 */
Countly.disableLogging = function () {
    CountlyReactNative.setLoggingEnabled([false]);
};

/**
 * Set to true if you want to enable countly internal debugging logs
 * Should be called before Countly init
 */
Countly.setLoggingEnabled = function (enabled = true) {
    CountlyReactNative.setLoggingEnabled([enabled]);
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.setLocation' intead of 'setLocationInit'.
 *
 * Set user initial location
 * Should be called before init
 * @param {ISO Country code for the user's country} countryCode
 * @param {Name of the user's city} city
 * @param {comma separate lat and lng values. For example, "56.42345,123.45325"} location
 * @param {IP address of user's} ipAddress
 * */

Countly.setLocationInit = function (countryCode, city, location, ipAddress) {
    const args = [];
    args.push(countryCode || 'null');
    args.push(city || 'null');
    args.push(location || 'null');
    args.push(ipAddress || 'null');
    CountlyReactNative.setLocationInit(args);
};

Countly.setLocation = function (countryCode, city, location, ipAddress) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'setLocation'";
        Countly.logError('setLocation', message);
        return message;
    }
    const args = [];
    args.push(countryCode || 'null');
    args.push(city || 'null');
    args.push(location || 'null');
    args.push(ipAddress || 'null');
    CountlyReactNative.setLocation(args);
};
Countly.disableLocation = function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'disableLocation'";
        Countly.logError('disableLocation', message);
        return message;
    }
    CountlyReactNative.disableLocation();
};
/**
 *
 * Get currently used device Id.
 * Should be called after Countly init
 * */
Countly.getCurrentDeviceId = async function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'getCurrentDeviceId'";
        Countly.logError('getCurrentDeviceId', message);
        return message;
    }
    const result = await CountlyReactNative.getCurrentDeviceId();
    return result;
};

_getDeviceIdType = function (deviceIdType) {
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
        Countly.logError('_getDeviceIdType', "unexpected deviceIdType [" + deviceIdType.toString() + "] from native side");
        return null;
    }
    return result;
};
/**
 * Get currently used device Id type.
 * Should be called after Countly init
 * */
Countly.getDeviceIDType = async function () {
    if (!_isInitialized) {
        Countly.logError('getDeviceIDType', "'init' must be called before 'getDeviceIDType'");
        return null;
    }
    const result = await CountlyReactNative.getDeviceIDType();
    if (result == null || result == "") {
        Countly.logError('getDeviceIDType', "'getDeviceIDType' unexpected null value from native side");
        return null;
    }
    return _getDeviceIdType(result);
};

Countly.changeDeviceId = async function (newDeviceID, onServer) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'changeDeviceId'";
        Countly.logError('changeDeviceId', msg);
        return msg;
    }
    const message = await Countly.validateString(newDeviceID, 'newDeviceID', 'changeDeviceId');
    if (message) {
        return message;
    }

    if (onServer === false) {
        onServer = '0';
    } else {
        onServer = '1';
    }
    newDeviceID = newDeviceID.toString();
    CountlyReactNative.changeDeviceId([newDeviceID, onServer]);
};

/**
 *
 * Set to "true" if you want HTTP POST to be used for all requests
 * Should be called before Countly init
 */
Countly.setHttpPostForced = function (boolean = true) {
    const args = [];
    args.push(boolean == true ? '1' : '0');
    CountlyReactNative.setHttpPostForced(args);
};

Countly.isCrashReportingEnabled = false;
/**
 * @deprecated in 23.02.0 : use 'countlyConfig.enableCrashReporting' intead of 'enableCrashReporting'.
 *
 * Enable crash reporting to report unhandled crashes to Countly
 * Should be called before Countly init
 */
Countly.enableCrashReporting = async function () {
    CountlyReactNative.enableCrashReporting();
    if (ErrorUtils && !Countly.isCrashReportingEnabled) {
        if (await CountlyReactNative.isLoggingEnabled()) {
            console.log('[CountlyReactNative] Adding Countly JS error handler.');
        }
        const previousHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler((error, isFatal) => {
            const jsStackTrace = Countly.getStackTrace(error);
            let errorTitle;
            let stackArr;
            if (jsStackTrace == null) {
                errorTitle = error.name;
                stackArr = error.stack;
            } else {
                let fname = jsStackTrace[0].file;
                if (fname.startsWith('http')) {
                    const chunks = fname.split('/');
                    fname = chunks[chunks.length - 1].split('?')[0];
                }
                errorTitle = `${error.name} (${jsStackTrace[0].methodName}@${fname})`;
                const regExp = '(.*)(@?)http(s?).*/(.*)\\?(.*):(.*):(.*)';
                stackArr = error.stack.split('\n').map((row) => {
                    row = row.trim();
                    if (!row.includes('http')) {
                        return row;
                    }

                    const matches = row.match(regExp);
                    return matches && matches.length == 8 ? `${matches[1]}${matches[2]}${matches[4]}(${matches[6]}:${matches[7]})` : row;
                });
                stackArr = stackArr.join('\n');
            }

            CountlyReactNative.logJSException(errorTitle, error.message.trim(), stackArr);

            if (previousHandler) {
                previousHandler(error, isFatal);
            }
        });
    }
    Countly.isCrashReportingEnabled = true;
};

Countly.getStackTrace = (e) => {
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
        // console.log(e.message);
    }
    return jsStackTrace;
};

Countly.addCrashLog = function (crashLog) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'addCrashLog'";
        Countly.logError('addCrashLog', message);
        return message;
    }
    CountlyReactNative.addCrashLog([crashLog]);
};

Countly.logException = function (exception, nonfatal, segments) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'logException'";
        Countly.logError('logException', message);
        return message;
    }
    const exceptionArray = exception.split('\n');
    let exceptionString = '';
    for (let i = 0, il = exceptionArray.length; i < il; i++) {
        exceptionString += `${exceptionArray[i]}\n`;
    }
    const args = [];
    args.push(exceptionString || '');
    args.push(nonfatal || false);
    for (const key in segments) {
        args.push(key);
        args.push(segments[key].toString());
    }
    CountlyReactNative.logException(args);
};
Countly.setCustomCrashSegments = function (segments) {
    const args = [];
    for (const key in segments) {
        args.push(key.toString());
        args.push(segments[key].toString());
    }
    CountlyReactNative.setCustomCrashSegments(args);
};
Countly.startSession = function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'startSession'";
        Countly.logError('startSession', message);
        return message;
    }
    CountlyReactNative.startSession();
};
Countly.endSession = function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'endSession'";
        Countly.logError('endSession', message);
        return message;
    }
    CountlyReactNative.endSession();
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.enableParameterTamperingProtection' intead of 'enableParameterTamperingProtection'.
 *
 * Set the optional salt to be used for calculating the checksum of requested data which will be sent with each request, using the &checksum field
 * Should be called before Countly init
 */
Countly.enableParameterTamperingProtection = async function (salt) {
    const message = await Countly.validateString(salt, 'salt', 'enableParameterTamperingProtection');
    if (message) {
        return message;
    }

    CountlyReactNative.enableParameterTamperingProtection([salt.toString()]);
};

/**
 *
 * It will ensure that connection is made with one of the public keys specified
 * Should be called before Countly init
 */
Countly.pinnedCertificates = async function (certificateName) {
    const message = await Countly.validateString(certificateName, 'certificateName', 'pinnedCertificates');
    if (message) {
        return message;
    }

    CountlyReactNative.pinnedCertificates([certificateName]);
};
Countly.startEvent = async function (eventName) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'startEvent'";
        Countly.logError('startEvent', msg);
        return msg;
    }
    const message = await Countly.validateString(eventName, 'eventName', 'startEvent');
    if (message) {
        return message;
    }

    CountlyReactNative.startEvent([eventName.toString()]);
};
Countly.cancelEvent = async function (eventName) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'cancelEvent'";
        Countly.logError('cancelEvent', msg);
        return msg;
    }
    const message = await Countly.validateString(eventName, 'eventName', 'cancelEvent');
    if (message) {
        return message;
    }

    CountlyReactNative.cancelEvent([eventName.toString()]);
};
Countly.endEvent = function (options) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'endEvent'";
        Countly.logError('endEvent', message);
        return message;
    }
    if (typeof options === 'string') {
        options = { eventName: options };
    }
    const args = [];
    let eventType = 'event'; // event, eventWithSum, eventWithSegment, eventWithSumSegment
    let segments = {};

    if (options.eventSum) {
        eventType = 'eventWithSum';
    }
    if (options.segments) {
        eventType = 'eventWithSegment';
    }
    if (options.segments && options.eventSum) {
        eventType = 'eventWithSumSegment';
    }

    args.push(eventType);

    if (!options.eventName) {
        options.eventName = '';
    }
    args.push(options.eventName.toString());

    if (!options.eventCount) {
        options.eventCount = '1';
    }
    args.push(options.eventCount.toString());

    if (options.eventSum) {
        let eventSumTemp = options.eventSum.toString();
        if (eventSumTemp.indexOf('.') == -1) {
            eventSumTemp = parseFloat(eventSumTemp).toFixed(2);
            args.push(eventSumTemp);
        } else {
            args.push(eventSumTemp);
        }
    } else {
        args.push('0.0');
    }

    if (options.segments) {
        segments = options.segments;
    }
    for (const event in segments) {
        args.push(event);
        args.push(segments[event]);
    }
    CountlyReactNative.endEvent(args);
};

// countly sending user data
Countly.setUserData = async function (userData) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'setUserData'";
        Countly.logError('setUserData', msg);
        return msg;
    }
    let message = null;
    if (!userData) {
        message = 'User profile data should not be null or undefined';
        Countly.logError('setUserData', message);
        return message;
    }
    if (typeof userData !== 'object') {
        message = `unsupported data type of user data '${typeof userData}'`;
        Countly.logWarning('setUserData', message);
        return message;
    }
    const args = [];
    for (const key in userData) {
        if (typeof userData[key] !== 'string' && key.toString() != 'byear') {
            Countly.logWarning('setUserData', `skipping value for key '${key.toString()}', due to unsupported data type '${typeof userData[key]}', its data type should be 'string'`);
        }
    }

    if (userData.org && !userData.organization) {
        userData.organization = userData.org;
        delete userData.org;
    }

    if (userData.byear) {
        Countly.validateParseInt(userData.byear, 'key byear', 'setUserData');
        userData.byear = userData.byear.toString();
    }
    args.push(userData);

    await CountlyReactNative.setUserData(args);
};

Countly.userData = {};
Countly.userData.setProperty = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'setProperty'";
        Countly.logError('setProperty', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'setProperty');
    if (message) {
        return message;
    }

    message = await Countly.validateValidUserData(keyValue, 'value', 'setProperty');
    if (message) {
        return message;
    }
    keyName = keyName.toString();
    keyValue = keyValue.toString();
    if (keyName && (keyValue || keyValue == '')) {
        await CountlyReactNative.userData_setProperty([keyName, keyValue]);
    }
};
Countly.userData.increment = async function (keyName) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'increment'";
        Countly.logError('increment', msg);
        return msg;
    }
    const message = await Countly.validateString(keyName, 'key', 'setProperty');
    if (message) {
        return message;
    }
    keyName = keyName.toString();
    if (keyName) {
        await CountlyReactNative.userData_increment([keyName]);
    }
};
Countly.userData.incrementBy = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'incrementBy'";
        Countly.logError('incrementBy', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'incrementBy');
    if (message) {
        return message;
    }
    message = await Countly.validateUserDataValue(keyValue, 'value', 'incrementBy');
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue).toString();
    await CountlyReactNative.userData_incrementBy([keyName, intValue]);
};
Countly.userData.multiply = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'multiply'";
        Countly.logError('multiply', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'multiply');
    if (message) {
        return message;
    }
    message = await Countly.validateUserDataValue(keyValue, 'value', 'multiply');
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue).toString();
    await CountlyReactNative.userData_multiply([keyName, intValue]);
};
Countly.userData.saveMax = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'saveMax'";
        Countly.logError('saveMax', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'saveMax');
    if (message) {
        return message;
    }
    message = await Countly.validateUserDataValue(keyValue, 'value', 'saveMax');
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue).toString();
    await CountlyReactNative.userData_saveMax([keyName, intValue]);
};
Countly.userData.saveMin = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'saveMin'";
        Countly.logError('saveMin', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'saveMin');
    if (message) {
        return message;
    }
    message = await Countly.validateUserDataValue(keyValue, 'value', 'saveMin');
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue).toString();
    await CountlyReactNative.userData_saveMin([keyName, intValue]);
};
Countly.userData.setOnce = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'setOnce'";
        Countly.logError('setOnce', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'setOnce');
    if (message) {
        return message;
    }
    message = await Countly.validateValidUserData(keyValue, 'value', 'setOnce');
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == '') {
        await CountlyReactNative.userData_setOnce([keyName, keyValue]);
    }
};
Countly.userData.pushUniqueValue = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'pushUniqueValue'";
        Countly.logError('pushUniqueValue', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'pushUniqueValue');
    if (message) {
        return message;
    }
    message = await Countly.validateValidUserData(keyValue, 'value', 'pushUniqueValue');
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == '') {
        await CountlyReactNative.userData_pushUniqueValue([keyName, keyValue]);
    }
};
Countly.userData.pushValue = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'pushValue'";
        Countly.logError('pushValue', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'pushValue');
    if (message) {
        return message;
    }
    message = await Countly.validateValidUserData(keyValue, 'value', 'pushValue');
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == '') {
        await CountlyReactNative.userData_pushValue([keyName, keyValue]);
    }
};
Countly.userData.pullValue = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'pullValue'";
        Countly.logError('pullValue', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'pullValue');
    if (message) {
        return message;
    }
    message = await Countly.validateValidUserData(keyValue, 'value', 'pullValue');
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == '') {
        await CountlyReactNative.userData_pullValue([keyName, keyValue]);
    }
};

// nothing is sent without calling save
Countly.userDataBulk = {};

// providing key/values with predefined and custom properties
Countly.userDataBulk.setUserProperties = async function (customAndPredefined) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'setUserProperties'";
        Countly.logError('setUserProperties', msg);
        return msg;
    }
    let message = null;
    if (!customAndPredefined) {
        message = 'User profile data should not be null or undefined';
        Countly.logError('setUserProperties', message);
        return message;
    }
    if (typeof customAndPredefined !== 'object') {
        message = `unsupported data type of user data '${typeof customAndPredefined}'`;
        Countly.logWarning('setUserProperties', message);
        return message;
    }
    for (const key in customAndPredefined) {
        if (typeof customAndPredefined[key] !== 'string' && key.toString() != 'byear') {
            Countly.logWarning('setUserProperties', `skipping value for key '${key.toString()}', due to unsupported data type '${typeof customAndPredefined[key]}', its data type should be 'string'`);
        }
    }

    if (customAndPredefined.org && !customAndPredefined.organization) {
        customAndPredefined.organization = customAndPredefined.org;
        delete customAndPredefined.org;
    }

    if (customAndPredefined.byear) {
        Countly.validateParseInt(customAndPredefined.byear, 'key byear', 'setUserProperties');
        customAndPredefined.byear = customAndPredefined.byear.toString();
    }

    await CountlyReactNative.userDataBulk_setUserProperties(customAndPredefined);
};

Countly.userDataBulk.save = async function () {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'save'";
        Countly.logError('save', msg);
        return msg;
    }
    await CountlyReactNative.userDataBulk_save([]);
};

Countly.userDataBulk.setProperty = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'setProperty'";
        Countly.logError('setProperty', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'setProperty');
    if (message) {
        return message;
    }

    message = await Countly.validateValidUserData(keyValue, 'value', 'setProperty');
    if (message) {
        return message;
    }
    keyName = keyName.toString();
    keyValue = keyValue.toString();
    if (keyName && (keyValue || keyValue == '')) {
        await CountlyReactNative.userDataBulk_setProperty([keyName, keyValue]);
    }
};
Countly.userDataBulk.increment = async function (keyName) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'increment'";
        Countly.logError('increment', msg);
        return msg;
    }
    const message = await Countly.validateString(keyName, 'key', 'setProperty');
    if (message) {
        return message;
    }
    keyName = keyName.toString();
    if (keyName) {
        await CountlyReactNative.userDataBulk_increment([keyName]);
    }
};
Countly.userDataBulk.incrementBy = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'incrementBy'";
        Countly.logError('incrementBy', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'incrementBy');
    if (message) {
        return message;
    }
    message = await Countly.validateUserDataValue(keyValue, 'value', 'incrementBy');
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue).toString();
    await CountlyReactNative.userDataBulk_incrementBy([keyName, intValue]);
};
Countly.userDataBulk.multiply = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'multiply'";
        Countly.logError('multiply', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'multiply');
    if (message) {
        return message;
    }
    message = await Countly.validateUserDataValue(keyValue, 'value', 'multiply');
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue).toString();
    await CountlyReactNative.userDataBulk_multiply([keyName, intValue]);
};
Countly.userDataBulk.saveMax = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'saveMax'";
        Countly.logError('saveMax', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'saveMax');
    if (message) {
        return message;
    }
    message = await Countly.validateUserDataValue(keyValue, 'value', 'saveMax');
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue).toString();
    await CountlyReactNative.userDataBulk_saveMax([keyName, intValue]);
};
Countly.userDataBulk.saveMin = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'saveMin'";
        Countly.logError('saveMin', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'saveMin');
    if (message) {
        return message;
    }
    message = await Countly.validateUserDataValue(keyValue, 'value', 'saveMin');
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue).toString();
    await CountlyReactNative.userDataBulk_saveMin([keyName, intValue]);
};
Countly.userDataBulk.setOnce = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'setOnce'";
        Countly.logError('setOnce', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'setOnce');
    if (message) {
        return message;
    }
    message = await Countly.validateValidUserData(keyValue, 'value', 'setOnce');
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == '') {
        await CountlyReactNative.userDataBulk_setOnce([keyName, keyValue]);
    }
};
Countly.userDataBulk.pushUniqueValue = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'pushUniqueValue'";
        Countly.logError('pushUniqueValue', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'pushUniqueValue');
    if (message) {
        return message;
    }
    message = await Countly.validateValidUserData(keyValue, 'value', 'pushUniqueValue');
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == '') {
        await CountlyReactNative.userDataBulk_pushUniqueValue([keyName, keyValue]);
    }
};
Countly.userDataBulk.pushValue = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'pushValue'";
        Countly.logError('pushValue', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'pushValue');
    if (message) {
        return message;
    }
    message = await Countly.validateValidUserData(keyValue, 'value', 'pushValue');
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == '') {
        await CountlyReactNative.userDataBulk_pushValue([keyName, keyValue]);
    }
};
Countly.userDataBulk.pullValue = async function (keyName, keyValue) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'pullValue'";
        Countly.logError('pullValue', msg);
        return msg;
    }
    let message = await Countly.validateString(keyName, 'key', 'pullValue');
    if (message) {
        return message;
    }
    message = await Countly.validateValidUserData(keyValue, 'value', 'pullValue');
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == '') {
        await CountlyReactNative.userDataBulk_pullValue([keyName, keyValue]);
    }
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.setRequiresConsent' intead of 'setRequiresConsent'.
 *
 * Set that consent should be required for features to work.
 * Should be called before Countly init
 */
Countly.setRequiresConsent = function (flag) {
    CountlyReactNative.setRequiresConsent([flag]);
};

Countly.giveConsent = function (args) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'giveConsent'";
        Countly.logError('giveConsent', message);
        return message;
    }
    let features = [];
    if (typeof args === 'string') {
        features.push(args);
    } else {
        features = args;
    }
    CountlyReactNative.giveConsent(features);
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.giveConsent' intead of 'giveConsentInit'.
 *
 * Give consent for specific features before init.
 * Should be called after Countly init
 */
Countly.giveConsentInit = async function (args) {
    let features = [];
    if (typeof args === 'string') {
        features.push(args);
    } else if (Array.isArray(args)) {
        features = args;
    } else {
        Countly.logWarning('giveConsentInit', `unsupported data type '${typeof args}'`);
    }
    await CountlyReactNative.giveConsentInit(features);
};

Countly.removeConsent = function (args) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'removeConsent'";
        Countly.logError('removeConsent', message);
        return message;
    }
    let features = [];
    if (typeof args === 'string') {
        features.push(args);
    } else {
        features = args;
    }
    CountlyReactNative.removeConsent(features);
};

/**
 *
 * Give consent for all features
 * Should be called after Countly init
 */
Countly.giveAllConsent = function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'giveAllConsent'";
        Countly.logError('giveAllConsent', message);
        return message;
    }
    CountlyReactNative.giveAllConsent();
};

Countly.removeAllConsent = function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'removeAllConsent'";
        Countly.logError('removeAllConsent', message);
        return message;
    }
    CountlyReactNative.removeAllConsent();
};

Countly.remoteConfigUpdate = function (callback) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'remoteConfigUpdate'";
        Countly.logError('remoteConfigUpdate', message);
        callback(message);
        return message;
    }
    CountlyReactNative.remoteConfigUpdate([], (stringItem) => {
        callback(stringItem);
    });
};

Countly.updateRemoteConfigForKeysOnly = function (keyNames, callback) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'updateRemoteConfigForKeysOnly'";
        Countly.logError('updateRemoteConfigForKeysOnly', message);
        callback(message);
        return message;
    }
    const args = [];
    if (keyNames.length) {
        for (let i = 0, il = keyNames.length; i < il; i++) {
            args.push(keyNames[i]);
        }
        CountlyReactNative.updateRemoteConfigForKeysOnly(args, (stringItem) => {
            callback(stringItem);
        });
    }
};

Countly.updateRemoteConfigExceptKeys = function (keyNames, callback) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'updateRemoteConfigExceptKeys'";
        Countly.logError('updateRemoteConfigExceptKeys', message);
        callback(message);
        return message;
    }
    const args = [];
    if (keyNames.length) {
        for (let i = 0, il = keyNames.length; i < il; i++) {
            args.push(keyNames[i]);
        }
        CountlyReactNative.updateRemoteConfigExceptKeys(args, (stringItem) => {
            callback(stringItem);
        });
    }
};

Countly.getRemoteConfigValueForKey = function (keyName, callback) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'getRemoteConfigValueForKey'";
        Countly.logError('getRemoteConfigValueForKey', message);
        callback(message);
        return message;
    }
    CountlyReactNative.getRemoteConfigValueForKey([keyName.toString() || ''], (value) => {
        if (Platform.OS == 'android') {
            try {
                value = JSON.parse(value);
            } catch (e) {
                // console.log(e.message);
                // noop. value will remain string if not JSON parsable and returned as string
            }
        }
        callback(value);
    });
};

Countly.getRemoteConfigValueForKeyP = function (keyName) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'getRemoteConfigValueForKeyP'";
        Countly.logError('getRemoteConfigValueForKeyP', message);
        callback(message);
        return message;
    }
    if (Platform.OS != 'android') {
        return 'To be implemented';
    }
    const promise = CountlyReactNative.getRemoteConfigValueForKeyP(keyName);
    return promise.then((value) => {
        if (Platform.OS == 'android') {
            try {
                value = JSON.parse(value);
            } catch (e) {
                // console.log(e.message);
                // noop. value will remain string if not JSON parsable and returned as string
            }
        }
        return value;
    });
};

Countly.remoteConfigClearValues = async function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'remoteConfigClearValues'";
        Countly.logError('remoteConfigClearValues', message);
        callback(message);
        return message;
    }
    const result = await CountlyReactNative.remoteConfigClearValues();
    return result;
};
/**
 * @deprecated in 23.02.0 : use 'countlyConfig.setStarRatingDialogTexts' intead of 'setStarRatingDialogTexts'.
 *
 * Set's the text's for the different fields in the star rating dialog. Set value null if for some field you want to keep the old value
 *
 * @param {String} starRatingTextTitle - dialog's title text (Only for Android)
 * @param {String} starRatingTextMessage - dialog's message text
 * @param {String} starRatingTextDismiss - dialog's dismiss buttons text (Only for Android)
 */
Countly.setStarRatingDialogTexts = function (starRatingTextTitle, starRatingTextMessage, starRatingTextDismiss) {
    const args = [];
    args.push(starRatingTextTitle);
    args.push(starRatingTextMessage);
    args.push(starRatingTextDismiss);
    CountlyReactNative.setStarRatingDialogTexts(args);
};

Countly.showStarRating = function (callback) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'showStarRating'";
        Countly.logError('showStarRating', message);
        return message;
    }
    if (!callback) {
        callback = function () {};
    }
    CountlyReactNative.showStarRating([], callback);
};

/**
 * Present a Rating Popup using rating widget Id
 *
 * @param {String} widgetId - id of rating widget to present
 * @param {String} closeButtonText - text for cancel/close button
 * @deprecated use 'presentRatingWidgetWithID' intead of 'showFeedbackPopup'.
 */
Countly.showFeedbackPopup = function (widgetId, closeButtonText) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'showFeedbackPopup'";
        Countly.logError('showFeedbackPopup', message);
        return message;
    }
    Countly.presentRatingWidgetWithID(widgetId, closeButtonText);
};

/**
 * Present a Rating Popup using rating widget Id
 *
 * @param {String} widgetId - id of rating widget to present
 * @param {String} closeButtonText - text for cancel/close button
 * @param {callback listener} ratingWidgetCallback
 */
Countly.presentRatingWidgetWithID = function (widgetId, closeButtonText, ratingWidgetCallback) {
    if (!_isInitialized) {
        var message = "'init' must be called before 'presentRatingWidgetWithID'";
        Countly.logError('presentRatingWidgetWithID', message);
        return message;
    }
    if (!widgetId) {
        message = 'Rating Widget id should not be null or empty';
        Countly.logError('presentRatingWidgetWithID', message);
        return message;
    }
    if (typeof closeButtonText !== 'string') {
        closeButtonText = '';
        Countly.logWarning('presentRatingWidgetWithID', `unsupported data type of closeButtonText : '${typeof args}'`);
    }
    if (ratingWidgetCallback) {
        // eventEmitter.addListener('ratingWidgetCallback', ratingWidgetCallback);
        _ratingWidgetListener = eventEmitter.addListener(ratingWidgetCallbackName, (error) => {
            ratingWidgetCallback(error);
            _ratingWidgetListener.remove();
        });
    }
    CountlyReactNative.presentRatingWidgetWithID([widgetId.toString() || '', closeButtonText.toString() || 'Done']);
};

/**
 * Get a list of available feedback widgets as array of object to handle multiple widgets of same type.
 * @param {callback listener} onFinished - returns (retrievedWidgets, error)
 */
Countly.getFeedbackWidgets = async function (onFinished) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'getFeedbackWidgets'";
        Countly.logError('getFeedbackWidgets', message);
        return message;
    }
    let result = [];
    let error = null;
    try {
        result = await CountlyReactNative.getFeedbackWidgets();
    } catch (e) {
        error = e.message;
    }
    if (onFinished) {
        onFinished(result, error);
    }
    return result;
};

/**
 * Get a list of available feedback widgets for this device ID
 * @deprecated in 20.11.1 : use 'getFeedbackWidgets' intead of 'getAvailableFeedbackWidgets'.
 * Using the old function it will not be possible to see all the available feedback widgets.
 * In case there are multiple ones for the same type, only the last one will be returned due to their id being overwritten in the type field.
 * The newer function allow also to see the widgets 'name' field which can be further used to filter and identify specific widgets.
 */
Countly.getAvailableFeedbackWidgets = async function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'getAvailableFeedbackWidgets'";
        Countly.logError('getAvailableFeedbackWidgets', message);
        return message;
    }
    const result = await CountlyReactNative.getAvailableFeedbackWidgets();
    return result;
};

/**
 * Present a chosen feedback widget
 *
 * @param {Object} feedbackWidget - feeback Widget with id, type and name
 * @param {String} closeButtonText - text for cancel/close button
 * @param {callback listener} widgetShownCallback - Callback to be executed when feedback widget is displayed
 * @param {callback listener} widgetClosedCallback - Callback to be executed when feedback widget is closed
 */
Countly.presentFeedbackWidgetObject = async function (feedbackWidget, closeButtonText, widgetShownCallback, widgetClosedCallback) {
    if (!_isInitialized) {
        const msg = "'init' must be called before 'presentFeedbackWidgetObject'";
        Countly.logError('presentFeedbackWidgetObject', msg);
        return msg;
    }
    let message = null;
    if (!feedbackWidget) {
        message = 'feedbackWidget should not be null or undefined';
        Countly.logError('presentFeedbackWidgetObject', message);
        return message;
    }
    if (!feedbackWidget.id) {
        message = 'FeedbackWidget id should not be null or empty';
        Countly.logError('presentFeedbackWidgetObject', message);
        return message;
    }
    if (!feedbackWidget.type) {
        message = 'FeedbackWidget type should not be null or empty';
        Countly.logError('presentFeedbackWidgetObject', message);
        return message;
    }
    if (typeof closeButtonText !== 'string') {
        closeButtonText = '';
        Countly.logWarning('presentFeedbackWidgetObject', `unsupported data type of closeButtonText : '${typeof args}'`);
    }

    if (widgetShownCallback) {
        _widgetShownCallback = eventEmitter.addListener(widgetShownCallbackName, () => {
            widgetShownCallback();
            _widgetShownCallback.remove();
        });
    }
    if (widgetClosedCallback) {
        _widgetClosedCallback = eventEmitter.addListener(widgetClosedCallbackName, () => {
            widgetClosedCallback();
            _widgetClosedCallback.remove();
        });
    }

    feedbackWidget.name = feedbackWidget.name || '';
    closeButtonText = closeButtonText || '';
    CountlyReactNative.presentFeedbackWidget([feedbackWidget.id, feedbackWidget.type, feedbackWidget.name, closeButtonText]);
};

/**
 * Present a chosen feedback widget
 *
 * @param {String} widgetType - type of widget : "nps" or "survey"
 * @param {String} widgetId - id of widget to present
 * @param {String} closeButtonText - text for cancel/close button
 * @deprecated in 20.11.1 : use 'presentFeedbackWidgetObject' intead of 'presentFeedbackWidget'.
 */
Countly.presentFeedbackWidget = function (widgetType, widgetId, closeButtonText) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'presentFeedbackWidget'";
        Countly.logError('presentFeedbackWidget', message);
        return message;
    }
    const feedbackWidget = {
        'id': widgetId,
        'type': widgetType,
    };
    Countly.presentFeedbackWidgetObject(feedbackWidget, closeButtonText);
};

/**
 *
 * Events get grouped together and are sent either every minute or after the unsent event count reaches a threshold. By default it is 10
 * Should be called before Countly init
 */
Countly.setEventSendThreshold = function (size) {
    CountlyReactNative.setEventSendThreshold([size.toString() || '']);
};

Countly.startTrace = function (traceKey) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'startTrace'";
        Countly.logError('startTrace', message);
        return message;
    }
    const args = [];
    args.push(traceKey);
    CountlyReactNative.startTrace(args);
};

Countly.cancelTrace = function (traceKey) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'cancelTrace'";
        Countly.logError('cancelTrace', message);
        return message;
    }
    const args = [];
    args.push(traceKey);
    CountlyReactNative.cancelTrace(args);
};

Countly.clearAllTraces = function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'clearAllTraces'";
        Countly.logError('clearAllTraces', message);
        return message;
    }
    const args = [];
    CountlyReactNative.clearAllTraces(args);
};

Countly.endTrace = function (traceKey, customMetric) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'endTrace'";
        Countly.logError('endTrace', message);
        return message;
    }
    const args = [];
    args.push(traceKey);
    customMetric = customMetric || {};
    for (const key in customMetric) {
        args.push(key.toString());
        args.push(customMetric[key].toString());
    }
    CountlyReactNative.endTrace(args);
};

Countly.recordNetworkTrace = function (networkTraceKey, responseCode, requestPayloadSize, responsePayloadSize, startTime, endTime) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'recordNetworkTrace'";
        Countly.logError('recordNetworkTrace', message);
        return message;
    }
    const args = [];
    args.push(networkTraceKey);
    args.push(responseCode.toString());
    args.push(requestPayloadSize.toString());
    args.push(responsePayloadSize.toString());
    args.push(startTime.toString());
    args.push(endTime.toString());
    CountlyReactNative.recordNetworkTrace(args);
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.enableApm' intead of 'enableApm'.
 *
 * Enable APM features, which includes the recording of app start time.
 * Should be called before Countly init
 */
Countly.enableApm = function () {
    const args = [];
    CountlyReactNative.enableApm(args);
};

/**
 * @deprecated in 23.02.0 : use 'Countly.recordIndirectAttribution' intead of 'Countly'.
 *
 * Enable campaign attribution reporting to Countly.
 * For iOS use "recordAttributionID" instead of "enableAttribution"
 * Should be called before Countly init
 */
Countly.enableAttribution = async function (attributionID = '') {
    if (Platform.OS.match('ios')) {
        if (attributionID == '') {
            const message = "attribution Id for iOS can't be empty string";
            Countly.logError('enableAttribution', message);
            return message;
        }
        Countly.recordAttributionID(attributionID);
    } else {
        CountlyReactNative.enableAttribution();
    }
};

/**
 *
 * @deprecated in 23.02.0 : use 'Countly.recordIndirectAttribution' intead of 'recordAttributionID'.
 *
 * set attribution Id for campaign attribution reporting.
 * Currently implemented for iOS only
 * For Android just call the enableAttribution to enable campaign attribution.
 */
Countly.recordAttributionID = function (attributionID) {
    if (!Platform.OS.match('ios')) {
        return 'recordAttributionID : To be implemented';
    }
    const args = [];
    args.push(attributionID);
    CountlyReactNative.recordAttributionID(args);
};
/**
 * Replaces all requests with a different app key with the current app key.
 * In request queue, if there are any request whose app key is different than the current app key,
 * these requests' app key will be replaced with the current app key.
 */
Countly.replaceAllAppKeysInQueueWithCurrentAppKey = function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'replaceAllAppKeysInQueueWithCurrentAppKey'";
        Countly.logError('replaceAllAppKeysInQueueWithCurrentAppKey', message);
        return message;
    }
    CountlyReactNative.replaceAllAppKeysInQueueWithCurrentAppKey();
};
/**
 * set direct attribution Id for campaign attribution reporting.
 */
Countly.recordDirectAttribution = function (campaignType, campaignData) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'recordDirectAttribution'";
        Countly.logError('recordDirectAttribution', message);
        return message;
    }
    const args = [];
    args.push(campaignType);
    args.push(campaignData);
    CountlyReactNative.recordDirectAttribution(args);
};
/**
 * set indirect attribution Id for campaign attribution reporting.
 */
Countly.recordIndirectAttribution = function (attributionValues) {
    if (!_isInitialized) {
        const message = "'init' must be called before 'recordIndirectAttribution'";
        Countly.logError('recordIndirectAttribution', message);
        return message;
    }
    const args = [];
    args.push(attributionValues);
    CountlyReactNative.recordIndirectAttribution(args);
};
/**
 * Removes all requests with a different app key in request queue.
 * In request queue, if there are any request whose app key is different than the current app key,
 * these requests will be removed from request queue.
 */
Countly.removeDifferentAppKeysFromQueue = function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'removeDifferentAppKeysFromQueue'";
        Countly.logError('removeDifferentAppKeysFromQueue', message);
        return message;
    }
    CountlyReactNative.removeDifferentAppKeysFromQueue();
};

/**
 * Call this function when app is loaded, so that the app launch duration can be recorded.
 * Should be called after init.
 */
Countly.appLoadingFinished = async function () {
    if (!_isInitialized) {
        const message = "'init' must be called before 'appLoadingFinished'";
        Countly.logError('appLoadingFinished', message);
        return message;
    }
    CountlyReactNative.appLoadingFinished();
};

/**
 * Set the metrics you want to override
 * Should be called before Countly init
 * @param {Object} customMetric - metric with key/value pair
 * Supported data type for customMetric values is String
 */
Countly.setCustomMetrics = async function (customMetric) {
    let message = null;
    if (!customMetric) {
        message = 'customMetric should not be null or undefined';
        Countly.logError('setCustomMetrics', message);
        return message;
    }
    if (typeof customMetric !== 'object') {
        message = `unsupported data type of customMetric '${typeof customMetric}'`;
        Countly.logWarning('setCustomMetrics', message);
        return message;
    }
    const args = [];
    for (const key in customMetric) {
        if (typeof customMetric[key] === 'string') {
            args.push(key.toString());
            args.push(customMetric[key].toString());
        } else {
            Countly.logWarning('setCustomMetrics', `skipping value for key '${key.toString()}', due to unsupported data type '${typeof customMetric[key]}'`);
        }
    }
    if (args.length != 0) {
        CountlyReactNative.setCustomMetrics(args);
    }
};
/**
 * Validate user data value, it should be 'number' or 'string' that is parseable to 'number'
 * and it should not be null or undefined
 * It will return message if any issue found related to data validation else return null.
 * @param {String} stringValue : value of data to validate
 * @param {String} stringName : name of that value string
 * @param {String} functionName : name of function from where value is validating.
 * @returns
 */
Countly.validateUserDataValue = async (stringValue, stringName, functionName) => {
    // validating that value should not be null or undefined
    let message = await Countly.validateValidUserData(stringValue, stringName, functionName);
    if (message) {
        return message;
    }

    // validating that value should be 'number' or 'string'
    message = await Countly.validateUserDataType(stringValue, stringName, functionName);
    if (message) {
        return message;
    }

    // validating that value should be parceable to int.
    return await Countly.validateParseInt(stringValue, stringName, functionName);
};

/**
 * Validate user data value, it should be 'number' or 'string' that is parseable to 'number'
 * It will return message if any issue found related to data validation else return null.
 * @param {String} stringValue : value of data to validate
 * @param {String} stringName : name of that value string
 * @param {String} functionName : name of function from where value is validating.
 * @returns
 */
Countly.validateUserDataType = async (stringValue, stringName, functionName) => {
    let message = null;
    if (typeof stringValue === 'number') {
        return null;
    }
    if (typeof stringValue === 'string') {
        Countly.logWarning(functionName, `unsupported data type '${typeof stringValue}', its data type should be 'number'`);
        return null;
    }

    message = `skipping value for '${stringName.toString()}', due to unsupported data type '${typeof stringValue}', its data type should be 'number'`;
    Countly.logError(functionName, message);
    return message;
};

/**
 * Validate user data value, it should not be null or undefined
 * It will return message if any issue found related to data validation else return null.
 * @param {String} stringValue : value of data to validate
 * @param {String} stringName : name of that value string
 * @param {String} functionName : name of function from where value is validating.
 * @returns
 */
Countly.validateValidUserData = async (stringValue, stringName, functionName) => {
    if (stringValue || stringValue == '') {
        return null;
    }

    const message = `${stringName} should not be null or undefined`;
    Countly.logError(functionName, message);
    return message;
};

/**
 * Validate user data value, it should be parseable to 'number'
 * It will return message if any issue found related to data validation else return null.
 * @param {String} stringValue : value of data to validate
 * @param {String} stringName : name of that value string
 * @param {String} functionName : name of function from where value is validating.
 * @returns
 */
Countly.validateParseInt = async (stringValue, stringName, functionName) => {
    const intValue = parseInt(stringValue);
    if (!isNaN(intValue)) {
        return null;
    }

    const message = `skipping value for '${stringName.toString()}', due to unsupported data type '${typeof stringValue}', its data type should be 'number' or parseable to 'integer'`;
    Countly.logError(functionName, message);
    return message;
};

/**
 * Validate string, it should not be empty, null or undefined
 * It will return message if any issue found related to string validation else return null.
 * @param {String} stringValue : value of string to validate
 * @param {String} stringName : name of that value string
 * @param {String} functionName : name of function from where value is validating.
 * @returns
 */
Countly.validateString = async (stringValue, stringName, functionName) => {
    let message = null;
    if (!stringValue) {
        message = `${stringName} should not be null, undefined or empty`;
    } else if (typeof stringValue !== 'string') {
        message = `skipping value for '${stringName.toString()}', due to unsupported data type '${typeof stringValue}', its data type should be 'string'`;
    }
    if (message) {
        Countly.logError(functionName, message);
    }
    return message;
};

/**
 * Print error if logging is enabled
 * @param {String} functionName : name of function from where value is validating.
 * @param {String} error : error message
 */
Countly.logError = async (functionName, error) => {
    if (await CountlyReactNative.isLoggingEnabled()) {
        console.error(`[CountlyReactNative] ${functionName}, ${error}`);
    }
};
/**
 * Print warning if logging is enabled
 * @param {String} functionName : name of function from where value is validating.
 * @param {String} error : error message
 */
Countly.logWarning = async (functionName, warning) => {
    if (await CountlyReactNative.isLoggingEnabled()) {
        console.warn(`[CountlyReactNative] ${functionName}, ${warning}`);
    }
};

/*
Countly.initNative = function(){
    CountlyReactNative.initNative();
}

Countly.testCrash = function(){
    CountlyReactNative.testCrash();
}
*/

export default Countly;
