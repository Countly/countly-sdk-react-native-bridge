import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge-np";
import CountlyButton from "./CountlyButton";

const successCodes = [100, 101, 200, 201, 202, 205, 300, 301, 303, 305];
const failureCodes = [400, 402, 405, 408, 500, 501, 502, 505];

const startTrace = () => {
    const traceKey = "Trace Key";
    Countly.startTrace(traceKey);
};
const endTrace = () => {
    const traceKey = "Trace Key";
    const customMetric = {
        ABC: 1233,
        C44C: 1337,
    };
    Countly.endTrace(traceKey, customMetric);
};
const random = (number: number) => {
    return Math.floor(Math.random() * number);
};
const recordNetworkTraceSuccess = () => {
    const networkTraceKey = "api/endpoint.1";
    const responseCode = successCodes[random(successCodes.length)];
    const requestPayloadSize = random(700) + 200;
    const responsePayloadSize = random(700) + 200;
    const startTime = new Date().getTime();
    const endTime = startTime + 500;
    Countly.recordNetworkTrace(networkTraceKey, responseCode, requestPayloadSize, responsePayloadSize, startTime, endTime);
};
const recordNetworkTraceFailure = () => {
    const networkTraceKey = "api/endpoint.1";
    const responseCode = failureCodes[random(failureCodes.length)];
    const requestPayloadSize = random(700) + 250;
    const responsePayloadSize = random(700) + 250;
    const startTime = new Date().getTime();
    const endTime = startTime + 500;
    Countly.recordNetworkTrace(networkTraceKey, responseCode, requestPayloadSize, responsePayloadSize, startTime, endTime);
};

function APMScreen({ navigation }) {
    return (
        <SafeAreaView>
            <ScrollView>
                <CountlyButton onPress={startTrace} title="Start Trace" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={endTrace} title="End Trace" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={recordNetworkTraceSuccess} title="End Network Request Success" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={recordNetworkTraceFailure} title="End Network Request Failure" color="#1b1c1d" lightText={true} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default APMScreen;
