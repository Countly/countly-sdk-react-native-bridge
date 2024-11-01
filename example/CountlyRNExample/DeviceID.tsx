import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge";
import CountlyButton from "./CountlyButton";
import { lightOrange } from "./Constants";

const temporaryDeviceIdMode = () => {
    Countly.changeDeviceId(Countly.TemporaryDeviceIDString, true);
};

const changeDeviceId = () => {
    Countly.changeDeviceId("02d56d66-6a39-482d-aff0-d14e4d5e5fda", true);
};

const setDeviceId = () => {
    Countly.deviceId.setId("TestingDeviceIDValue");
};

function DeviceIDScreen({ navigation }) {
    return (
        <SafeAreaView>
            <ScrollView>
                <CountlyButton title="Temporary Device ID Mode" onPress={temporaryDeviceIdMode} color={lightOrange} />
                <CountlyButton title="Change Device ID" onPress={changeDeviceId} color={lightOrange} />
                <CountlyButton title="Set Device ID" onPress={setDeviceId} color={lightOrange} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default DeviceIDScreen;
