import * as L from "./Logger.js";
import * as Utils from "./Utils.js";

class DeviceId {
    #state;

    constructor(state) {
        this.#state = state;
    }

    /**
     *
     * Get currently used device Id.
     * Should be called after Countly init
     *
     * @returns {string | null} device id or null
     */
    getID = async function () {
        if (!this.#state.isInitialized) {
            L.e("getID, 'init' must be called before 'getID'");
            return null;
        }
        L.d("getID, Getting current device id");
        const result = await this.#state.CountlyReactNative.getCurrentDeviceId();
        return result;
    };

    /**
     * Get currently used device Id type.
     * Should be called after Countly init
     *
     * @return {DeviceIdType | null} deviceIdType or null
     */
    getType = async function () {
        if (!this.#state.isInitialized) {
            L.e("getType, 'init' must be called before 'getType'");
            return null;
        }
        L.d("getType, Getting device id type");
        const result = await this.#state.CountlyReactNative.getDeviceIDType();
        return Utils.intToDeviceIDType(result);
    };

    /**
     * Sets device ID according to the device ID Type.
     * If previous ID was Developer Supplied sets it without merge, otherwise with merge.
     *
     * @param {string} newDeviceID device id to set
     */
    setID = function(newDeviceID) {
        if (!this.#state.isInitialized) {
            L.e("setID, 'init' must be called before 'setID'");
            return;
        }
        // Check if newDeviceID is not a string
        if (typeof newDeviceID !== 'string') {
            L.w("setID, provided device ID is not a string.");
            return;
        }
        L.d(`setID, Setting device id as: [${newDeviceID}]`);
        this.#state.CountlyReactNative.setID(newDeviceID);
    };
}

export default DeviceId;