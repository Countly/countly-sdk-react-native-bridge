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
     * @param {CountlyEventOptions} options event
     * @return {string | void} error message or void
     */
    sendEvent(options) {
        if (!this.#state.isInitialized) {
            const message = "'init' must be called before 'sendEvent'";
            L.e(`sendEvent, ${message}`);
            return message;
        }
        if (!options) {
            const message = "sendEvent, no event object provided";
            L.e(`sendEvent, ${message}`);
            return message;
        }
        if (!options.eventName) {
            const message = "sendEvent, eventName is required";
            L.e(`sendEvent, ${message}`);
            return message;
        }
        L.d(`sendEvent, Sending event: ${JSON.stringify(options)}]`);

        const args = [];
        let eventType = "event"; // event, eventWithSum, eventWithSegment, eventWithSumSegment
        let segments = {};

        if (options.eventSum) {
            eventType = "eventWithSum";
        }
        if (options.segments) {
            eventType = "eventWithSegment";
        }
        if (options.segments && options.eventSum) {
            eventType = "eventWithSumSegment";
        }

        args.push(eventType);
        args.push(options.eventName.toString());

        if (options.eventCount) {
            args.push(options.eventCount.toString());
        } else {
            args.push("1");
        }

        if (options.eventSum) {
            options.eventSum = options.eventSum.toString();
            if (options.eventSum.indexOf(".") === -1) {
                options.eventSum = parseFloat(options.eventSum).toFixed(2);
                args.push(options.eventSum);
            } else {
                args.push(options.eventSum);
            }
        }

        if (options.segments) {
            segments = options.segments;
        }
        for (const event in segments) {
            args.push(event);
            args.push(segments[event]);
        }
        this.#state.this.#state.CountlyReactNative.event(args);
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
        L.d(`startEvent, Starting event: [${eventName}]`);
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
        L.d(`cancelEvent, Canceling event: [${eventName}]`);
        this.#state.CountlyReactNative.cancelEvent([eventName.toString()]);
    }

    /**
     *
     * End Event
     *
     * @param {string | CountlyEventOptions} options event options
     * @return {string | void} error message or void
     */
    endEvent(options) {
        if (!this.#state.isInitialized) {
            const message = "'init' must be called before 'endEvent'";
            L.e(`endEvent, ${message}`);
            return message;
        }
        L.d(`endEvent, Ending event: [${JSON.stringify(options)}]`);
        if (typeof options === "string") {
            options = { eventName: options };
        }
        const args = [];
        let eventType = "event"; // event, eventWithSum, eventWithSegment, eventWithSumSegment
        let segments = {};

        if (options.eventSum) {
            eventType = "eventWithSum";
        }
        if (options.segments) {
            eventType = "eventWithSegment";
        }
        if (options.segments && options.eventSum) {
            eventType = "eventWithSumSegment";
        }

        args.push(eventType);

        if (!options.eventName) {
            options.eventName = "";
        }
        args.push(options.eventName.toString());

        if (!options.eventCount) {
            options.eventCount = "1";
        }
        args.push(options.eventCount.toString());

        if (options.eventSum) {
            let eventSumTemp = options.eventSum.toString();
            if (eventSumTemp.indexOf(".") === -1) {
                eventSumTemp = parseFloat(eventSumTemp).toFixed(2);
                args.push(eventSumTemp);
            } else {
                args.push(eventSumTemp);
            }
        } else {
            args.push("0.0");
        }

        if (options.segments) {
            segments = options.segments;
        }
        for (const event in segments) {
            args.push(event);
            args.push(segments[event]);
        }
        this.#state.CountlyReactNative.endEvent(args);
    }
}

export default Event;
