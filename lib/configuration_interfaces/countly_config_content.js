import { i } from "../../Logger";

/**
 *
 * This class holds content feature configurations to be used with CountlyConfig 
 * class and serves as an interface.
 */
class CountlyConfigContent {
    constructor() {
        this._intervalLimit = 0;
        this._globalContentCallback = null;
    }

    get timerInterval() {
        return this._intervalLimit;
    }

    get contentCallback() {
        return this._globalContentCallback;
    }

    /**
     * Set the interval limit for zone timers. (minimum 15, default 30, seconds)
     * @param {Number} interval - interval limit for zone timers
     * @returns CountlyConfigContent
     */
    setZoneTimerInterval(interval) {
        this._intervalLimit = interval;
        return this;
    }

    /**
     * Set the global content callback
     * @param {Function} callback - callback function to be called for global content
     * @returns CountlyConfigContent
     */
    setGlobalContentCallback(callback) {
        this._globalContentCallback = callback;
        return this;
    }
}

export default CountlyConfigContent;
