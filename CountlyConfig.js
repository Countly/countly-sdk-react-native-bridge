/**
 * Countly SDK React Native Bridge
 * https://github.com/Countly/countly-sdk-react-native-bridge
 * @Countly
 */
class CountlyConfig {
    constructor(appKey, deviceId, serverUrl) {
        this.appKey = appKey;
        this.deviceId = deviceId;
        this.serverUrl = serverUrl;
    }

    setLoggingEnabled(loggingEnabled) {
        this.hasSetLoggingEnabled = true;
        this.loggingEnabled = loggingEnabled;
        return this;
    }

    enableCrashReporting() {
        this.hasSetCrashReporting = true;
        return this;
    }

    setRequiresConsent(flag) {
        this.hasSetRequiresConsent = true;
        this.flag = flag;
        return this;
    }

    giveConsentInit(features) {
        this.hasSetConsent = true;
        this.features = features;
        return this;
    }

    setLocationInit(countryCode, city, location, ipAddress) {
        this.hasSetLocation = true;
        this.countryCode = countryCode;
        this.city = city;
        this.location = location;
        this.ipAddress = ipAddress;
        return this;
    }

    enableParameterTamperingProtection(salt) {
        this.hasSetTamperProtection = true;
        this.salt = salt;
        return this;
    }

    enableApm() {
        this.hasSetApm = true;
        return this;
    }

    pushTokenType(tokenType, channelName, channelDescription) {
        this.hasSetPushTokenType = true;
        this.tokenType = tokenType;
        this.channelName = channelName;
        this.channelDescription = channelDescription;
        return this;
    }

    recordAttributionID(attributionID) {
        this.hasSetRecordAttributionID = true;
        this.attributionID = attributionID;
        return this;
    }

    enableAttribution() {
        this.hasSetAttribution = true;
        return this;
    }

    configureIntentRedirectionCheck(allowedIntentClassNames, allowedIntentPackageNames) {
        this.hasSetIntentRedirectionCheck = true;
        this.allowedIntentClassNames = allowedIntentClassNames;
        this.allowedIntentPackageNames = allowedIntentPackageNames;
        return this;
    }

    setStarRatingDialogTexts(starRatingTextTitle, starRatingTextMessage, starRatingTextDismiss) {
        this.hasSetStarRatingDialogTexts = true;
        this.starRatingTextTitle = starRatingTextTitle;
        this.starRatingTextMessage = starRatingTextMessage;
        this.starRatingTextDismiss = starRatingTextDismiss;
        return this;
    }
}

export default CountlyConfig;
