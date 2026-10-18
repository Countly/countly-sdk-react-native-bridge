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

const CountlyNativeModule = TurboModuleRegistry.get("CountlyReactNative") ?? NativeModules.CountlyReactNative;

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
const MAX_THROWN_VALUE_DESCRIPTION_LENGTH = 1000;

Countly.userData = {}; // userData interface
Countly.userDataBulk = {}; // userDataBulk interface

Countly.content = {}; // content interface

Countly.test = {}; // test-only interface

/*
 * Listener for rating widget callback, when callback recieve we will remove the callback using listener.
 */
let _ratingWidgetListener;
const ratingWidgetCallbackName = "ratingWidgetCallback";
const pushNotificationCallbackName = "pushNotificationCallback";
const pushNotificationOpenedCallbackName = "pushNotificationOpenedCallback";

function removeSubscription(stateKey) {
    const subscription = _state[stateKey];
    if (subscription && typeof subscription.remove === "function") {
        subscription.remove();
    }
    _state[stateKey] = null;
}

/**
 * Creates a subscription that listens to nothing, returned by the push listener calls of the no-push package.
 *
 * @return {object} subscription with a 'remove' function that does nothing
 */
function createInactiveSubscription() {
    return { remove() {} };
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

/**
 * Tells whether the test-only helpers may run. They change or wipe SDK state, so they only run in debug builds.
 *
 * @param {string} functionName - name of the called helper, for the log
 * @return {boolean} true in debug builds
 */
function isTestApiAvailable(functionName) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
        return true;
    }
    L.e(`${functionName}, Countly.test helpers are only available in debug builds`);
    return false;
}

/**
 * Converts the value passed to logException into the text that is reported.
 *
 * @param {any} exception - exception text or an Error object
 * @return {string | null} the exception text (an Error's stack, or its name and message), or null when the value is neither text nor an Error
 */
function exceptionToText(exception) {
    if (typeof exception === "string") {
        return exception;
    }
    if (exception && typeof exception === "object" && (typeof exception.stack === "string" || typeof exception.message === "string")) {
        if (typeof exception.stack === "string" && exception.stack.length > 0) {
            return exception.stack;
        }
        const name = typeof exception.name === "string" && exception.name ? exception.name : "Error";
        return `${name}: ${exception.message}`;
    }
    return null;
}

/**
 * Converts any thrown value into an error object that can be reported.
 *
 * @param {any} thrown - value the app threw
 * @return {Error} the value itself when it is error-like, otherwise an Error describing it
 */
function toReportableError(thrown) {
    if (thrown instanceof Error || (thrown && typeof thrown.message === "string")) {
        return thrown;
    }
    if (typeof thrown === "string") {
        return new Error(thrown.substring(0, MAX_THROWN_VALUE_DESCRIPTION_LENGTH));
    }
    try {
        const description = JSON.stringify(thrown);
        if (description !== undefined) {
            return new Error(description.substring(0, MAX_THROWN_VALUE_DESCRIPTION_LENGTH));
        }
    } catch (error) {
        // Values that cannot be serialized fall back to their string form.
    }
    return new Error(String(thrown).substring(0, MAX_THROWN_VALUE_DESCRIPTION_LENGTH));
}

/**
 * Describes an error caught by the global JS error handler for crash reporting.
 *
 * @param {any} thrown - value the app threw
 * @return {{title: string, message: string, stack: string}} the error's title, message and JS stack
 */
function describeGlobalJSError(thrown) {
    const error = toReportableError(thrown);
    const errorName = typeof error.name === "string" && error.name ? error.name : "Error";
    const jsStackTrace = Utils.getStackTrace(error);
    let errorTitle;
    let stackArr;
    if (jsStackTrace == null || jsStackTrace.length === 0) {
        errorTitle = errorName;
        stackArr = typeof error.stack === "string" ? error.stack : "";
    } else {
        // Only the file name is kept: debug URLs carry options after "?" or "//&", and embedded bundles report per-install paths.
        const chunks = (jsStackTrace[0].file || "").split(/[?&]/)[0].replace(/\/+$/, "").split("/");
        const fname = chunks[chunks.length - 1];
        errorTitle = `${errorName} (${jsStackTrace[0].methodName}@${fname})`;
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

    return { title: errorTitle, message: error.message.trim(), stack: stackArr || "" };
}

function installJsCrashReportingHandler() {
    if (_isCrashReportingEnabled || typeof ErrorUtils === "undefined") {
        return;
    }

    L.i("initWithConfig, Adding Countly JS error handler.");
    const previousHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
        try {
            const description = describeGlobalJSError(error);
            // Debug builds show a fatal error instead of crashing, so only release builds record it as a fatal crash.
            CountlyNativeModule.logJSException(description.title, description.message, description.stack, isFatal === true && !__DEV__);
        } catch (reportError) {
            L.e(`JS error handler, could not report the error: ${reportError}`);
        }

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
    if (!countlyConfig) {
        L.e("init, config should not be null or undefined");
        return;
    }
    if (countlyConfig.deviceID !== undefined && countlyConfig.deviceID !== null && (typeof countlyConfig.deviceID !== "string" || countlyConfig.deviceID === "")) {
        L.e("init, Device ID during init must be a non-empty string. Value will be ignored and the SDK will generate one.");
    }
    if (typeof countlyConfig.serverURL !== "string" || countlyConfig.serverURL === "") {
        L.e("init, Server URL during init must be a non-empty string");
        return;
    }
    if (typeof countlyConfig.appKey !== "string" || countlyConfig.appKey === "") {
        L.e("init, App Key during init must be a non-empty string");
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
    try {
        await CountlyNativeModule.init(args);
    } catch (error) {
        L.e(`init, native init failed: ${error && error.message ? error.message : String(error)}`);
        removeSubscription("globalContentCallbackSubscription");
        return;
    }
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
 * Should be called after Countly init
 * @param {object} options - object containing the push token
 * {token: string}
 *
 * @return {string | void} error message or void
 */
Countly.sendPushToken = function (options) {
    const pushMessage = Validate.PushAvailable("sendPushToken");
    if (pushMessage) {
        return pushMessage;
    }
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'sendPushToken'";
        L.e(`sendPushToken, ${message}`);
        return message;
    }
    const token = options ? options.token : undefined;
    const message = Validate.String(token, "token", "sendPushToken");
    if (message) {
        L.e(`sendPushToken, ${message}`);
        return message;
    }
    L.d(`sendPushToken, Sending push token: [${token}]`);
    CountlyNativeModule.sendPushToken([token]);
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
    const pushMessage = Validate.PushAvailable("askForNotificationPermission");
    if (pushMessage) {
        return pushMessage;
    }
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'askForNotificationPermission'";
        L.e(`askForNotificationPermission, ${message}`);
        return message;
    }
    const soundPath = typeof customSoundPath === "string" && customSoundPath.length > 0 ? customSoundPath : "null";
    L.d(`askForNotificationPermission, Asking for notification permission at: [${soundPath}]`);
    CountlyNativeModule.askForNotificationPermission([soundPath]);
};

/**
 *
 * Set callback to receive push notifications
 * On Android it is called when a push arrives. On iOS it is called when a push arrives while the app is open and when the user taps a push.
 * To react to taps the same way on both platforms, for example to open a deep link, use 'registerForNotificationOpened'.
 * Registering again replaces the previous listener.
 * @param {callback listener } theListener
 * @return {object} subscription with a 'remove' function, which does nothing when the listener is not a function
 */
Countly.registerForNotification = function (theListener) {
    if (Validate.PushAvailable("registerForNotification")) {
        return createInactiveSubscription();
    }
    if (typeof theListener !== "function") {
        L.e("registerForNotification, listener should be a function");
        return createInactiveSubscription();
    }
    L.d("registerForNotification, Registering for notification");
    removeSubscription("pushNotificationSubscription");
    const event = eventEmitter.addListener(pushNotificationCallbackName, theListener);
    _state.pushNotificationSubscription = event;
    CountlyNativeModule.registerForNotification([]);
    return event;
};

/**
 *
 * Set a listener that is called when the user taps a push notification, on Android and iOS.
 * A tap that opened the app before a listener was registered is delivered once the listener is registered.
 * Registering again replaces the previous listener.
 * On Android, when the system has stopped the app in the background, the tap reaches the app before React Native is ready.
 * Call 'setIntent(intent)' in your MainActivity's 'onNewIntent' so that such a tap is kept and delivered too.
 * @param {function(object, number): void} theListener - called with the notification payload and the index of the tapped action:
 * 0 for the notification itself, 1 and up for its buttons
 * @return {object} subscription with a 'remove' function, which does nothing when the listener is not a function
 */
Countly.registerForNotificationOpened = function (theListener) {
    if (Validate.PushAvailable("registerForNotificationOpened")) {
        return createInactiveSubscription();
    }
    if (typeof theListener !== "function") {
        L.e("registerForNotificationOpened, listener should be a function");
        return createInactiveSubscription();
    }
    L.d("registerForNotificationOpened, Registering for notification taps");
    removeSubscription("pushNotificationOpenedSubscription");
    const subscription = eventEmitter.addListener(pushNotificationOpenedCallbackName, (data) => {
        let opened;
        try {
            opened = typeof data === "string" ? JSON.parse(data) : data;
        } catch (error) {
            L.e(`registerForNotificationOpened, could not read the tapped notification: ${error}`);
            return;
        }
        if (!opened || typeof opened !== "object") {
            L.e("registerForNotificationOpened, the tapped notification has no payload");
            return;
        }
        theListener(opened.notification || {}, typeof opened.actionIndex === "number" ? opened.actionIndex : 0);
    });
    _state.pushNotificationOpenedSubscription = subscription;
    CountlyNativeModule.registerForNotificationOpened([]);
    return subscription;
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
 * Should be called after Countly init
 *
 * @param {object} [metricsOverride] - optional metrics override map
 * @return {string | void} error message or void
 */
Countly.recordMetrics = function (metricsOverride = {}) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'recordMetrics'";
        L.e(`recordMetrics, ${message}`);
        return message;
    }
    L.d(`recordMetrics, Sending metrics request with override: [${JSON.stringify(metricsOverride)}]`);
    if (metricsOverride && typeof metricsOverride !== "object") {
        L.w(`recordMetrics, ignoring non-object metricsOverride of type '${typeof metricsOverride}'`);
        metricsOverride = {};
    }

    const args = [];
    for (const key in metricsOverride) {
        const value = metricsOverride[key];
        if (value === null || value === undefined) {
            L.w(`recordMetrics, skipping metric [${key}], its value is [${value}]`);
            continue;
        }
        args.push(key.toString());
        args.push(value.toString());
    }
    CountlyNativeModule.recordMetrics(args);
};

/**
 *
 * Log exception for Countly
 *
 * @param {string | Error} exception exception text, or an Error object whose stack (or name and message) is reported
 * @param {boolean} nonfatal false records the exception as a fatal crash, anything else as non-fatal
 * @param {object} segments segments
 * @return {string | void} error message or void
 */
Countly.logException = function (exception, nonfatal, segments) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'logException'";
        L.e(`logException, ${message}`);
        return message;
    }
    const exceptionText = exceptionToText(exception);
    if (exceptionText === null) {
        const message = "exception should be a text or an Error object";
        L.e(`logException, ${message}`);
        return message;
    }
    L.d(`logException, Logging exception: [${exceptionText}], with nonfatal: [${nonfatal}], with segments: [${JSON.stringify(segments)}]`);
    const exceptionArray = exceptionText.split("\n");
    let exceptionString = "";
    for (let i = 0, il = exceptionArray.length; i < il; i++) {
        exceptionString += `${exceptionArray[i]}\n`;
    }
    const args = [];
    args.push(exceptionString || "");
    args.push(nonfatal !== false);
    for (const key in segments) {
        const value = segments[key];
        if (value === null || value === undefined) {
            L.w(`logException, skipping segment [${key}], its value is [${value}]`);
            continue;
        }
        args.push(key);
        args.push(value.toString());
    }
    CountlyNativeModule.logException(args);
};

/**
 *
 * Set custom crash segment for Countly
 * Should be called before Countly init; the native SDKs read crash segments only at init, so calls after init are refused.
 * Segments with null or undefined values are skipped.
 *
 * @param {object} segments segments
 * @return {string | void} error message or void
 */
Countly.setCustomCrashSegments = function (segments) {
    if (_state.isInitialized) {
        const message = "'setCustomCrashSegments' has no effect after init, set crash segments before 'initWithConfig'";
        L.w(`setCustomCrashSegments, ${message}`);
        return message;
    }
    L.d(`setCustomCrashSegments, Setting custom crash segments: [${JSON.stringify(segments)}]`);
    const args = [];
    for (const key in segments) {
        const value = segments[key];
        if (value === null || value === undefined) {
            L.w(`setCustomCrashSegments, skipping segment [${key}], its value is [${value}]`);
            continue;
        }
        args.push(key.toString());
        args.push(value.toString());
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
 * @param {number | string} keyValue whole number to increment user property by, decimals are refused
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
    message = Validate.UserDataInteger(keyValue, "value", "incrementBy");
    if (message) {
        return message;
    }
    const intValue = Number(typeof keyValue === "string" ? keyValue.trim() : keyValue).toString();
    await CountlyNativeModule.userData_incrementBy([keyName, intValue]);
};

/**
 *
 * Multiply custom user data by a specified value
 *
 * @param {string} keyName user property key
 * @param {number | string} keyValue whole number to multiply user property by, decimals are refused
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
    message = Validate.UserDataInteger(keyValue, "value", "multiply");
    if (message) {
        return message;
    }
    const intValue = Number(typeof keyValue === "string" ? keyValue.trim() : keyValue).toString();
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
    message = Validate.UserDataInteger(keyValue, "value", "saveMax");
    if (message) {
        return message;
    }
    const intValue = Number(typeof keyValue === "string" ? keyValue.trim() : keyValue).toString();
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
    message = Validate.UserDataInteger(keyValue, "value", "saveMin");
    if (message) {
        return message;
    }
    const intValue = Number(typeof keyValue === "string" ? keyValue.trim() : keyValue).toString();
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
 * @param {number | string} keyValue whole number to increment user property by, decimals are refused
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
    message = Validate.UserDataInteger(keyValue, "value", "incrementBy");
    if (message) {
        return message;
    }
    const intValue = Number(typeof keyValue === "string" ? keyValue.trim() : keyValue).toString();
    await CountlyNativeModule.userDataBulk_incrementBy([keyName, intValue]);
};

/**
 *
 * Multiply custom user data by a specified value
 * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
 *
 * @param {string} keyName user property key
 * @param {number | string} keyValue whole number to multiply user property by, decimals are refused
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
    message = Validate.UserDataInteger(keyValue, "value", "multiply");
    if (message) {
        return message;
    }
    const intValue = Number(typeof keyValue === "string" ? keyValue.trim() : keyValue).toString();
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
    message = Validate.UserDataInteger(keyValue, "value", "saveMax");
    if (message) {
        return message;
    }
    const intValue = Number(typeof keyValue === "string" ? keyValue.trim() : keyValue).toString();
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
    message = Validate.UserDataInteger(keyValue, "value", "saveMin");
    if (message) {
        return message;
    }
    const intValue = Number(typeof keyValue === "string" ? keyValue.trim() : keyValue).toString();
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
    const features = Validate.normalizeFeatureNames(args);
    if (features === null) {
        const message = "features should be a feature name or a list of feature names";
        L.e(`giveConsent, ${message}`);
        return message;
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
    const features = Validate.normalizeFeatureNames(args);
    if (features === null) {
        const message = "features should be a feature name or a list of feature names";
        L.e(`removeConsent, ${message}`);
        return message;
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
 * @param {number} size - event count, a whole number of at least 1
 * @return {string | void} error message or void
 */
Countly.setEventSendThreshold = function (size) {
    const sizeValue = typeof size === "string" && /^\s*\d+\s*$/.test(size) ? Number(size) : size;
    if (typeof sizeValue !== "number" || !Number.isInteger(sizeValue) || sizeValue < 1 || sizeValue > Validate.INT32_MAX) {
        const message = `size should be a whole number between 1 and ${Validate.INT32_MAX}, received [${size}]`;
        L.e(`setEventSendThreshold, ${message}`);
        return message;
    }
    L.d(`setEventSendThreshold, Setting event send threshold to: [${sizeValue}]`);
    CountlyNativeModule.setEventSendThreshold([sizeValue.toString()]);
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
 * @param {string} campaignType type, for example 'countly'
 * @param {string | object} campaignData data as JSON text or as an object, for example { cid: 'campaign_id', cuid: 'campaign_user_id' }. Objects are sent as JSON text.
 * @return {string | void} error message or void
 */
Countly.recordDirectAttribution = function (campaignType, campaignData) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'recordDirectAttribution'";
        L.e(`recordDirectAttribution, ${message}`);
        return message;
    }
    const campaignDataText = Utils.toCampaignDataText(campaignData);
    if (typeof campaignType !== "string" || campaignType.length === 0 || !campaignDataText) {
        const message = "direct attribution needs a campaign type and campaign data";
        L.e(`recordDirectAttribution, ${message}`);
        return message;
    }
    L.d(`recordDirectAttribution, Recording direct attribution: [${campaignType}, ${campaignDataText}]`);
    CountlyNativeModule.recordDirectAttribution([campaignType, campaignDataText]);
};

/**
 * set indirect attribution Id for campaign attribution reporting.
 * @param {object} attributionValues attribution values as key/value pairs, for example { adid: 'advertising_id' }. Values are sent as text and null values are skipped.
 * @return {string | void} error message or void
 */
Countly.recordIndirectAttribution = function (attributionValues) {
    if (!_state.isInitialized) {
        const message = "'init' must be called before 'recordIndirectAttribution'";
        L.e(`recordIndirectAttribution, ${message}`);
        return message;
    }
    const values = Utils.toAttributionValues(attributionValues);
    if (!values) {
        const message = "indirect attribution values must be an object of text values";
        L.e(`recordIndirectAttribution, ${message}`);
        return message;
    }
    L.d(`recordIndirectAttribution, Recording indirect attribution: [${JSON.stringify(values)}]`);
    CountlyNativeModule.recordIndirectAttribution([values]);
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
Countly.content.enterContentZone = function () {
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
Countly.content.refreshContentZone = function () {
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
Countly.content.previewContent = function (contentId) {
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
Countly.content.exitContentZone = function () {
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
 * They change or wipe SDK state, so they only run in debug builds and do nothing in release builds.
 */
Countly.test.enableRequestCapture = async function () {
    if (!isTestApiAvailable("enableRequestCapture")) {
        return;
    }
    await CountlyNativeModule.enableRequestCapture();
};

Countly.test.getCapturedRequests = async function () {
    if (!isTestApiAvailable("getCapturedRequests")) {
        return [];
    }
    const requests = await CountlyNativeModule.getCapturedRequests();
    return requests || [];
};

Countly.test.getRequestQueue = async function () {
    if (!isTestApiAvailable("getRequestQueue")) {
        return [];
    }
    const queue = await CountlyNativeModule.getRequestQueue();
    return queue || [];
};

Countly.test.getEventQueue = async function () {
    if (!isTestApiAvailable("getEventQueue")) {
        return [];
    }
    const queue = await CountlyNativeModule.getEventQueue();
    return queue || [];
};

Countly.test.halt = async function () {
    if (!isTestApiAvailable("halt")) {
        return;
    }
    await CountlyNativeModule.halt();
    resetBridgeStateForTesting();
};

export default Countly;
