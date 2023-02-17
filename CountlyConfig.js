/**
 * Countly SDK React Native Bridge
 * https://github.com/Countly/countly-sdk-react-native-bridge
 * @Countly
 */
 class CountlyConfig {
    constructor(serverURL, appKey, deviceID) {
        this.serverURL = serverURL;
        this.appKey = appKey;
        this.deviceID = deviceID;
    }

    setLoggingEnabled(loggingEnabled) {
        this.loggingEnabled = loggingEnabled;
        return this;
    }

    enableCrashReporting() {
        this.crashReporting = true;
        return this;
    }

    setRequiresConsent(shouldRequireConsent) {
        this.shouldRequireConsent = shouldRequireConsent;
        return this;
    }

    giveConsentInit(consents) {
        this.consents = consents;
        return this;
    }

    setLocationInit(locationCountryCode, locationCity, locationGpsCoordinates, locationIpAddress) {
        this.locationCountryCode = locationCountryCode;
        this.locationCity = locationCity;
        this.locationGpsCoordinates = locationGpsCoordinates;
        this.locationIpAddress = locationIpAddress;
        return this;
    }

    enableParameterTamperingProtection(tamperingProtectionSalt) {
        this.tamperingProtectionSalt = tamperingProtectionSalt;
        return this;
    }

    enableApm() {
        this.enableApm = true;
        return this;
    }

    pushTokenType(tokenType, channelName, channelDescription) {
        this.tokenType = tokenType;
        this.channelName = channelName;
        this.channelDescription = channelDescription;
        return this;
    }

    recordAttributionID(attributionID) {
        this.attributionID = attributionID;
        return this;
    }

    enableAttribution() {
        this.enableAttribution = true;
        return this;
    }

    configureIntentRedirectionCheck(allowedIntentClassNames, allowedIntentPackageNames) {
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
