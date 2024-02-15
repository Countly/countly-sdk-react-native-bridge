/**
 * Countly SDK React Native Bridge APM Configuration
 * https://github.com/Countly/countly-sdk-react-native-bridge
 * @Countly
 */

/**
 *
 * This class holds APM specific configurations to be used with CountlyConfig 
 * class and serves as an interface.
 */
class CountlyConfigApm {
    constructor() {
        this._enableForegroundBackground = false;
        this._enableManualAppLoaded = false;
        this._startTSOverride = 0;
        this._trackAppStartTime = false;
    }

    enableForegroundBackground = this._enableForegroundBackground;

    enableManualAppLoaded = this._enableManualAppLoaded;

    startTSOverride = this._startTSOverride;

    trackAppStartTime = this._trackAppStartTime;

    /**
     * Enables the tracking of app start time. (For iOS after this call you 
     * will have to call [enableManualAppLoadedTrigger])
     */
    enableAppStartTimeTracking() {
        this._trackAppStartTime = true;
        return this;
    }

    /**
     * Enables the automatic tracking of app foreground and background 
     * durations.
     */
    enableForegroundBackgroundTracking() {
        this._enableForegroundBackground = true;
        return this;
    }

    /**
     * Enables the usage of manual trigger [Countly.appLoadingFinished] to 
     * determine app start finish time.
     */
    enableManualAppLoadedTrigger() {
        this._enableManualAppLoaded = true;
        return this;
    }

    /**
     * Gives you the ability to override the app start initial timestamp.
     * [timestamp] is the timestamp (in milliseconds)
     */
    setAppStartTimestampOverride(timestamp) {
        if (timestamp > 0) {
            this._startTSOverride = timestamp;
        }
        return this;
    }
}

export default CountlyConfigApm;
