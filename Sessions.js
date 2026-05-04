import * as L from "./Logger.js";

class Sessions {
    #state;

    constructor(state) {
        this.#state = state;
    }

    /**
     * Starts a manual session.
     * Requires CountlyConfig.enableManualSessionControl().
     *
     * @returns {void}
     */
    beginSession() {
        if (!this.#state.isInitialized) {
            const message = "'init' must be called before 'Countly.sessions.beginSession'";
            L.e(`beginSession, ${message}`);
            return;
        }

        L.d("beginSession, Starting session");
        this.#state.CountlyReactNative.startSession();
    }

    /**
     * Updates the active manual session.
     * Requires CountlyConfig.enableManualSessionControl().
     *
     * @returns {void}
     */
    updateSession() {
        if (!this.#state.isInitialized) {
            const message = "'init' must be called before 'Countly.sessions.updateSession'";
            L.e(`updateSession, ${message}`);
            return;
        }

        L.d("updateSession, Updating session");
        this.#state.CountlyReactNative.updateSession();
    }

    /**
     * Ends the active manual session.
     * Requires CountlyConfig.enableManualSessionControl().
     *
     * @returns {void}
     */
    endSession() {
        if (!this.#state.isInitialized) {
            const message = "'init' must be called before 'Countly.sessions.endSession'";
            L.e(`endSession, ${message}`);
            return;
        }

        L.d("endSession, Ending session");
        this.#state.CountlyReactNative.endSession();
    }
}

export default Sessions;