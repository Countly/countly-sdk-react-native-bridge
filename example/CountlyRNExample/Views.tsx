import React from "react";
import { SafeAreaView, ScrollView, Text } from "react-native";
import Countly from "countly-sdk-react-native-bridge";
import CountlyButton from "./CountlyButton";

const autoStoppedViewName = "ExampleAutoStoppedView";
const manualViewName = "ExampleManualView";

function ViewsScreen() {
    const [autoStoppedViewID, setAutoStoppedViewID] = React.useState<string | null>(null);
    const [manualViewID, setManualViewID] = React.useState<string | null>(null);
    const [status, setStatus] = React.useState("Use the buttons below to exercise the Countly.views API.");

    const handleStartAutoStoppedView = async () => {
        const viewID = await Countly.views.startAutoStoppedView(autoStoppedViewName, {
            source: "CountlyRNExample",
            mode: "auto-stopped",
        });

        setAutoStoppedViewID(viewID);
        setStatus(`Started auto-stopped view with ID: ${viewID ?? "null"}`);
    };

    const handleStartView = async () => {
        const viewID = await Countly.views.startView(manualViewName, {
            source: "CountlyRNExample",
            mode: "manual",
        });

        setManualViewID(viewID);
        setStatus(`Started manual view with ID: ${viewID ?? "null"}`);
    };

    const handleStopViewWithName = () => {
        Countly.views.stopViewWithName(manualViewName, { closedBy: "name" });
        setManualViewID(null);
        setStatus(`Stopped '${manualViewName}' by name.`);
    };

    const handleStopViewWithID = () => {
        if (!manualViewID) {
            setStatus("Start a manual view first to stop it by ID.");
            return;
        }

        Countly.views.stopViewWithID(manualViewID, { closedBy: "id" });
        setManualViewID(null);
        setStatus(`Stopped manual view by ID: ${manualViewID}`);
    };

    const handleStopAllViews = () => {
        Countly.views.stopAllViews({ closedBy: "stop-all" });
        setAutoStoppedViewID(null);
        setManualViewID(null);
        setStatus("Stopped all tracked views.");
    };

    const handlePauseViewWithID = () => {
        if (!manualViewID) {
            setStatus("Start a manual view first to pause it by ID.");
            return;
        }

        Countly.views.pauseViewWithID(manualViewID);
        setStatus(`Paused manual view ID: ${manualViewID}`);
    };

    const handleResumeViewWithID = () => {
        if (!manualViewID) {
            setStatus("Start a manual view first to resume it by ID.");
            return;
        }

        Countly.views.resumeViewWithID(manualViewID);
        setStatus(`Resumed manual view ID: ${manualViewID}`);
    };

    const handleAddSegmentationToViewWithID = () => {
        if (!manualViewID) {
            setStatus("Start a manual view first to add segmentation by ID.");
            return;
        }

        Countly.views.addSegmentationToViewWithID(manualViewID, {
            progress: "50%",
            attempt: 1,
        });
        setStatus(`Added segmentation to manual view ID: ${manualViewID}`);
    };

    const handleAddSegmentationToViewWithName = () => {
        Countly.views.addSegmentationToViewWithName(manualViewName, {
            step: "payment",
            validated: true,
        });
        setStatus(`Added segmentation to '${manualViewName}' by name.`);
    };

    const handleSetGlobalViewSegmentation = () => {
        Countly.views.setGlobalViewSegmentation({
            app: "CountlyRNExample",
            environment: "demo",
        });
        setStatus("Set global view segmentation for subsequent views.");
    };

    const handleUpdateGlobalViewSegmentation = () => {
        Countly.views.updateGlobalViewSegmentation({
            tab: "Views",
            updated: true,
        });
        setStatus("Updated global view segmentation.");
    };

    const handleLegacyRecordView = () => {
        Countly.recordView("LegacyRecordView", {
            source: "CountlyRNExample",
            mode: "legacy-root-alias",
        });
        setStatus("Requested legacy Countly.recordView(...). Prefer Countly.views.startAutoStoppedView(...).");
    };

    return (
        <SafeAreaView>
            <ScrollView>
                <Text style={{ marginHorizontal: 20, marginTop: 12, marginBottom: 8, fontSize: 14 }}>
                    Automatic view tracking config examples live in Configuration.tsx.
                </Text>
                <Text style={{ marginHorizontal: 20, marginBottom: 4, fontSize: 12 }}>
                    Auto-stopped view ID: {autoStoppedViewID ?? "not started"}
                </Text>
                <Text style={{ marginHorizontal: 20, marginBottom: 4, fontSize: 12 }}>
                    Manual view ID: {manualViewID ?? "not started"}
                </Text>
                <Text style={{ marginHorizontal: 20, marginBottom: 8, fontSize: 12 }}>
                    Status: {status}
                </Text>
                <CountlyButton
                    onPress={handleStartAutoStoppedView}
                    title="startAutoStoppedView()"
                    color="#e0e0e0"
                />
                <CountlyButton
                    onPress={handleStartView}
                    title="startView()"
                    color="#e0e0e0"
                />
                <CountlyButton
                    onPress={handleStopViewWithName}
                    title="stopViewWithName()"
                    color="#e0e0e0"
                />
                <CountlyButton
                    onPress={handleStopViewWithID}
                    title="stopViewWithID()"
                    color="#e0e0e0"
                    disabled={!manualViewID}
                />
                <CountlyButton
                    onPress={handlePauseViewWithID}
                    title="pauseViewWithID()"
                    color="#e0e0e0"
                    disabled={!manualViewID}
                />
                <CountlyButton
                    onPress={handleResumeViewWithID}
                    title="resumeViewWithID()"
                    color="#e0e0e0"
                    disabled={!manualViewID}
                />
                <CountlyButton
                    onPress={handleAddSegmentationToViewWithID}
                    title="addSegmentationToViewWithID()"
                    color="#e0e0e0"
                    disabled={!manualViewID}
                />
                <CountlyButton
                    onPress={handleAddSegmentationToViewWithName}
                    title="addSegmentationToViewWithName()"
                    color="#e0e0e0"
                />
                <CountlyButton
                    onPress={handleSetGlobalViewSegmentation}
                    title="setGlobalViewSegmentation()"
                    color="#e0e0e0"
                />
                <CountlyButton
                    onPress={handleUpdateGlobalViewSegmentation}
                    title="updateGlobalViewSegmentation()"
                    color="#e0e0e0"
                />
                <CountlyButton
                    onPress={handleStopAllViews}
                    title="stopAllViews()"
                    color="#e0e0e0"
                />
                <Text style={{ marginHorizontal: 20, marginTop: 20, marginBottom: 8, fontSize: 14, textAlign: "center", fontWeight: "bold" }}>
                    Legacy Root Alias
                </Text>
                <Text style={{ marginHorizontal: 20, marginBottom: 8, fontSize: 12, textAlign: "center" }}>
                    Keep this only for backward-compatibility testing. Prefer Countly.views.startAutoStoppedView(...).
                </Text>
                <CountlyButton
                    onPress={handleLegacyRecordView}
                    title="Legacy Countly.recordView()"
                    color="#e0e0e0"
                />
            </ScrollView>
        </SafeAreaView>
    );
}

export default ViewsScreen;
