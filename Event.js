import * as L from "./Logger.js";
import * as Validate from "./Validators.js";

class Event {
    #state;

    constructor(state) {
        this.#state = state;
    }

    /**
     * Record an event;
     *
     * @param {string} eventName - Name of the event.
     * @param {Segmentation} segments - segementation data for the event.
     * @param {number} eventCount - event count.
     * @param {number} eventSum - event sum.
     * @return {void} void
     */
    recordEvent(eventName, segments, eventCount, eventSum) {
        if (!this.#state.isInitialized) {
            L.d("recordEvent, 'init' must be called before 'recordEvent'");
            return;
        }
        if (!eventName) {
            L.d("recordEvent, eventName is required");
            return;
        }
        const validParameters = Validate.areEventParametersValid('recordEvent', eventName, segments, eventCount, eventSum);
        if (!validParameters) {
            return;
        }

        L.i(`recordEvent, Sending event: [eventName: ${eventName}, segments: ${JSON.stringify(segments)}, eventCount: ${eventCount}, eventSum: ${eventSum}]`);

        const args = {};
        args.n = eventName;

        if (eventCount) {
            args.c = eventCount;
        } else {
            args.c = 1;
        }

        args.s = eventSum;

        args.g = [];
        for (const event in segments) {
            args.g.push(event);
            args.g.push(segments[event]);
        }
        this.#state.CountlyReactNative.recordEvent(args);
    }

    /**
     *
     * Start Event
     * NB: If endEvent is not called (with the same event name),
     * no event will be recorded.
     *
     * @param {string} eventName name of event
     * @return {void} void
     */
    startEvent(eventName) {
        if (!this.#state.isInitialized) {
            L.d("startEvent, 'init' must be called before 'startEvent'");
            return;
        }
        const isInvalid = Validate.String(eventName, "eventName", "startEvent");
        if (isInvalid) {
            return;
        }
        L.i(`startEvent, Starting event: [${eventName}]`);
        this.#state.CountlyReactNative.startEvent([eventName]);
    }

    /**
     *
     * Cancels an Event
     *
     * @param {string} eventName name of event
     * @return {void} void
     */
    cancelEvent(eventName) {
        if (!this.#state.isInitialized) {
            L.d("cancelEvent, 'init' must be called before 'cancelEvent'");
            return;
        }
        const isInvalid = Validate.String(eventName, "eventName", "cancelEvent");
        if (isInvalid) {
            return;
        }
        L.i(`cancelEvent, Canceling event: [${eventName}]`);
        this.#state.CountlyReactNative.cancelEvent([eventName]);
    }

    /**
     *
     * End Event
     * NB: Should be called after startEvent.
     *
     * @param {string} eventName - Name of the event.
     * @param {Segmentation} segments - segementation data for the event.
     * @param {number} eventCount - event count.
     * @param {number} eventSum - event sum.
     * @return {void} void
     */
    endEvent(eventName, segments, eventCount, eventSum) {
        if (!this.#state.isInitialized) {
            L.d("endEvent, 'init' must be called before 'endEvent'");
            return;
        }
        const validParameters = Validate.areEventParametersValid('endEvent', eventName, segments, eventCount, eventSum);
        if (!validParameters) {
            return;
        }
        L.i(`endEvent, Sending event: [eventName: ${eventName}, segments: ${JSON.stringify(segments)}, eventCount: ${eventCount}, eventSum: ${eventSum}]`);

        const args = {};
        args.n = eventName;

        if (eventCount) {
            args.c = eventCount;
        } else {
            args.c = 1;
        }

        args.s = eventSum;

        args.g = [];
        for (const event in segments) {
            args.g.push(event);
            args.g.push(segments[event]);
        }
        this.#state.CountlyReactNative.endEvent(args);
    }
}

export default Event;
