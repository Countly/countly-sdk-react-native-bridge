import CountlyConfig from "countly-sdk-react-native-bridge/CountlyConfig";

const COUNTLY_SERVER_URL = "https://your.server.ly";
const COUNTLY_APP_KEY = "YOUR_APP_KEY";

if (COUNTLY_APP_KEY === "YOUR_APP_KEY" || COUNTLY_SERVER_URL === "https://your.server.ly") {
    console.warn("Please do not use default set of app key and server url");
}

function createCountlyConfig() {
    return new CountlyConfig(COUNTLY_SERVER_URL, COUNTLY_APP_KEY)
        .setLoggingEnabled(true) // Enable countly internal debugging logs
        .enableManualSessionControl(); // Demonstrate Countly.startSession, Countly.updateSession, and Countly.endSession
}

const countlyConfig = createCountlyConfig();
// Core initialization =======================================
// .setDeviceID(Countly.TemporaryDeviceIDString) // Enable temporary id mode
// .setRequestTimeoutDuration(60) // Set custom request timeout duration in seconds (default is 30 seconds)
// Manual session control is enabled above so the Sessions screen can exercise the session APIs.
// .enableManualSessionControlHybridMode() // Enable hybrid manual session control
// .addCustomNetworkRequestHeaders({ "X-Example": "CountlyRNExample" })
// .enableCrashReporting() // Enable crash reporting to report unhandled crashes to Countly
// .setRequiresConsent(true) // Set that consent should be required for features to work.
// .giveConsent(['location', 'sessions', 'attribution', 'push', 'events', 'views', 'crashes', 'users', 'push', 'star-rating', 'apm', 'feedback', 'remote-config']) // give consent for specific features before init.
// .setLocation('TR', 'Istanbul', '41.0082,28.9784', '10.2.33.12') // Set user initial location.
// .enableParameterTamperingProtection('salt') // Set the optional salt to be used for calculating the checksum of requested data which will be sent with each request
// .disableAdditionalIntentRedirectionChecks() // Disable additional intent redirection checks
// .disableSDKBehaviorSettingsUpdates() // Skip SDK behavior settings refresh requests
// .disableBackoffMechanism() // Disable request backoff logic
// .disableGradualRequestCleaner() // Android only
// .disableViewRestartForManualRecording() // Keep manually recorded views from auto-restarting
// .setSDKBehaviorSettings({}) // Provide SDK behavior settings from Countly server

// Push notification configuration ============================
// .setPushTokenType(Countly.messagingMode.DEVELOPMENT) // iOS only
// .setPushNotificationChannelInformation('ChannelName', 'ChannelDescription') // Android only
// .setPushNotificationAccentColor('#2DA657') // Android only
// .configureIntentRedirectionCheck(['MainActivity'], ['com.countly.demo'])

// Feedback + attribution ====================================
// .setStarRatingDialogTexts('Title', 'Message', 'Dismiss')
// .recordDirectAttribution('countly', campaignData)
// .recordIndirectAttribution(attributionValues)

// APM configuration ========================================
// countlyConfig.apm
//   .enableAppStartTimeTracking()
//   .enableForegroundBackgroundTracking()
//   .enableManualAppLoadedTrigger()
//   .setAppStartTimestampOverride(11223344);

// Countly SDK Limits ========================================
// countlyConfig.sdkInternalLimits
//   .setMaxKeyLength(128)
//   .setMaxValueSize(256)
//   .setMaxSegmentationValues(100)
//   .setMaxBreadcrumbCount(100)
//   .setMaxStackTraceLineLength(1000)
//   .setMaxStackTraceLinesPerThread(30);

// Countly Experimental features ==============================
// countlyConfig.experimental
//   .enablePreviousNameRecording()
//   .enableVisibilityTracking();

// Content + Feedback web view presentation ===================
// countlyConfig.content.setWebViewDisplayOption("SAFE_AREA"); // Use "IMMERSIVE" for edge-to-edge presentation.
// countlyConfig.content.setZoneTimerInterval(120);
// countlyConfig.content.setGlobalContentCallback((status: string, data: object) => {
//     console.log("Global content callback", status, data);
// });

export { COUNTLY_SERVER_URL, COUNTLY_APP_KEY, createCountlyConfig };
export default countlyConfig;
