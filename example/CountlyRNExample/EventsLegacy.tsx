import React from "react";
import { ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge";
import CountlyButton from "./CountlyButton";

interface Segmentation {
    [key: string]: string | number | boolean | Array<string | number | boolean>;
}
interface SegmentationCustom_1 extends Segmentation {
    Country: string;
    Age: string;
}
interface EventProps {
    eventName: string;
    segments?: Segmentation;
    eventCount?: number;
    eventSum?: string;
}
interface EventPropsCustom_1 extends EventProps {
    segments?: SegmentationCustom_1;
}

interface LegacyFeedbackWidget {
    id: string;
    type: string;
    name?: string;
    tags?: string[];
    widgetVersion?: string | null;
}

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

function LegacyScreen() {
    const [ratingId, setRatingId] = React.useState("61eac4627b8ad224e37bb3f5");
    const [remoteConfigKey, setRemoteConfigKey] = React.useState("stringValue");
    const [status, setStatus] = React.useState("Deprecated API actions will appear here.");

    const currentRemoteConfigKey = remoteConfigKey.trim() || "stringValue";

    const updateStatus = (message: string) => {
        console.log(message);
        setStatus(message);
    };

    const formatLegacyValue = (value: unknown) => {
        if (typeof value === "string") {
            return value;
        }

        const serialized = JSON.stringify(value);
        return serialized === undefined ? String(value) : serialized;
    };

    const basicEvent = () => {
        Countly.sendEvent({ eventName: "Basic Event", eventCount: 1 });
        updateStatus("Sent legacy basic event.");
    };

    const eventWithSum = () => {
        Countly.sendEvent({ eventName: "Event With Sum", eventCount: 1, eventSum: "0.99" });
        updateStatus("Sent legacy event with sum.");
    };

    const eventWithSegment = () => {
        let event: EventPropsCustom_1 = {
            eventName: "Event With Segment",
            eventCount: 1,
            segments: { Country: "Turkey", Age: "28" },
        };

        Countly.sendEvent(event);
        event = {
            eventName: "Event With Segment",
            eventCount: 1,
            segments: { Country: "France", Age: "38" },
        };
        Countly.sendEvent(event);
        updateStatus("Sent legacy segmented events.");
    };

    const eventWithSumAndSegment = () => {
        let event: EventPropsCustom_1 = {
            eventName: "Event With Sum And Segment",
            eventCount: 1,
            eventSum: "0.99",
            segments: { Country: "Turkey", Age: "28" },
        };

        Countly.sendEvent(event);
        event = {
            eventName: "Event With Sum And Segment",
            eventCount: 3,
            eventSum: "1.99",
            segments: { Country: "France", Age: "38" },
        };
        Countly.sendEvent(event);
        updateStatus("Sent legacy segmented events with sums.");
    };

    const startTimedEvent = () => {
        Countly.startEvent("legacyTimedEvent");
        setTimeout(() => {
            Countly.endEvent("legacyTimedEvent");
            updateStatus("Ended legacy timed event.");
        }, 1000);
        updateStatus("Started legacy timed event.");
    };

    const timedEventWithSum = () => {
        Countly.startEvent("legacyTimedEventWithSum");

        setTimeout(() => {
            Countly.endEvent({
                eventName: "legacyTimedEventWithSum",
                eventSum: "0.99",
            });
            updateStatus("Ended legacy timed event with sum.");
        }, 1000);
        updateStatus("Started legacy timed event with sum.");
    };

    const timedEventWithSegment = () => {
        Countly.startEvent("legacyTimedEventWithSegment");

        setTimeout(() => {
            Countly.endEvent({
                eventName: "legacyTimedEventWithSegment",
                segments: { Country: "Germany", Age: "32" },
            });
            updateStatus("Ended legacy timed event with segmentation.");
        }, 1000);
        updateStatus("Started legacy timed event with segmentation.");
    };

    const timedEventWithSumAndSegment = () => {
        Countly.startEvent("legacyTimedEventWithSumAndSegment");

        setTimeout(() => {
            Countly.endEvent({
                eventName: "legacyTimedEventWithSumAndSegment",
                eventCount: 1,
                eventSum: "0.99",
                segments: { Country: "India", Age: "21" },
            });
            updateStatus("Ended legacy timed event with sum and segmentation.");
        }, 1000);
        updateStatus("Started legacy timed event with sum and segmentation.");
    };

    const cancelTimedEvent = () => {
        Countly.startEvent("legacyTimedEventToCancel");

        setTimeout(() => {
            Countly.cancelEvent("legacyTimedEventToCancel");
            updateStatus("Canceled legacy timed event.");
        }, 1000);
        updateStatus("Started legacy timed event that will be canceled.");
    };

    const setStarRatingDialogTexts = () => {
        Countly.setStarRatingDialogTexts("Rate Countly RN Example", "Would you recommend this demo?", "Later");
        updateStatus("Updated legacy star-rating dialog texts.");
    };

    const showStarRating = () => {
        Countly.showStarRating((result: unknown) => {
            updateStatus(`Legacy showStarRating callback: ${String(result)}`);
        });
        updateStatus("Requested legacy star-rating dialog.");
    };

    const presentRatingWidgetWithID = () => {
        const currentRatingId = ratingId.trim();
        if (!currentRatingId) {
            updateStatus("Provide a rating widget ID before using presentRatingWidgetWithID.");
            return;
        }

        Countly.presentRatingWidgetWithID(currentRatingId, "Submit", (error) => {
            updateStatus(error != null ? `Legacy rating widget callback error: ${String(error)}` : "Legacy rating widget callback completed.");
        });
        updateStatus(`Requested legacy rating widget '${currentRatingId}'.`);
    };

    const getLegacyFeedbackWidgets = async () => {
        const result = await Countly.getFeedbackWidgets();
        if (!Array.isArray(result)) {
            updateStatus(`Legacy getFeedbackWidgets returned: ${String(result)}`);
            return [];
        }

        updateStatus(`Legacy getFeedbackWidgets found ${result.length} widgets.`);
        console.log("Legacy feedback widgets", result);
        return result as LegacyFeedbackWidget[];
    };

    const presentFeedbackWidgetObject = async () => {
        const widgets = await getLegacyFeedbackWidgets();
        const widget = widgets.find((item) => item.type === "rating") || widgets[0];

        if (!widget) {
            updateStatus("Legacy presentFeedbackWidgetObject skipped because no widgets were returned.");
            return;
        }

        const result = await Countly.presentFeedbackWidgetObject(
            widget,
            "Close",
            () => updateStatus(`Legacy widget '${widget.type}' shown.`),
            () => updateStatus(`Legacy widget '${widget.type}' closed.`)
        );

        if (typeof result === "string") {
            updateStatus(`Legacy presentFeedbackWidgetObject error: ${result}`);
            return;
        }

        updateStatus(`Requested legacy widget object presentation for '${widget.type}'.`);
    };

    const getCurrentDeviceId = async () => {
        const deviceId = await Countly.getCurrentDeviceId();
        updateStatus(`Legacy getCurrentDeviceId: ${String(deviceId)}`);
    };

    const getDeviceIDType = async () => {
        const deviceIdType = await Countly.getDeviceIDType();
        updateStatus(`Legacy getDeviceIDType: ${String(deviceIdType)}`);
    };

    const temporaryDeviceIdMode = () => {
        Countly.changeDeviceId(Countly.TemporaryDeviceIDString, true);
        updateStatus("Legacy changeDeviceId switched to temporary mode.");
    };

    const changeDeviceId = () => {
        Countly.changeDeviceId("02d56d66-6a39-482d-aff0-d14e4d5e5fda", true);
        updateStatus("Legacy changeDeviceId merged a new device ID.");
    };

    const remoteConfigUpdate = () => {
        Countly.remoteConfigUpdate((data) => {
            updateStatus(`Legacy remoteConfigUpdate: ${formatLegacyValue(data)}`);
        });
    };

    const updateRemoteConfigForKeysOnly = () => {
        Countly.updateRemoteConfigForKeysOnly([currentRemoteConfigKey], (data) => {
            updateStatus(`Legacy updateRemoteConfigForKeysOnly for '${currentRemoteConfigKey}': ${formatLegacyValue(data)}`);
        });
    };

    const updateRemoteConfigExceptKeys = () => {
        Countly.updateRemoteConfigExceptKeys([currentRemoteConfigKey], (data) => {
            updateStatus(`Legacy updateRemoteConfigExceptKeys for '${currentRemoteConfigKey}': ${formatLegacyValue(data)}`);
        });
    };

    const getRemoteConfigValueForKey = () => {
        Countly.getRemoteConfigValueForKey(currentRemoteConfigKey, (data) => {
            updateStatus(`Legacy getRemoteConfigValueForKey '${currentRemoteConfigKey}': ${formatLegacyValue(data)}`);
        });
    };

    const getRemoteConfigValueForKeyP = async () => {
        const result = Countly.getRemoteConfigValueForKeyP(currentRemoteConfigKey);

        if (typeof result === "string") {
            updateStatus(`Legacy getRemoteConfigValueForKeyP '${currentRemoteConfigKey}': ${result}`);
            return;
        }

        const data = await result;
        updateStatus(`Legacy getRemoteConfigValueForKeyP '${currentRemoteConfigKey}': ${formatLegacyValue(data)}`);
    };

    const remoteConfigClearValues = async () => {
        const result = await Countly.remoteConfigClearValues();
        updateStatus(`Legacy remoteConfigClearValues: ${formatLegacyValue(result)}`);
    };

    return (
        <SafeAreaView>
            <ScrollView>
                <Text style={styles.statusText}>{status}</Text>
                <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 20 }}>Legacy Events</Text>
                <CountlyButton onPress={basicEvent} title="Basic Event" color="#e0e0e0" />
                <CountlyButton onPress={eventWithSum} title="Event with Sum" color="#e0e0e0" />
                <CountlyButton onPress={eventWithSegment} title="Event with Segment" color="#e0e0e0" />
                <CountlyButton onPress={eventWithSumAndSegment} title="Event with Sum and Segment" color="#841584" />
                <CountlyButton onPress={startTimedEvent} title="Timed event" color="#e0e0e0" />
                <CountlyButton onPress={timedEventWithSum} title="Timed events with Sum" color="#e0e0e0" />
                <CountlyButton onPress={timedEventWithSegment} title="Timed events with Segment" color="#e0e0e0" />
                <CountlyButton onPress={timedEventWithSumAndSegment} title="Timed events with Sum and Segment" color="#e0e0e0" />
                <CountlyButton onPress={cancelTimedEvent} title="Cancel Timed Event" color="#e0e0e0" />
                <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 20 }}>Legacy Feedback</Text>
                <CountlyButton onPress={() => void getLegacyFeedbackWidgets()} title="Get Feedback Widgets" color="#00b5ad" />
                <CountlyButton onPress={() => void presentFeedbackWidgetObject()} title="Present Feedback Widget Object" color="#00b5ad" />
                <CountlyButton onPress={showStarRating} title="Show Star Rating" color="#00b5ad" />
                <CountlyButton onPress={setStarRatingDialogTexts} title="Set Star Rating Dialog Texts" color="#00b5ad" />
                <TextInput style={styles.inputRoundedBorder} placeholder="Enter a rating widget ID" onChangeText={setRatingId} value={ratingId} />
                <CountlyButton disabled={!ratingId.trim()} onPress={presentRatingWidgetWithID} title="Present Rating Widget With ID" color="#00b5ad" />
                <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 20 }}>Legacy Device ID</Text>
                <CountlyButton onPress={() => void getCurrentDeviceId()} title="Get Current Device ID" color="#f2711c" />
                <CountlyButton onPress={() => void getDeviceIDType()} title="Get Device ID Type" color="#f2711c" />
                <CountlyButton onPress={temporaryDeviceIdMode} title="Temporary Device ID Mode" color="#f2711c" />
                <CountlyButton onPress={changeDeviceId} title="Change Device ID" color="#f2711c" />
                <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 20 }}>Legacy Remote Config</Text>
                <TextInput style={styles.inputRoundedBorder} placeholder="Remote config key" onChangeText={setRemoteConfigKey} value={remoteConfigKey} />
                <CountlyButton onPress={remoteConfigUpdate} title="remoteConfigUpdate" color="#6435c9" lightText={true} />
                <CountlyButton onPress={updateRemoteConfigForKeysOnly} title="updateRemoteConfigForKeysOnly" color="#6435c9" lightText={true} />
                <CountlyButton onPress={updateRemoteConfigExceptKeys} title="updateRemoteConfigExceptKeys" color="#6435c9" lightText={true} />
                <CountlyButton onPress={getRemoteConfigValueForKey} title="getRemoteConfigValueForKey" color="#6435c9" lightText={true} />
                <CountlyButton onPress={() => void getRemoteConfigValueForKeyP()} title="getRemoteConfigValueForKeyP" color="#6435c9" lightText={true} />
                <CountlyButton onPress={() => void remoteConfigClearValues()} title="remoteConfigClearValues" color="#6435c9" lightText={true} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default LegacyScreen;