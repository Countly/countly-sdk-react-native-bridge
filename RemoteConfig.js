import { Platform } from "react-native";

import * as L from "./Logger.js";
import * as Validate from "./Validators.js";

const REMOTE_CONFIG_KEY_NOT_FOUND = "ConfigKeyNotFound";
const REMOTE_CONFIG_UPDATE_ERROR_PREFIX = "There was an error while updating Remote Config:";

function parseRemoteConfigValue(rawValue) {
    if (rawValue == null || rawValue === REMOTE_CONFIG_KEY_NOT_FOUND) {
        return null;
    }

    if (Platform.OS === "android" && typeof rawValue === "string") {
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
     * @returns {Promise<void>}
     */
    async update() {
        if (!this.#ensureInitialized("update")) {
            return;
        }

        L.d("remoteConfig.update, Updating remote config");
        await this.#runUpdate("remoteConfigUpdate", []);
    }

    /**
     * Replaces specific Remote Config key/value pairs with new values from server.
     * Invalid keys are skipped, and failures are only logged.
     *
     * @param {string[]} keyNames - Keys to update.
     * @returns {Promise<void>}
     */
    async updateForKeysOnly(keyNames) {
        if (!this.#ensureInitialized("updateForKeysOnly")) {
            return;
        }

        const normalizedKeyNames = this.#normalizeKeyNames(keyNames, "updateForKeysOnly");
        if (normalizedKeyNames == null) {
            return;
        }

        if (normalizedKeyNames.length === 0) {
            L.d("remoteConfig.updateForKeysOnly, No keys provided. Skipping remote config update.");
            return;
        }

        L.d(`remoteConfig.updateForKeysOnly, Updating remote config for keys: [${normalizedKeyNames}]`);
        await this.#runUpdate("updateRemoteConfigForKeysOnly", normalizedKeyNames);
    }

    /**
     * Replaces all except specific Remote Config key/value pairs with new values from server.
     * Invalid keys are skipped, and failures are only logged.
     *
     * @param {string[]} keyNames - Keys to exclude from the update.
     * @returns {Promise<void>}
     */
    async updateExceptKeys(keyNames) {
        if (!this.#ensureInitialized("updateExceptKeys")) {
            return;
        }

        const normalizedKeyNames = this.#normalizeKeyNames(keyNames, "updateExceptKeys");
        if (normalizedKeyNames == null) {
            return;
        }

        if (normalizedKeyNames.length === 0) {
            L.d("remoteConfig.updateExceptKeys, No keys provided. Skipping remote config update.");
            return;
        }

        L.d(`remoteConfig.updateExceptKeys, Updating remote config except keys: [${normalizedKeyNames}]`);
        await this.#runUpdate("updateRemoteConfigExceptKeys", normalizedKeyNames);
    }

    /**
     * Gets the current Remote Config value for a specific key.
     * Returns null when the key is missing or the call cannot be completed.
     *
     * @param {string} keyName - Key to read.
     * @returns {Promise<any | null>}
     */
    async getValue(keyName) {
        if (!this.#ensureInitialized("getValue")) {
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
        if (!this.#ensureInitialized("clearValues")) {
            return;
        }

        L.d("remoteConfig.clearValues, Clearing remote config values");
        try {
            await this.#state.CountlyReactNative.remoteConfigClearValues();
        } catch (error) {
            L.e(`remoteConfig.clearValues, ${toErrorMessage(error)}`);
        }
    }

    #ensureInitialized(functionName) {
        if (!this.#state.isInitialized) {
            const message = `'init' must be called before 'Countly.remoteConfig.${functionName}'`;
            L.e(`remoteConfig.${functionName}, ${message}`);
            return false;
        }

        return true;
    }

    #normalizeKeyNames(keyNames, functionName) {
        if (!Array.isArray(keyNames)) {
            const message = "keyNames must be an array of strings";
            L.e(`remoteConfig.${functionName}, ${message}`);
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

            if (typeof status === "string" && status.startsWith(REMOTE_CONFIG_UPDATE_ERROR_PREFIX)) {
                L.e(`remoteConfig.${nativeMethodName}, ${status}`);
                return;
            }

            if (status != null && typeof status !== "string") {
                L.d(`remoteConfig.${nativeMethodName}, completed with result: ${toErrorMessage(status)}`);
            }
        } catch (error) {
            L.e(`remoteConfig.${nativeMethodName}, ${toErrorMessage(error)}`);
        }
    }
}

export { REMOTE_CONFIG_KEY_NOT_FOUND };
export default RemoteConfig;