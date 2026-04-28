import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge";
import CountlyButton from "./CountlyButton";

const styles = StyleSheet.create({
    noteText: {
        fontSize: 14,
        marginHorizontal: 20,
        marginTop: 10,
        textAlign: "center",
    },
    statusLabel: {
        fontSize: 15,
        fontWeight: "bold",
        marginHorizontal: 20,
        marginTop: 12,
        textAlign: "center",
    },
    statusText: {
        fontSize: 14,
        marginHorizontal: 20,
        marginTop: 8,
        textAlign: "center",
    },
});

function SessionsScreen() {
    const [isSessionActive, setIsSessionActive] = React.useState(true);
    const [status, setStatus] = React.useState("Manual session control is enabled. The example starts one session during initialization so you can update or end it here.");

    const updateStatus = (message: string) => {
        console.log(message);
        setStatus(message);
    };

    const startSession = () => {
        const result = Countly.startSession();

        if (result) {
            updateStatus(String(result));
            return;
        }

        setIsSessionActive(true);
        updateStatus("Started a manual session.");
    };

    const updateSession = () => {
        const result = Countly.updateSession();
        updateStatus(result ? String(result) : "Updated the active manual session.");
    };

    const endSession = () => {
        const result = Countly.endSession();

        if (result) {
            updateStatus(String(result));
            return;
        }

        setIsSessionActive(false);
        updateStatus("Ended the active manual session.");
    };

    return (
        <SafeAreaView>
            <ScrollView>
                <Text style={styles.noteText}>This example enables manual session control in the Countly configuration and starts an initial session during app bootstrap.</Text>
                <Text style={styles.statusLabel}>Current session state: {isSessionActive ? "active" : "ended"}</Text>
                <Text style={styles.statusText}>{status}</Text>
                <CountlyButton onPress={startSession} title="Start Session" color="#2DA657" lightText={true} disabled={isSessionActive} />
                <CountlyButton onPress={updateSession} title="Update Session" color="#FFA737" disabled={!isSessionActive} />
                <CountlyButton onPress={endSession} title="End Session" color="#1b1c1d" lightText={true} disabled={!isSessionActive} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default SessionsScreen;