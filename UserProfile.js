import * as L from "./Logger.js";
import * as Validate from "./Validators.js";

class UserProfile {
    #state;

    constructor(state) {
        this.#state = state;
    }

    isValidUserProfileCall = function (keyName, keyValue, functionName) {
        if (!this.#state.isInitialized) {
            L.w(`${functionName}, 'init' must be called before ${functionName}`);
            return false;
        }
        // validate keyName
        if(!keyName) {
            return false;
        }
        if (typeof keyName !== 'string' || keyName.trim() === '') {
            L.w(`${functionName}, provided keyName is not a valid string`);
            return false;
        }
        // validate keyValue
        if (keyValue === null || !Validate.isValidPrimitiveOrArray(keyValue)) {
            L.w(`${functionName}, provided keyValue is not valid`);
            return false;
        }
        return true;
    }

    /**
     * 
     * Set custom key and value pair for the current user
     * 
     * @param {string} keyName - user property key
     * @param {object} keyValue - user property value
     * @returns {void}
     */
    setProperty = async function (keyName, keyValue) {
        if(!this.isValidUserProfileCall(keyName, keyValue, "setProperty")) {
            return;
        }
        let formattedKeyValue = keyValue.toString();
        L.d(`setProperty, Setting user property: [${keyName}, ${formattedKeyValue}]`);
        await this.#state.CountlyReactNative.userData_setProperty([keyName, formattedKeyValue]);
    };

    /**
     * 
     * Set predefined and/or custom key and value pairs for the current user
     * 
     * @param {object} userData - custom key value pairs
     * @returns {void}
     */
    setProperties = async function (userData) {
        if (!this.#state.isInitialized) {
            L.w("setProperties, 'init' must be called before 'setProperties'");
            return;
        }
        if (!userData) {
            L.w("setProperties, User profile data should not be null or undefined");
            return;
        }
        if (typeof userData !== "object") {
            L.w(`setProperties, unsupported data type of user data '${typeof userData}'`);
            return;
        }
        L.d(`setProperties, Setting properties: [${JSON.stringify(userData)}]`);
        const predefinedKeys = {
            name: "string",
            username: "string",
            email: "string",
            organization: "string",
            phone: "string",
            picture: "string",
            picturePath: "string",
            gender: "string",
            byear: "number",
        };
        const userProfile = {};
        for (const key in userData) {
            const value = userData[key];
            const expectedType = predefinedKeys[key];
            if (expectedType) {
                if (typeof value === expectedType || (key === "byear" && typeof value === "number")) {
                    userProfile[key] = key === "byear" ? value.toString() : value;
                } else {
                    L.w(`setProperties, skipping key '${key}' due to type mismatch (expected: ${expectedType}, got: ${typeof value})`);
                }
            } else {
                if (Validate.isValidPrimitiveOrArray(value)) {
                    userProfile[key] = value;
                } else {
                    L.w(`setProperties, skipping custom key '${key}' due to unsupported data type '${typeof value}'`);
                }
            }
        }
        await this.#state.CountlyReactNative.setProperties([userProfile]);
    };    

    /**
     * 
     * Increment custom user data by 1
     * 
     * @param {string} keyName - user property key
     * @returns {void}
     */
    increment = async function (keyName) {
        if (!this.#state.isInitialized) {
            L.w("increment, 'init' must be called before 'increment'");
            return;
        }
        if (!keyName || typeof keyName !== 'string') {
            L.w("increment, provided keyName is not a valid string");
            return;
        }
        L.d(`increment, Incrementing user property: [${keyName}]`);
        await this.#state.CountlyReactNative.userData_increment([keyName]);
    };

    /**
     * 
     * Increment custom user data by a specified value
     * 
     * @param {string} keyName - user property key
     * @param {number} keyValue - value to increment user property by
     * @returns {void}
     */
    incrementBy = async function (keyName, keyValue) {
        if(!this.isValidUserProfileCall(keyName, keyValue, "incrementBy")) {
            return;
        }
        L.d(`incrementBy, Incrementing user property: [${keyName}, ${keyValue}]`);
        const intValue = parseInt(keyValue, 10).toString();
        await this.#state.CountlyReactNative.userData_incrementBy([keyName, intValue]);
    };    

    /**
     * 
     * Multiply custom user data by a specified value
     * 
     * @param {string} keyName - user property key
     * @param {number} keyValue - value to multiply user property by
     * @returns {void}
     */
    multiply = async function (keyName, keyValue) {
        if(!this.isValidUserProfileCall(keyName, keyValue, "multiply")) {
            return;
        }
        L.d(`multiply, Multiplying user property: [${keyName}, ${keyValue}]`);
        const intValue = parseInt(keyValue, 10).toString();
        await this.#state.CountlyReactNative.userData_multiply([keyName, intValue]);
    };

    /**
     * 
     * Save the max value between current and provided value
     * 
     * @param {string} keyName - user property key
     * @param {number} keyValue - user property value
     * @returns {void}
     */
    saveMax = async function (keyName, keyValue) {
        if(!this.isValidUserProfileCall(keyName, keyValue, "saveMax")) {
            return;
        }
        L.d(`saveMax, Saving max user property: [${keyName}, ${keyValue}]`);
        const intValue = parseInt(keyValue, 10).toString();
        await this.#state.CountlyReactNative.userData_saveMax([keyName, intValue]);
    };

    /**
     * 
     * Save the min value between current and provided value
     * 
     * @param {string} keyName - user property key
     * @param {number} keyValue - user property value
     * @returns {void}
     */
    saveMin = async function (keyName, keyValue) {
        if(!this.isValidUserProfileCall(keyName, keyValue, "saveMin")) {
            return;
        }
        L.d(`saveMin, Saving min user property: [${keyName}, ${keyValue}]`);
        const intValue = parseInt(keyValue, 10).toString();
        await this.#state.CountlyReactNative.userData_saveMin([keyName, intValue]);
    };

    /**
     * 
     * Set the property value if it does not exist
     * 
     * @param {string} keyName - The user property key.
     * @param {boolean | number | string} keyValue - The user property value.
     * @returns {void}
     */
    setOnce = async function (keyName, keyValue) {
        if(!this.isValidUserProfileCall(keyName, keyValue, "setOnce")) {
            return;
        }
        keyValue = keyValue.toString();
        L.d(`setOnce, Setting once user property: [${keyName}, ${keyValue}]`);
        await this.#state.CountlyReactNative.userData_setOnce([keyName, keyValue]);
    };

    /**
     * 
     * Add value to custom property (array) if value does not exist within
     * 
     * @param {string} keyName - The user property key.
     * @param {boolean | number | string} keyValue - The user property value.
     * @returns {void}
     */
    pushUnique = async function (keyName, keyValue) {
        if(!this.isValidUserProfileCall(keyName, keyValue, "pushUnique")) {
            return;
        }
        keyValue = keyValue.toString();
        L.d(`pushUnique, Pushing unique value to user property: [${keyName}, ${keyValue}]`);
        await this.#state.CountlyReactNative.userData_pushUniqueValue([keyName, keyValue]);
    };

    /**
     * 
     * Add a value to a custom property (array).
     * 
     * @param {string} keyName - The user property key.
     * @param {boolean | number | string} keyValue - The user property value.
     * @returns {void}
     */
    push = async function (keyName, keyValue) {
        if(!this.isValidUserProfileCall(keyName, keyValue, "push")) {
            return;
        }
        keyValue = keyValue.toString();
        L.d(`push, Pushing value to user property: [${keyName}, ${keyValue}]`);
        await this.#state.CountlyReactNative.userData_pushValue([keyName, keyValue]);
    };

    /**
     * 
     * Remove value from custom property (array)
     * 
     * @param {string} keyName - The user property key.
     * @param {boolean | number | string} keyValue - The user property value.
     * @returns {void}
     */
    pull = async function (keyName, keyValue) {
        if(!this.isValidUserProfileCall(keyName, keyValue, "push")) {
            return;
        }
        keyValue = keyValue.toString();
        L.d(`push, Pulling value from user property: [${keyName}, ${keyValue}]`);
        await this.#state.CountlyReactNative.userData_pullValue([keyName, keyValue]);
    };
}

export default UserProfile;