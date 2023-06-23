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
import CountlyInternal from './Countly.js';

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
    * Method to enable countly internal debugging logs
    *
    * @param {bool} loggingEnabled enable
    * if true, countly sdk would log to console.
    */
    setLoggingEnabled(loggingEnabled) {
        this.loggingEnabled = loggingEnabled;
        CountlyInternal.setLoggingEnabled(loggingEnabled);
        return this;
    }

    /**
    * Method to enable crash reporting to report unhandled crashes to Countly
    */
    enableCrashReporting() {
        this.crashReporting = true;
        return this;
    }

    /**
    * Method to set if the consent feature is enabled.
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
    * Method to give consent for specific features before init
    *
    * @param {String[]} consents consents e.g ['location', 'sessions', 
    * 'attribution', 'push', 'events', 'views', 'crashes', 'users', 'push', 
    * 'star-rating', 'apm', 'feedback', 'remote-config']
    */
    giveConsent(consents) {
        this.consents = consents;
        return this;
    }

    /**
    * Method to set the user initial location
    *
    * @param {String} locationCountryCode country code e.g 'TR'
    * @param {String} locationCity city e.g 'Istanbul'
    * @param {String} locationGpsCoordinates gps coordinates e.g '41.0082,28.9784'
    * @param {String} locationIpAddress ip address e.g '10.2.33.12'
    */
    setLocation(locationCountryCode, locationCity, locationGpsCoordinates, locationIpAddress) {
        this.locationCountryCode = locationCountryCode;
        this.locationCity = locationCity;
        this.locationGpsCoordinates = locationGpsCoordinates;
        this.locationIpAddress = locationIpAddress;
        return this;
    }

    /**
    * Method to enable tamper protection. This sets the optional salt to be 
    * used for calculating the checksum of requested data which will be sent 
    * with each request
    *
    * @param {String} tamperingProtectionSalt salt
    */
    enableParameterTamperingProtection(tamperingProtectionSalt) {
        this.tamperingProtectionSalt = tamperingProtectionSalt;
        return this;
    }

    /**
    * Method to enable application performance monitoring which includes the recording of app start time.
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
    * @param {String} accentColor notification accent color
    */
    pushTokenType(tokenType, channelName, channelDescription, accentColor) {
        this.tokenType = tokenType;
        this.channelName = channelName;
        this.channelDescription = channelDescription;
        this.accentColor = accentColor;
        return this;
    }

    /**
    * Method to configure intent redirection check
    *
    * @param {String[]} allowedIntentClassNames allowed intent class names
    * @param {String[]} allowedIntentPackageNames allowed intent package name
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
        this.starRatingTextTitle = starRatingTextTitle;
        this.starRatingTextMessage = starRatingTextMessage;
        this.starRatingTextDismiss = starRatingTextDismiss;
        return this;
    }

    /**
    * Report direct user attribution
    */
    recordDirectAttribution(campaignType, campaignData) {
      this.campaignType = campaignType;
      this.campaignData = campaignData;
      return this;
    }

    /**
    * Report indirect user attribution
    */
    recordIndirectAttribution(attributionValues) {
      this.attributionValues = attributionValues;
      return this;
    }
}

export default CountlyConfig;
