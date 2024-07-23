/* eslint-disable react-native/no-inline-styles */
import React from "react";
import { Text, SafeAreaView, ScrollView, Alert } from "react-native";
import CountlyButton from "./CountlyButton";
import Countly from "countly-sdk-react-native-bridge-np";
import countlyConfig from "./Configuration";
import { lightGreen, navigationName } from "./Constants";

async function initialize() {
    if (await Countly.isInitialized()) {
        console.warn("Countly is already initialized");
        return;
    }

    await Countly.initWithConfig(countlyConfig); // Initialize the countly SDK.
    Countly.appLoadingFinished();
}

function HomeScreen({ navigation }) {
    initialize(); // Initialize the countly SDK.
    return (
        <SafeAreaView>
            <ScrollView>
                <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 10 }}>Features List</Text>
                <CountlyButton title="Feedback" onPress={() => navigation.navigate(navigationName.Feedback)} color={lightGreen} lightText={true} />
                <CountlyButton title="Events" onPress={() => navigation.navigate(navigationName.Events)} color={lightGreen} lightText={true} />
                <CountlyButton title="User Profiles" onPress={() => navigation.navigate(navigationName.UserProfiles)} color={lightGreen} lightText={true} />
                <CountlyButton title="Views" onPress={() => navigation.navigate(navigationName.Views)} color={lightGreen} lightText={true} />
                <CountlyButton title="APM" onPress={() => navigation.navigate(navigationName.APM)} color={lightGreen} lightText={true} />
                <CountlyButton title="Device ID" onPress={() => navigation.navigate(navigationName.DeviceID)} color={lightGreen} lightText={true} />
                <CountlyButton title="Consent" onPress={() => navigation.navigate(navigationName.Consent)} color={lightGreen} lightText={true} />
                <CountlyButton title="Remote Config" onPress={() => navigation.navigate(navigationName.RemoteConfig)} color={lightGreen} lightText={true} />
                <CountlyButton title="Crashes" onPress={() => navigation.navigate(navigationName.Crashes)} color={lightGreen} lightText={true} />
                <CountlyButton title="Others" onPress={() => navigation.navigate(navigationName.Others)} color={lightGreen} lightText={true} />
                <CountlyButton title="Events (Legacy)" onPress={() => navigation.navigate(navigationName.eventLegacy)} color={lightGreen} lightText={true} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default HomeScreen;
