import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge-np";
import CountlyButton from "./CountlyButton";

const consentFeatures = ["sessions", "events", "views", "location", "crashes", "attribution", "users", "push", "star-rating", "apm", "feedback", "remote-config"];

const formatConsentLabel = (name: string) => {
    if (name === "apm") {
        return "APM";
    }

    return name.replace("-", " ");
};

const giveConsent = (name: string) => {
    Countly.giveConsent([name]);
};

const removeConsent = (name: string) => {
    Countly.removeConsent([name]);
};

const giveMultipleConsent = () => {
    Countly.giveConsent(["events", "views", "feedback", "remote-config", "invalidFeatureName"]);
};

const removeMultipleConsent = () => {
    Countly.removeConsent(["events", "views", "feedback", "remote-config"]);
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
                {consentFeatures.map((feature) => (
                    <CountlyButton key={`give-${feature}`} onPress={() => giveConsent(feature)} title={`Give ${formatConsentLabel(feature)}`} color="#00b5ad" />
                ))}
                {consentFeatures.map((feature) => (
                    <CountlyButton key={`remove-${feature}`} onPress={() => removeConsent(feature)} title={`Remove ${formatConsentLabel(feature)}`} color="#00b5ad" />
                ))}
                <CountlyButton onPress={giveMultipleConsent} title="Give multiple consent" color="#00b5ad" />
                <CountlyButton onPress={removeMultipleConsent} title="Remove multiple consent" color="#00b5ad" />
            </ScrollView>
        </SafeAreaView>
    );
}

export default ConsentScreen;
