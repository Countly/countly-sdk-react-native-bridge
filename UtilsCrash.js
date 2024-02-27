import parseErrorStackLib from "../react-native/Libraries/Core/Devtools/parseErrorStack.js";

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

export { getStackTrace };