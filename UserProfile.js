import * as L from "./Logger.js";
import * as Validate from "./Validators.js";

class UserProfile {
    #state;

    constructor(state) {
        this.#state = state;
    }

    setProperty = async function (keyName, keyValue) {
        if (!this.#state.isInitialized) {
            L.w("setProperty, 'init' must be called before 'setProperty'");
            return;
        }
        // Validate keyName
        if (typeof keyName !== 'string' || keyName.trim() === '') {
            L.w("setProperty, 'keyName' must be a valid non-empty string");
            return;
        }
        // Validate keyValue
        if (keyValue === null || !Validate.isValidPrimitiveOrArray(keyValue)) {
            L.w("setProperty, 'keyValue' must be a valid primitive type or an array of primitives");
            return;
        }

        let formattedKeyValue = keyValue.toString();
        L.d(`setProperty, Setting user property: [${keyName}, ${formattedKeyValue}]`);
        await this.#state.CountlyReactNative.userData_setProperty([keyName, formattedKeyValue]);
    };

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

    increment = async function (keyName) {
        // Increment custom user data by 1
    };

    incrementBy = async function (keyName, keyValue) {
        // Increment custom user data by a specified value
    };

    multiply = async function (keyName, keyValue) {
        // Multiply custom user data by a specified value
    };

    saveMax = async function (keyName, keyValue) {
        // Save the max value between current and provided value.
    };

    saveMin = async function (keyName, keyValue) {
        // Save the min value between current and provided value.
    };

    setOnce = async function (keyName, keyValue) {
        // Set the property value if it does not exist.
    };

    pushUniqueValue = async function (keyName, keyValue) {
        // Add value to custom property (array) if value does not exist within.
    };

    pushValue = async function (keyName, keyValue) {
        // Add value to custom property (array).
    };

    pullValue = async function (keyName, keyValue) {
        // Remove value to custom property (array).
    };
}

export default UserProfile;