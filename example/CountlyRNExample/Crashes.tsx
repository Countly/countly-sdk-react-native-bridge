import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge";
import CountlyButton from "./CountlyButton";

const addCrashLog = () => {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    Countly.addCrashLog(`My crash log in string. Time: ${timestamp.toString()}`);
};

const recordException = () => {
    Countly.addCrashLog("User Performed Step A");
    setTimeout(() => {
        Countly.addCrashLog("User Performed Step B");
    }, 1000);
    setTimeout(() => {
        Countly.addCrashLog("User Performed Step C");
        try {
            const a = {};
            const x = a.b.c; // this will create error.
        } catch (error) {
            const stack = error.stack.toString();
            Countly.logException(stack, true, { _library_a_version: "0.0.1" });
        }
    }, 1010);
};

const setCustomCrashSegments = () => {
    const segment = { Key: "Value" };
    Countly.setCustomCrashSegments(segment);
};

function CrashesScreen({ navigation }) {
    return (
        <SafeAreaView>
            <ScrollView>
                <CountlyButton onPress={addCrashLog} title="Add Crash Log" color="#00b5ad" />
                <CountlyButton onPress={recordException} title="Record Exception" color="#00b5ad" />
                <CountlyButton onPress={setCustomCrashSegments} title="Set Custom Crash Segment" color="#00b5ad" />
            </ScrollView>
        </SafeAreaView>
    );
}

export default CrashesScreen;
