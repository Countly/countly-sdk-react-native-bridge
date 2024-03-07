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
        L.d(`recordEvent, Sending event: [eventName: ${eventName}, eventCount: ${eventCount}, eventSum: ${eventSum}, segments: ${segments}]`);

        const args = [];
        let eventType = "event"; // event, eventWithSum, eventWithSegment, eventWithSumSegment

        if (eventSum) {
            eventType = "eventWithSum";
        }
        if (segments) {
            eventType = "eventWithSegment";
        }
        if (segments && eventSum) {
            eventType = "eventWithSumSegment";
        }

        args.push(eventType);
        args.push(eventName);

        if (eventCount) {
            args.push(eventCount);
        } else {
            args.push(1);
        }

        if (eventSum) {
            let eventSumTemp = eventSum.toString();
            if (eventSumTemp.indexOf(".") === -1) {
                eventSumTemp = parseFloat(eventSumTemp).toFixed(2);
                args.push(eventSumTemp);
            } else {
                args.push(eventSum);
            }
        }

        for (const event in segments) {
            args.push(event);
            args.push(segments[event]);
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
     * @param {string} eventName event name. 
     * @param {number} eventCount event count. 
     * @param {number} eventSum event sum. 
     * @param {Segmentation} segments event segmentation.
     * @return {string | void} error message or void
     */
    endEvent(eventName, eventCount, eventSum, segments) {
        if (!this.#state.isInitialized) {
            const message = "'init' must be called before 'endEvent'";
            L.e(`endEvent, ${message}`);
            return message;
        }
        L.d(`endEvent, Ending event: [eventName: ${eventName}, eventCount: ${eventCount}, eventSum: ${eventSum}, segments: ${segments}]`);

        if (!eventName) {
            const message = "endEvent, eventName is required";
            L.e(`endEvent, ${message}`);
            return message;
        }

        const args = [];
        let eventType = "event"; // event, eventWithSum, eventWithSegment, eventWithSumSegment

        if (eventSum) {
            eventType = "eventWithSum";
        }
        if (segments) {
            eventType = "eventWithSegment";
        }
        if (segments && eventSum) {
            eventType = "eventWithSumSegment";
        }

        args.push(eventType);

        if (!eventName) {
            eventName = "";
        }
        args.push(eventName);

        if (!eventCount) {
            eventCount = 1;
        }
        args.push(eventCount);

        if (eventSum) {
            let eventSumTemp = eventSum.toString();
            if (eventSumTemp.indexOf(".") === -1) {
                eventSumTemp = parseFloat(eventSumTemp).toFixed(2);
                args.push(eventSumTemp);
            } else {
                args.push(eventSum);
            }
        } else {
            args.push("0.0");
        }

        for (const event in segments) {
            args.push(event);
            args.push(segments[event]);
        }
        this.#state.CountlyReactNative.endEvent(args);
    }
}

export default Event;
