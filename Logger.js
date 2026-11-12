const countlyNamespace = "[CountlyReactNative] ";
let canLog = false;
let logListener = null;

/**
 * Initialize logger
 * @param {Boolean} debugMode
 */
function initialize(debugMode) {
    canLog = debugMode && console !== undefined;
    i("[Logger] initializing the module");
}

/**
 * Sets the listener that receives every log line and its level, also when logging is disabled.
 * @param {Function} listener - called with the message and its level, anything else removes the listener
 */
function setListener(listener) {
    logListener = typeof listener === "function" ? listener : null;
}

/**
 * Passes a log line to the log listener, if one is set. A listener that throws does not break the SDK.
 * @param {String} message - the log line
 * @param {String} level - "error", "warning", "info", "debug" or "verbose"
 */
function notifyListener(message, level) {
    if (!logListener) {
        return;
    }
    try {
        logListener(message, level);
    } catch (error) {
        if (canLog) {
            console.error(`${countlyNamespace}[Logger] notifyListener, the log listener threw an error: ${error}`);
        }
    }
}

/**
 * Error - this is for things that need immediate attention because SDK won’t work.
 * @param {String} message
 */
function e(message) {
    if (canLog) {
        console.error(countlyNamespace + message);
    }
    notifyListener(countlyNamespace + message, "error");
}

/**
 * Warning - this is something that is potentially a issue. Maybe a deprecated usage of something,
 * maybe consent is enabled but consent is not given.
 * @param {String} message
 */
function w(message) {
    if (canLog) {
        console.warn(countlyNamespace + message);
    }
    notifyListener(countlyNamespace + message, "warning");
}

/**
 * Info - All publicly exposed functions should log a call at this level to indicate that they were called.
 * @param {String} message
 */
function i(message) {
    if (canLog) {
        console.info(countlyNamespace + message);
    }
    notifyListener(countlyNamespace + message, "info");
}

/**
 * Debug - this should contain logs from the internal workings of the SDK and it's important calls.
 * This should include things like the SDK configuration options, success or fail of the current network request,
 * "request queue is full" and the oldest request get's dropped, etc.
 * @param {String} message
 */
function d(message) {
    if (canLog) {
        console.debug(countlyNamespace + message);
    }
    notifyListener(countlyNamespace + message, "debug");
}

/**
 * Verbose - this should give an even deeper look into the SDK's inner working
 * and should contain things that are more noisy and happen often.
 * @param {String} message
 */
function v(message) {
    if (canLog) {
        console.log(`[VERBOSE]${countlyNamespace}${message}`);
    }
    notifyListener(countlyNamespace + message, "verbose");
}

export { initialize, setListener, notifyListener, e, w, i, d, v };
