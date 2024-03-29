import * as L from "./Logger.js";
import * as Validate from "./Validators.js";

class Event {
    #state;

    constructor(state) {
        this.#state = state;
    }

    /**
     * Used to record an event;
     *
     * @param {string} eventName event name.
     * @param {Segmentation} segments event segmentation.
     * @param {number} eventCount event count.
     * @param {number} eventSum event sum.
     * @return {void} void
     */
    recordEvent(eventName, segments, eventCount, eventSum) {
        if (!this.#state.isInitialized) {
            L.e("recordEvent, 'init' must be called before 'recordEvent'");
            return;
        }
        if (!eventName) {
            L.e("recordEvent, eventName is required");
            return;
        }
        const validParameters = Validate.isEventParametersValid('recordEvent', eventName, segments, eventCount, eventSum);
        if (!validParameters) {
            return;
        }

        L.i(`recordEvent, Sending event: [eventName: ${eventName}, eventCount: ${eventCount}, eventSum: ${eventSum}, segments: ${segments}]`);

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
        this.#state.CountlyReactNative.event(args);
    }

    /**
     *
     * Start Event
     *
     * @param {string} eventName name of event
     * @return {void} void
     */
    startEvent(eventName) {
        if (!this.#state.isInitialized) {
            L.e("startEvent, 'init' must be called before 'startEvent'");
            return;
        }
        const message = Validate.String(eventName, "eventName", "startEvent");
        if (message) {
            L.e(`startEvent, ${message}`);
            return;
        }
        L.i(`startEvent, Starting event: [${eventName}]`);
        this.#state.CountlyReactNative.startEvent([eventName.toString()]);
    }

    /**
     *
     * Cancel Event
     *
     * @param {string} eventName name of event
     * @return {void} void
     */
    cancelEvent(eventName) {
        if (!this.#state.isInitialized) {
            L.e("cancelEvent, 'init' must be called before 'cancelEvent'");
            return msg;
        }
        const message = Validate.String(eventName, "eventName", "cancelEvent");
        if (message) {
            L.e(`cancelEvent, ${message}`);
            return;
        }
        L.i(`cancelEvent, Canceling event: [${eventName}]`);
        this.#state.CountlyReactNative.cancelEvent([eventName.toString()]);
    }

    /**
     *
     * End Event
     *
     * @param {string} eventName event name.
     * @param {Segmentation} segments event segmentation.
     * @param {number} eventCount event count.
     * @param {number} eventSum event sum.
     * @return {void} void
     */
    endEvent(eventName, segments, eventCount, eventSum) {
        if (!this.#state.isInitialized) {
            L.e("endEvent, 'init' must be called before 'endEvent'");
            return;
        }
        const validParameters = Validate.isEventParametersValid('recordEvent', eventName, segments, eventCount, eventSum);
        if (!validParameters) {
            return;
        }
        L.i(`recordEvent, Sending event: [eventName: ${eventName}, segments: ${segments}, eventCount: ${eventCount}, eventSum: ${eventSum}]`);

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
