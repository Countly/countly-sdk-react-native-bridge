/**
 * Countly SDK React Native Bridge
 * https://github.com/Countly/countly-sdk-react-native-bridge
 * @Countly
 */

import { Platform, NativeModules, NativeEventEmitter } from "react-native";

import CountlyConfig from "./CountlyConfig.js";
import CountlyState from "./CountlyState.js";
import Feedback from "./Feedback.js";
import Event from "./Event.js";
import DeviceId from "./DeviceId.js";
import * as L from "./Logger.js";
import * as Utils from "./Utils.js";
import * as Validate from "./Validators.js";

const { CountlyReactNative } = NativeModules;
const eventEmitter = new NativeEventEmitter(CountlyReactNative);

const Countly = {};
Countly.serverUrl = "";
Countly.appKey = "";
let _state = CountlyState;
CountlyState.CountlyReactNative = CountlyReactNative;
CountlyState.eventEmitter = eventEmitter;

Countly.feedback = new Feedback(CountlyState);
Countly.events = new Event(CountlyState);
Countly.deviceId = new DeviceId(CountlyState);

let _isCrashReportingEnabled = false;

Countly.userData = {}; // userData interface
Countly.userDataBulk = {}; // userDataBulk interface

Countly.content = {}; // content interface

let _isPushInitialized = false;

const BUILDING_WITH_PUSH_DISABLED = true;
const _pushDisabledMsg = 'Push Notifications are disabled in this flavor. Please use the original Countly React Native SDK if you need to use Push Notifications.';

/*
 * Listener for rating widget callback, when callback recieve we will remove the callback using listener.
 */
let _ratingWidgetListener;
const ratingWidgetCallbackName = "ratingWidgetCallback";
const pushNotificationCallbackName = "pushNotificationCallback";

Countly.messagingMode = { DEVELOPMENT: "1", PRODUCTION: "0", ADHOC: "2" };
if (/android/.exec(Platform.OS)) {
    Countly.messagingMode.DEVELOPMENT = "2";
}
Countly.TemporaryDeviceIDString = "TemporaryDeviceID";

/**
 * Initialize Countly
 *
 * @deprecated in 23.02.0 : use 'initWithConfig' instead of 'init'.
 *
 * @function Countly.init should be used to initialize countly
 * @param {string} serverURL server url
 * @param {string} appKey application key
 * @param {string} deviceId device ID
 */
Countly.init = async function (serverUrl, appKey, deviceId) {
    L.w("Countly.init is deprecated, use Countly.initWithConfig instead");
    const countlyConfig = new CountlyConfig(serverUrl, appKey).setDeviceID(deviceId);
    await Countly.initWithConfig(countlyConfig);
};

/**
 * Initialize Countly
 *
 * @function Countly.initWithConfig should be used to initialize countly with config
 * @param {CountlyConfig} countlyConfig countly config object
 */
Countly.initWithConfig = async function (countlyConfig) {
    if (_state.isInitialized) {
        L.d("init, SDK is already initialized");
        return;
    }
    if (countlyConfig.deviceID == "") {
        L.e("init, Device ID during init can't be an empty string. Value will be ignored.");
        countlyConfig.deviceId = null;
    }
    if (countlyConfig.serverURL == "") {
        L.e("init, Server URL during init can't be an empty string");
        return;
    }
    if (countlyConfig.appKey == "") {
        L.e("init, App Key during init can't be an empty string");
        return;
    }
    L.d("initWithConfig, Initializing Countly");
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
 * @return {boolean} if true, countly sdk has been initialized
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
 * @return {boolean | string} boolean or error message
 */
Countly.hasBeenCalledOnStart = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'hasBeenCalledOnStart'";
        L.e(`hasBeenCalledOnStart, ${message}`);
        return message;
    }
    L.w("hasBeenCalledOnStart, This call is deprecated and will be removed with no replacement.");
    return CountlyReactNative.hasBeenCalledOnStart();
};

/**
 * Sends an event to the server
 *
 * @deprecated in 24.4.0 : use 'Countly.events.recordEvent' instead of this.
 * 
 * @param {CountlyEventOptions} options event options. 
 * CountlyEventOptions {
 *   eventName: string;
 *   eventCount?: number;
 *   eventSum?: number | string;
 *   segments?: Segmentation;
 * }
 * @return {string | void} error message or void
 */
Countly.sendEvent = function (options) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'sendEvent'";
        L.w(`sendEvent, ${msg}`);
        return msg;
    }
    L.w("sendEvent, This method is deprecated, use 'Countly.events.recordEvent' instead");
    if (!options) {
        const message = "no event object provided!";
        L.w(`sendEvent, ${message}`);
        return message;
    }
    // previous implementation was not clear about the data types of eventCount and eventSum
    // here parse them to make sure they are in correct format for the new method
    // parser will return a false value (NaN) in case of invalid data (like undefined, null, empty string, etc.)
    options.eventCount = parseInt(options.eventCount, 10) || 1;
    options.eventSum = parseFloat(options.eventSum) || 0;

    Countly.events.recordEvent(options.eventName, options.segments, options.eventCount, options.eventSum);
};

/**
 * Record custom view to Countly.
 *
 * @param {string} recordView - name of the view
 * @param {object} segments - allows to add optional segmentation,
 * Supported data type for segments values are string, int, double and boolean
 * @return {string | void} error message or void
 */
Countly.recordView = function (recordView, segments) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'recordView'";
        L.e(`recordView, ${msg}`);
        return msg;
    }
    const message = Validate.String(recordView, "view name", "recordView");
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
 * @return {string | void} error message or void
 */
Countly.disablePushNotifications = function () {
    if (!/ios/.exec(Platform.OS)) {
        L.e("disablePushNotifications, " + "disablePushNotifications is not implemented for Android");

        return "disablePushNotifications : To be implemented";
    }
    L.d("disablePushNotifications, Disabling push notifications");
    CountlyReactNative.disablePushNotifications();
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.pushTokenType' instead of 'pushTokenType'.
 *
 * Set messaging mode for push notifications
 * Should be called before Countly init
 *
 * @return {string | void} error message or void
 */
Countly.pushTokenType = function (tokenType, channelName, channelDescription) {
    if (BUILDING_WITH_PUSH_DISABLED) {
      L.w(`pushTokenType, ${_pushDisabledMsg}`);
      return _pushDisabledMsg;
    }
    const message = Validate.String(tokenType, "tokenType", "pushTokenType");
    if (message) {
        return message;
    }
    L.w("pushTokenType, pushTokenType is deprecated, use countlyConfig.pushTokenType instead");
    const args = [];
    args.push(tokenType);
    args.push(channelName || "");
    args.push(channelDescription || "");
    CountlyReactNative.pushTokenType(args);
};

/**
 *
 * Send push token
 * @param {object} options - object containing the push token
 * {token: string}
 *
 * @return {string | void} error message or void
 */
Countly.sendPushToken = function (options) {
    if (BUILDING_WITH_PUSH_DISABLED) {
      L.w(`sendPushToken, ${_pushDisabledMsg}`);
      return;
    }
    L.d(`sendPushToken, Sending push token: [${JSON.stringify(options)}]`);
    const args = [];
    args.push(options.token || "");
    CountlyReactNative.sendPushToken(args);
};

/**
 * This method will ask for permission, enables push notification and send push token to countly server.
 *
 * @param {string} customSoundPath - name of custom sound for push notifications (Only for Android)
 * Custom sound should be place at 'your_project_root/android/app/src/main/res/raw'
 * Should be called after Countly init
 *
 * @return {string | void} error message or void
 */
Countly.askForNotificationPermission = function (customSoundPath = "null") {
    if (BUILDING_WITH_PUSH_DISABLED) {
      L.w(`askForNotificationPermission, ${_pushDisabledMsg}`);
      return _pushDisabledMsg;
    }
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
    if (BUILDING_WITH_PUSH_DISABLED) {
      L.w(`registerForNotification, ${_pushDisabledMsg}`);
      return;
    }
    L.d("registerForNotification, Registering for notification");
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
 * @param {string[]} allowedIntentClassNames allowed intent class names
 * @param {string[]} allowedIntentPackageNames allowed intent package names
 * @param {boolean} useAdditionalIntentRedirectionChecks to check additional intent checks. The default value is "true"
 * @return {string | void} error message or void
 */
Countly.configureIntentRedirectionCheck = function (allowedIntentClassNames = [], allowedIntentPackageNames = [], useAdditionalIntentRedirectionChecks = true) {
    if (BUILDING_WITH_PUSH_DISABLED) {
      L.w(`configureIntentRedirectionCheck, ${_pushDisabledMsg}`);
      return;
    }
    if (/ios/.exec(Platform.OS)) {
        L.w("configureIntentRedirectionCheck, configureIntentRedirectionCheck is not required for iOS");

        return "configureIntentRedirectionCheck : not required for iOS";
    }

    if (_isPushInitialized) {
        let message = "'configureIntentRedirectionCheck' must be called before 'askForNotificationPermission'";
        L.w(`configureIntentRedirectionCheck, ${message}`);
        return message;
    }
    L.w("configureIntentRedirectionCheck, configureIntentRedirectionCheck is deprecated, use countlyConfig.configureIntentRedirectionCheck instead");
    if (!Array.isArray(allowedIntentClassNames)) {
        L.w("configureIntentRedirectionCheck, " + `Ignoring, unsupported data type '${typeof allowedIntentClassNames}' 'allowedIntentClassNames' should be an array of String`);
        allowedIntentClassNames = [];
    }
    if (!Array.isArray(allowedIntentPackageNames)) {
        L.w("configureIntentRedirectionCheck, " + `Ignoring, unsupported data type '${typeof allowedIntentPackageNames}' 'allowedIntentPackageNames' should be an array of String`);
        allowedIntentPackageNames = [];
    }

    if (typeof useAdditionalIntentRedirectionChecks !== "boolean") {
        L.w("configureIntentRedirectionCheck, " + `Ignoring, unsupported data type '${typeof useAdditionalIntentRedirectionChecks}' 'useAdditionalIntentRedirectionChecks' should be a boolean`);
        useAdditionalIntentRedirectionChecks = true;
    }

    const _allowedIntentClassNames = [];
    for (const className of allowedIntentClassNames) {
        let message = Validate.String(className, "class name", "configureIntentRedirectionCheck");
        if (message == null) {
            _allowedIntentClassNames.push(className);
        }
    }

    const _allowedIntentPackageNames = [];
    for (const packageName of allowedIntentPackageNames) {
        let message = Validate.String(packageName, "package name", "configureIntentRedirectionCheck");
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
 */
Countly.start = function () {
    L.w("start, Automatic sessions are handled by underlying SDK, this function will do nothing.");
};

/**
 * @deprecated at 23.6.0 - Automatic sessions are handled by underlying SDK, this function will do nothing.
 *
 * Countly stop for android
 *
 */
Countly.stop = function () {
    L.w("stop, Automatic sessions are handled by underlying SDK, this function will do nothing.");
};

/**
 * Enable countly internal debugging logs
 * Should be called before Countly init
 *
 * @deprecated in 20.04.6
 *
 * @function Countly.setLoggingEnabled should be used to enable/disable countly internal debugging logs
 * 
 */

Countly.enableLogging = function () {
    L.w("enableLogging, enableLogging is deprecated, use countlyConfig.enableLogging instead");
    CountlyReactNative.setLoggingEnabled([true]);
};

/**
 * Disable countly internal debugging logs
 *
 * @deprecated in 20.04.6
 *
 * @function Countly.setLoggingEnabled should be used to enable/disable countly internal debugging logs
 * 
 */
Countly.disableLogging = function () {
    L.w("disableLogging, disableLogging is deprecated, use countlyConfig.enableLogging instead");
    CountlyReactNative.setLoggingEnabled([false]);
};

/**
 * Set to true if you want to enable countly internal debugging logs
 * Should be called before Countly init
 *
 * @param {[boolean = true]} enabled server url
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
 * @param {string | null} countryCode ISO Country code for the user's country
 * @param {string | null} city Name of the user's city
 * @param {string | null} location comma separate lat and lng values. For example, "56.42345,123.45325"
 * @param {string | null} ipAddress IP address of user's
 */
Countly.setLocationInit = function (countryCode, city, location, ipAddress) {
    L.w("setLocationInit, setLocationInit is deprecated, use countlyConfig.setLocation instead");
    const args = [];
    args.push(countryCode || "null");
    args.push(city || "null");
    args.push(location || "null");
    args.push(ipAddress || "null");
    CountlyReactNative.setLocationInit(args);
};

/**
 *
 * Set user location
 * @param {string | null} countryCode ISO Country code for the user's country
 * @param {string | null} city Name of the user's city
 * @param {string | null} location comma separate lat and lng values. For example, "56.42345,123.45325"
 * @param {string | null} ipAddress IP address of user's
 * @return {string | void} error message or void
 */
Countly.setLocation = function (countryCode, city, location, ipAddress) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'setLocation'";
        L.e(`setLocation, ${message}`);
        return message;
    }
    L.d(`setLocation, Setting location: [${countryCode}, ${city}, ${location}, ${ipAddress}]`);
    const args = [];
    args.push(countryCode || "null");
    args.push(city || "null");
    args.push(location || "null");
    args.push(ipAddress || "null");
    CountlyReactNative.setLocation(args);
};

/**
 *
 * Disable user location
 *
 * @return {string | void} error message or void
 */
Countly.disableLocation = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'disableLocation'";
        L.e(`disableLocation, ${message}`);
        return message;
    }
    L.d("disableLocation, Disabling location");
    CountlyReactNative.disableLocation();
};

/**
 * @deprecated use 'Countly.deviceId.getID' instead of 'Countly.getCurrentDeviceId'
 * 
 * Get currently used device Id.
 * Should be called after Countly init
 *
 * @return {string} device id or error message
 */
Countly.getCurrentDeviceId = async function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'getCurrentDeviceId'";
        L.e(`getCurrentDeviceId, ${message}`);
        return message;
    }
    L.d("getCurrentDeviceId, Getting current device id");
    const result = await CountlyReactNative.getCurrentDeviceId();
    return result;
};

/**
 * @deprecated use 'Countly.deviceId.getType' instead of 'Countly.getDeviceIDType'
 * 
 * Get currently used device Id type.
 * Should be called after Countly init
 *
 * @return {DeviceIdType | null} deviceIdType or null
 */
Countly.getDeviceIDType = async function () {
    if (!_state.isInitialized) {
        L.e("getDeviceIDType, 'init' must be called before 'getDeviceIDType'");
        return null;
    }
    L.d("getDeviceIDType, Getting device id type");
    const result = await CountlyReactNative.getDeviceIDType();
    return Utils.intToDeviceIDType(result);
};

/**
 * @deprecated use 'Countly.deviceId.setID' instead of 'Countly.changeDeviceId' for setting device ID.
 * 
 * Change the current device ID
 *
 * @param {string} newDeviceID id new device id
 * @param {boolean} onServer merge device id
 * @return {string | void} error message or void
 */
Countly.changeDeviceId = function (newDeviceID, onServer) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'changeDeviceId'";
        L.e(`changeDeviceId, ${msg}`);
        return msg;
    }
    const message = Validate.String(newDeviceID, "newDeviceID", "changeDeviceId");
    if (message) {
        return message;
    }

    L.d(`changeDeviceId, Changing to new device id: [${newDeviceID}], with merge: [${onServer}]`);
    if (!onServer) {
        onServer = "0";
    } else {
        onServer = "1";
    }
    newDeviceID = newDeviceID.toString();
    CountlyReactNative.changeDeviceId([newDeviceID, onServer]);
};

/**
 *
 * Set to "true" if you want HTTP POST to be used for all requests
 * Should be called before Countly init
 * @param {boolean} forceHttp force http post for all requests.
 */
Countly.setHttpPostForced = function (boolean = true) {
    L.d(`setHttpPostForced, Setting http post forced to: [${boolean}]`);
    const args = [];
    args.push(boolean ? "1" : "0");
    CountlyReactNative.setHttpPostForced(args);
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.enableCrashReporting' instead of 'enableCrashReporting'.
 *
 * Enable crash reporting to report unhandled crashes to Countly
 * Should be called before Countly init
 */
Countly.enableCrashReporting = async function () {
    L.w("enableCrashReporting, enableCrashReporting is deprecated, use countlyConfig.enableCrashReporting instead");
    CountlyReactNative.enableCrashReporting();
    if (ErrorUtils && !_isCrashReportingEnabled) {
        L.i("enableCrashReporting, Adding Countly JS error handler.");
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
                if (fname.startsWith("http")) {
                    const chunks = fname.split("/");
                    fname = chunks[chunks.length - 1].split("?")[0];
                }
                errorTitle = `${error.name} (${jsStackTrace[0].methodName}@${fname})`;
                const regExp = "(.*)(@?)http(s?).*/(.*)\\?(.*):(.*):(.*)";
                stackArr = error.stack.split("\n").map((row) => {
                    row = row.trim();
                    if (!row.includes("http")) {
                        return row;
                    }

                    const matches = row.match(regExp);
                    return matches && matches.length == 8 ? `${matches[1]}${matches[2]}${matches[4]}(${matches[6]}:${matches[7]})` : row;
                });
                stackArr = stackArr.join("\n");
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
 * @param {string} crashLog crash log
 * @return {string | void} error message or void
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
 * @param {string} exception exception
 * @param {boolean} nonfatal nonfatal
 * @param {object} segments segments
 * @return {string | void} error message or void
 */
Countly.logException = function (exception, nonfatal, segments) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'logException'";
        L.e(`logException, ${message}`);
        return message;
    }
    L.d(`logException, Logging exception: [${exception}], with nonfatal: [${nonfatal}], with segments: [${JSON.stringify(segments)}]`);
    const exceptionArray = exception.split("\n");
    let exceptionString = "";
    for (let i = 0, il = exceptionArray.length; i < il; i++) {
        exceptionString += `${exceptionArray[i]}\n`;
    }
    const args = [];
    args.push(exceptionString || "");
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
 * @param {object} segments segments
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
 * @return {string | void} error message or void
 */
Countly.startSession = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'startSession'";
        L.e(`startSession, ${message}`);
        return message;
    }
    L.d("startSession, Starting session");
    CountlyReactNative.startSession();
};

/**
 *
 * End session tracking
 *
 * @return {string | void} error message or void
 */
Countly.endSession = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'endSession'";
        L.e(`endSession, ${message}`);
        return message;
    }
    L.d("endSession, Ending session");
    CountlyReactNative.endSession();
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.enableParameterTamperingProtection' instead of 'enableParameterTamperingProtection'.
 *
 * Set the optional salt to be used for calculating the checksum of requested data which will be sent with each request, using the &checksum field
 * Should be called before Countly init
 *
 * @param {string} salt salt
 * @return {string | void} error message or void
 */
Countly.enableParameterTamperingProtection = function (salt) {
    const message = Validate.String(salt, "salt", "enableParameterTamperingProtection");
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
 * @return {string | void} error message or void
 */
Countly.pinnedCertificates = function (certificateName) {
    const message = Validate.String(certificateName, "certificateName", "pinnedCertificates");
    if (message) {
        return message;
    }
    L.d(`pinnedCertificates, Setting pinned certificates: [${certificateName}]`);
    CountlyReactNative.pinnedCertificates([certificateName]);
};

/**
 * Start a Timed Event
 * @deprecated in 24.4.0 : use 'Countly.events.startEvent' instead of this.
 *
 * @param {string} eventName name of event
 * @return {string | void} error message or void
 */
Countly.startEvent = function (eventName) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'startEvent'";
        L.e(`startEventLegacy, ${msg}`);
        return msg;
    }
    L.w("startEventLegacy, This method is deprecated, use 'Countly.events.startEvent' instead");
    Countly.events.startEvent(eventName);
};

/**
 * Cancel a Timed Event
 * @deprecated in 24.4.0 : use 'Countly.events.cancelEvent' instead of this.
 *
 * @param {string} eventName name of event
 * @return {string | void} error message or void
 */
Countly.cancelEvent = function (eventName) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'cancelEvent'";
        L.e(`cancelEventLegacy, ${msg}`);
        return msg;
    }
    L.w("cancelEventLegacy, This method is deprecated, use 'Countly.events.cancelEvent' instead");
    Countly.events.cancelEvent(eventName);
};

/**
 * End a Timed Event
 * @deprecated in 24.4.0 : use 'Countly.events.endEvent' instead of this.
 *
 * @param {string | CountlyEventOptions} options event options. 
 * CountlyEventOptions {
 *   eventName: string;
 *   eventCount?: number;
 *   eventSum?: number | string;
 *   segments?: Segmentation;
 * }
 * @return {string | void} error message or void
 */
Countly.endEvent = function (options) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'endEvent'";
        L.e(`endEventLegacy, ${message}`);
        return message;
    }
    L.w("endEventLegacy, This method is deprecated, use 'Countly.events.endEvent' instead");
    if (!options) {
        const message = "no event object or event name provided!";
        L.w(`endEventLegacy, ${message}`);
        return message;
    }
    if (typeof options === "string") {
        options = { eventName: options };
    }
    // previous implementation was not clear about the data types of eventCount and eventSum
    // here parse them to make sure they are in correct format for the new method
    // parser will return a false value (NaN) in case of invalid data (like undefined, null, empty string, etc.)
    options.eventCount = parseInt(options.eventCount, 10) || 1;
    options.eventSum = parseFloat(options.eventSum) || 0;
    Countly.events.endEvent(options.eventName, options.segments, options.eventCount, options.eventSum);
};

/**
 *
 * Used to send user data
 *
 * @param {object} userData user data
 * @return {string | void} error message or void
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
        message = "User profile data should not be null or undefined";
        L.e(`setUserData, ${message}`);
        return message;
    }
    if (typeof userData !== "object") {
        message = `unsupported data type of user data '${typeof userData}'`;
        L.w(`setUserData, ${message}`);
        return message;
    }
    const args = [];
    for (const key in userData) {
        if (typeof userData[key] !== "string" && key.toString() != "byear") {
            L.w("setUserData, " + `skipping value for key '${key.toString()}', due to unsupported data type '${typeof userData[key]}', its data type should be 'string'`);
        }
    }

    if (userData.org && !userData.organization) {
        userData.organization = userData.org;
        delete userData.org;
    }

    if (userData.byear) {
        Validate.ParseInt(userData.byear, "key byear", "setUserData");
        userData.byear = userData.byear.toString();
    }
    args.push(userData);

    await CountlyReactNative.setUserData(args);
};

/**
 *
 * Set custom key and value pair for the current user.
 *
 * @param {string} keyName user property key
 * @param {object} keyValue user property value
 * @return {string | void} error message or void
 */
Countly.userData.setProperty = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'setProperty'";
        L.e(`setProperty, ${msg}`);
        return msg;
    }
    L.d(`setProperty, Setting user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "setProperty");
    if (message) {
        return message;
    }

    message = Validate.ValidUserData(keyValue, "value", "setProperty");
    if (message) {
        return message;
    }
    keyName = keyName.toString();
    keyValue = keyValue.toString();
    if (keyName && (keyValue || keyValue == "")) {
        await CountlyReactNative.userData_setProperty([keyName, keyValue]);
    }
};

/**
 *
 * Increment custom user data by 1
 *
 * @param {string} keyName user property key
 * @return {string | void} error message or void
 */
Countly.userData.increment = async function (keyName) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'increment'";
        L.e(`increment, ${msg}`);
        return msg;
    }
    L.d(`increment, Incrementing user property: [${keyName}]`);
    const message = Validate.String(keyName, "key", "increment");
    if (message) {
        return message;
    }
    keyName = keyName.toString();
    if (keyName) {
        await CountlyReactNative.userData_increment([keyName]);
    }
};

/**
 *
 * Increment custom user data by a specified value
 *
 * @param {string} keyName user property key
 * @param {string} keyValue value to increment user property by
 * @return {string | void} error message or void
 */
Countly.userData.incrementBy = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'incrementBy'";
        L.e(`incrementBy, ${msg}`);
        return msg;
    }
    L.d(`incrementBy, Incrementing user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "incrementBy");
    if (message) {
        return message;
    }
    message = Validate.UserDataValue(keyValue, "value", "incrementBy");
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue, 10).toString();
    await CountlyReactNative.userData_incrementBy([keyName, intValue]);
};

/**
 *
 * Multiply custom user data by a specified value
 *
 * @param {string} keyName user property key
 * @param {string} keyValue value to multiply user property by
 * @return {string | void} error message or void
 */
Countly.userData.multiply = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'multiply'";
        L.e(`multiply, ${msg}`);
        return msg;
    }
    L.d(`multiply, Multiplying user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "multiply");
    if (message) {
        return message;
    }
    message = Validate.UserDataValue(keyValue, "value", "multiply");
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue, 10).toString();
    await CountlyReactNative.userData_multiply([keyName, intValue]);
};

/**
 *
 * Save the max value between current and provided value.
 *
 * @param {string} keyName user property key
 * @param {string} keyValue user property value
 * @return {string | void} error message or void
 */
Countly.userData.saveMax = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'saveMax'";
        L.e(`saveMax, ${msg}`);
        return msg;
    }
    L.d(`saveMax, Saving max user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "saveMax");
    if (message) {
        return message;
    }
    message = Validate.UserDataValue(keyValue, "value", "saveMax");
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue, 10).toString();
    await CountlyReactNative.userData_saveMax([keyName, intValue]);
};

/**
 *
 * Save the min value between current and provided value.
 *
 * @param {string} keyName user property key
 * @param {string} keyValue user property value
 * @return {string | void} error message or void
 */
Countly.userData.saveMin = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'saveMin'";
        L.e(`saveMin, ${msg}`);
        return msg;
    }
    L.d(`saveMin, Saving min user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "saveMin");
    if (message) {
        return message;
    }
    message = Validate.UserDataValue(keyValue, "value", "saveMin");
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue, 10).toString();
    await CountlyReactNative.userData_saveMin([keyName, intValue]);
};

/**
 *
 * Set the property value if it does not exist.
 *
 * @param {string} keyName user property key
 * @param {string} keyValue user property value
 * @return {string | void} error message or void
 */
Countly.userData.setOnce = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'setOnce'";
        L.e(`setOnce, ${msg}`);
        return msg;
    }
    L.d(`setOnce, Setting once user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "setOnce");
    if (message) {
        return message;
    }
    message = Validate.ValidUserData(keyValue, "value", "setOnce");
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == "") {
        await CountlyReactNative.userData_setOnce([keyName, keyValue]);
    }
};

/**
 *
 * Add value to custom property (array) if value does not exist within.
 *
 * @param {string} keyName user property key
 * @param {string} keyValue user property value
 * @return {string | void} error message or void
 */
Countly.userData.pushUniqueValue = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'pushUniqueValue'";
        L.e(`pushUniqueValue, ${msg}`);
        return msg;
    }
    L.d(`pushUniqueValue, Pushing unique value to user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "pushUniqueValue");
    if (message) {
        return message;
    }
    message = Validate.ValidUserData(keyValue, "value", "pushUniqueValue");
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == "") {
        await CountlyReactNative.userData_pushUniqueValue([keyName, keyValue]);
    }
};

/**
 *
 * Add value to custom property (array).
 *
 * @param {string} keyName user property key
 * @param {string} keyValue user property value
 * @return {string | void} error message or void
 */
Countly.userData.pushValue = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'pushValue'";
        L.e(`pushValue, ${msg}`);
        return msg;
    }
    L.d(`pushValue, Pushing value to user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "pushValue");
    if (message) {
        return message;
    }
    message = Validate.ValidUserData(keyValue, "value", "pushValue");
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == "") {
        await CountlyReactNative.userData_pushValue([keyName, keyValue]);
    }
};

/**
 *
 * Remove value to custom property (array).
 *
 * @param {string} keyName user property key
 * @param {string} keyValue user property value
 * @return {string | void} error message or void
 */
Countly.userData.pullValue = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'pullValue'";
        L.e(`pullValue, ${msg}`);
        return msg;
    }
    L.d(`pullValue, Pulling value from user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "pullValue");
    if (message) {
        return message;
    }
    message = Validate.ValidUserData(keyValue, "value", "pullValue");
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == "") {
        await CountlyReactNative.userData_pullValue([keyName, keyValue]);
    }
};

/**
 *
 * Custom key and value pairs for the current user.
 * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
 *
 * @param {object} customAndPredefined custom key value pairs
 * @return {string | void} error message or void
 */
Countly.userDataBulk.setUserProperties = async function (customAndPredefined) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'setUserProperties'";
        L.e(`setUserProperties, ${msg}`);
        return msg;
    }
    L.d(`setUserProperties, Setting user properties: [${JSON.stringify(customAndPredefined)}]`);
    L.w("setUserProperties, Countly.userDataBulk.save() must be called after setting user properties!");
    let message = null;
    if (!customAndPredefined) {
        message = "User profile data should not be null or undefined";
        L.e(`setUserProperties, ${message}`);
        return message;
    }
    if (typeof customAndPredefined !== "object") {
        message = `unsupported data type of user data '${typeof customAndPredefined}'`;
        L.w(`setUserProperties, ${message}`);
        return message;
    }
    for (const key in customAndPredefined) {
        if (typeof customAndPredefined[key] !== "string" && key.toString() != "byear") {
            L.w("setUserProperties, " + `skipping value for key '${key.toString()}', due to unsupported data type '${typeof customAndPredefined[key]}', its data type should be 'string'`);
        }
    }

    if (customAndPredefined.org && !customAndPredefined.organization) {
        customAndPredefined.organization = customAndPredefined.org;
        delete customAndPredefined.org;
    }

    if (customAndPredefined.byear) {
        Validate.ParseInt(customAndPredefined.byear, "key byear", "setUserProperties");
        customAndPredefined.byear = customAndPredefined.byear.toString();
    }

    await CountlyReactNative.userDataBulk_setUserProperties(customAndPredefined);
};

/**
 *
 * Save user data and send to server.
 *
 * @return {string | void} error message or void
 */
Countly.userDataBulk.save = async function () {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'save'";
        L.e(`save, ${msg}`);
        return msg;
    }
    L.d("save, Saving user data");
    await CountlyReactNative.userDataBulk_save([]);
};

/**
 *
 * Set custom key and value pair for the current user.
 * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
 *
 * @param {string} keyName custom user data key
 * @param {string} keyValue custom user data value
 * @return {string | void} error message or void
 */
Countly.userDataBulk.setProperty = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'setProperty'";
        L.e(`setProperty, ${msg}`);
        return msg;
    }
    L.d(`setProperty, Setting user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "setProperty");
    if (message) {
        return message;
    }

    message = Validate.ValidUserData(keyValue, "value", "setProperty");
    if (message) {
        return message;
    }
    keyName = keyName.toString();
    keyValue = keyValue.toString();
    if (keyName && (keyValue || keyValue == "")) {
        await CountlyReactNative.userDataBulk_setProperty([keyName, keyValue]);
    }
};

/**
 *
 * Increment custom user data by 1
 * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
 *
 * @param {string} keyName user property key
 * @return {string | void} error message or void
 */
Countly.userDataBulk.increment = async function (keyName) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'increment'";
        L.e(`increment, ${msg}`);
        return msg;
    }
    L.d(`increment, Incrementing user property: [${keyName}]`);
    const message = Validate.String(keyName, "key", "setProperty");
    if (message) {
        return message;
    }
    keyName = keyName.toString();
    if (keyName) {
        await CountlyReactNative.userDataBulk_increment([keyName]);
    }
};

/**
 *
 * Increment custom user data by a specified value
 * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
 *
 * @param {string} keyName user property key
 * @param {string} keyValue value to increment user property by
 * @return {string | void} error message or void
 */
Countly.userDataBulk.incrementBy = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'incrementBy'";
        L.e(`incrementBy, ${msg}`);
        return msg;
    }
    L.d(`incrementBy, Incrementing user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "incrementBy");
    if (message) {
        return message;
    }
    message = Validate.UserDataValue(keyValue, "value", "incrementBy");
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue, 10).toString();
    await CountlyReactNative.userDataBulk_incrementBy([keyName, intValue]);
};

/**
 *
 * Multiply custom user data by a specified value
 * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
 *
 * @param {string} keyName user property key
 * @param {string} keyValue value to multiply user property by
 * @return {string | void} error message or void
 */
Countly.userDataBulk.multiply = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'multiply'";
        L.e(`multiply, ${msg}`);
        return msg;
    }
    L.d(`multiply, Multiplying user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "multiply");
    if (message) {
        return message;
    }
    message = Validate.UserDataValue(keyValue, "value", "multiply");
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue, 10).toString();
    await CountlyReactNative.userDataBulk_multiply([keyName, intValue]);
};

/**
 *
 * Save the max value between current and provided value.
 * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
 *
 * @param {string} keyName user property key
 * @param {string} keyValue user property value
 * @return {string | void} error message or void
 */
Countly.userDataBulk.saveMax = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'saveMax'";
        L.e(`saveMax, ${msg}`);
        return msg;
    }
    L.d(`saveMax, Saving max user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "saveMax");
    if (message) {
        return message;
    }
    message = Validate.UserDataValue(keyValue, "value", "saveMax");
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue, 10).toString();
    await CountlyReactNative.userDataBulk_saveMax([keyName, intValue]);
};

/**
 *
 * Save the min value between current and provided value.
 * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
 *
 * @param {string} keyName user property key
 * @param {string} keyValue user property value
 * @return {string | void} error message or void
 */
Countly.userDataBulk.saveMin = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'saveMin'";
        L.e(`saveMin, ${msg}`);
        return msg;
    }
    L.d(`saveMin, Saving min user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "saveMin");
    if (message) {
        return message;
    }
    message = Validate.UserDataValue(keyValue, "value", "saveMin");
    if (message) {
        return message;
    }
    const intValue = parseInt(keyValue, 10).toString();
    await CountlyReactNative.userDataBulk_saveMin([keyName, intValue]);
};

/**
 *
 * Set the property value if it does not exist.
 * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
 *
 * @param {string} keyName user property key
 * @param {string} keyValue user property value
 * @return {string | void} error message or void
 */
Countly.userDataBulk.setOnce = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'setOnce'";
        L.e(`setOnce, ${msg}`);
        return msg;
    }
    L.d(`setOnce, Setting once user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "setOnce");
    if (message) {
        return message;
    }
    message = Validate.ValidUserData(keyValue, "value", "setOnce");
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == "") {
        await CountlyReactNative.userDataBulk_setOnce([keyName, keyValue]);
    }
};

/**
 *
 * Add value to custom property (array) if value does not exist within.
 * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
 *
 * @param {string} keyName user property key
 * @param {string} keyValue user property value
 * @return {string | void} error message or void
 */
Countly.userDataBulk.pushUniqueValue = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'pushUniqueValue'";
        L.e(`pushUniqueValue, ${msg}`);
        return msg;
    }
    L.d(`pushUniqueValue, Pushing unique value to user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "pushUniqueValue");
    if (message) {
        return message;
    }
    message = Validate.ValidUserData(keyValue, "value", "pushUniqueValue");
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == "") {
        await CountlyReactNative.userDataBulk_pushUniqueValue([keyName, keyValue]);
    }
};

/**
 *
 * Add value to custom property (array).
 * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
 *
 * @param {string} keyName user property key
 * @param {string} keyValue user property value
 * @return {string | void} error message or void
 */
Countly.userDataBulk.pushValue = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'pushValue'";
        L.e(`pushValue, ${msg}`);
        return msg;
    }
    L.d(`pushValue, Pushing value to user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "pushValue");
    if (message) {
        return message;
    }
    message = Validate.ValidUserData(keyValue, "value", "pushValue");
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == "") {
        await CountlyReactNative.userDataBulk_pushValue([keyName, keyValue]);
    }
};

/**
 *
 * Remove value to custom property (array).
 * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
 *
 * @param {string} keyName user property key
 * @param {string} keyValue user property value
 * @return {string | void} error message or void
 */
Countly.userDataBulk.pullValue = async function (keyName, keyValue) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'pullValue'";
        L.e(`pullValue, ${msg}`);
        return msg;
    }
    L.d(`pullValue, Pulling value from user property: [${keyName}, ${keyValue}]`);
    let message = Validate.String(keyName, "key", "pullValue");
    if (message) {
        return message;
    }
    message = Validate.ValidUserData(keyValue, "value", "pullValue");
    if (message) {
        return message;
    }
    keyValue = keyValue.toString();
    if (keyValue || keyValue == "") {
        await CountlyReactNative.userDataBulk_pullValue([keyName, keyValue]);
    }
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.setRequiresConsent' instead of 'setRequiresConsent'.
 *
 * Set that consent should be required for features to work.
 * Should be called before Countly init
 *
 * @param {boolean} flag if true, consent is required for features to work.
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
 * @param {string[] | string} args list of consents
 * @return {string | void} error message or void
 */
Countly.giveConsent = function (args) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'giveConsent'";
        L.e(`giveConsent ${message}`);
        return message;
    }
    L.d(`giveConsent, Giving consent for features: [${args}]`);
    let features = [];
    if (typeof args === "string") {
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
 * @param {string[] | string} args list of consents
 */
Countly.giveConsentInit = async function (args) {
    L.w("giveConsentInit, giveConsentInit is deprecated, use countlyConfig.giveConsent instead.");
    let features = [];
    if (typeof args === "string") {
        features.push(args);
    } else if (Array.isArray(args)) {
        features = args;
    } else {
        L.w("giveConsentInit " + `unsupported data type '${typeof args}'`);
    }
    await CountlyReactNative.giveConsentInit(features);
};

/**
 *
 * Remove consent for some features
 * Should be called after Countly init
 *
 * @param {string[] | string} args list of consents
 * @return {string | void} error message or void
 */
Countly.removeConsent = function (args) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'removeConsent'";
        L.e(`removeConsent${message}`);
        return message;
    }
    L.d(`removeConsent, Removing consent for features: [${args}]`);
    let features = [];
    if (typeof args === "string") {
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
 * @return {string | void} error message or void
 */
Countly.giveAllConsent = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'giveAllConsent'";
        L.e(`giveAllConsent, ${message}`);
        return message;
    }
    L.d("giveAllConsent, Giving consent for all features");
    CountlyReactNative.giveAllConsent();
};

/**
 *
 * Remove consent for all features
 * Should be called after Countly init
 *
 * @return {string | void} error message or void
 */
Countly.removeAllConsent = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'removeAllConsent'";
        L.e(`removeAllConsent, ${message}`);
        return message;
    }
    L.d("removeAllConsent, Removing consent for all features");
    CountlyReactNative.removeAllConsent();
};

/**
 *
 * Replaces all stored Remote Config values with new values from server.
 *
 * @param {function} callback function to be called after fetching values.
 * @return {string | void} error message or void
 */
Countly.remoteConfigUpdate = function (callback) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'remoteConfigUpdate'";
        L.e(`remoteConfigUpdate, ${message}`);
        callback(message);
        return message;
    }
    L.d("remoteConfigUpdate, Updating remote config");
    CountlyReactNative.remoteConfigUpdate([], (stringItem) => {
        callback(stringItem);
    });
};

/**
 *
 * Replace specific Remote Config key value pairs with new values from server.
 *
 * @param {string[]} keyNames array of keys to replace.
 * @param {function} callback function to be called after fetching values.
 * @return {string | void} error message or void
 */
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

/**
 *
 * Replace all except specific Remote Config key value pairs with new values from server.
 *
 * @param {string[]} keyNames array of keys to skip.
 * @param {function} callback function to be called after fetching values.
 * @return {string | void} error message or void
 */
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

/**
 *
 * Replace Remote Config key value for a specific key with new values from server.
 *
 * @param {string} keyNames key to fetch.
 * @param {function} callback function to be called after fetching new values.
 * @return {string | void} error message or void
 */
Countly.getRemoteConfigValueForKey = function (keyName, callback) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'getRemoteConfigValueForKey'";
        L.e(`getRemoteConfigValueForKey ${message}`);
        callback(message);
        return message;
    }
    CountlyReactNative.getRemoteConfigValueForKey([keyName.toString() || ""], (value) => {
        if (Platform.OS == "android") {
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

/**
 *
 * Replace Remote Config key value for a specific key with new values from server.
 *
 * @param {string} keyName key to fetch.
 * @return {string | promise} error message or promise
 */
Countly.getRemoteConfigValueForKeyP = function (keyName) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'getRemoteConfigValueForKeyP'";
        L.e(`getRemoteConfigValueForKeyP, ${message}`);
        return message;
    }
    L.d(`getRemoteConfigValueForKeyP, Getting remote config value for key: [${keyName}]`);
    if (Platform.OS != "android") {
        return "To be implemented";
    }
    const promise = CountlyReactNative.getRemoteConfigValueForKeyP(keyName);
    return promise
        .then((value) => {
            if (Platform.OS == "android") {
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
            L.e("getRemoteConfigValueForKeyP, Catch Error:", e);
        });
};

/**
 *
 * Clear all Remote Config values downloaded from the server.
 *
 * @return {string | promise} error message or promise
 */
Countly.remoteConfigClearValues = async function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'remoteConfigClearValues'";
        L.e(`remoteConfigClearValues, ${message}`);
        return message;
    }
    L.d("remoteConfigClearValues, Clearing remote config values");
    const result = await CountlyReactNative.remoteConfigClearValues();
    return result;
};

/**
 * @deprecated in 23.02.0 : use 'countlyConfig.setStarRatingDialogTexts' instead of 'setStarRatingDialogTexts'.
 *
 * Set's the text's for the different fields in the star rating dialog. Set value null if for some field you want to keep the old value
 *
 * @param {string} starRatingTextTitle - dialog's title text (Only for Android)
 * @param {string} starRatingTextMessage - dialog's message text
 * @param {string} starRatingTextDismiss - dialog's dismiss buttons text (Only for Android)
 * @return {string | void} error message or void
 */
Countly.setStarRatingDialogTexts = function (starRatingTextTitle, starRatingTextMessage, starRatingTextDismiss) {
    L.w(`setStarRatingDialogTexts, setStarRatingDialogTexts is deprecated, use countlyConfig.setStarRatingDialogTexts instead. starRatingTextTitle : [${starRatingTextTitle}], starRatingTextMessage : [${starRatingTextMessage}], starRatingTextDismiss : [${starRatingTextDismiss}]`);
    const args = [];
    args.push(starRatingTextTitle);
    args.push(starRatingTextMessage);
    args.push(starRatingTextDismiss);
    CountlyReactNative.setStarRatingDialogTexts(args);
};

/**
 *
 * For getting brief feedback from your users to be displayed on the
  Countly dashboard.
 *
 * @param {function} callback function to be called after it completes.
 * @return {string | void} error message or void
 */
Countly.showStarRating = function (callback) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'showStarRating'";
        L.e(`showStarRating, ${message}`);
        return message;
    }
    L.d("showStarRating, Showing star rating");
    if (!callback) {
        callback = function () {};
    }
    CountlyReactNative.showStarRating([], callback);
};

/**
 * Present a Rating Popup using rating widget Id
 *
 * @param {string} widgetId - id of rating widget to present
 * @param {string} closeButtonText - text for cancel/close button
 * @param {callback listener} [ratingWidgetCallback] This parameter is optional.
 * @return {string | void} error message or void
 */
Countly.presentRatingWidgetWithID = function (widgetId, closeButtonText, ratingWidgetCallback) {
    var message = "";
    if (!_state.isInitialized) {
        message = "'init' must be called before 'presentRatingWidgetWithID'";
        L.e(`presentRatingWidgetWithID, ${message}`);
        return message;
    }
    if (!widgetId) {
        message = "Rating Widget id should not be null or empty";
        L.e(`presentRatingWidgetWithID, ${message}`);
        return message;
    }
    if (typeof closeButtonText !== "string") {
        closeButtonText = "";
        L.w("presentRatingWidgetWithID, " + `unsupported data type of closeButtonText : '${typeof args}'`);
    }
    if (ratingWidgetCallback) {
        // eventEmitter.addListener('ratingWidgetCallback', ratingWidgetCallback);
        _ratingWidgetListener = eventEmitter.addListener(ratingWidgetCallbackName, (error) => {
            ratingWidgetCallback(error);
            _ratingWidgetListener.remove();
        });
    }
    CountlyReactNative.presentRatingWidgetWithID([widgetId.toString() || "", closeButtonText.toString() || "Done"]);
};

/**
 * Get a list of available feedback widgets as array of object to handle multiple widgets of same type.
 * @deprecated in 23.8.0 : use 'Countly.feedback.getAvailableFeedbackWidgets' instead of 'getFeedbackWidgets'.
 * @param {callback listener} [onFinished] - returns (retrievedWidgets, error). This parameter is optional.
 * @return {string | []} error message or array of feedback widgets
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
 * @param {object} feedbackWidget - feeback Widget with id, type and name
 * @param {string} closeButtonText - text for cancel/close button
 * @param {callback listener} [widgetShownCallback] - Callback to be executed when feedback widget is displayed. This parameter is optional.
 * @param {callback listener} [widgetClosedCallback] - Callback to be executed when feedback widget is closed. This parameter is optional.
 *
 * @return {string | void} error message or void
 */
Countly.presentFeedbackWidgetObject = async function (feedbackWidget, closeButtonText, widgetShownCallback, widgetClosedCallback) {
    if (!_state.isInitialized) {
        const msg = "'init' must be called before 'presentFeedbackWidgetObject'";
        L.e(`presentFeedbackWidgetObject, ${msg}`);
        return msg;
    }
    L.w("presentFeedbackWidgetObject, presentFeedbackWidgetObject is deprecated, use Countly.feedback.presentFeedbackWidget instead.");
    let message = null;
    if (!feedbackWidget) {
        message = "feedbackWidget should not be null or undefined";
        L.e(`presentFeedbackWidgetObject, ${message}`);
        return message;
    }
    if (!feedbackWidget.id) {
        message = "FeedbackWidget id should not be null or empty";
        L.e(`presentFeedbackWidgetObject, ${message}`);
        return message;
    }
    if (!feedbackWidget.type) {
        message = "FeedbackWidget type should not be null or empty";
        L.e(`presentFeedbackWidgetObject, ${message}`);
        return message;
    }
    if (typeof closeButtonText !== "string") {
        closeButtonText = "";
        L.w("presentFeedbackWidgetObject, " + `unsupported data type of closeButtonText : '${typeof args}'`);
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

    feedbackWidget.name = feedbackWidget.name || "";
    closeButtonText = closeButtonText || "";
    CountlyReactNative.presentFeedbackWidget([feedbackWidget.id, feedbackWidget.type, feedbackWidget.name, closeButtonText]);
};

/**
 *
 * Events get grouped together and are sent either every minute or after the unsent event count reaches a threshold. By default it is 10
 * Should be called before Countly init
 * @param {number} size - event count
 */
Countly.setEventSendThreshold = function (size) {
    CountlyReactNative.setEventSendThreshold([size.toString() || ""]);
};

/**
 *
 * Measure and record time taken by any operation.
 *
 * @param {string} traceKey name of trace
 * @return {string | void} error message or void
 */
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

/**
 *
 * Cancel custom trace.
 *
 * @param {string} traceKey name of trace
 * @return {string | void} error message or void
 */
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

/**
 *
 * Cancel all custom traces.
 *
 * @return {string | void} error message or void
 */
Countly.clearAllTraces = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'clearAllTraces'";
        L.e(`clearAllTraces, ${message}`);
        return message;
    }
    L.d("clearAllTraces, Clearing all traces");
    const args = [];
    CountlyReactNative.clearAllTraces(args);
};

/**
 *
 * End a custom trace.
 *
 * @param {string} traceKey name of trace
 * @param {object} customMetric metric with key/value pair
 * @return {string | void} error message or void
 */
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

/**
 *
 * Manually record a custom trace
 *
 * @param {string} networkTraceKey name of trace
 * @param {number} responseCode HTTP status code of the received
  response
 * @param {number} requestPayloadSize Size of the request's
  payload in bytes
 * @param {number} responsePayloadSize Size
  of the received response's payload in bytes
 * @param {number} startTime UNIX timestamp in milliseconds for
  the starting time of the request
 * @param {number} endTime UNIX timestamp in milliseconds for
  the ending time of the request
 * @return {string | void} error message or void
 */
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
 * @deprecated in 23.02.0 : use 'countlyConfig.apm' interface instead of 'enableApm'.
 *
 * Enable APM features, which includes the recording of app start time.
 * Should be called before Countly init
 */
Countly.enableApm = function () {
    L.w("enableApm, enableApm is deprecated, use countlyConfig.apm interface instead.");
    const args = [];
    CountlyReactNative.enableApm(args);
};

/**
 * @deprecated in 23.02.0 : use 'Countly.recordIndirectAttribution' instead of 'Countly'.
 *
 * Enable campaign attribution reporting to Countly.
 * For iOS use "recordAttributionID" instead of "enableAttribution"
 * Should be called before Countly init
 * @param {string} attributionID attribution ID
 * @return {string | void} error message or void
 */
Countly.enableAttribution = async function (attributionID = "") {
    L.w("enableAttribution, enableAttribution is deprecated, use Countly.recordIndirectAttribution instead.");
    if (/ios/.exec(Platform.OS)) {
        if (attributionID == "") {
            const message = "attribution Id for iOS can't be empty string";
            L.e(`enableAttribution ${message}`);
            return message;
        }
        Countly.recordAttributionID(attributionID);
    } else {
        const message = "This method does nothing for android";
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
 * @param {string} attributionID attribution ID
 * @return {string | void} error message or void
 */
Countly.recordAttributionID = function (attributionID) {
    L.w("recordAttributionID, recordAttributionID is deprecated, use Countly.recordIndirectAttribution instead.");
    if (!/ios/.exec(Platform.OS)) {
        return "recordAttributionID : To be implemented";
    }
    const args = [];
    args.push(attributionID);
    CountlyReactNative.recordAttributionID(args);
};

/**
 * Replaces all requests with a different app key with the current app key.
 * In request queue, if there are any request whose app key is different than the current app key,
 * these requests' app key will be replaced with the current app key.
 * @return {string | void} error message or void
 */
Countly.replaceAllAppKeysInQueueWithCurrentAppKey = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'replaceAllAppKeysInQueueWithCurrentAppKey'";
        L.e(`replaceAllAppKeysInQueueWithCurrentAppKey, ${message}`);
        return message;
    }
    L.d("replaceAllAppKeysInQueueWithCurrentAppKey, Replacing all app keys in queue with current app key");
    CountlyReactNative.replaceAllAppKeysInQueueWithCurrentAppKey();
};

/**
 * set direct attribution Id for campaign attribution reporting.
 * @param {string} campaignType type
 * @param {string} campaignData data
 * @return {string | void} error message or void
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
 * @param {string} attributionValues attribution values
 * @return {string | void} error message or void
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
 * @return {string | void} error message or void
 */
Countly.removeDifferentAppKeysFromQueue = function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'removeDifferentAppKeysFromQueue'";
        L.e(`removeDifferentAppKeysFromQueue, ${message}`);
        return message;
    }
    L.d("removeDifferentAppKeysFromQueue, Removing all requests with a different app key in request queue");
    CountlyReactNative.removeDifferentAppKeysFromQueue();
};

/**
 * Call this function when app is loaded, so that the app launch duration can be recorded.
 * Should be called after init.
 * @return {string | void} error message or void
 */
Countly.appLoadingFinished = async function () {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'appLoadingFinished'";
        L.e(`appLoadingFinished, ${message}`);
        return message;
    }
    L.d("appLoadingFinished, App loading finished");
    CountlyReactNative.appLoadingFinished();
};

/**
 * Set the metrics you want to override
 * Should be called before Countly init
 * @param {object} customMetric metric with key/value pair
 * Supported data type for customMetric values is String
 * @return {string | void} error message or void
 */
Countly.setCustomMetrics = async function (customMetric) {
    L.d(`setCustomMetrics, Setting custom metrics: [${JSON.stringify(customMetric)}]`);
    let message = null;
    if (!customMetric) {
        message = "customMetric should not be null or undefined";
        L.e(`setCustomMetrics, ${message}`);
        return message;
    }
    if (typeof customMetric !== "object") {
        message = `unsupported data type of customMetric '${typeof customMetric}'`;
        L.w(`setCustomMetrics, ${message}`);
        return message;
    }
    const args = [];
    for (const key in customMetric) {
        if (typeof customMetric[key] === "string") {
            args.push(key.toString());
            args.push(customMetric[key].toString());
        } else {
            L.w("setCustomMetrics, " + `skipping value for key '${key.toString()}', due to unsupported data type '${typeof customMetric[key]}'`);
        }
    }
    if (args.length != 0) {
        CountlyReactNative.setCustomMetrics(args);
    }
};

/**
 * Opt in user for the content fetching and updates
 * 
 * NOTE: This is an EXPERIMENTAL feature, and it can have breaking changes
 */
Countly.content.enterContentZone = function() {
    L.i("enterContentZone, opting for content fetching.");
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'enterContentZone'";
        L.e(`enterContentZone, ${message}`);
        return;
    }
    CountlyReactNative.enterContentZone();
};

/**
 * Opt out user from the content fetching and updates
 * 
 * NOTE: This is an EXPERIMENTAL feature, and it can have breaking changes
 */
Countly.content.exitContentZone = function() {
    L.i("exitContentZone, opting out from content fetching.");
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'exitContentZone'";
        L.e(`exitContentZone, ${message}`);
        return;
    }
    CountlyReactNative.exitContentZone();
};

export default Countly;
