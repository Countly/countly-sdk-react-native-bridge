import * as L from "./Logger.js";
import * as Validate from "./Validators.js";
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
     * @return {string} device id or error message
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
    setId = function(newDeviceID) {
        if (!this.#state.isInitialized) {
            const msg = "'init' must be called before 'setId'";
            L.e(`setId, ${msg}`);
            return msg;
        }

        L.d(`setId, Setting device id as: [${newDeviceID}]`);

        newDeviceID = newDeviceID.toString();
        this.#state.CountlyReactNative.setId([newDeviceID]);
    };
}

export default DeviceId;