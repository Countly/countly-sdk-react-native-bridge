import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge";
import CountlyButton from "./CountlyButton";

interface Segmentation {}
interface SegmentationCustom_1 extends Segmentation {
    Country: string;
    Age: string;
}
interface EventProps {
    eventName: string;
    segments?: Segmentation;
    eventCount?: number;
    eventSum?: string;
}
interface EventPropsCustom_1 extends EventProps {
    segments?: SegmentationCustom_1;
}

const basicEvent = () => {
    // example for basic event
    const event = { eventName: "Basic Event", eventCount: 1 };
    Countly.sendEvent(event);
};
const eventWithSum = () => {
    // example for event with sum
    const event = { eventName: "Event With Sum", eventCount: 1, eventSum: "0.99" };
    Countly.sendEvent(event);
};
const eventWithSegment = () => {
    // example for event with segment
    let event: EventPropsCustom_1 = {
        eventName: "Event With Segment",
        eventCount: 1,
        segments: { Country: "Turkey", Age: "28" },
    };
    event.segments = { Country: "Turkey", Age: "28" };
    Countly.sendEvent(event);
    event = {
        eventName: "Event With Segment",
        eventCount: 1,
        segments: { Country: "France", Age: "38" },
    };
    Countly.sendEvent(event);
};
const eventWithSumAndSegment = () => {
    // example for event with segment and sum
    let event: EventPropsCustom_1 = {
        eventName: "Event With Sum And Segment",
        eventCount: 1,
        eventSum: "0.99",
        segments: { Country: "Turkey", Age: "28" },
    };
    Countly.sendEvent(event);
    event = {
        eventName: "Event With Sum And Segment",
        eventCount: 3,
        eventSum: "1.99",
        segments: { Country: "France", Age: "38" },
    };
    Countly.sendEvent(event);
};

// TIMED EVENTS
const startEvent = () => {
    Countly.startEvent("timedEvent");
    setTimeout(() => {
        Countly.endEvent("timedEvent");
    }, 1000);
};

/*
    setTimeout may not work correctly if you are attached to Chrome Debugger.
    for workaround see: https://github.com/facebook/react-native/issues/9436
*/
const timedEventWithSum = () => {
    // Event with sum
    Countly.startEvent("timedEventWithSum");

    const event: EventProps = {
        eventName: "timedEventWithSum",
        eventSum: "0.99",
    };

    setTimeout(() => {
        Countly.endEvent(event);
    }, 1000);
};

const timedEventWithSegment = () => {
    // Event with segment
    Countly.startEvent("timedEventWithSegment");

    const event: EventPropsCustom_1 = {
        eventName: "timedEventWithSegment",
        segments: { Country: "Germany", Age: "32" },
    };
    setTimeout(() => {
        Countly.endEvent(event);
    }, 1000);
};

const timedEventWithSumAndSegment = () => {
    // Event with Segment, sum and count
    Countly.startEvent("timedEventWithSumAndSegment");

    const event: EventPropsCustom_1 = {
        eventName: "timedEventWithSumAndSegment",
        eventCount: 1,
        eventSum: "0.99",
        segments: { Country: "India", Age: "21" },
    };
    setTimeout(() => {
        Countly.endEvent(event);
    }, 1000);
};
// TIMED EVENTS

const eventSendThreshold = () => {
    Countly.setEventSendThreshold(10);
};

function EventScreen({ navigation }) {
    return (
        <SafeAreaView>
            <ScrollView>
                <CountlyButton onPress={basicEvent} title="Basic Event" color="#e0e0e0" />
                <CountlyButton onPress={eventWithSum} title="Event with Sum" color="#e0e0e0" />
                <CountlyButton onPress={eventWithSegment} title="Event with Segment" color="#e0e0e0" />
                <CountlyButton onPress={eventWithSumAndSegment} title="Even with Sum and Segment" color="#841584" />
                <CountlyButton onPress={startEvent} title="Timed event" color="#e0e0e0" />
                <CountlyButton onPress={timedEventWithSum} title="Timed events with Sum" color="#e0e0e0" />
                <CountlyButton onPress={timedEventWithSegment} title="Timed events with Segment" color="#e0e0e0" />
                <CountlyButton onPress={timedEventWithSumAndSegment} title="Timed events with Sum and Segment" color="#e0e0e0" />
                <CountlyButton onPress={eventSendThreshold} title="Set Event Threshold" color="#00b5ad" />
            </ScrollView>
        </SafeAreaView>
    );
}

export default EventScreen;
