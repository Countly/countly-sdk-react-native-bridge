/* eslint-disable react-native/no-inline-styles */
import React from "react";
import { Text, SafeAreaView, ScrollView, Alert } from "react-native";
import CountlyButton from "./CountlyButton";
import Countly from "countly-sdk-react-native-bridge";
import countlyConfig from "./Configuration";
import { lightGreen, navigationName } from "./Constants";

async function initialize() {
    const isInitialized = await Countly.isInitialized();
    if (!isInitialized) {
        await Countly.initWithConfig(countlyConfig);
        const sessionStartResult = Countly.startSession();

        if (sessionStartResult) {
            console.warn(sessionStartResult);
        }

        await Countly.appLoadingFinished();
    }

    return Countly.registerForNotification((theNotification: string) => {
        const jsonString = JSON.stringify(JSON.parse(theNotification));
        console.log(`Just received this notification data: ${jsonString}`);
        Alert.alert(`theNotification: ${jsonString}`);
    });
}

function HomeScreen({ navigation }) {
    React.useEffect(() => {
        let notificationSubscription: { remove?: () => void } | null = null;

        void initialize()
            .then((subscription) => {
                notificationSubscription = subscription;
            })
            .catch((error) => {
                console.error("Failed to initialize Countly example app", error);
            });

        return () => {
            notificationSubscription?.remove?.();
        };
    }, []);

    return (
        <SafeAreaView>
            <ScrollView>
                <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 10 }}>Features List</Text>
                <CountlyButton title="Integration Tests" onPress={() => navigation.navigate(navigationName.IntegrationTests)} color={lightGreen} lightText={true} />
                <CountlyButton title="Feedback" onPress={() => navigation.navigate(navigationName.Feedback)} color={lightGreen} lightText={true} />
                <CountlyButton title="Events" onPress={() => navigation.navigate(navigationName.Events)} color={lightGreen} lightText={true} />
                <CountlyButton title="Sessions" onPress={() => navigation.navigate(navigationName.Sessions)} color={lightGreen} lightText={true} />
                <CountlyButton title="User Profiles" onPress={() => navigation.navigate(navigationName.UserProfiles)} color={lightGreen} lightText={true} />
                <CountlyButton title="Views" onPress={() => navigation.navigate(navigationName.Views)} color={lightGreen} lightText={true} />
                <CountlyButton title="APM" onPress={() => navigation.navigate(navigationName.APM)} color={lightGreen} lightText={true} />
                <CountlyButton title="Device ID" onPress={() => navigation.navigate(navigationName.DeviceID)} color={lightGreen} lightText={true} />
                <CountlyButton title="Consent" onPress={() => navigation.navigate(navigationName.Consent)} color={lightGreen} lightText={true} />
                <CountlyButton title="Remote Config" onPress={() => navigation.navigate(navigationName.RemoteConfig)} color={lightGreen} lightText={true} />
                <CountlyButton title="Crashes" onPress={() => navigation.navigate(navigationName.Crashes)} color={lightGreen} lightText={true} />
                <CountlyButton title="Others" onPress={() => navigation.navigate(navigationName.Others)} color={lightGreen} lightText={true} />
                <CountlyButton title="Legacy APIs" onPress={() => navigation.navigate(navigationName.Legacy)} color={lightGreen} lightText={true} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default HomeScreen;
