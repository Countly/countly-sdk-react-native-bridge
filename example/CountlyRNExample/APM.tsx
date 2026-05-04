import React from "react";
import { ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge-np";
import CountlyButton from "./CountlyButton";

const successCodes = [100, 101, 200, 201, 202, 205, 300, 301, 303, 305];
const failureCodes = [400, 402, 405, 408, 500, 501, 502, 505];

const random = (number: number) => {
    return Math.floor(Math.random() * number);
};

const styles = StyleSheet.create({
    inputRoundedBorder: {
        margin: 5,
        backgroundColor: "white",
        borderWidth: 1,
        borderRadius: 10,
        borderColor: "grey",
        padding: 10,
        fontSize: 16,
    },
    statusText: {
        fontSize: 14,
        marginHorizontal: 20,
        marginTop: 10,
        textAlign: "center",
    },
});

function APMScreen() {
    const [traceKey, setTraceKey] = React.useState("BridgeExampleTrace");
    const [status, setStatus] = React.useState("Trace actions will appear here.");

    const currentTraceKey = traceKey.trim() || "BridgeExampleTrace";

    const startTrace = () => {
        Countly.startTrace(currentTraceKey);
        setStatus(`Started trace '${currentTraceKey}'.`);
    };

    const endTrace = () => {
        Countly.endTrace(currentTraceKey, {
            durationBucket: 500,
            requestCount: 3,
        });
        setStatus(`Ended trace '${currentTraceKey}' with custom metrics.`);
    };

    const cancelTrace = () => {
        Countly.cancelTrace(currentTraceKey);
        setStatus(`Canceled trace '${currentTraceKey}'.`);
    };

    const clearAllTraces = () => {
        Countly.clearAllTraces();
        setStatus("Cleared all active traces.");
    };

    const recordNetworkTrace = (responseCode: number) => {
        const requestPayloadSize = random(700) + 200;
        const responsePayloadSize = random(700) + 200;
        const startTime = new Date().getTime();
        const endTime = startTime + 500;
        const networkTraceKey = `${currentTraceKey}/network`;

        Countly.recordNetworkTrace(networkTraceKey, responseCode, requestPayloadSize, responsePayloadSize, startTime, endTime);
        setStatus(`Recorded network trace '${networkTraceKey}' with response code ${responseCode}.`);
    };

    return (
        <SafeAreaView>
            <ScrollView>
                <TextInput style={styles.inputRoundedBorder} placeholder="Enter a trace key" onChangeText={setTraceKey} value={traceKey} />
                <Text style={styles.statusText}>{status}</Text>
                <CountlyButton onPress={startTrace} title="Start Trace" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={endTrace} title="End Trace" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={cancelTrace} title="Cancel Trace" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={clearAllTraces} title="Clear All Traces" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={() => recordNetworkTrace(successCodes[random(successCodes.length)])} title="Record Network Trace Success" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={() => recordNetworkTrace(failureCodes[random(failureCodes.length)])} title="Record Network Trace Failure" color="#1b1c1d" lightText={true} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default APMScreen;
