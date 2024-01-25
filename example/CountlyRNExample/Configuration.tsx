import CountlyConfig from "countly-sdk-react-native-bridge/CountlyConfig";

const COUNTLY_SERVER_KEY = "https://your.server.ly";
const COUNTLY_APP_KEY = "YOUR_APP_KEY";

if(COUNTLY_APP_KEY === "YOUR_APP_KEY" || COUNTLY_SERVER_KEY === "https://your.server.ly"){
    throw new Error("Please do not use default set of app key and server url")
}

const countlyConfig = new CountlyConfig(COUNTLY_SERVER_KEY, COUNTLY_APP_KEY).setLoggingEnabled(true); // Enable countly internal debugging logs
// .setDeviceID(Countly.TemporaryDeviceIDString) // Enable temporary id mode
// .enableCrashReporting() // Enable crash reporting to report unhandled crashes to Countly
// .setRequiresConsent(true) // Set that consent should be required for features to work.
// .giveConsent(['location', 'sessions', 'attribution', 'push', 'events', 'views', 'crashes', 'users', 'push', 'star-rating', 'apm', 'feedback', 'remote-config']) // give consent for specific features before init.
// .setLocation('TR', 'Istanbul', '41.0082,28.9784', '10.2.33.12') // Set user initial location.
// .enableParameterTamperingProtection('salt') // Set the optional salt to be used for calculating the checksum of requested data which will be sent with each request
// .pinnedCertificates("count.ly.cer") // It will ensure that connection is made with one of the public keys specified
// .setHttpPostForced(false) // Set to "true" if you want HTTP POST to be used for all requests
// .enableApm() // Enable APM features, which includes the recording of app start time.
// .pushTokenType(Countly.messagingMode.DEVELOPMENT, 'ChannelName', 'ChannelDescription') // Set messaging mode for push notifications
// .configureIntentRedirectionCheck(['MainActivity'], ['com.countly.demo'])
// .setStarRatingDialogTexts('Title', 'Message', 'Dismiss')
// .recordDirectAttribution('countly', campaignData)
// .recordIndirectAttribution(attributionValues)
export default countlyConfig;
