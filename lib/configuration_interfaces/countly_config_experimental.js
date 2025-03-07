/**
 *
 * This class holds experimental configurations to be used with CountlyConfig 
 * class and serves as an interface.
 */
class CountlyConfigExp {
    constructor() {
        this._enablePreviousNameRecording = false;
        this._enableVisibilityTracking = false;
    }

    get previousNameRecording() {
        return this._enablePreviousNameRecording;
    }

    get visibilityTracking() {
        return this._enableVisibilityTracking;
    }

    /**
     * Enables the reporting of previous view/event names.
     * @returns CountlyConfigExp
     */
    enablePreviousNameRecording() {
        this._enablePreviousNameRecording = true;
        return this;
    }

    /**
     * Enables the tracking of app visibility with events.
     * @returns CountlyConfigExp
     */
    enableVisibilityTracking() {
        this._enableVisibilityTracking = true;
        return this;
    }
}

export default CountlyConfigExp;
