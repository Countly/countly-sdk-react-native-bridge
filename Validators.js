import * as L from "./Logger.js";
import { PUSH_NOTIFICATIONS_AVAILABLE } from "./CountlyFlavor.js";

const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;

/**
 * Checks that push notification calls are part of this package. The no-push package ignores them with a warning.
 *
 * @param {String} functionName : name of the called function, for the log
 * @returns {String | null} the reason the call is ignored, or null when push notifications are available
 */
function validatePushAvailable(functionName) {
    if (PUSH_NOTIFICATIONS_AVAILABLE) {
        return null;
    }
    const message = "push notifications are not part of the no-push package, use 'countly-sdk-react-native-bridge' for push notifications";
    L.w(`${functionName}, ${message}`);
    return message;
}

/**
 * Validate user data value, it should be 'number' or 'string' that is parseable to 'number'
 * It will return message if any issue found related to data validation else return null.
 * @param {String} stringValue : value of data to validate
 * @param {String} stringName : name of that value string
 * @param {String} functionName : name of function from where value is validating.
 * @returns
 */
function validateUserDataType(stringValue, stringName, functionName) {
    L.d(`validateUserDataType, Validating user data type: [${stringValue}], name: [${stringName}], function: [${functionName}]`);
    let message = null;
    if (typeof stringValue === "number") {
        return null;
    }
    if (typeof stringValue === "string") {
        L.d(`${functionName} unsupported data type '${typeof stringValue}', its data type should be 'number'`);
        return null;
    }

    message = `skipping value for '${stringName.toString()}', due to unsupported data type '${typeof stringValue}', its data type should be 'number'`;
    L.e(`${functionName}, ${message}`);
    return message;
}

/**
 * Validate user data value, it should not be null or undefined
 * It will return message if any issue found related to data validation else return null.
 * @param {String} stringValue : value of data to validate
 * @param {String} stringName : name of that value string
 * @param {String} functionName : name of function from where value is validating.
 * @returns
 */
function validateValidUserData(stringValue, stringName, functionName) {
    L.d(`validateValidUserData, Validating valid user data: [${stringValue}], name: [${stringName}], function: [${functionName}]`);
    if (stringValue || stringValue == "") {
        return null;
    }

    const message = `${stringName} should not be null or undefined`;
    L.e(`${functionName}, ${message}`);
    return message;
}

/**
 * Validate user data value, it should be parseable to 'number'
 * It will return message if any issue found related to data validation else return null.
 * @param {String} stringValue : value of data to validate
 * @param {String} stringName : name of that value string
 * @param {String} functionName : name of function from where value is validating.
 * @returns
 */
function validateParseInt(stringValue, stringName, functionName) {
    L.d(`validateParseInt, Validating parse int: [${stringValue}], name: [${stringName}], function: [${functionName}]`);
    const intValue = parseInt(stringValue, 10); // explicitly converting to base 10, Codacy issue
    if (!isNaN(intValue)) {
        return null;
    }

    const message = `skipping value for '${stringName.toString()}', due to unsupported data type '${typeof stringValue}', its data type should be 'number' or parseable to 'integer'`;
    L.e(`${functionName}, ${message}`);
    return message;
}

/**
 * Validate string, it should not be empty, null or undefined
 * It will return message if any issue found related to string validation else return null.
 * @param {String} stringValue : value of string to validate
 * @param {String} stringName : name of that value string
 * @param {String} functionName : name of function from where value is validating.
 * @returns
 */
function validateString(stringValue, stringName, functionName) {
    L.d(`validateString, Validating string: [${stringValue}], name: [${stringName}], function: [${functionName}]`);
    let message = null;
    if (!stringValue) {
        message = `${stringName} should not be null, undefined or empty`;
    } else if (typeof stringValue !== "string") {
        message = `skipping value for '${stringName.toString()}', due to unsupported data type '${typeof stringValue}', its data type should be 'string'`;
    }
    if (message) {
        L.d(`${functionName}, ${message}`);
    }
    return message;
}

/**
 * Validate user data value, it should be 'number' or 'string' that is parseable to 'number'
 * and it should not be null or undefined
 * It will return message if any issue found related to data validation else return null.
 * @param {String} stringValue : value of data to validate
 * @param {String} stringName : name of that value string
 * @param {String} functionName : name of function from where value is validating.
 * @returns
 */
function validateUserDataValue(stringValue, stringName, functionName) {
    L.d(`validateUserDataValue, Validating user data value: [${stringValue}], name: [${stringName}], function: [${functionName}]`);
    // validating that value should not be null or undefined
    let message = validateValidUserData(stringValue, stringName, functionName);
    if (message) {
        return message;
    }

    // validating that value should be 'number' or 'string'
    message = validateUserDataType(stringValue, stringName, functionName);
    if (message) {
        return message;
    }

    // validating that value should be parceable to int.
    return validateParseInt(stringValue, stringName, functionName);
}

/**
 * Validate a value for a user profile number operation (increment, multiply, max, min).
 * It should be a whole number, or a text holding one, in the 32-bit integer range, because the native SDKs apply these operations as 32-bit integers.
 * Decimals are refused instead of being cut, so 2.5 is never sent as 2 and 0.5 never as 0.
 * It will return message if any issue found related to data validation else return null.
 * @param {number | String} value : value of data to validate
 * @param {String} valueName : name of that value
 * @param {String} functionName : name of function from where value is validating.
 * @returns {String | null} error message or null
 */
function validateUserDataInteger(value, valueName, functionName) {
    let message = validateValidUserData(value, valueName, functionName);
    if (message) {
        return message;
    }

    message = validateUserDataType(value, valueName, functionName);
    if (message) {
        return message;
    }

    const numberValue = typeof value === "string" && /^\s*-?\d+\s*$/.test(value) ? Number(value) : value;
    if (typeof numberValue !== "number" || !Number.isInteger(numberValue) || numberValue < INT32_MIN || numberValue > INT32_MAX) {
        message = `${valueName} should be a whole number between ${INT32_MIN} and ${INT32_MAX}, received [${value}]`;
        L.e(`${functionName}, ${message}`);
        return message;
    }
    return null;
}

/**
 * Normalize consent feature names: a single name becomes a list, and entries that are not non-empty texts are dropped.
 * @param {String | String[]} features : a feature name or a list of feature names
 * @returns {String[] | null} the list of feature names, or null when the input is neither a name nor a list
 */
function normalizeFeatureNames(features) {
    if (typeof features === "string") {
        features = [features];
    }
    if (!Array.isArray(features)) {
        return null;
    }
    return features.filter((feature) => typeof feature === "string" && feature.length > 0);
}

/**
 * Validates event parameters.
 * It will log a message if any issue is found and return false.
 * If the parameters are valid, it will return true.
 * 
 * @param {string} functionName - name of function that called this method for logging
 * @param {string} eventName - provided event name
 * @param {Segmentation} segmentation - provided segmentation
 * @param {number} eventCount - provided event count
 * @param {number} eventSum - provided event sum
 * @returns {boolean} true if parameters are valid, false otherwise
 */
function areEventParametersValid(functionName, eventName, segmentation, eventCount, eventSum) {
    if (!eventName || typeof eventName !== "string" || eventName.length === 0) {
        L.w(`${functionName}, provided eventName: [${eventName}]. It must be a valid string!`);
        return false;
    }
    if (segmentation && typeof segmentation !== "object") {
        L.w(`${functionName}, provided segmentation: [${segmentation}]. It must be an object!`);
        return false;
    }

    if (eventCount && (typeof eventCount !== "number" || eventCount < 0)) {
        L.w(`${functionName}, provided eventCount: [${eventCount}]. It must be a positive number!`);
        return false;
    }

    if (eventSum && typeof eventSum !== "number") {
        L.w(`${functionName}, provided eventSum: [${eventSum}]. It must be a number!`);
        return false;
    }

    return true;
}

export { validateUserDataValue as UserDataValue, validateUserDataInteger as UserDataInteger, validateString as String, validateParseInt as ParseInt, validateValidUserData as ValidUserData, validateUserDataType as UserDataType, validatePushAvailable as PushAvailable, areEventParametersValid, normalizeFeatureNames, INT32_MAX };
