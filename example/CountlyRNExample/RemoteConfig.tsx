import React from "react";
import { ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge";
import CountlyButton from "./CountlyButton";

type CountlyWithRemoteConfig = typeof Countly & {
    remoteConfig: {
        update(): Promise<void>;
        updateForKeysOnly(keyNames: readonly string[]): Promise<void>;
        updateExceptKeys(keyNames: readonly string[]): Promise<void>;
        getValue(keyName: string): Promise<unknown | null>;
        clearValues(): Promise<void>;
    };
};

const countly = Countly as CountlyWithRemoteConfig;

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

function serializeStatusValue(value: unknown) {
    if (value instanceof Error) {
        return value.message;
    }

    if (typeof value === "string") {
        return value;
    }

    const serialized = JSON.stringify(value);
    return serialized === undefined ? String(value) : serialized;
}

function RemoteConfigScreen() {
    const [keyName, setKeyName] = React.useState("stringValue");
    const [status, setStatus] = React.useState("Remote config responses will appear here.");

    const currentKey = keyName.trim() || "stringValue";

    const updateStatus = (label: string, data: unknown) => {
        const serialized = serializeStatusValue(data);
        const message = `${label}: ${serialized}`;

        console.log(message);
        setStatus(message);
    };

    const remoteConfigUpdate = async () => {
        try {
            await countly.remoteConfig.update();
            setStatus("Updated all remote config values.");
        } catch (error) {
            updateStatus("Failed to update remote config", error);
        }
    };

    const updateRemoteConfigForKeysOnly = async () => {
        try {
            await countly.remoteConfig.updateForKeysOnly([currentKey]);
            setStatus(`Updated only '${currentKey}'.`);
        } catch (error) {
            updateStatus(`Failed to update only '${currentKey}'`, error);
        }
    };

    const updateRemoteConfigExceptKeys = async () => {
        try {
            await countly.remoteConfig.updateExceptKeys([currentKey]);
            setStatus(`Updated all keys except '${currentKey}'.`);
        } catch (error) {
            updateStatus(`Failed to update all keys except '${currentKey}'`, error);
        }
    };

    const getRemoteConfigValueForKey = async () => {
        try {
            const data = await countly.remoteConfig.getValue(currentKey);
            updateStatus(`Value for '${currentKey}'`, data);
        } catch (error) {
            updateStatus(`Lookup failed for '${currentKey}'`, error);
        }
    };

    const remoteConfigClearValues = async () => {
        try {
            await countly.remoteConfig.clearValues();
            setStatus("Cleared remote config cache.");
        } catch (error) {
            updateStatus("Failed to clear remote config cache", error);
        }
    };

    return (
        <SafeAreaView>
            <ScrollView>
                <TextInput style={styles.inputRoundedBorder} placeholder="Remote config key" onChangeText={setKeyName} value={keyName} />
                <Text style={styles.statusText}>{status}</Text>
                <CountlyButton onPress={() => void remoteConfigUpdate()} title="Update Remote Config" color="#00b5ad" />
                <CountlyButton onPress={() => void updateRemoteConfigForKeysOnly()} title="Update Current Key Only" color="#00b5ad" />
                <CountlyButton onPress={() => void updateRemoteConfigExceptKeys()} title="Update Except Current Key" color="#00b5ad" />
                <CountlyButton onPress={() => void getRemoteConfigValueForKey()} title="Get Value" color="#00b5ad" />
                <CountlyButton onPress={() => void remoteConfigClearValues()} title="Clear remote config cache" color="#00b5ad" />
            </ScrollView>
        </SafeAreaView>
    );
}

export default RemoteConfigScreen;
