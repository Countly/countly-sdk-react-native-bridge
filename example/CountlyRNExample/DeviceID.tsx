import React from "react";
import { ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge";
import CountlyButton from "./CountlyButton";
import { lightOrange } from "./Constants";

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

function DeviceIDScreen() {
    const [nextDeviceId, setNextDeviceId] = React.useState("TestingDeviceIDValue");
    const [status, setStatus] = React.useState("Current device ID details and update results will appear here.");

    const currentDeviceId = nextDeviceId.trim() || "TestingDeviceIDValue";

    const readDeviceId = async () => {
        const deviceId = await Countly.deviceId.getID();
        setStatus(`Current device ID: ${String(deviceId)}`);
    };

    const readDeviceIdType = async () => {
        const deviceIdType = await Countly.deviceId.getType();
        setStatus(`Current device ID type: ${String(deviceIdType)}`);
    };

    const setDeviceId = () => {
        Countly.deviceId.setID(currentDeviceId);
        setStatus(`Set device ID to '${currentDeviceId}' using automatic merge selection.`);
    };

    const changeDeviceIdWithMerge = () => {
        Countly.deviceId.changeID(currentDeviceId, true);
        setStatus(`Changed device ID to '${currentDeviceId}' with merge enabled.`);
    };

    const changeDeviceIdWithoutMerge = () => {
        Countly.deviceId.changeID(currentDeviceId, false);
        setStatus(`Changed device ID to '${currentDeviceId}' without merge.`);
    };

    const temporaryDeviceIdMode = () => {
        Countly.deviceId.setID(Countly.TemporaryDeviceIDString);
        setStatus("Switched to temporary device ID mode.");
    };

    return (
        <SafeAreaView>
            <ScrollView>
                <TextInput style={styles.inputRoundedBorder} placeholder="Enter a device ID" onChangeText={setNextDeviceId} value={nextDeviceId} />
                <Text style={styles.statusText}>{status}</Text>
                <CountlyButton title="Get Device ID" onPress={() => void readDeviceId()} color={lightOrange} />
                <CountlyButton title="Get Device ID Type" onPress={() => void readDeviceIdType()} color={lightOrange} />
                <CountlyButton title="Temporary Device ID Mode" onPress={temporaryDeviceIdMode} color={lightOrange} />
                <CountlyButton title="Set Device ID (Auto)" onPress={setDeviceId} color={lightOrange} />
                <CountlyButton title="Change Device ID With Merge" onPress={changeDeviceIdWithMerge} color={lightOrange} />
                <CountlyButton title="Change Device ID Without Merge" onPress={changeDeviceIdWithoutMerge} color={lightOrange} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default DeviceIDScreen;
