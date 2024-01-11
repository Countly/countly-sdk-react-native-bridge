import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge";
import CountlyButton from "./CountlyButton";

const giveConsent = (name: string) => {
    Countly.giveConsent([name]);
};

const removeConsent = (name: string) => {
    Countly.removeConsent([name]);
};

const giveMultipleConsent = () => {
    Countly.giveConsent(["events", "views", "star-rating", "crashes", "invalidFeatureName"]);
};

const removeMultipleConsent = () => {
    Countly.removeConsent(["events", "views"]);
};

const giveAllConsent = () => {
    Countly.giveAllConsent();
};

const removeAllConsent = () => {
    Countly.removeAllConsent();
};

function ConsentScreen({ navigation }) {
    return (
        <SafeAreaView>
            <ScrollView>
                <CountlyButton onPress={giveAllConsent} title="Give all Consent" color="#00b5ad" />
                <CountlyButton onPress={removeAllConsent} title="Remove all Consent" color="#00b5ad" />
                <CountlyButton
                    onPress={() => {
                        giveConsent("sessions");
                    }}
                    title="Give sessions"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        giveConsent("events");
                    }}
                    title="Give events"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        giveConsent("views");
                    }}
                    title="Give views"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        giveConsent("location");
                    }}
                    title="Give location"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        giveConsent("crashes");
                    }}
                    title="Give crashes"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        giveConsent("attribution");
                    }}
                    title="Give attribution"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        giveConsent("users");
                    }}
                    title="Give users"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        giveConsent("push");
                    }}
                    title="Give push"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        giveConsent("star-rating");
                    }}
                    title="Give star-rating"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        giveConsent("apm");
                    }}
                    title="Give APM"
                    color="#00b5ad"
                />

                <CountlyButton
                    onPress={() => {
                        removeConsent("sessions");
                    }}
                    title="Remove sessions"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        removeConsent("events");
                    }}
                    title="Remove events"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        removeConsent("views");
                    }}
                    title="Remove views"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        removeConsent("location");
                    }}
                    title="Remove location"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        removeConsent("crashes");
                    }}
                    title="Remove crashes"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        removeConsent("attribution");
                    }}
                    title="Remove attribution"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        removeConsent("users");
                    }}
                    title="Remove users"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        removeConsent("push");
                    }}
                    title="Remove push"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        removeConsent("star-rating");
                    }}
                    title="Remove star-rating"
                    color="#00b5ad"
                />
                <CountlyButton
                    onPress={() => {
                        removeConsent("apm");
                    }}
                    title="Remove APM"
                    color="#00b5ad"
                />
                <CountlyButton onPress={giveMultipleConsent} title="Give multiple consent" color="#00b5ad" />
                <CountlyButton onPress={removeMultipleConsent} title="Remove multiple consent" color="#00b5ad" />
            </ScrollView>
        </SafeAreaView>
    );
}

export default ConsentScreen;
