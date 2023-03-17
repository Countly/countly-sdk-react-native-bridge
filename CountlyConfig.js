/**
 * Countly SDK React Native Bridge
 * https://github.com/Countly/countly-sdk-react-native-bridge
 * @Countly
 */
/**
 *
 * Config Object for Countly Init
 * Should be called before Countly "askForNotificationPermission"
 *
 * @param {String} serverURL server url
 * @param {String} appKey application key
 */
 class CountlyConfig {
    constructor(serverURL, appKey) {
        this.serverURL = serverURL;
        this.appKey = appKey;
    }

    /**
    * Method to set the server url
    *
    * @param {String} serverURL server url
    */
    setServerURL(serverURL) {
        this.serverURL = serverURL;
        return this;
    }

    /**
    * Method to set the app key
    *
    * @param {String} appKey application key
    */
    setAppKey(appKey) {
        this.appKey = appKey;
        return this;
    }

    /**
    * Method to set the device id
    *
    * @param {String} deviceID device id
    */
    setDeviceID(deviceID) {
        this.deviceID = deviceID;
        return this;
    }

    /**
    * Method to enable countly logging to the console.
    *
    * @param {bool} loggingEnabled enable
    * if true, countly sdk would log to console.
    */
    setLoggingEnabled(loggingEnabled) {
        this.loggingEnabled = loggingEnabled;
        return this;
    }

    /**
    * Method to enable unhandled crash reporting
    */
    enableCrashReporting() {
        this.crashReporting = true;
        return this;
    }

    /**
    * Method to set if consent is required.
    * 
    * If set to true, no feature will work without consent being given.
    *
    * @param {bool} shouldRequireConsent required. True: It is enabled. False: 
    * It is disabled.
    */
    setRequiresConsent(shouldRequireConsent) {
        this.shouldRequireConsent = shouldRequireConsent;
        return this;
    }

    /**
    * Method to give consent
    *
    * @param {array of String} consents consents
    */
    giveConsent(consents) {
        this.consents = consents;
        return this;
    }

    /**
    * Method to set the location
    *
    * @param {String} locationCountryCode country code
    * @param {String} locationCity city
    * @param {String} locationGpsCoordinates gps coordinates
    * @param {String} locationIpAddress ip address
    */
    setLocation(locationCountryCode, locationCity, locationGpsCoordinates, locationIpAddress) {
        this.locationCountryCode = locationCountryCode;
        this.locationCity = locationCity;
        this.locationGpsCoordinates = locationGpsCoordinates;
        this.locationIpAddress = locationIpAddress;
        return this;
    }

    /**
    * Method to enable tamper protection
    *
    * @param {String} tamperingProtectionSalt salt
    */
    enableParameterTamperingProtection(tamperingProtectionSalt) {
        this.tamperingProtectionSalt = tamperingProtectionSalt;
        return this;
    }

    /**
    * Method to set enable apm
    */
    enableApm() {
        this.enableApm = true;
        return this;
    }

    /**
    * Method to set the push token type
    *
    * @param {TokenType} tokenType token type
    * @param {String} channelName channel name
    * @param {String} channelDescription channel description
    */
    pushTokenType(tokenType, channelName, channelDescription) {
        this.tokenType = tokenType;
        this.channelName = channelName;
        this.channelDescription = channelDescription;
        return this;
    }

    /**
    * Method to set attribution id
    *
    * @param {String} attributionID attribution id
    */
    recordAttributionID(attributionID) {
        this.attributionID = attributionID;
        return this;
    }

    /**
    * Method to enable attribution
    */
    enableAttribution() {
        this.enableAttribution = true;
        return this;
    }

    /**
    * Method to configure intent redirection check
    *
    * @param {String} allowedIntentClassNames allowedIntentClassNames
    * @param {String} allowedIntentPackageNames allowedIntentPackageNames
    */
    configureIntentRedirectionCheck(allowedIntentClassNames, allowedIntentPackageNames) {
        this.allowedIntentClassNames = allowedIntentClassNames;
        this.allowedIntentPackageNames = allowedIntentPackageNames;
        return this;
    }

    /**
    * Method to set star rating dialog text
    *
    * @param {String} starRatingTextTitle title
    * @param {String} starRatingTextMessage message
    * @param {String} starRatingTextDismiss dismiss
    */
    setStarRatingDialogTexts(starRatingTextTitle, starRatingTextMessage, starRatingTextDismiss) {
        this.hasSetStarRatingDialogTexts = true;
        this.starRatingTextTitle = starRatingTextTitle;
        this.starRatingTextMessage = starRatingTextMessage;
        this.starRatingTextDismiss = starRatingTextDismiss;
        return this;
    }
}

export default CountlyConfig;
