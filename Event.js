import * as L from "./Logger.js";
import * as Validate from "./Validators.js";

class Event {
    #state;

    constructor(state) {
        this.#state = state;
    }

    /**
     * Records an event.
     * Event will be saved to the internal queue and will be sent to the server with the next trigger.
     *
     * @param {string} eventName - Name of the event (This will be displayed on the dashboard)
     * @param {Segmentation} segmentation - Extra information to send with your event as key/value pairs
     * @param {number} eventCount - Indicates how many times this event has happened (Default is 1)
     * @param {number} eventSum - A numerical value that is attached to this event (Will be summed up on the dashboard for all events with the same name)
     * @return {void}
     */
    recordEvent(eventName, segmentation, eventCount, eventSum) {
        if (!this.#state.isInitialized) {
            L.w("recordEvent, SDK must be initialized before calling 'recordEvent'");
            return;
        }
        L.i(`recordEvent, called with eventName: [${eventName}], segmentation: [${JSON.stringify(segmentation)}], eventCount: [${eventCount}], eventSum: [${eventSum}]`);
        const areParamsValid = Validate.areEventParametersValid("recordEvent", eventName, segmentation, eventCount, eventSum);
        if (!areParamsValid) {
            return;
        }

        // At this point all parameters should be valid (eventName should exist but other parameters are optional)
        const args = {};
        args.n = eventName; // mandatory
        args.c = eventCount || 1; // default is 1
        args.s = eventSum || 0; // default is 0
        if (segmentation) { // optional
            args.g = [];
            for (const key in segmentation) {
                args.g.push(key);
                args.g.push(segmentation[key]);
            }
        }
        this.#state.CountlyReactNative.recordEvent(args);
    }

    /**
     *
     * Starts a Timed Event
     * If 'endEvent' is not called (with the same event name) no event will be recorded.
     *
     * @param {string} eventName - name of the event
     * @return {void}
     */
    startEvent(eventName) {
        if (!this.#state.isInitialized) {
            L.w("startEvent, SDK must be initialized before calling 'startEvent'");
            return;
        }
        L.i(`startEvent, called with eventName: [${eventName}]`);
        const areParamsValid = Validate.areEventParametersValid("startEvent", eventName, null, null, null);
        if (!areParamsValid) {
            return;
        }
        this.#state.CountlyReactNative.startEvent([eventName]);
    }

    /**
     *
     * Cancels a Timed Event if it is started.
     *
     * @param {string} eventName - name of the event
     * @return {void}
     */
    cancelEvent(eventName) {
        if (!this.#state.isInitialized) {
            L.w("cancelEvent, SDK must be initialized before calling 'cancelEvent'");
            return;
        }
        L.i(`cancelEvent, called with eventName: [${eventName}]`);
        const areParamsValid = Validate.areEventParametersValid("cancelEvent", eventName, null, null, null);
        if (!areParamsValid) {
            return;
        }
        this.#state.CountlyReactNative.cancelEvent([eventName]);
    }

    /**
     *
     * Ends a Timed Event if it is started.
     * Should be called after startEvent.
     * This will behave like recordEvent.
     *
     * @param {string} eventName - Name of the event (This will be displayed on the dashboard)
     * @param {Segmentation} segmentation - Extra information to send with your event as key/value pairs
     * @param {number} eventCount - Indicates how many times this event has happened (Default is 1)
     * @param {number} eventSum - A numerical value that is attached to this event (Will be summed up on the dashboard for all events with the same name)
     * @return {void} void
     */
    endEvent(eventName, segmentation, eventCount, eventSum) {
        if (!this.#state.isInitialized) {
            L.w("endEvent, SDK must be initialized before calling 'endEvent'");
            return;
        }
        L.i(`endEvent, called with eventName: [${eventName}], segmentation: [${JSON.stringify(segmentation)}], eventCount: [${eventCount}], eventSum: [${eventSum}]`);
        const validParameters = Validate.areEventParametersValid("endEvent", eventName, segmentation, eventCount, eventSum);
        if (!validParameters) {
            return;
        }

        // At this point all parameters should be valid (eventName should exist but other parameters are optional)
        const args = {};
        args.n = eventName; // mandatory
        args.c = eventCount || 1; // default is 1
        args.s = eventSum || 0; // default is 0
        if (segmentation) { // optional
            args.g = [];
            for (const key in segmentation) {
                args.g.push(key);
                args.g.push(segmentation[key]);
            }
        }
        this.#state.CountlyReactNative.endEvent(args);
    }
}

export default Event;
