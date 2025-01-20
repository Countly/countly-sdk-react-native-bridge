import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge-np";
import CountlyButton from "./CountlyButton";

const basicEvent = () => {
    // example for basic event
    Countly.events.recordEvent("Basic Event", undefined, 1);
};
const eventWithSum = () => {
    // example for event with sum
    Countly.events.recordEvent("Event With Sum", undefined, 1, 0.99);
};
const eventWithSegment = () => {
    // example for event with segment
    Countly.events.recordEvent("Event With Segment", { Country: "Paris", Age: 28 }, 1, undefined);
    Countly.events.recordEvent("Event With Segment", { Country: "France", Age: 38 }, 1, undefined);
        const segment: Segmentation = {
            stringList: ['value1', 'value2', 'value3'],
            intList: [1, 2, 3],
            doubleList: [1.1, 2.2, 3.3],
            boolList: [true, false, true],
            mixedList: ['value1', 2, 3.3, true],
            mapList: [ // currently this is not supported
              { key1: 'value1', key2: 2 },
              { key1: 'value2', key2: 3 },
              { key1: 'value3', key2: 4 }
            ], 
            nestedList: [ // currently this is not supported
              ['value1', 'value2'],
              ['value3', 'value4'],
              ['value5', 'value6']
            ], 
            normalString: 'normalString',
            normalInt: 1,
            normalDouble: 1.1,
            normalBool: true
          };
    Countly.events.recordEvent("Event With Segment With Mixed Types", segment, 1, undefined);
};
const eventWithSumAndSegment = () => {
    // example for event with segment and sum
    Countly.events.recordEvent("Event With Sum And Segment", { Country: "Lyon", Age: 28, height: 180.21, male: true, }, 1, 0.99);
    Countly.events.recordEvent("Event With Sum And Segment", { Country: "France", Age: 38, height: 150.55, male: false, }, 3, 1.99);
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
        Countly.events.endEvent("timedEventWithSum", undefined, undefined, 0.99);
    }, 1000);
};

const timedEventWithSegment = () => {
    // Event with segment
    Countly.events.startEvent("timedEventWithSegment");

    setTimeout(() => {
        Countly.events.endEvent("timedEventWithSegment", { Country: "Germany", Age: 32 }, undefined, undefined);
    }, 1000);
};

const timedEventWithSumAndSegment = () => {
    // Event with Segment, sum and count
    Countly.events.startEvent("timedEventWithSumAndSegment");

    setTimeout(() => {
        Countly.events.endEvent("timedEventWithSumAndSegment", { Country: "India", Age: 21 }, 1, 0.99);
    }, 1000);
};
// TIMED EVENTS

// Test Bad Values
const testEventWithBadValues = () => {
    Countly.events.recordEvent(10);
    Countly.events.recordEvent("Basic Event", "11");
    Countly.events.recordEvent("Basic Event", 1, "abc");
    Countly.events.recordEvent("Event With Sum", undefined, "1", "0.99");
    Countly.events.recordEvent("Event With Segment", ["Country", "France"], "1", "0.99");
    Countly.events.recordEvent("Event With Segment", { hello: ["Country", "France"] }, "abc", "def");
    Countly.events.recordEvent("timedEventWithSumAndSegment", { Country: "India", Age: 21 }, -2, 0.99);
    Countly.events.recordEvent(null, null, null, null);
    Countly.events.recordEvent(0, 0, 0, 0);
    Countly.events.recordEvent(" ", " ", " ", " ");
    Countly.events.recordEvent("", "", "", "");
};
// Test Bad Values

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
                <CountlyButton onPress={testEventWithBadValues} title="Test Event With Bad Values" color="#e0e0e0" />
                <CountlyButton onPress={eventSendThreshold} title="Set Event Threshold" color="#00b5ad" />
            </ScrollView>
        </SafeAreaView>
    );
}

export default EventScreen;
