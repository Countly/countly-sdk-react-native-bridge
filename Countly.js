/**
 * Countly SDK React Native Bridge
 * https://github.com/Countly/countly-sdk-react-native-bridge
 * @Countly
 */

import { Platform, NativeModules, NativeEventEmitter, TurboModuleRegistry } from "react-native";

import CountlyState from "./CountlyState.js";
import Feedback from "./Feedback.js";
import Event from "./Event.js";
import Sessions from "./Sessions.js";
import DeviceId from "./DeviceId.js";
import RemoteConfig from "./RemoteConfig.js";
import Views from "./Views.js";
import * as L from "./Logger.js";
import * as Utils from "./Utils.js";
import * as Validate from "./Validators.js";

const CountlyNativeModule =
  TurboModuleRegistry.get('CountlyReactNative') ??
  NativeModules.CountlyReactNative;

const eventEmitter = new NativeEventEmitter(CountlyNativeModule);

const Countly = {};
Countly.serverUrl = "";
Countly.appKey = "";
let _state = CountlyState;
CountlyState.CountlyReactNative = CountlyNativeModule;
CountlyState.eventEmitter = eventEmitter;

Countly.feedback = new Feedback(CountlyState);
Countly.events = new Event(CountlyState);
Countly.sessions = new Sessions(CountlyState);
Countly.deviceId = new DeviceId(CountlyState);
Countly.remoteConfig = new RemoteConfig(CountlyState);
Countly.views = new Views(CountlyState);

let _isCrashReportingEnabled = false;

Countly.userData = {}; // userData interface
Countly.userDataBulk = {}; // userDataBulk interface

Countly.content = {}; // content interface

Countly.test = {}; // test-only interface

const BUILDING_WITH_PUSH_DISABLED = true;
const _pushDisabledMsg = 'Push Notifications are disabled in this flavor. Please use the original Countly React Native SDK if you need to use Push Notifications.';

/*
 * Listener for rating widget callback, when callback recieve we will remove the callback using listener.
 */
let _ratingWidgetListener;
const ratingWidgetCallbackName = "ratingWidgetCallback";
const pushNotificationCallbackName = "pushNotificationCallback";

function removeSubscription(stateKey) {
    const subscription = _state[stateKey];
    if (subscription && typeof subscription.remove === "function") {
        subscription.remove();
    }
    _state[stateKey] = null;
}

function resetBridgeStateForTesting() {
    removeSubscription("globalContentCallbackSubscription");
    removeSubscription("widgetShownCallback");
    removeSubscription("widgetClosedCallback");

    if (_ratingWidgetListener && typeof _ratingWidgetListener.remove === "function") {
        _ratingWidgetListener.remove();
    }
    _ratingWidgetListener = null;

    _state.isInitialized = false;
}

function installJsCrashReportingHandler() {
    if (_isCrashReportingEnabled || typeof ErrorUtils === "undefined") {
        return;
    }

    L.i("initWithConfig, Adding Countly JS error handler.");
    const previousHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
        const jsStackTrace = Utils.getStackTrace(error);
        let errorTitle;
        let stackArr;
        if (jsStackTrace == null || jsStackTrace.length === 0) {
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

        CountlyNativeModule.logJSException(errorTitle, error.message.trim(), stackArr);

        if (previousHandler) {
            previousHandler(error, isFatal);
        }
    });

    _isCrashReportingEnabled = true;
}

function isSupportedUserPropertyValue(value) {
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || Array.isArray(value);
}

Countly.messagingMode = { DEVELOPMENT: "1", PRODUCTION: "0", ADHOC: "2" };
if (/android/.exec(Platform.OS)) {
    Countly.messagingMode.DEVELOPMENT = "2";
}
Countly.webViewDisplayOption = { IMMERSIVE: "IMMERSIVE", SAFE_AREA: "SAFE_AREA" };
Countly.TemporaryDeviceIDString = "TemporaryDeviceID";

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
        countlyConfig.deviceID = null;
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
    removeSubscription("globalContentCallbackSubscription");
    if (countlyConfig.content.contentCallback) {
        _state.globalContentCallbackSubscription = eventEmitter.addListener("globalContentCallback", (data) => {
            L.d(`init configuration, Global content callback called with data: ${data}`);
            try {
                data = JSON.parse(data);
                countlyConfig.content.contentCallback(data.status, data.data);
            } catch (error) {
                L.e(`init configuration, Error parsing global content callback data: ${error}`);                
            }
        });
    }
    const args = [];
    const argsMap = Utils.configToJson(countlyConfig);
    const argsString = JSON.stringify(argsMap);
    args.push(argsString);
    await CountlyNativeModule.init(args);
    if (countlyConfig._crashReporting) {
        installJsCrashReportingHandler();
    }
    _state.isInitialized = true;
};

/**
 *
 * Checks if the sdk is initialized;
 *
 * @return {boolean} if true, countly sdk has been initialized
 */
Countly.isInitialized = async function () {
    _state.isInitialized = await CountlyNativeModule.isInitialized();
    L.d(`isInitialized, isInitialized: [${_state.isInitialized}]`);
    return _state.isInitialized;
};

/**
 * @deprecated in 26.1.0 : use 'Countly.views.startAutoStoppedView' instead.
 *
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
    L.w("recordView, deprecated legacy alias. Use 'Countly.views.startAutoStoppedView(viewName, segmentation)' instead.");
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
    CountlyNativeModule.recordView(args);
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
    CountlyNativeModule.disablePushNotifications();
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
    CountlyNativeModule.sendPushToken(args);
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
    CountlyNativeModule.askForNotificationPermission([customSoundPath]);
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
    CountlyNativeModule.registerForNotification([]);
    return event;
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
    CountlyNativeModule.setLoggingEnabled([enabled]);
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
    CountlyNativeModule.setLocation(args);
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
    CountlyNativeModule.disableLocation();
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
    CountlyNativeModule.setHttpPostForced(args);
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
    CountlyNativeModule.addCrashLog([crashLog]);
};

/**
 * Record a metrics request to be sent to the server
 *
 * @param {object} [metricsOverride] - optional metrics override map
 */
Countly.recordMetrics = function (metricsOverride = {}) {
    if (!_state.isInitialized) {
        L.e(`recordMetrics, 'init' must be called before 'recordMetrics'`);
    }
    L.d(`recordMetrics, Sending metrics request with override: [${JSON.stringify(metricsOverride)}]`);
    if (metricsOverride && typeof metricsOverride !== "object") {
        L.w(`recordMetrics, ignoring non-object metricsOverride of type '${typeof metricsOverride}'`);
        metricsOverride = {};
    }

    const args = [];
    for (const key in metricsOverride) {
        args.push(key.toString());
        args.push(metricsOverride[key].toString());
    }
    CountlyNativeModule.recordMetrics(args);
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
    CountlyNativeModule.logException(args);
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
    CountlyNativeModule.setCustomCrashSegments(args);
};

/**
 * @deprecated in 26.1.0 : use 'Countly.sessions.beginSession' instead of 'startSession'.
 *
 * Start session tracking.
 *
 * @return {string | void} error message or void
 */
Countly.startSession = function () {
    L.w("startSession, startSession is deprecated, use Countly.sessions.beginSession instead.");
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'startSession'";
        L.e(`startSession, ${message}`);
        return message;
    }
    return Countly.sessions.beginSession();
};

/**
 * @deprecated in 26.1.0 : use 'Countly.sessions.updateSession' instead of 'updateSession'.
 *
 * Update session tracking.
 *
 * @return {string | void} error message or void
 */
Countly.updateSession = function () {
    L.w("updateSession, updateSession is deprecated, use Countly.sessions.updateSession instead.");
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'updateSession'";
        L.e(`updateSession, ${message}`);
        return message;
    }
    return Countly.sessions.updateSession();
};

/**
 * @deprecated in 26.1.0 : use 'Countly.sessions.endSession' instead of 'endSession'.
 *
 * End session tracking.
 *
 * @return {string | void} error message or void
 */
Countly.endSession = function () {
    L.w("endSession, endSession is deprecated, use Countly.sessions.endSession instead.");
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'endSession'";
        L.e(`endSession, ${message}`);
        return message;
    }
    return Countly.sessions.endSession();
};

/**
 * Adds or overrides custom network request headers at runtime.
 *
 * @param {Record<string, string>} customHeaderValues header key/value pairs
 * @return {string | void} error message or void
 */
Countly.addCustomNetworkRequestHeaders = function (customHeaderValues) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'addCustomNetworkRequestHeaders'";
        L.e(`addCustomNetworkRequestHeaders, ${message}`);
        return message;
    }
    if (!customHeaderValues || typeof customHeaderValues !== "object") {
        const message = "customHeaderValues should be a key/value object";
        L.e(`addCustomNetworkRequestHeaders, ${message}`);
        return message;
    }

    const args = [];
    for (const key in customHeaderValues) {
        const value = customHeaderValues[key];
        if (value === null || value === undefined) {
            L.w(`addCustomNetworkRequestHeaders, skipping '${key}' due to null or undefined value`);
            continue;
        }

        args.push(key.toString());
        args.push(value.toString());
    }

    if (args.length === 0) {
        L.w("addCustomNetworkRequestHeaders, no valid header values were provided");
        return;
    }

    L.d(`addCustomNetworkRequestHeaders, Adding custom headers: [${JSON.stringify(customHeaderValues)}]`);
    CountlyNativeModule.addCustomNetworkRequestHeaders(args);
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
    CountlyNativeModule.pinnedCertificates([certificateName]);
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
        if (key.toString() !== "byear" && !isSupportedUserPropertyValue(userData[key])) {
            L.w("setUserData, " + `skipping value for key '${key.toString()}', due to unsupported data type '${typeof userData[key]}', its data type should be 'string', 'number', 'boolean', or an array of those types`);
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

    await CountlyNativeModule.setUserData(args);
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
    if (keyName && (keyValue || keyValue == "")) {
        await CountlyNativeModule.userData_setProperty([keyName, keyValue]);
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
        await CountlyNativeModule.userData_increment([keyName]);
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
    await CountlyNativeModule.userData_incrementBy([keyName, intValue]);
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
    await CountlyNativeModule.userData_multiply([keyName, intValue]);
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
    await CountlyNativeModule.userData_saveMax([keyName, intValue]);
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
    await CountlyNativeModule.userData_saveMin([keyName, intValue]);
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
        await CountlyNativeModule.userData_setOnce([keyName, keyValue]);
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
        await CountlyNativeModule.userData_pushUniqueValue([keyName, keyValue]);
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
        await CountlyNativeModule.userData_pushValue([keyName, keyValue]);
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
        await CountlyNativeModule.userData_pullValue([keyName, keyValue]);
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
        if (key.toString() !== "byear" && !isSupportedUserPropertyValue(customAndPredefined[key])) {
            L.w("setUserProperties, " + `skipping value for key '${key.toString()}', due to unsupported data type '${typeof customAndPredefined[key]}', its data type should be 'string', 'number', 'boolean', or an array of those types`);
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

    await CountlyNativeModule.userDataBulk_setUserProperties(customAndPredefined);
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
    await CountlyNativeModule.userDataBulk_save([]);
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
    if (keyName && (keyValue || keyValue == "")) {
        await CountlyNativeModule.userDataBulk_setProperty([keyName, keyValue]);
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
        await CountlyNativeModule.userDataBulk_increment([keyName]);
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
    await CountlyNativeModule.userDataBulk_incrementBy([keyName, intValue]);
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
    await CountlyNativeModule.userDataBulk_multiply([keyName, intValue]);
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
    await CountlyNativeModule.userDataBulk_saveMax([keyName, intValue]);
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
    await CountlyNativeModule.userDataBulk_saveMin([keyName, intValue]);
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
        await CountlyNativeModule.userDataBulk_setOnce([keyName, keyValue]);
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
        await CountlyNativeModule.userDataBulk_pushUniqueValue([keyName, keyValue]);
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
        await CountlyNativeModule.userDataBulk_pushValue([keyName, keyValue]);
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
        await CountlyNativeModule.userDataBulk_pullValue([keyName, keyValue]);
    }
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
    CountlyNativeModule.giveConsent(features);
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
    CountlyNativeModule.removeConsent(features);
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
    CountlyNativeModule.giveAllConsent();
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
    CountlyNativeModule.removeAllConsent();
};

/**
 * @deprecated in 26.1.0 : use 'Countly.remoteConfig.update' instead of 'remoteConfigUpdate'.
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
    L.w("remoteConfigUpdate, remoteConfigUpdate is deprecated, use Countly.remoteConfig.update instead.");
    L.d("remoteConfigUpdate, Updating remote config");
    CountlyNativeModule.remoteConfigUpdate([], (stringItem) => {
        callback(stringItem);
    });
};

/**
 * @deprecated in 26.1.0 : use 'Countly.remoteConfig.updateForKeysOnly' instead of 'updateRemoteConfigForKeysOnly'.
 *
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
    L.w("updateRemoteConfigForKeysOnly, updateRemoteConfigForKeysOnly is deprecated, use Countly.remoteConfig.updateForKeysOnly instead.");
    L.d(`updateRemoteConfigForKeysOnly, Updating remote config for keys: [${keyNames}]`);
    const args = [];
    if (keyNames.length) {
        for (let i = 0, il = keyNames.length; i < il; i++) {
            args.push(keyNames[i]);
        }
        CountlyNativeModule.updateRemoteConfigForKeysOnly(args, (stringItem) => {
            callback(stringItem);
        });
    }
};

/**
 * @deprecated in 26.1.0 : use 'Countly.remoteConfig.updateExceptKeys' instead of 'updateRemoteConfigExceptKeys'.
 *
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
    L.w("updateRemoteConfigExceptKeys, updateRemoteConfigExceptKeys is deprecated, use Countly.remoteConfig.updateExceptKeys instead.");
    L.d(`updateRemoteConfigExceptKeys, Updating remote config except keys: [${keyNames}]`);
    const args = [];
    if (keyNames.length) {
        for (let i = 0, il = keyNames.length; i < il; i++) {
            args.push(keyNames[i]);
        }
        CountlyNativeModule.updateRemoteConfigExceptKeys(args, (stringItem) => {
            callback(stringItem);
        });
    }
};

/**
 * @deprecated in 26.1.0 : use 'Countly.remoteConfig.getValue' instead of 'getRemoteConfigValueForKey'.
 *
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
    L.w("getRemoteConfigValueForKey, getRemoteConfigValueForKey is deprecated, use Countly.remoteConfig.getValue instead.");
    CountlyNativeModule.getRemoteConfigValueForKey([keyName.toString() || ""], (value) => {
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
 * @deprecated in 26.1.0 : use 'Countly.remoteConfig.getValue' instead of 'getRemoteConfigValueForKeyP'.
 *
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
    L.w("getRemoteConfigValueForKeyP, getRemoteConfigValueForKeyP is deprecated, use Countly.remoteConfig.getValue instead.");
    L.d(`getRemoteConfigValueForKeyP, Getting remote config value for key: [${keyName}]`);
    if (Platform.OS != "android") {
        return "To be implemented";
    }
    const promise = CountlyNativeModule.getRemoteConfigValueForKeyP(keyName);
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
            L.e(`getRemoteConfigValueForKeyP, Catch Error: ${e?.message || String(e)}`);
            return undefined;
        });
};

/**
 * @deprecated in 26.1.0 : use 'Countly.remoteConfig.clearValues' instead of 'remoteConfigClearValues'.
 *
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
    L.w("remoteConfigClearValues, remoteConfigClearValues is deprecated, use Countly.remoteConfig.clearValues instead.");
    L.d("remoteConfigClearValues, Clearing remote config values");
    const result = await CountlyNativeModule.remoteConfigClearValues();
    return result;
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
    CountlyNativeModule.showStarRating([], callback);
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
    if (closeButtonText == null) {
        closeButtonText = "";
    } else if (typeof closeButtonText !== "string") {
        closeButtonText = "";
        L.w("presentRatingWidgetWithID, " + `unsupported data type of closeButtonText : '${typeof closeButtonText}'`);
    }
    if (ratingWidgetCallback) {
        // eventEmitter.addListener('ratingWidgetCallback', ratingWidgetCallback);
        _ratingWidgetListener = eventEmitter.addListener(ratingWidgetCallbackName, (error) => {
            ratingWidgetCallback(error);
            _ratingWidgetListener.remove();
        });
    }
    CountlyNativeModule.presentRatingWidgetWithID([widgetId.toString() || "", closeButtonText.toString() || "Done"]);
};

/**
 *
 * Events get grouped together and are sent either every minute or after the unsent event count reaches a threshold. By default it is 10
 * Should be called before Countly init
 * @param {number} size - event count
 */
Countly.setEventSendThreshold = function (size) {
    CountlyNativeModule.setEventSendThreshold([size.toString() || ""]);
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
    CountlyNativeModule.startTrace(args);
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
    CountlyNativeModule.cancelTrace(args);
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
    CountlyNativeModule.clearAllTraces(args);
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
    CountlyNativeModule.endTrace(args);
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
    CountlyNativeModule.recordNetworkTrace(args);
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
    CountlyNativeModule.replaceAllAppKeysInQueueWithCurrentAppKey();
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
    CountlyNativeModule.recordDirectAttribution(args);
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
    CountlyNativeModule.recordIndirectAttribution(args);
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
    CountlyNativeModule.removeDifferentAppKeysFromQueue();
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
    CountlyNativeModule.appLoadingFinished();
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
        CountlyNativeModule.setCustomMetrics(args);
    }
};

/**
 * Opt in user for the content fetching and updates
 * 
 */
Countly.content.enterContentZone = function() {
    L.i("enterContentZone, opting for content fetching.");
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'enterContentZone'";
        L.e(`enterContentZone, ${message}`);
        return;
    }
    CountlyNativeModule.enterContentZone();
};

/**
 * Refreshes the content zone.
 */
Countly.content.refreshContentZone = function() {
    L.i("refreshContentZone, refreshing content zone.");
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'refreshContentZone'";
        L.e(`refreshContentZone, ${message}`);
        return;
    }
    CountlyNativeModule.refreshContentZone();
};

/**
 * Preview a specific content by ID without entering the content zone.
 *
 * @param {string} contentId content identifier to preview
 */
Countly.content.previewContent = function(contentId) {
    const message = Validate.String(contentId, "contentId", "previewContent");
    if (message) {
        return message;
    }
    L.i(`previewContent, previewing content with ID: [${contentId}]`);
    if (!_state.isInitialized) {
        const initMessage = "'init' must be called before 'previewContent'";
        L.e(`previewContent, ${initMessage}`);
        return initMessage;
    }
    CountlyNativeModule.previewContent([contentId]);
};

/**
 * Opt out user from the content fetching and updates
 * 
 */
Countly.content.exitContentZone = function() {
    L.i("exitContentZone, opting out from content fetching.");
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'exitContentZone'";
        L.e(`exitContentZone, ${message}`);
        return;
    }
    CountlyNativeModule.exitContentZone();
};

/**
 * Test-only helper methods for RN integration tests.
 */
Countly.test.enableRequestCapture = async function () {
    await CountlyNativeModule.enableRequestCapture();
};

Countly.test.getCapturedRequests = async function () {
    const requests = await CountlyNativeModule.getCapturedRequests();
    return requests || [];
};

Countly.test.getRequestQueue = async function () {
    const queue = await CountlyNativeModule.getRequestQueue();
    return queue || [];
};

Countly.test.getEventQueue = async function () {
    const queue = await CountlyNativeModule.getEventQueue();
    return queue || [];
};

Countly.test.halt = async function () {
    await CountlyNativeModule.halt();
    resetBridgeStateForTesting();
};

export default Countly;
