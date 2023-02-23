/**
 * Countly SDK React Native Bridge
 * https://github.com/Countly/countly-sdk-react-native-bridge
 * @Countly
 */
 class CountlyConfig {
    constructor(serverURL, appKey) {
        this.serverURL = serverURL;
        this.appKey = appKey;
    }

    setServerURL(serverURL) {
        this.serverURL = serverURL;
        return this;
    }

    setAppKey(appKey) {
        this.appKey = appKey;
        return this;
    }

    setDeviceID(deviceID) {
        this.deviceID = deviceID;
        return this;
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

    giveConsent(consents) {
        this.consents = consents;
        return this;
    }

    setLocation(locationCountryCode, locationCity, locationGpsCoordinates, locationIpAddress) {
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
