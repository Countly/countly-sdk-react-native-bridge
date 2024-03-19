import * as L from "./Logger.js";
import * as Validate from "./Validators.js";

class Event {
    #state;

    constructor(state) {
        this.#state = state;
    }

    /**
     * Used to send various types of event;
     *
     * @param {string} eventName event name.
     * @param {number} eventCount event count.
     * @param {number} eventSum event sum.
     * @param {Segmentation} segments event segmentation.
     * @return {string | void} error message or void
     */
    recordEvent(eventName, eventCount, eventSum, segments) {
        if (!this.#state.isInitialized) {
            const message = "'init' must be called before 'recordEvent'";
            L.e(`recordEvent, ${message}`);
            return message;
        }
        if (!eventName) {
            const message = "recordEvent, eventName is required";
            L.e(`recordEvent, ${message}`);
            return message;
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
     * @return {string | void} error message or void
     */
    startEvent(eventName) {
        if (!this.#state.isInitialized) {
            const msg = "'init' must be called before 'startEvent'";
            L.e(`startEvent, ${msg}`);
            return msg;
        }
        const message = Validate.String(eventName, "eventName", "startEvent");
        if (message) {
            return message;
        }
        L.i(`startEvent, Starting event: [${eventName}]`);
        this.#state.CountlyReactNative.startEvent([eventName.toString()]);
    }

    /**
     *
     * Cancel Event
     *
     * @param {string} eventName name of event
     * @return {string | void} error message or void
     */
    cancelEvent(eventName) {
        if (!this.#state.isInitialized) {
            const msg = "'init' must be called before 'cancelEvent'";
            L.e(`cancelEvent, ${msg}`);
            return msg;
        }
        const message = Validate.String(eventName, "eventName", "cancelEvent");
        if (message) {
            return message;
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
     * @return {string | void} error message or void
     */
    endEvent(eventName, segments, eventCount, eventSum) {
        if (!this.#state.isInitialized) {
            const message = "'init' must be called before 'endEvent'";
            L.e(`endEvent, ${message}`);
            return message;
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
