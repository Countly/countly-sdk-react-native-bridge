import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge";
import CountlyButton from "./CountlyButton";
import { COUNTLY_APP_KEY, COUNTLY_SERVER_URL } from "./Configuration";

class AttributionKey {
    static IDFA = "idfa";

    static AdvertisingID = "adid";
}

const campaignData = "{\"cid\":\"[PROVIDED_CAMPAIGN_ID]\", \"cuid\":\"[PROVIDED_CAMPAIGN_USER_ID]\"}";

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

function OthersScreen() {
    const [contentId, setContentId] = React.useState("homepage-banner");
    const [pushToken, setPushToken] = React.useState("sample-push-token");
    const [serverUrl, setServerUrl] = React.useState(COUNTLY_SERVER_URL);
    const [appKey, setAppKey] = React.useState(COUNTLY_APP_KEY);
    const [status, setStatus] = React.useState("Utility actions will appear here.");

    const currentContentId = contentId.trim() || "homepage-banner";
    const currentPushToken = pushToken.trim() || "sample-push-token";
    const currentServerUrl = serverUrl.trim();
    const currentAppKey = appKey.trim();

    const updateStatus = (message: string) => {
        console.log(message);
        setStatus(message);
    };

    const checkInitialization = async () => {
        const isInitialized = await Countly.isInitialized();
        updateStatus(`SDK initialized: ${String(isInitialized)}`);
    };

    const setLocation = () => {
        Countly.setLocation("us", "Houston", "29.634933,-95.220255", "103.238.105.167");
        updateStatus("Updated current location.");
    };

    const disableLocation = () => {
        Countly.disableLocation();
        updateStatus("Location tracking disabled.");
    };

    const askForNotificationPermission = () => {
        Countly.askForNotificationPermission();
        updateStatus("Requested push notification permission.");
    };

    const sendPushToken = () => {
        Countly.sendPushToken({ token: currentPushToken });
        updateStatus(`Sent push token '${currentPushToken}'.`);
    };

    const addRequestHeaders = () => {
        Countly.addCustomNetworkRequestHeaders({
            "X-Countly-Example": "CountlyRNExample",
            "X-Countly-Platform": Platform.OS,
        });
        updateStatus("Added custom network request headers.");
    };

    const setCustomMetrics = () => {
        Countly.setCustomMetrics({
            _carrier: "Custom Carrier",
            _orientation: "portrait",
        });
        updateStatus("Set custom metrics.");
    };

    const recordDirectAttribution = () => {
        Countly.recordDirectAttribution("countly", campaignData);
        updateStatus("Recorded direct attribution.");
    };

    const recordIndirectAttribution = () => {
        const attributionValues: Record<string, string> = {};

        if (/ios/.exec(Platform.OS)) {
            attributionValues[AttributionKey.IDFA] = "IDFA";
        } else {
            attributionValues[AttributionKey.AdvertisingID] = "AdvertisingID";
        }

        Countly.recordIndirectAttribution(attributionValues);
        updateStatus("Recorded indirect attribution.");
    };

    const replaceQueuedAppKeys = () => {
        const result = Countly.replaceAllAppKeysInQueueWithCurrentAppKey();
        updateStatus(result ? String(result) : "Replaced queued request app keys with the current app key.");
    };

    const removeQueuedAppKeys = () => {
        const result = Countly.removeDifferentAppKeysFromQueue();
        updateStatus(result ? String(result) : "Removed queued requests that used a different app key.");
    };

    /** Sends the requests to the server URL typed in the field from now on. */
    const changeServerUrl = () => {
        const result = Countly.changeServerUrl(currentServerUrl);
        updateStatus(result ? String(result) : `Asked to send the requests to '${currentServerUrl}' from now on.`);
    };

    /** Reports to the app whose key is typed in the field from now on. */
    const changeAppKey = () => {
        const result = Countly.changeAppKey(currentAppKey);
        updateStatus(result ? String(result) : `Asked to report to the app key '${currentAppKey}' from now on.`);
    };

    /** Deletes the stored requests and the recorded events. */
    const flushQueues = () => {
        const result = Countly.flushQueues();
        updateStatus(result ? String(result) : "Deleted the stored requests and events.");
    };

    /** Packs the recorded events into a request and sends the stored requests now. */
    const attemptToSendStoredRequests = () => {
        const result = Countly.attemptToSendStoredRequests();
        updateStatus(result ? String(result) : "Started sending the stored requests.");
    };

    const enterContentZone = () => {
        Countly.content.enterContentZone();
        updateStatus("Entered the content zone.");
    };

    const refreshContentZone = () => {
        Countly.content.refreshContentZone();
        updateStatus("Refreshed the content zone.");
    };

    const previewContent = () => {
        const previewResult = Countly.content.previewContent(currentContentId);
        updateStatus(previewResult ? String(previewResult) : `Previewed content '${currentContentId}'.`);
    };

    const exitContentZone = () => {
        Countly.content.exitContentZone();
        updateStatus("Exited the content zone.");
    };

    const recordMetrics = () => {
        Countly.recordMetrics();
        Countly.recordMetrics({
            _device: "name of the device",
            _os: "device OS",
            _os_version: "device OS version",
            _resolution: "resolution of the device/application",
            _app_version: "application version",
            _manufacturer: "device manufacturer",
            _carrier: "device carrier",
            _orientation: "device orientation",
            _has_hinge: "device has hinge sensor, foldable",
        });
        updateStatus("Recorded metrics with default and custom values.");
    };

    return (
        <SafeAreaView>
            <ScrollView>
                <TextInput style={styles.inputRoundedBorder} placeholder="Content ID to preview" onChangeText={setContentId} value={contentId} />
                <TextInput style={styles.inputRoundedBorder} placeholder="Push token" onChangeText={setPushToken} value={pushToken} />
                <TextInput style={styles.inputRoundedBorder} placeholder="Server URL to change to" onChangeText={setServerUrl} value={serverUrl} autoCapitalize="none" />
                <TextInput style={styles.inputRoundedBorder} placeholder="App key to change to" onChangeText={setAppKey} value={appKey} autoCapitalize="none" />
                <Text style={styles.statusText}>{status}</Text>
                <CountlyButton onPress={() => void checkInitialization()} title="Check SDK Initialization" color="#00b5ad" />
                <CountlyButton onPress={setLocation} title="Set Location" color="#00b5ad" />
                <CountlyButton onPress={disableLocation} title="Disable Location" color="#00b5ad" />
                <CountlyButton onPress={askForNotificationPermission} title="Ask For Notification Permission" color="#00b5ad" />
                <CountlyButton onPress={sendPushToken} title="Send Push Token" color="#00b5ad" />
                <CountlyButton onPress={addRequestHeaders} title="Add Custom Request Headers" color="#00b5ad" />
                <CountlyButton onPress={setCustomMetrics} title="Set Custom Metrics" color="#00b5ad" />
                <CountlyButton onPress={recordDirectAttribution} title="Record Direct Attribution" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={recordIndirectAttribution} title="Record Indirect Attribution" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={replaceQueuedAppKeys} title="Replace Queued App Keys" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={removeQueuedAppKeys} title="Remove Other Queued App Keys" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={changeServerUrl} title="Change Server URL" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={changeAppKey} title="Change App Key" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={flushQueues} title="Flush Queues" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={attemptToSendStoredRequests} title="Send Stored Requests Now" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={enterContentZone} title="Enter Content Zone" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={refreshContentZone} title="Refresh Content Zone" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={previewContent} title="Preview Content By ID" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={exitContentZone} title="Exit Content Zone" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={recordMetrics} title="Record Metrics" color="#1b1c1d" lightText={true} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default OthersScreen;
