const countlyNamespace = "[CountlyReactNative] ";
let canLog = false;

/**
 * Initialize logger
 * @param {Boolean} debugMode
 */
function initialize(debugMode) {
    canLog = debugMode && console !== undefined;
    i("[Logger] initializing the module");
}

/**
 * Error - this is for things that need immediate attention because SDK won’t work.
 * @param {String} message
 */
function e(message) {
    if (canLog) {
        console.error(countlyNamespace + message);
    }
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
}

/**
 * Info - All publicly exposed functions should log a call at this level to indicate that they were called.
 * @param {String} message
 */
function i(message) {
    if (canLog) {
        console.info(countlyNamespace + message);
    }
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
}

export { initialize, e, w, i, d, v };
