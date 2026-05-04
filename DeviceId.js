import * as L from "./Logger.js";
import * as Utils from "./Utils.js";

class DeviceId {
    #state;

    constructor(state) {
        this.#state = state;
    }

    /**
     *
     * Get currently used device ID.
     * Should be called after Countly init
     *
     * @returns {string | null} device ID or null
     */
    getID = async function () {
        if (!this.#state.isInitialized) {
            L.w("getID, 'init' must be called before 'getID'");
            return null;
        }
        L.d("getID, Getting current device ID");
        const result = await this.#state.CountlyReactNative.getCurrentDeviceId();
        return result;
    };

    /**
     * Get currently used device ID type.
     * Should be called after Countly init
     *
     * @return {DeviceIdType | null} deviceIdType or null
     */
    getType = async function () {
        if (!this.#state.isInitialized) {
            L.w("getType, 'init' must be called before 'getType'");
            return null;
        }
        L.d("getType, Getting device ID type");
        const result = await this.#state.CountlyReactNative.getDeviceIDType();
        return Utils.intToDeviceIDType(result);
    };

    /**
     * Sets device ID according to the device ID Type.
     * If previous ID was Developer Supplied sets it without merge, otherwise with merge.
     *
     * @param {string} newDeviceID - device ID to set
     */
    setID = function (newDeviceID) {
        if (!this.#state.isInitialized) {
            L.w("setID, 'init' must be called before 'setID'");
            return;
        }
        // Check if newDeviceID is not a string
        if (!newDeviceID || typeof newDeviceID !== "string" || newDeviceID.length === 0) {
            L.w("setID, provided device ID is not a valid string:[" + newDeviceID + "]");
            return;
        }
        L.d(`setID, Setting device id as: [${newDeviceID}]`);
        this.#state.CountlyReactNative.setID(newDeviceID);
    };

    /**
     * Changes device ID with explicit merge selection.
     *
     * @param {string} newDeviceID - device ID to set
     * @param {boolean} merge - when true, merges the old and new device IDs on the server
     */
    changeID = function (newDeviceID, merge = false) {
        if (!this.#state.isInitialized) {
            L.w("changeID, 'init' must be called before 'changeID'");
            return;
        }
        if (!newDeviceID || typeof newDeviceID !== "string" || newDeviceID.length === 0) {
            L.w("changeID, provided device ID is not a valid string:[" + newDeviceID + "]");
            return;
        }
        if (typeof merge !== "boolean") {
            L.w("changeID, merge should be a boolean value");
            return;
        }

        L.d(`changeID, Changing to new device id: [${newDeviceID}], with merge: [${merge}]`);
        this.#state.CountlyReactNative.changeDeviceId([newDeviceID, merge ? "1" : "0"]);
    };
}

export default DeviceId;