/* eslint-disable react-native/no-inline-styles */
import React from "react";
import { ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge-np";
import CountlyButton from "./CountlyButton";
import { lightOrange } from "./Constants";

type WidgetType = "rating" | "survey" | "nps";

interface FeedbackWidgetInfo {
    id: string;
    type: string;
    name?: string;
    tags?: string[];
    widgetVersion?: string | null;
}

const matchesWidget = (widget: FeedbackWidgetInfo, widgetType: WidgetType, filterValue: string) => {
    if (widget.type !== widgetType) {
        return false;
    }

    if (!filterValue) {
        return true;
    }

    return widget.id === filterValue || widget.name === filterValue || (Array.isArray(widget.tags) && widget.tags.includes(filterValue));
};

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

function FeedbackScreen() {
    const [widgetFilter, setWidgetFilter] = React.useState("");
    const [closeButtonText, setCloseButtonText] = React.useState("Close");
    const [status, setStatus] = React.useState("Feedback actions will appear here.");

    const currentFilter = widgetFilter.trim();
    const currentCloseButtonText = closeButtonText.trim() || "Close";

    const updateStatus = (message: string) => {
        console.log(message);
        setStatus(message);
    };

    const getAvailableWidgets = async () => {
        const resultObject = await Countly.feedback.getAvailableFeedbackWidgets();

        if (resultObject.error != null || !resultObject.data) {
            updateStatus(`Failed to load widgets: ${String(resultObject.error)}`);
            return [];
        }

        console.log("Available feedback widgets", resultObject.data);
        const summary = resultObject.data.map((widget) => `${widget.type}:${widget.name || widget.id}`).join(", ");
        updateStatus(summary ? `Loaded widgets: ${summary}` : "No feedback widgets available.");
        return resultObject.data as FeedbackWidgetInfo[];
    };

    const findWidget = async (widgetType: WidgetType) => {
        const widgets = await getAvailableWidgets();
        return widgets.find((widget) => matchesWidget(widget, widgetType, currentFilter)) || null;
    };

    const presentWidgetFromList = async (widgetType: WidgetType) => {
        const widget = await findWidget(widgetType);

        if (!widget) {
            updateStatus(`No ${widgetType} widget matched '${currentFilter || "first available widget"}'.`);
            return;
        }

        const result = Countly.feedback.presentFeedbackWidget(
            widget,
            currentCloseButtonText,
            () => updateStatus(`Lookup ${widgetType} widget shown.`),
            () => updateStatus(`Lookup ${widgetType} widget closed.`)
        );

        if (result.error != null) {
            updateStatus(`Failed to present ${widgetType} widget: ${result.error}`);
            return;
        }

        updateStatus(`Requested ${widgetType} widget presentation from widget lookup.`);
    };

    const reportWidgetManually = async (widgetType: WidgetType) => {
        const widget = await findWidget(widgetType);

        if (!widget) {
            updateStatus(`No ${widgetType} widget matched '${currentFilter || "first available widget"}'.`);
            return;
        }

        const widgetData = await Countly.feedback.getFeedbackWidgetData(widget);
        if (widgetData.error != null || widgetData.data == null) {
            updateStatus(`Failed to fetch ${widgetType} widget data: ${String(widgetData.error)}`);
            return;
        }

        const reportResult = await Countly.feedback.reportFeedbackWidgetManually(widget, widgetData.data, {
            rating: 5,
            comment: `Manual ${widgetType} response from CountlyRNExample`,
        });

        if (reportResult.error != null) {
            updateStatus(`Failed to report ${widgetType} widget manually: ${reportResult.error}`);
            return;
        }

        updateStatus(`Reported ${widgetType} widget manually.`);
    };

    const presentDirectWidget = (widgetType: WidgetType) => {
        const lookupValue = currentFilter || undefined;
        const onShown = () => updateStatus(`Direct ${widgetType} widget shown.`);
        const onClosed = () => updateStatus(`Direct ${widgetType} widget closed.`);

        if (widgetType === "rating") {
            Countly.feedback.presentRating(lookupValue, onShown, onClosed);
        } else if (widgetType === "survey") {
            Countly.feedback.presentSurvey(lookupValue, onShown, onClosed);
        } else {
            Countly.feedback.presentNPS(lookupValue, onShown, onClosed);
        }

        updateStatus(`Requested direct ${widgetType} widget presentation.`);
    };

    const showDirectWidget = (widgetType: WidgetType) => {
        const lookupValue = currentFilter || undefined;
        const onClosed = () => updateStatus(`Legacy show ${widgetType} widget closed.`);

        if (widgetType === "rating") {
            Countly.feedback.showRating(lookupValue, onClosed);
        } else if (widgetType === "survey") {
            Countly.feedback.showSurvey(lookupValue, onClosed);
        } else {
            Countly.feedback.showNPS(lookupValue, onClosed);
        }

        updateStatus(`Requested legacy show ${widgetType} widget. Prefer Countly.feedback.present${widgetType === "nps" ? "NPS" : widgetType === "survey" ? "Survey" : "Rating"}(...).`);
    };

    return (
        <SafeAreaView>
            <ScrollView>
                <TextInput
                    style={styles.inputRoundedBorder}
                    placeholder="Optional widget name, id, or tag"
                    onChangeText={setWidgetFilter}
                    value={widgetFilter}
                />
                <TextInput
                    style={styles.inputRoundedBorder}
                    placeholder="Close button text"
                    onChangeText={setCloseButtonText}
                    value={closeButtonText}
                />
                <Text style={styles.statusText}>{status}</Text>
                <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 20 }}>Widget Lookup APIs</Text>
                <CountlyButton title="List Available Widgets" onPress={() => void getAvailableWidgets()} color={lightOrange} lightText={true} />
                <CountlyButton
                    title="Present Rating Widget"
                    onPress={() => void presentWidgetFromList("rating")}
                    color={lightOrange}
                    lightText={true}
                />
                <CountlyButton
                    title="Present Survey Widget"
                    onPress={() => void presentWidgetFromList("survey")}
                    color={lightOrange}
                    lightText={true}
                />
                <CountlyButton
                    title="Present NPS Widget"
                    onPress={() => void presentWidgetFromList("nps")}
                    color={lightOrange}
                    lightText={true}
                />
                <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 20 }}>Manual Reporting</Text>
                <CountlyButton
                    title="Report Rating Widget"
                    onPress={() => void reportWidgetManually("rating")}
                    color={lightOrange}
                    lightText={true}
                />
                <CountlyButton
                    title="Report Survey Widget"
                    onPress={() => void reportWidgetManually("survey")}
                    color={lightOrange}
                    lightText={true}
                />
                <CountlyButton
                    title="Report NPS Widget"
                    onPress={() => void reportWidgetManually("nps")}
                    color={lightOrange}
                    lightText={true}
                />
                <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 20 }}>Preferred Direct Present APIs</Text>
                <CountlyButton
                    title="Present Rating"
                    onPress={() => presentDirectWidget("rating")}
                    color="#00b5ad"
                />
                <CountlyButton onPress={() => presentDirectWidget("survey")} title="Present Survey" color="#00b5ad" />
                <CountlyButton onPress={() => presentDirectWidget("nps")} title="Present NPS" color="#00b5ad" />
                <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 20 }}>Legacy Direct Show APIs</Text>
                <Text style={styles.statusText}>Use these only for backward-compatibility checks. Prefer the present* helpers above.</Text>
                <CountlyButton onPress={() => showDirectWidget("rating")} title="Legacy Show Rating" color="#00b5ad" />
                <CountlyButton onPress={() => showDirectWidget("survey")} title="Legacy Show Survey" color="#00b5ad" />
                <CountlyButton onPress={() => showDirectWidget("nps")} title="Legacy Show NPS" color="#00b5ad" />
            </ScrollView>
        </SafeAreaView>
    );
}

export default FeedbackScreen;
