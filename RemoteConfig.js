import { Platform } from "react-native";

import * as L from "./Logger.js";
import * as Validate from "./Validators.js";

const REMOTE_CONFIG_KEY_NOT_FOUND = "ConfigKeyNotFound";
const REMOTE_CONFIG_UPDATE_ERROR_PREFIX = "There was an error while updating Remote Config:";
const KEY_NAMES_TYPE_ERROR = "keyNames must be an array of strings";
const NO_KEYS_ERROR = "No valid keys provided";

/**
 * Builds the result of a remote config update that downloaded no values.
 *
 * @param {string} error - why no values were downloaded
 * @returns {{success: boolean, error: string}} the failed update result
 */
function failedUpdate(error) {
    return { success: false, error: error };
}

function parseRemoteConfigValue(rawValue) {
    if (rawValue == null) {
        return null;
    }

    if (Platform.OS === "android" && typeof rawValue === "string") {
        if (rawValue === REMOTE_CONFIG_KEY_NOT_FOUND) {
            return null;
        }
        try {
            return JSON.parse(rawValue);
        } catch (error) {
            // noop. Raw scalar strings should stay as strings.
        }
    }

    return rawValue;
}

function toErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }

    if (error && typeof error === "object" && typeof error.message === "string") {
        return error.message;
    }

    return String(error);
}

class RemoteConfig {
    #state;

    constructor(state) {
        this.#state = state;
    }

    /**
     * Replaces all stored Remote Config values with new values from server.
     * Logs any failures and returns without throwing.
     *
     * @returns {Promise<{success: boolean, error: string | null}>} whether new values were downloaded, and why not
     */
    async update() {
        const initializationError = this.#initializationError("update");
        if (initializationError) {
            return failedUpdate(initializationError);
        }

        L.d("remoteConfig.update, Updating remote config");
        return this.#runUpdate("remoteConfigUpdate", []);
    }

    /**
     * Replaces specific Remote Config key/value pairs with new values from server.
     * Invalid keys are skipped, and failures are only logged.
     *
     * @param {string[]} keyNames - Keys to update.
     * @returns {Promise<{success: boolean, error: string | null}>} whether new values were downloaded, and why not
     */
    async updateForKeysOnly(keyNames) {
        const initializationError = this.#initializationError("updateForKeysOnly");
        if (initializationError) {
            return failedUpdate(initializationError);
        }

        const normalizedKeyNames = this.#normalizeKeyNames(keyNames, "updateForKeysOnly");
        if (normalizedKeyNames == null) {
            return failedUpdate(KEY_NAMES_TYPE_ERROR);
        }

        if (normalizedKeyNames.length === 0) {
            L.d("remoteConfig.updateForKeysOnly, No keys provided. Skipping remote config update.");
            return failedUpdate(NO_KEYS_ERROR);
        }

        L.d(`remoteConfig.updateForKeysOnly, Updating remote config for keys: [${normalizedKeyNames}]`);
        return this.#runUpdate("updateRemoteConfigForKeysOnly", normalizedKeyNames);
    }

    /**
     * Replaces all except specific Remote Config key/value pairs with new values from server.
     * Invalid keys are skipped, and failures are only logged.
     *
     * @param {string[]} keyNames - Keys to exclude from the update.
     * @returns {Promise<{success: boolean, error: string | null}>} whether new values were downloaded, and why not
     */
    async updateExceptKeys(keyNames) {
        const initializationError = this.#initializationError("updateExceptKeys");
        if (initializationError) {
            return failedUpdate(initializationError);
        }

        const normalizedKeyNames = this.#normalizeKeyNames(keyNames, "updateExceptKeys");
        if (normalizedKeyNames == null) {
            return failedUpdate(KEY_NAMES_TYPE_ERROR);
        }

        if (normalizedKeyNames.length === 0) {
            L.d("remoteConfig.updateExceptKeys, No keys provided. Skipping remote config update.");
            return failedUpdate(NO_KEYS_ERROR);
        }

        L.d(`remoteConfig.updateExceptKeys, Updating remote config except keys: [${normalizedKeyNames}]`);
        return this.#runUpdate("updateRemoteConfigExceptKeys", normalizedKeyNames);
    }

    /**
     * Gets the current Remote Config value for a specific key.
     * Returns null when the key is missing or the call cannot be completed.
     *
     * @param {string} keyName - Key to read.
     * @returns {Promise<any | null>}
     */
    async getValue(keyName) {
        if (this.#initializationError("getValue")) {
            return null;
        }

        const message = Validate.String(keyName, "keyName", "remoteConfig.getValue");
        if (message) {
            L.w(`remoteConfig.getValue, ${message}`);
            return null;
        }

        L.d(`remoteConfig.getValue, Getting remote config value for key: [${keyName}]`);
        try {
            const rawValue = await new Promise((resolve) => {
                this.#state.CountlyReactNative.getRemoteConfigValueForKey([keyName.toString()], (value) => {
                    resolve(value);
                });
            });

            return parseRemoteConfigValue(rawValue);
        } catch (error) {
            L.e(`remoteConfig.getValue, ${toErrorMessage(error)}`);
            return null;
        }
    }

    /**
     * Clears all downloaded Remote Config values.
     * Logs any failures and returns without throwing.
     *
     * @returns {Promise<void>}
     */
    async clearValues() {
        if (this.#initializationError("clearValues")) {
            return;
        }

        L.d("remoteConfig.clearValues, Clearing remote config values");
        try {
            await this.#state.CountlyReactNative.remoteConfigClearValues();
        } catch (error) {
            L.e(`remoteConfig.clearValues, ${toErrorMessage(error)}`);
        }
    }

    /**
     * Logs and returns the error for a call made before init.
     *
     * @param {string} functionName - name of the called function
     * @returns {string | null} the error message, or null when the SDK is initialized
     */
    #initializationError(functionName) {
        if (!this.#state.isInitialized) {
            const message = `'init' must be called before 'Countly.remoteConfig.${functionName}'`;
            L.e(`remoteConfig.${functionName}, ${message}`);
            return message;
        }

        return null;
    }

    #normalizeKeyNames(keyNames, functionName) {
        if (!Array.isArray(keyNames)) {
            L.e(`remoteConfig.${functionName}, ${KEY_NAMES_TYPE_ERROR}`);
            return null;
        }

        const normalizedKeyNames = [];
        for (let index = 0; index < keyNames.length; index += 1) {
            const keyName = keyNames[index];
            const message = Validate.String(keyName, `keyNames[${index}]`, `remoteConfig.${functionName}`);
            if (message) {
                L.w(`remoteConfig.${functionName}, ${message}`);
                continue;
            }

            normalizedKeyNames.push(keyName.toString());
        }

        return normalizedKeyNames;
    }

    async #runUpdate(nativeMethodName, args) {
        try {
            const status = await new Promise((resolve) => {
                this.#state.CountlyReactNative[nativeMethodName](args, (result) => {
                    resolve(result);
                });
            });

            if (typeof status !== "string") {
                const message = `unexpected native result: ${toErrorMessage(status)}`;
                L.e(`remoteConfig.${nativeMethodName}, ${message}`);
                return failedUpdate(message);
            }

            if (status.startsWith(REMOTE_CONFIG_UPDATE_ERROR_PREFIX)) {
                L.e(`remoteConfig.${nativeMethodName}, ${status}`);
                return failedUpdate(status.slice(REMOTE_CONFIG_UPDATE_ERROR_PREFIX.length).trim());
            }
            return { success: true, error: null };
        } catch (error) {
            const message = toErrorMessage(error);
            L.e(`remoteConfig.${nativeMethodName}, ${message}`);
            return failedUpdate(message);
        }
    }
}

export { REMOTE_CONFIG_KEY_NOT_FOUND };
export default RemoteConfig;