// Code an app writes with the SDK. CI compiles it against Countly.d.ts with the oldest and the newest TypeScript the
// typings support, so a declaration that needs a newer TypeScript, or that no longer accepts these calls, fails here.
import Countly from "countly-sdk-react-native-bridge";
import CountlyConfig from "countly-sdk-react-native-bridge/CountlyConfig";

const config = new CountlyConfig("https://example.invalid", "app-key")
    .setLoggingEnabled(true)
    .setDeviceID("device-1")
    .enableCrashReporting()
    .setRequiresConsent(true)
    .giveConsent(["events", "views", "crashes"])
    .setLocation("TR", "Istanbul", "41.0082,28.9784", "10.2.33.12")
    .setLogListener((message: string, level: string) => {
        void message;
        void level;
    })
    .enableRequestCompression()
    .setUpdateSessionTimerDelay(60);
config.apm.enableAppStartTimeTracking();
config.sdkInternalLimits.setMaxKeyLength(128);

async function useTheSdk(): Promise<void> {
    await Countly.initWithConfig(config);
    Countly.events.recordEvent("purchase", { item: "book", count: 2 }, 1, 9.99);
    Countly.events.startEvent("checkout");
    const viewId: string | null = await Countly.views.startView("Home", { source: "push" });
    if (viewId !== null) {
        Countly.views.stopViewWithID(viewId);
    }
    const deviceId: string | null = await Countly.deviceId.getID();
    Countly.deviceId.changeID(`${deviceId}-merged`, true);
    await Countly.userData.setProperty("plan", "pro");
    Countly.logException(new Error("handled"), true, { screen: "Home" });
    const subscription = Countly.registerForNotificationOpened((notification: Record<string, any>, actionIndex: number) => {
        void notification;
        void actionIndex;
    });
    subscription.remove();
    const widgets = await Countly.feedback.getAvailableFeedbackWidgets();
    if (widgets.data.length > 0) {
        Countly.feedback.presentFeedbackWidget(widgets.data[0], "Close");
    }
    const update = await Countly.remoteConfig.update();
    if (update.success) {
        await Countly.remoteConfig.getValue("color");
    }
    Countly.content.enterContentZone();
}

void useTheSdk();
