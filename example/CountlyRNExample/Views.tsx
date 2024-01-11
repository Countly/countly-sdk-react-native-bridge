import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge";
import CountlyButton from "./CountlyButton";

function ViewsScreen({ navigation }) {
    return (
        <SafeAreaView>
            <ScrollView>
                <CountlyButton
                    onPress={function () {
                        Countly.recordView("HomePage");
                    }}
                    title="Record View: 'HomePage'"
                    color="#e0e0e0"
                />
                <CountlyButton
                    onPress={function () {
                        Countly.recordView("Dashboard");
                    }}
                    title="Record View: 'Dashboard'"
                    color="#e0e0e0"
                />
                <CountlyButton
                    onPress={function () {
                        Countly.recordView("HomePage", {
                            version: "1.0",
                            _facebook_version: "0.0.1",
                        });
                    }}
                    title="Record View: 'HomePage' with Segment"
                    color="#e0e0e0"
                />
            </ScrollView>
        </SafeAreaView>
    );
}

export default ViewsScreen;
