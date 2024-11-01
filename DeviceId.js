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
            const message = "'init' must be called before 'getCurrentDeviceId'";
            L.e(`getCurrentDeviceId, ${message}`);
            return message;
        }
        L.d("getCurrentDeviceId, Getting current device id");
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
            L.e("getDeviceIDType, 'init' must be called before 'getDeviceIDType'");
            return null;
        }
        L.d("getDeviceIDType, Getting device id type");
        const result = await this.#state.CountlyReactNative.getDeviceIDType();
        return Utils.intToDeviceIDType(result);
    };
    
    /**
     * Change the current device id
     *
     * @param {string} newDeviceID id new device id
     * @param {boolean} onServer merge device id
     * @return {string | void} error message or void
     */
    changeDeviceId = function (newDeviceID, onServer) {
        if (!this.#state.isInitialized) {
            const msg = "'init' must be called before 'changeDeviceId'";
            L.e(`changeDeviceId, ${msg}`);
            return msg;
        }
        const message = Validate.String(newDeviceID, "newDeviceID", "changeDeviceId");
        if (message) {
            return message;
        }

        L.d(`changeDeviceId, Changing to new device id: [${newDeviceID}], with merge: [${onServer}]`);
        if (!onServer) {
            onServer = "0";
        } else {
            onServer = "1";
        }
        newDeviceID = newDeviceID.toString();
        this.#state.CountlyReactNative.changeDeviceId([newDeviceID, onServer]);
    };
}

export default DeviceId;