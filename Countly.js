/**
 * Countly SDK React Native Bridge
 * https://github.com/Countly/countly-sdk-react-native-bridge
 * @Countly
 */

import { Platform, NativeModules, NativeEventEmitter } from 'react-native';

import CountlyConfig from './CountlyConfig.js';
import CountlyState from './CountlyState.js';
import Feedback from './Feedback.js';
import * as L from './Logger.js';
import * as Utils from './Utils.js';

const { CountlyReactNative } = NativeModules;
const eventEmitter = new NativeEventEmitter(CountlyReactNative);

const Countly = {};
Countly.serverUrl = '';
Countly.appKey = '';
let _state = CountlyState;
CountlyState.CountlyReactNative = CountlyReactNative;
CountlyState.eventEmitter = eventEmitter;

Countly.feedback = Feedback;
Countly.feedback.state = CountlyState;

let _isCrashReportingEnabled = false;

Countly.userData = {}; // userData interface
Countly.userDataBulk = {}; // userDataBulk interface

let _isPushInitialized = false;

/*
 * Listener for rating widget callback, when callback recieve we will remove the callback using listener.
 */
let _ratingWidgetListener;
const ratingWidgetCallbackName = 'ratingWidgetCallback';
const pushNotificationCallbackName = 'pushNotificationCallback';

Countly.messagingMode = { 'DEVELOPMENT': '1', 'PRODUCTION': '0', 'ADHOC': '2' };
if (/android/.exec(Platform.OS)) {
    Countly.messagingMode.DEVELOPMENT = '2';
}
Countly.TemporaryDeviceIDString = 'TemporaryDeviceID';

/**
 * Initialize Countly
 *
 * @deprecated in 23.02.0 : use 'initWithConfig' instead of 'init'.
 *
 * @function Countly.init should be used to initialize countly
 * @param {String} serverURL server url
 * @param {String} appKey application key
 * @param {String} deviceId device ID
 */
Countly.init = async function (serverUrl, appKey, deviceId) {
    L.w('Countly.init is deprecated, use Countly.initWithConfig instead');
    const countlyConfig = new CountlyConfig(serverUrl, appKey).setDeviceID(deviceId);
    Countly.initWithConfig(countlyConfig);
};

/**
 * Initialize Countly
 *
 * @function Countly.initWithConfig should be used to initialize countly with config
 * @param {Object} countlyConfig countly config object
 */
Countly.initWithConfig = async function (countlyConfig) {
    if (_state.isInitialized) {
        L.d('init, SDK is already initialized');
        return;
    }
    if (countlyConfig.deviceID == '') {
        L.e("init, Device ID during init can't be an empty string. Value will be ignored.");
        countlyConfig.deviceId = null;
    }
    if (countlyConfig.serverURL == '') {
        L.e("init, Server URL during init can't be an empty string");
        return;
    }
    if (countlyConfig.appKey == '') {
        L.e("init, App Key during init can't be an empty string");
        return;
    }
    L.d('initWithConfig, Initializing Countly');
    const args = [];
    const argsMap = Utils.configToJson(countlyConfig);
    const argsString = JSON.stringify(argsMap);
    args.push(argsString);
    await CountlyReactNative.init(args);
    _state.isInitialized = true;
};

/**
 *
 * Checks if the sdk is initialized;
 *
 * @return {bool} if true, countly sdk has been initialized
 */
Countly.isInitialized = async function () {
    _state.isInitialized = await CountlyReactNative.isInitialized();
    L.d(`isInitialized, isInitialized: [${_state.isInitialized}]`);
    return _state.isInitialized;
};

/**
 *
 * Checks if the Countly SDK onStart function has been called
 *
 * @deprecated in 23.6.0. This will be removed.
 *
 * @return {bool || String} bool or error message
 */
Countly.hasBeenCalledOnStart = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'hasBeenCalledOnStart'";
        L.e(`hasBeenCalledOnStart, ${message}`);
        return message;
    }
    L.w('hasBeenCalledOnStart, This call is deprecated and will be removed with no replacement.');
    return CountlyReactNative.hasBeenCalledOnStart();
};

/**
 *
 * Used to send various types of event;
 *
 * @param {Object} options event
 * @return {String || void} error message or void
 */
Countly.sendEvent = function (options) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'sendEvent'";
        L.e(`sendEvent, ${message}`);
        return message;
    }
    if (!options) {
        const message = 'sendEvent, no event object provided';
        L.e(`sendEvent, ${message}`);
        return message;
    }
    if (!options.eventName) {
        const message = 'sendEvent, eventName is required';
        L.e(`sendEvent, ${message}`);
        return message;
    }
    L.d(`sendEvent, Sending event: ${JSON.stringify(options)}]`);

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
    args.push(options.eventName.toString());

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
 * Record custom view to Countly.
 *
 * @param {string} recordView - name of the view
 * @param {Map} segments - allows to add optional segmentation,
 * Supported data type for segments values are String, int, double and bool
 * @return {String || void} error message or void
 */
Countly.recordView = async function (recordView, segments) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'recordView'";
        L.e(`recordView, ${msg}`);
        return msg;
    }
    const message = await Countly.validateString(recordView, 'view name', 'recordView');
    if (message) {
        return message;
    }
    L.d(`recordView, Recording view: ${recordView}]`);

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
 *
 * @return {String || void} error message or void
 */
Countly.disablePushNotifications = function () {
    if (!/ios/.exec(Platform.OS)) {
        L.e('disablePushNotifications, ' + 'disablePushNotifications is not implemented for Android');

        return 'disablePushNotifications : To be implemented';
    }
    L.d('disablePushNotifications, Disabling push notifications');
    CountlyReactNative.disablePushNotifications();
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.pushTokenType' instead of 'pushTokenType'.
 *
 * Set messaging mode for push notifications
 * Should be called before Countly init
 *
 * @return {String || void} error message or void
 */
Countly.pushTokenType = async function (tokenType, channelName, channelDescription) {
    const message = await Countly.validateString(tokenType, 'tokenType', 'pushTokenType');
    if (message) {
        return message;
    }
    L.w('pushTokenType, pushTokenType is deprecated, use countlyConfig.pushTokenType instead');
    const args = [];
    args.push(tokenType);
    args.push(channelName || '');
    args.push(channelDescription || '');
    CountlyReactNative.pushTokenType(args);
};

Countly.sendPushToken = function (options) {
    L.d(`sendPushToken, Sending push token: [${JSON.stringify(options)}]`);
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
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'askForNotificationPermission'";
        L.e(`askForNotificationPermission, ${message}`);
        return message;
    }
    L.d(`askForNotificationPermission, Asking for notification permission at: [${customSoundPath}]`);
    CountlyReactNative.askForNotificationPermission([customSoundPath]);
    _isPushInitialized = true;
};

/**
 *
 * Set callback to receive push notifications
 * @param {callback listener } theListener
 * @return {NativeEventEmitter} event
 */
Countly.registerForNotification = function (theListener) {
    L.d('registerForNotification, Registering for notification');
    const event = eventEmitter.addListener(pushNotificationCallbackName, theListener);
    CountlyReactNative.registerForNotification([]);
    return event;
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.configureIntentRedirectionCheck' instead of 'configureIntentRedirectionCheck'.
 *
 * Configure intent redirection checks for push notification
 * Should be called before Countly "askForNotificationPermission"
 *
 * @param {array of allowed class names } allowedIntentClassNames set allowed intent class names
 * @param {array of allowed package names } allowedIntentPackageNames set allowed intent package names
 * @param {bool to check additional intent checks} useAdditionalIntentRedirectionChecks by default its true
 * @return {String || void} error message or void
 */
Countly.configureIntentRedirectionCheck = function (allowedIntentClassNames = [], allowedIntentPackageNames = [], useAdditionalIntentRedirectionChecks = true) {
    if (/ios/.exec(Platform.OS)) {
        L.e('configureIntentRedirectionCheck, configureIntentRedirectionCheck is not required for iOS');

        return 'configureIntentRedirectionCheck : not required for iOS';
    }

    if (_isPushInitialized) {
        var message = "'configureIntentRedirectionCheck' must be called before 'askForNotificationPermission'";
        L.e(`configureIntentRedirectionCheck, ${message}`);
        return message;
    }
    L.w('configureIntentRedirectionCheck, configureIntentRedirectionCheck is deprecated, use countlyConfig.configureIntentRedirectionCheck instead');
    if (!Array.isArray(allowedIntentClassNames)) {
        L.w('configureIntentRedirectionCheck, ' + `Ignoring, unsupported data type '${typeof allowedIntentClassNames}' 'allowedIntentClassNames' should be an array of String`);
        allowedIntentClassNames = [];
    }
    if (!Array.isArray(allowedIntentPackageNames)) {
        L.w('configureIntentRedirectionCheck, ' + `Ignoring, unsupported data type '${typeof allowedIntentPackageNames}' 'allowedIntentPackageNames' should be an array of String`);
        allowedIntentPackageNames = [];
    }

    if (typeof useAdditionalIntentRedirectionChecks !== 'boolean') {
        L.w('configureIntentRedirectionCheck, ' + `Ignoring, unsupported data type '${typeof useAdditionalIntentRedirectionChecks}' 'useAdditionalIntentRedirectionChecks' should be a boolean`);
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

/**
 * @deprecated at 23.6.0 - Automatic sessions are handled by underlying SDK, this function will do nothing.
 *
 * Countly start for android
 *
 * @return {String || void} error message or void
 */
Countly.start = function () {
    L.w('start, Automatic sessions are handled by underlying SDK, this function will do nothing.');
};

/**
 * @deprecated at 23.6.0 - Automatic sessions are handled by underlying SDK, this function will do nothing.
 *
 * Countly stop for android
 *
 * @return {String || void} error message or void
 */
Countly.stop = function () {
    L.w('stop, Automatic sessions are handled by underlying SDK, this function will do nothing.');
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
    L.w('enableLogging, enableLogging is deprecated, use countlyConfig.enableLogging instead');
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
    L.w('disableLogging, disableLogging is deprecated, use countlyConfig.enableLogging instead');
    CountlyReactNative.setLoggingEnabled([false]);
};

/**
 * Set to true if you want to enable countly internal debugging logs
 * Should be called before Countly init
 *
 * @param {[bool = true]} enabled server url
 */
Countly.setLoggingEnabled = function (enabled = true) {
    // TODO: init check
    L.d(`setLoggingEnabled, Setting logging enabled to: [${enabled}]`);
    CountlyReactNative.setLoggingEnabled([enabled]);
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.setLocation' instead of 'setLocationInit'.
 *
 * Set user initial location
 * Should be called before init
 * @param {ISO Country code for the user's country} countryCode
 * @param {Name of the user's city} city
 * @param {comma separate lat and lng values. For example, "56.42345,123.45325"} location
 * @param {IP address of user's} ipAddress
 * */
Countly.setLocationInit = function (countryCode, city, location, ipAddress) {
    L.w('setLocationInit, setLocationInit is deprecated, use countlyConfig.setLocation instead');
    const args = [];
    args.push(countryCode || 'null');
    args.push(city || 'null');
    args.push(location || 'null');
    args.push(ipAddress || 'null');
    CountlyReactNative.setLocationInit(args);
};

/**
 *
 * Set user location
 * @param {ISO Country code for the user's country} countryCode
 * @param {Name of the user's city} city
 * @param {comma separate lat and lng values. For example, "56.42345,123.45325"} location
 * @param {IP address of user's} ipAddress
 * */
Countly.setLocation = function (countryCode, city, location, ipAddress) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'setLocation'";
        L.e(`setLocation, ${message}`);
        return message;
    }
    L.d(`setLocation, Setting location: [${countryCode}, ${city}, ${location}, ${ipAddress}]`);
    const args = [];
    args.push(countryCode || 'null');
    args.push(city || 'null');
    args.push(location || 'null');
    args.push(ipAddress || 'null');
    CountlyReactNative.setLocation(args);
};

/**
 *
 * Disable user location
 *
 * @return {String || void} error message or void
 */
Countly.disableLocation = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'disableLocation'";
        L.e(`disableLocation, ${message}`);
        return message;
    }
    L.d('disableLocation, Disabling location');
    CountlyReactNative.disableLocation();
};

/**
 *
 * Get currently used device Id.
 * Should be called after Countly init
 *
 * @return {String} device id or error message
 */
Countly.getCurrentDeviceId = async function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'getCurrentDeviceId'";
        L.e(`getCurrentDeviceId, ${message}`);
        return message;
    }
    L.d('getCurrentDeviceId, Getting current device id');
    const result = await CountlyReactNative.getCurrentDeviceId();
    return result;
};

/**
 * Get currently used device Id type.
 * Should be called after Countly init
 *
 * @return {DeviceIdType || null} deviceIdType or null
 * */
Countly.getDeviceIDType = async function () {
    if (!_state.isInitialized) {
        L.e("getDeviceIDType, 'init' must be called before 'getDeviceIDType'");
        return null;
    }
    L.d('getDeviceIDType, Getting device id type');
    const result = await CountlyReactNative.getDeviceIDType();
    if (result == null || result == '') {
        L.e('getDeviceIDType, unexpected null value from native side');
        return null;
    }
    return Utils.stringToDeviceIDType(result);
};

/**
 * Change the current device id
 *
 * @param {String} newDeviceID id new device id
 * @param {Boolean} onServer merge device id
 * @return {String || void} error message or void
 * */
Countly.changeDeviceId = async function (newDeviceID, onServer) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'changeDeviceId'";
        L.e(`changeDeviceId, ${msg}`);
        return msg;
    }
    const message = await Countly.validateString(newDeviceID, 'newDeviceID', 'changeDeviceId');
    if (message) {
        return message;
    }

    L.d(`changeDeviceId, Changing to new device id: [${newDeviceID}], with merge: [${onServer}]`);
    if (!onServer) {
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
 * @param {bool} forceHttp force http post for all requests.
 */
Countly.setHttpPostForced = function (boolean = true) {
    L.d(`setHttpPostForced, Setting http post forced to: [${boolean}]`);
    const args = [];
    args.push(boolean ? '1' : '0');
    CountlyReactNative.setHttpPostForced(args);
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.enableCrashReporting' instead of 'enableCrashReporting'.
 *
 * Enable crash reporting to report unhandled crashes to Countly
 * Should be called before Countly init
 */
Countly.enableCrashReporting = async function () {
    L.w('enableCrashReporting, enableCrashReporting is deprecated, use countlyConfig.enableCrashReporting instead');
    CountlyReactNative.enableCrashReporting();
    if (ErrorUtils && !_isCrashReportingEnabled) {
        L.i('enableCrashReporting, Adding Countly JS error handler.');
        const previousHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler((error, isFatal) => {
            const jsStackTrace = Utils.getStackTrace(error);
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
    _isCrashReportingEnabled = true;
};

/**
 *
 * Add crash log for Countly
 *
 * @param {String} crashLog crash log
 * @return {String || void} error message or void
 */
Countly.addCrashLog = function (crashLog) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'addCrashLog'";
        L.e(`addCrashLog, ${message}`);
        return message;
    }
    L.d(`addCrashLog, Adding crash log: [${crashLog}]`);
    CountlyReactNative.addCrashLog([crashLog]);
};

/**
 *
 * Log exception for Countly
 *
 * @param {String} exception exception
 * @param {bool} nonfatal nonfatal
 * @param {Map} segments segments
 * @return {String || void} error message or void
 */
Countly.logException = function (exception, nonfatal, segments) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'logException'";
        L.e(`logException, ${message}`);
        return message;
    }
    L.d(`logException, Logging exception: [${exception}], with nonfatal: [${nonfatal}], with segments: [${JSON.stringify(segments)}]`);
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

/**
 *
 * Set custom crash segment for Countly
 *
 * @param {Map} segments segments
 */
Countly.setCustomCrashSegments = function (segments) {
    L.d(`setCustomCrashSegments, Setting custom crash segments: [${JSON.stringify(segments)}]`);
    const args = [];
    for (const key in segments) {
        args.push(key.toString());
        args.push(segments[key].toString());
    }
    CountlyReactNative.setCustomCrashSegments(args);
};

/**
 *
 * Start session tracking
 *
 * @return {String || void} error message or void
 */
Countly.startSession = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'startSession'";
        L.e(`startSession, ${message}`);
        return message;
    }
    L.d('startSession, Starting session');
    CountlyReactNative.startSession();
};

/**
 *
 * End session tracking
 *
 * @return {String || void} error message or void
 */
Countly.endSession = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'endSession'";
        L.e(`endSession, ${message}`);
        return message;
    }
    L.d('endSession, Ending session');
    CountlyReactNative.endSession();
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.enableParameterTamperingProtection' instead of 'enableParameterTamperingProtection'.
 *
 * Set the optional salt to be used for calculating the checksum of requested data which will be sent with each request, using the &checksum field
 * Should be called before Countly init
 *
 * @param {String} salt salt
 * @return {String || void} error message or void
 */
Countly.enableParameterTamperingProtection = async function (salt) {
    const message = await Countly.validateString(salt, 'salt', 'enableParameterTamperingProtection');
    if (message) {
        return message;
    }
    L.w(`enableParameterTamperingProtection, enableParameterTamperingProtection is deprecated, use countlyConfig.enableParameterTamperingProtection instead. Salt : [${salt}]`);
    CountlyReactNative.enableParameterTamperingProtection([salt.toString()]);
};

/**
 *
 * It will ensure that connection is made with one of the public keys specified
 * Should be called before Countly init
 *
 * @return {String || void} error message or void
 */
Countly.pinnedCertificates = async function (certificateName) {
    const message = await Countly.validateString(certificateName, 'certificateName', 'pinnedCertificates');
    if (message) {
        return message;
    }
    L.d(`pinnedCertificates, Setting pinned certificates: [${certificateName}]`);
    CountlyReactNative.pinnedCertificates([certificateName]);
};

/**
 *
 * Start Event
 *
 * @param {String} eventName name of event
 * @return {String || void} error message or void
 */
Countly.startEvent = async function (eventName) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'startEvent'";
        L.e(`startEvent, ${msg}`);
        return msg;
    }
    const message = await Countly.validateString(eventName, 'eventName', 'startEvent');
    if (message) {
        return message;
    }
    L.d(`startEvent, Starting event: [${eventName}]`);
    CountlyReactNative.startEvent([eventName.toString()]);
};

/**
 *
 * Cancel Event
 *
 * @param {String} eventName name of event
 * @return {String || void} error message or void
 */
Countly.cancelEvent = async function (eventName) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'cancelEvent'";
        L.e(`cancelEvent, ${msg}`);
        return msg;
    }
    const message = await Countly.validateString(eventName, 'eventName', 'cancelEvent');
    if (message) {
        return message;
    }
    L.d(`cancelEvent, Canceling event: [${eventName}]`);
    CountlyReactNative.cancelEvent([eventName.toString()]);
};

/**
 *
 * End Event
 *
 * @param {String || Object} options event options
 * @return {String || void} error message or void
 */
Countly.endEvent = function (options) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'endEvent'";
        L.e(`endEvent, ${message}`);
        return message;
    }
    L.d(`endEvent, Ending event: [${JSON.stringify(options)}]`);
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

/**
 *
 * Used to send user data
 *
 * @param {Object} userData user data
 * @return {String || void} error message or void
 */
Countly.setUserData = async function (userData) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'setUserData'";
        L.e(`setUserData, ${msg}`);
        return msg;
    }
    L.d(`setUserData, Setting user data: [${JSON.stringify(userData)}]`);
    let message = null;
    if (!userData) {
        message = 'User profile data should not be null or undefined';
        L.e(`setUserData, ${message}`);
        return message;
    }
    if (typeof userData !== 'object') {
        message = `unsupported data type of user data '${typeof userData}'`;
        L.w(`setUserData, ${message}`);
        return message;
    }
    const args = [];
    for (const key in userData) {
        if (typeof userData[key] !== 'string' && key.toString() != 'byear') {
            L.w('setUserData, ' + `skipping value for key '${key.toString()}', due to unsupported data type '${typeof userData[key]}', its data type should be 'string'`);
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

Countly.userData.setProperty = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'setProperty'";
        L.e(`setProperty, ${msg}`);
        return msg;
    }
    L.d(`setProperty, Setting user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'increment'";
        L.e(`increment, ${msg}`);
        return msg;
    }
    L.d(`increment, Incrementing user property: [${keyName}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'incrementBy'";
        L.e(`incrementBy, ${msg}`);
        return msg;
    }
    L.d(`incrementBy, Incrementing user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'multiply'";
        L.e(`multiply, ${msg}`);
        return msg;
    }
    L.d(`multiply, Multiplying user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'saveMax'";
        L.e(`saveMax, ${msg}`);
        return msg;
    }
    L.d(`saveMax, Saving max user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'saveMin'";
        L.e(`saveMin, ${msg}`);
        return msg;
    }
    L.d(`saveMin, Saving min user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'setOnce'";
        L.e(`setOnce, ${msg}`);
        return msg;
    }
    L.d(`setOnce, Setting once user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'pushUniqueValue'";
        L.e(`pushUniqueValue, ${msg}`);
        return msg;
    }
    L.d(`pushUniqueValue, Pushing unique value to user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'pushValue'";
        L.e(`pushValue, ${msg}`);
        return msg;
    }
    L.d(`pushValue, Pushing value to user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'pullValue'";
        L.e(`pullValue, ${msg}`);
        return msg;
    }
    L.d(`pullValue, Pulling value from user property: [${keyName}, ${keyValue}]`);
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

// providing key/values with predefined and custom properties
Countly.userDataBulk.setUserProperties = async function (customAndPredefined) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'setUserProperties'";
        L.e(`setUserProperties, ${msg}`);
        return msg;
    }
    L.d(`setUserProperties, Setting user properties: [${JSON.stringify(customAndPredefined)}]`);
    L.w('setUserProperties, Countly.userDataBulk.save() must be called after setting user properties!');
    let message = null;
    if (!customAndPredefined) {
        message = 'User profile data should not be null or undefined';
        L.e(`setUserProperties, ${message}`);
        return message;
    }
    if (typeof customAndPredefined !== 'object') {
        message = `unsupported data type of user data '${typeof customAndPredefined}'`;
        L.w(`setUserProperties, ${message}`);
        return message;
    }
    for (const key in customAndPredefined) {
        if (typeof customAndPredefined[key] !== 'string' && key.toString() != 'byear') {
            L.w('setUserProperties, ' + `skipping value for key '${key.toString()}', due to unsupported data type '${typeof customAndPredefined[key]}', its data type should be 'string'`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'save'";
        L.e(`save, ${msg}`);
        return msg;
    }
    L.d('save, Saving user data');
    await CountlyReactNative.userDataBulk_save([]);
};

Countly.userDataBulk.setProperty = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'setProperty'";
        L.e(`setProperty, ${msg}`);
        return msg;
    }
    L.d(`setProperty, Setting user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'increment'";
        L.e(`increment, ${msg}`);
        return msg;
    }
    L.d(`increment, Incrementing user property: [${keyName}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'incrementBy'";
        L.e(`incrementBy, ${msg}`);
        return msg;
    }
    L.d(`incrementBy, Incrementing user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'multiply'";
        L.e(`multiply, ${msg}`);
        return msg;
    }
    L.d(`multiply, Multiplying user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'saveMax'";
        L.e(`saveMax, ${msg}`);
        return msg;
    }
    L.d(`saveMax, Saving max user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'saveMin'";
        L.e(`saveMin, ${msg}`);
        return msg;
    }
    L.d(`saveMin, Saving min user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'setOnce'";
        L.e(`setOnce, ${msg}`);
        return msg;
    }
    L.d(`setOnce, Setting once user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'pushUniqueValue'";
        L.e(`pushUniqueValue, ${msg}`);
        return msg;
    }
    L.d(`pushUniqueValue, Pushing unique value to user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'pushValue'";
        L.e(`pushValue, ${msg}`);
        return msg;
    }
    L.d(`pushValue, Pushing value to user property: [${keyName}, ${keyValue}]`);
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
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'pullValue'";
        L.e(`pullValue, ${msg}`);
        return msg;
    }
    L.d(`pullValue, Pulling value from user property: [${keyName}, ${keyValue}]`);
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
 * @deprecated in 23.02.0 : use 'countlyConfig.setRequiresConsent' instead of 'setRequiresConsent'.
 *
 * Set that consent should be required for features to work.
 * Should be called before Countly init
 *
 * @param {bool} flag if true, consent is required for features to work.
 */
Countly.setRequiresConsent = function (flag) {
    L.w(`setRequiresConsent, setRequiresConsent is deprecated, use countlyConfig.setRequiresConsent instead. Flag : [${flag}]`);
    CountlyReactNative.setRequiresConsent([flag]);
};

/**
 *
 * Give consent for some features
 * Should be called after Countly init
 *
 * @param {String[]} args list of consents
 * @return {String || void} error message or void
 */
Countly.giveConsent = function (args) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'giveConsent'";
        L.e(`giveConsent ${message}`);
        return message;
    }
    L.d(`giveConsent, Giving consent for features: [${args}]`);
    let features = [];
    if (typeof args === 'string') {
        features.push(args);
    } else {
        features = args;
    }
    CountlyReactNative.giveConsent(features);
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.giveConsent' instead of 'giveConsentInit'.
 *
 * Give consent for specific features before init.
 * Should be called after Countly init
 *
 * @param {String[]} args list of consents
 */
Countly.giveConsentInit = async function (args) {
    L.w('giveConsentInit, giveConsentInit is deprecated, use countlyConfig.giveConsent instead.');
    let features = [];
    if (typeof args === 'string') {
        features.push(args);
    } else if (Array.isArray(args)) {
        features = args;
    } else {
        L.w('giveConsentInit ' + `unsupported data type '${typeof args}'`);
    }
    await CountlyReactNative.giveConsentInit(features);
};

/**
 *
 * Remove consent for some features
 * Should be called after Countly init
 *
 * @param {String[]} args list of consents
 * @return {String || void} error message or void
 */
Countly.removeConsent = function (args) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'removeConsent'";
        L.e(`removeConsent${message}`);
        return message;
    }
    L.d(`removeConsent, Removing consent for features: [${args}]`);
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
 *
 * @return {String || void} error message or void
 */
Countly.giveAllConsent = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'giveAllConsent'";
        L.e(`giveAllConsent, ${message}`);
        return message;
    }
    L.d('giveAllConsent, Giving consent for all features');
    CountlyReactNative.giveAllConsent();
};

/**
 *
 * Remove consent for all features
 * Should be called after Countly init
 *
 * @return {String || void} error message or void
 */
Countly.removeAllConsent = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'removeAllConsent'";
        L.e(`removeAllConsent, ${message}`);
        return message;
    }
    L.d('removeAllConsent, Removing consent for all features');
    CountlyReactNative.removeAllConsent();
};

Countly.remoteConfigUpdate = function (callback) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'remoteConfigUpdate'";
        L.e(`remoteConfigUpdate, ${message}`);
        callback(message);
        return message;
    }
    L.d('remoteConfigUpdate, Updating remote config');
    CountlyReactNative.remoteConfigUpdate([], (stringItem) => {
        callback(stringItem);
    });
};

Countly.updateRemoteConfigForKeysOnly = function (keyNames, callback) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'updateRemoteConfigForKeysOnly'";
        L.e(`updateRemoteConfigForKeysOnly, ${message}`);
        callback(message);
        return message;
    }
    L.d(`updateRemoteConfigForKeysOnly, Updating remote config for keys: [${keyNames}]`);
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
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'updateRemoteConfigExceptKeys'";
        L.e(`updateRemoteConfigExceptKeys, ${message}`);
        callback(message);
        return message;
    }
    L.d(`updateRemoteConfigExceptKeys, Updating remote config except keys: [${keyNames}]`);
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
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'getRemoteConfigValueForKey'";
        L.e(`getRemoteConfigValueForKey ${message}`);
        callback(message);
        return message;
    }
    CountlyReactNative.getRemoteConfigValueForKey([keyName.toString() || ''], (value) => {
        if (Platform.OS == 'android') {
            try {
                value = JSON.parse(value);
            } catch (e) {
                // L.e('getRemoteConfigValueForKey', e.message);
                // noop. value will remain string if not JSON parsable and returned as string
            }
        }
        callback(value);
    });
};

Countly.getRemoteConfigValueForKeyP = function (keyName) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'getRemoteConfigValueForKeyP'";
        L.e(`getRemoteConfigValueForKeyP, ${message}`);
        callback(message);
        return message;
    }
    L.d(`getRemoteConfigValueForKeyP, Getting remote config value for key: [${keyName}]`);
    if (Platform.OS != 'android') {
        return 'To be implemented';
    }
    const promise = CountlyReactNative.getRemoteConfigValueForKeyP(keyName);
    return promise
        .then((value) => {
            if (Platform.OS == 'android') {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    // L.e('getRemoteConfigValueForKeyP', e.message);
                    // noop. value will remain string if not JSON parsable and returned as string
                }
            }
            return value;
        })
        .catch((e) => {
            L.e('getRemoteConfigValueForKeyP, Catch Error:', e);
        });
};

Countly.remoteConfigClearValues = async function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'remoteConfigClearValues'";
        L.e(`remoteConfigClearValues, ${message}`);
        callback(message);
        return message;
    }
    L.d('remoteConfigClearValues, Clearing remote config values');
    const result = await CountlyReactNative.remoteConfigClearValues();
    return result;
};
/**
 * @deprecated in 23.02.0 : use 'countlyConfig.setStarRatingDialogTexts' instead of 'setStarRatingDialogTexts'.
 *
 * Set's the text's for the different fields in the star rating dialog. Set value null if for some field you want to keep the old value
 *
 * @param {String} starRatingTextTitle - dialog's title text (Only for Android)
 * @param {String} starRatingTextMessage - dialog's message text
 * @param {String} starRatingTextDismiss - dialog's dismiss buttons text (Only for Android)
 * @return {String || void} error message or void
 */
Countly.setStarRatingDialogTexts = function (starRatingTextTitle, starRatingTextMessage, starRatingTextDismiss) {
    L.w(`setStarRatingDialogTexts, setStarRatingDialogTexts is deprecated, use countlyConfig.setStarRatingDialogTexts instead. starRatingTextTitle : [${starRatingTextTitle}], starRatingTextMessage : [${starRatingTextMessage}], starRatingTextDismiss : [${starRatingTextDismiss}]`);
    const args = [];
    args.push(starRatingTextTitle);
    args.push(starRatingTextMessage);
    args.push(starRatingTextDismiss);
    CountlyReactNative.setStarRatingDialogTexts(args);
};

Countly.showStarRating = function (callback) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'showStarRating'";
        L.e(`showStarRating, ${message}`);
        return message;
    }
    L.d('showStarRating, Showing star rating');
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
 * @param {callback listener} [ratingWidgetCallback] This parameter is optional.
 */
Countly.presentRatingWidgetWithID = function (widgetId, closeButtonText, ratingWidgetCallback) {
    if (!_state.isInitialized) {
        var message = "'init' must be called before 'presentRatingWidgetWithID'";
        L.e(`presentRatingWidgetWithID, ${message}`);
        return message;
    }
    if (!widgetId) {
        message = 'Rating Widget id should not be null or empty';
        L.e(`presentRatingWidgetWithID, ${message}`);
        return message;
    }
    if (typeof closeButtonText !== 'string') {
        closeButtonText = '';
        L.w('presentRatingWidgetWithID, ' + `unsupported data type of closeButtonText : '${typeof args}'`);
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
 * @deprecated in 23.8.0 : use 'Countly.feedback.getAvailableFeedbackWidgets' instead of 'getFeedbackWidgets'.
 * @param {callback listener} [onFinished] - returns (retrievedWidgets, error). This parameter is optional.
 * @return {String || []} error message or []
 */
Countly.getFeedbackWidgets = async function (onFinished) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'getFeedbackWidgets'";
        L.e(`getFeedbackWidgets, ${message}`);
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
 * Present a chosen feedback widget
 *
 * @deprecated in 23.8.0 : use 'Countly.feedback.presentFeedbackWidget' instead of 'presentFeedbackWidgetObject'.
 * @param {Object} feedbackWidget - feeback Widget with id, type and name
 * @param {String} closeButtonText - text for cancel/close button
 * @param {callback listener} [widgetShownCallback] - Callback to be executed when feedback widget is displayed. This parameter is optional.
 * @param {callback listener} [widgetClosedCallback] - Callback to be executed when feedback widget is closed. This parameter is optional.
 *
 * @return {String || void} error message or void
 */
Countly.presentFeedbackWidgetObject = async function (feedbackWidget, closeButtonText, widgetShownCallback, widgetClosedCallback) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'presentFeedbackWidgetObject'";
        L.e(`presentFeedbackWidgetObject, ${msg}`);
        return msg;
    }
    L.w('presentFeedbackWidgetObject, presentFeedbackWidgetObject is deprecated, use Countly.feedback.presentFeedbackWidget instead.');
    let message = null;
    if (!feedbackWidget) {
        message = 'feedbackWidget should not be null or undefined';
        L.e(`presentFeedbackWidgetObject, ${message}`);
        return message;
    }
    if (!feedbackWidget.id) {
        message = 'FeedbackWidget id should not be null or empty';
        L.e(`presentFeedbackWidgetObject, ${message}`);
        return message;
    }
    if (!feedbackWidget.type) {
        message = 'FeedbackWidget type should not be null or empty';
        L.e(`presentFeedbackWidgetObject, ${message}`);
        return message;
    }
    if (typeof closeButtonText !== 'string') {
        closeButtonText = '';
        L.w('presentFeedbackWidgetObject, ' + `unsupported data type of closeButtonText : '${typeof args}'`);
    }

    if (widgetShownCallback) {
        _state.widgetShownCallback = eventEmitter.addListener(_state.widgetShownCallbackName, () => {
            widgetShownCallback();
            _state.widgetShownCallback.remove();
        });
    }
    if (widgetClosedCallback) {
        _state.widgetClosedCallback = eventEmitter.addListener(_state.widgetClosedCallbackName, () => {
            widgetClosedCallback();
            _state.widgetClosedCallback.remove();
        });
    }

    feedbackWidget.name = feedbackWidget.name || '';
    closeButtonText = closeButtonText || '';
    CountlyReactNative.presentFeedbackWidget([feedbackWidget.id, feedbackWidget.type, feedbackWidget.name, closeButtonText]);
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
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'startTrace'";
        L.e(`startTrace, ${message}`);
        return message;
    }
    L.d(`startTrace, Starting trace: [${traceKey}]`);
    const args = [];
    args.push(traceKey);
    CountlyReactNative.startTrace(args);
};

Countly.cancelTrace = function (traceKey) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'cancelTrace'";
        L.e(`cancelTrace, ${message}`);
        return message;
    }
    L.d(`cancelTrace, Canceling trace: [${traceKey}]`);
    const args = [];
    args.push(traceKey);
    CountlyReactNative.cancelTrace(args);
};

Countly.clearAllTraces = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'clearAllTraces'";
        L.e(`clearAllTraces, ${message}`);
        return message;
    }
    L.d('clearAllTraces, Clearing all traces');
    const args = [];
    CountlyReactNative.clearAllTraces(args);
};

Countly.endTrace = function (traceKey, customMetric) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'endTrace'";
        L.e(`endTrace, ${message}`);
        return message;
    }
    L.d(`endTrace, Ending trace: [${traceKey}]`);
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
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'recordNetworkTrace'";
        L.e(`recordNetworkTrace, ${message}`);
        return message;
    }
    L.d(`recordNetworkTrace, Recording network trace: [${networkTraceKey}]`);
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
 * @deprecated in 23.02.0 : use 'countlyConfig.enableApm' instead of 'enableApm'.
 *
 * Enable APM features, which includes the recording of app start time.
 * Should be called before Countly init
 */
Countly.enableApm = function () {
    L.w(`enableApm, enableApm is deprecated, use countlyConfig.enableApm instead.`);
    const args = [];
    CountlyReactNative.enableApm(args);
};

/**
 * @deprecated in 23.02.0 : use 'Countly.recordIndirectAttribution' instead of 'Countly'.
 *
 * Enable campaign attribution reporting to Countly.
 * For iOS use "recordAttributionID" instead of "enableAttribution"
 * Should be called before Countly init
 */
Countly.enableAttribution = async function (attributionID = '') {
    L.w(`enableAttribution, enableAttribution is deprecated, use Countly.recordIndirectAttribution instead.`);
    if (/ios/.exec(Platform.OS)) {
        if (attributionID == '') {
            const message = "attribution Id for iOS can't be empty string";
            L.e(`enableAttribution ${message}`);
            return message;
        }
        Countly.recordAttributionID(attributionID);
    } else {
        const message = 'This method does nothing for android';
        L.e(`enableAttribution, ${message}`);
        return message;
    }
};

/**
 *
 * @deprecated in 23.02.0 : use 'Countly.recordIndirectAttribution' instead of 'recordAttributionID'.
 *
 * set attribution Id for campaign attribution reporting.
 * Currently implemented for iOS only
 */
Countly.recordAttributionID = function (attributionID) {
    L.w(`recordAttributionID, recordAttributionID is deprecated, use Countly.recordIndirectAttribution instead.`);
    if (!/ios/.exec(Platform.OS)) {
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
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'replaceAllAppKeysInQueueWithCurrentAppKey'";
        L.e(`replaceAllAppKeysInQueueWithCurrentAppKey, ${message}`);
        return message;
    }
    L.d('replaceAllAppKeysInQueueWithCurrentAppKey, Replacing all app keys in queue with current app key');
    CountlyReactNative.replaceAllAppKeysInQueueWithCurrentAppKey();
};
/**
 * set direct attribution Id for campaign attribution reporting.
 */
Countly.recordDirectAttribution = function (campaignType, campaignData) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'recordDirectAttribution'";
        L.e(`recordDirectAttribution, ${message}`);
        return message;
    }
    L.d(`recordDirectAttribution, Recording direct attribution: [${campaignType}, ${campaignData}]`);
    const args = [];
    args.push(campaignType);
    args.push(campaignData);
    CountlyReactNative.recordDirectAttribution(args);
};
/**
 * set indirect attribution Id for campaign attribution reporting.
 */
Countly.recordIndirectAttribution = function (attributionValues) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'recordIndirectAttribution'";
        L.e(`recordIndirectAttribution, ${message}`);
        return message;
    }
    L.d(`recordIndirectAttribution, Recording indirect attribution: [${attributionValues}]`);
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
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'removeDifferentAppKeysFromQueue'";
        L.e(`removeDifferentAppKeysFromQueue, ${message}`);
        return message;
    }
    L.d('removeDifferentAppKeysFromQueue, Removing all requests with a different app key in request queue');
    CountlyReactNative.removeDifferentAppKeysFromQueue();
};

/**
 * Call this function when app is loaded, so that the app launch duration can be recorded.
 * Should be called after init.
 */
Countly.appLoadingFinished = async function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'appLoadingFinished'";
        L.e(`appLoadingFinished, ${message}`);
        return message;
    }
    L.d('appLoadingFinished, App loading finished');
    CountlyReactNative.appLoadingFinished();
};

/**
 * Set the metrics you want to override
 * Should be called before Countly init
 * @param {Object} customMetric - metric with key/value pair
 * Supported data type for customMetric values is String
 */
Countly.setCustomMetrics = async function (customMetric) {
    L.d(`setCustomMetrics, Setting custom metrics: [${JSON.stringify(customMetric)}]`);
    let message = null;
    if (!customMetric) {
        message = 'customMetric should not be null or undefined';
        L.e(`setCustomMetrics, ${message}`);
        return message;
    }
    if (typeof customMetric !== 'object') {
        message = `unsupported data type of customMetric '${typeof customMetric}'`;
        L.w(`setCustomMetrics, ${message}`);
        return message;
    }
    const args = [];
    for (const key in customMetric) {
        if (typeof customMetric[key] === 'string') {
            args.push(key.toString());
            args.push(customMetric[key].toString());
        } else {
            L.w('setCustomMetrics, ' + `skipping value for key '${key.toString()}', due to unsupported data type '${typeof customMetric[key]}'`);
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
    L.d(`validateUserDataValue, Validating user data value: [${stringValue}], name: [${stringName}], function: [${functionName}]`);
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
    L.d(`validateUserDataType, Validating user data type: [${stringValue}], name: [${stringName}], function: [${functionName}]`);
    let message = null;
    if (typeof stringValue === 'number') {
        return null;
    }
    if (typeof stringValue === 'string') {
        L.w(`${functionName} unsupported data type '${typeof stringValue}', its data type should be 'number'`);
        return null;
    }

    message = `skipping value for '${stringName.toString()}', due to unsupported data type '${typeof stringValue}', its data type should be 'number'`;
    L.e(`${functionName}, ${message}`);
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
    L.d(`validateValidUserData, Validating valid user data: [${stringValue}], name: [${stringName}], function: [${functionName}]`);
    if (stringValue || stringValue == '') {
        return null;
    }

    const message = `${stringName} should not be null or undefined`;
    L.e(`${functionName}, ${message}`);
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
    L.d(`validateParseInt, Validating parse int: [${stringValue}], name: [${stringName}], function: [${functionName}]`);
    const intValue = parseInt(stringValue);
    if (!isNaN(intValue)) {
        return null;
    }

    const message = `skipping value for '${stringName.toString()}', due to unsupported data type '${typeof stringValue}', its data type should be 'number' or parseable to 'integer'`;
    L.e(`${functionName}, ${message}`);
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
    L.d(`validateString, Validating string: [${stringValue}], name: [${stringName}], function: [${functionName}]`);
    let message = null;
    if (!stringValue) {
        message = `${stringName} should not be null, undefined or empty`;
    } else if (typeof stringValue !== 'string') {
        message = `skipping value for '${stringName.toString()}', due to unsupported data type '${typeof stringValue}', its data type should be 'string'`;
    }
    if (message) {
        L.e(`${functionName}, ${message}`);
    }
    return message;
};

export default Countly;
