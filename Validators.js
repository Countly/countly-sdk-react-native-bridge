import * as L from "./Logger.js";

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

    // validate segmentation values
    if (segmentation) {
        for (const key in segmentation) {
            const value = segmentation[key];
            const valueType = typeof value;
            if (value && valueType !== "string" && valueType !== "number" && valueType !== "boolean") {
                L.w(`${functionName}, segmentation value: [${value}] for the key: [${key}] must be a number, string or boolean!`);
                return false;
            }
        }
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

function isValidPrimitiveOrArray(value) {
    return (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        Array.isArray(value) && value.every(item => (
            typeof item === 'string' || 
            typeof item === 'number' || 
            typeof item === 'boolean'
        ))
    );
};

export { validateUserDataValue as UserDataValue, validateString as String, validateParseInt as ParseInt, validateValidUserData as ValidUserData, validateUserDataType as UserDataType, areEventParametersValid, isValidPrimitiveOrArray };
