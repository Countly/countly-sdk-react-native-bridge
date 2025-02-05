/* eslint-disable react-native/no-inline-styles */
import React from "react";
import { ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge-np";
import CountlyButton from "./CountlyButton";
import { lightOrange } from "./Constants";

// This function fetches the widget list and presents the widget with the given type. (with callback)
function getAndPresentWidgetWithCallback(widgetType: string) {
    Countly.feedback.getAvailableFeedbackWidgets((retrivedWidgets: any[], error: any) => {
        if (error != null) {
            console.error(`reportRatingManually, Error [${error}]`);
            return;
        }

        console.log(`reportRatingManually, result [${JSON.stringify(retrivedWidgets)}]`);
        const widget = retrivedWidgets.find((x: { type: string }) => x.type === widgetType);
        if (!widget) {
            console.error(`reportRatingManually, widget not found [${widgetType}]`);
            return;
        }

        presentWidget(widget);
    });
}

// This function fetches the widget list and presents the widget with the given type. (async)
async function getAndPresentWidgetAsync(widgetType: string) {
    const resultObject = await Countly.feedback.getAvailableFeedbackWidgets();
    console.log(`reportRatingManually, result [${JSON.stringify(resultObject)}]`);
    if (resultObject.error != null) {
        console.error(`reportRatingManually, Error [${resultObject.error}]`);
        return;
    }
    const widget = resultObject.data.find((x: { type: string }) => x.type === widgetType);
    if (!widget) {
        console.error(`reportRatingManually, widget not found [${widgetType}]`);
        return;
    }

    presentWidget(widget);
}

// This function presents the given widget.
function presentWidget(widget: any) {
    Countly.feedback.presentFeedbackWidget(
        widget,
        "Close",
        function () {
            console.log("presentWidget, Widgetshown");
        },
        function () {
            console.log("presentWidget, Widgetclosed");
        }
    );
}

// This function fetches the widget list then widget data and then reports the widget manually.
async function reportWidgetManually(widgetType: string) {
    // Get widget list
    const resultObject = await Countly.feedback.getAvailableFeedbackWidgets();
    console.log(`reportWidgetManually, retrieved widget list result [${JSON.stringify(resultObject)}]`);
    if (resultObject.error != null) {
        console.error(`reportWidgetManually, Error [${resultObject.error}]`);
        return;
    }

    // Find widget by type
    const widget = resultObject.data.find((x: { type: string }) => x.type === widgetType);
    if (!widget) {
        console.error(`reportWidgetManually, widget not found [${widgetType}]`);
        return;
    }

    // Get widget data
    const widgetData = await Countly.feedback.getFeedbackWidgetData(widget);
    if (widgetData.error != null) {
        console.error("reportWidgetManually, Error while fetching widget data");
        return;
    }

    // Report widget manually. Third parameter is some random data for the sake of example.
    Countly.feedback.reportFeedbackWidgetManually(widget, widgetData.data, { rating: 5, comment: "This is random" });
}

// ============================================================
// Old methods from the example project
// ============================================================
const setStarRatingDialogTexts = () => {
    Countly.setStarRatingDialogTexts();
};

const showStarRating = () => {
    Countly.showStarRating();
};

const presentRatingWidgetUsingEditBox = function () {
    Countly.presentRatingWidgetWithID(state.ratingId, "Submit", (error) => {
        if (error != null) {
            console.log(`presentRatingWidgetUsingEditBox : ${error}`);
        }
    });
};

const showSurvey = () => {
    Countly.feedback.showSurvey(undefined, () => {console.log(`Survey shown`);});
};

const showNPS = () => {
    Countly.feedback.showNPS(undefined, () => {console.log(`NPS shown`);});
};

const showRating = () => {
    Countly.feedback.showRating(undefined, () => {console.log(`Rating shown`);});
}

const styles = StyleSheet.create({
    inputRoundedBorder: {
        margin: 5,
        backgroundColor: "white",
        borderWidth: 1,
        borderRadius: 10,
        borderColor: "grey",
        padding: 10,
        fontSize: 20,
    },
});

const state = { ratingId: "61eac4627b8ad224e37bb3f5" };

function FeedbackScreen({ navigation }) {
    return (
        <SafeAreaView>
            <ScrollView>
                <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 20 }}>With Callback</Text>
                <CountlyButton
                    title="Present Rating Widget"
                    onPress={() => {
                        getAndPresentWidgetWithCallback("rating");
                    }}
                    color={lightOrange}
                    lightText={true}
                />
                <CountlyButton
                    title="Present Survey Widget"
                    onPress={() => {
                        getAndPresentWidgetWithCallback("survey");
                    }}
                    color={lightOrange}
                    lightText={true}
                />
                <CountlyButton
                    title="Present NPS Widget"
                    onPress={() => {
                        getAndPresentWidgetWithCallback("nps");
                    }}
                    color={lightOrange}
                    lightText={true}
                />
                <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 20 }}>Async Method</Text>
                <CountlyButton
                    title="Present Rating Widget"
                    onPress={async () =>
                        getAndPresentWidgetAsync("rating").catch((e) => {
                            console.log(e);
                        })
                    }
                    color={lightOrange}
                    lightText={true}
                />
                <CountlyButton
                    title="Present Survey Widget"
                    onPress={async () =>
                        getAndPresentWidgetAsync("survey").catch((e) => {
                            console.log(e);
                        })
                    }
                    color={lightOrange}
                    lightText={true}
                />
                <CountlyButton
                    title="Present NPS Widget"
                    onPress={async () =>
                        getAndPresentWidgetAsync("nps").catch((e) => {
                            console.log(e);
                        })
                    }
                    color={lightOrange}
                    lightText={true}
                />
                <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 20 }}>Report Widget Manually</Text>
                <CountlyButton
                    title="Report Rating Widget"
                    onPress={async () =>
                        reportWidgetManually("rating").catch((e) => {
                            console.log(e);
                        })
                    }
                    color={lightOrange}
                    lightText={true}
                />
                <CountlyButton
                    title="Report Survey Widget"
                    onPress={async () =>
                        reportWidgetManually("survey").catch((e) => {
                            console.log(e);
                        })
                    }
                    color={lightOrange}
                    lightText={true}
                />
                <CountlyButton
                    title="Report NPS Widget"
                    onPress={async () =>
                        reportWidgetManually("nps").catch((e) => {
                            console.log(e);
                        })
                    }
                    color={lightOrange}
                    lightText={true}
                />
                <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginTop: 20 }}>Legacy Methods</Text>
                <CountlyButton onPress={showStarRating} title="Show Star Rating Model" color="#00b5ad" />
                <TextInput
                    style={styles.inputRoundedBorder}
                    placeholder="Enter a Rating ID"
                    onChangeText={(ratingId) => {
                        state.ratingId = ratingId;
                    }}
                    value={state.ratingId}
                />
                <CountlyButton disabled={!state.ratingId} onPress={presentRatingWidgetUsingEditBox} title="Show Feedback using EditBox" color="#00b5ad" />
                <CountlyButton onPress={showSurvey} title="Show Survey" color="#00b5ad" />
                <CountlyButton onPress={showNPS} title="Show NPS" color="#00b5ad" />
                <CountlyButton onPress={showRating} title="Show Rating" color="#00b5ad" />
                <CountlyButton onPress={setStarRatingDialogTexts} title="Set Star Rating Dialog Texts" color="#00b5ad" />
            </ScrollView>
        </SafeAreaView>
    );
}

export default FeedbackScreen;
