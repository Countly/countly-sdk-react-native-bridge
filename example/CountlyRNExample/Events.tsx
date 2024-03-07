import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge";
import CountlyButton from "./CountlyButton";

const basicEvent = () => {
    // example for basic event
    Countly.events.recordEvent("Basic Event", 1);
};
const eventWithSum = () => {
    // example for event with sum
    Countly.events.recordEvent("Event With Sum", 1, 0.99);
};
const eventWithSegment = () => {
    // example for event with segment
    Countly.events.recordEvent("Event With Segment", 1, undefined, { Country: "Turkey", Age: "28" });
    Countly.events.recordEvent("Event With Segment", 1, undefined, { Country: "France", Age: "38" });
};
const eventWithSumAndSegment = () => {
    // example for event with segment and sum
    Countly.events.recordEvent("Event With Sum And Segment", 1, 0.99, { Country: "Turkey", Age: "28" });
    Countly.events.recordEvent("Event With Sum And Segment", 3, 1.99, { Country: "France", Age: "38" });
};

// TIMED EVENTS
const startEvent = () => {
    Countly.events.startEvent("timedEvent");
    setTimeout(() => {
        Countly.events.endEvent("timedEvent");
    }, 1000);
};

/*
    setTimeout may not work correctly if you are attached to Chrome Debugger.
    for workaround see: https://github.com/facebook/react-native/issues/9436
*/
const timedEventWithSum = () => {
    // Event with sum
    Countly.events.startEvent("timedEventWithSum");

    setTimeout(() => {
        Countly.events.endEvent("timedEventWithSum", undefined, 0.99);
    }, 1000);
};

const timedEventWithSegment = () => {
    // Event with segment
    Countly.startEvent("timedEventWithSegment");

    setTimeout(() => {
        Countly.events.endEvent("timedEventWithSegment", undefined, undefined, { Country: "Germany", Age: "32" });
    }, 1000);
};

const timedEventWithSumAndSegment = () => {
    // Event with Segment, sum and count
    Countly.startEvent("timedEventWithSumAndSegment");

    setTimeout(() => {
        Countly.events.endEvent("timedEventWithSumAndSegment", 1, 0.99, { Country: "India", Age: "21" });
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
