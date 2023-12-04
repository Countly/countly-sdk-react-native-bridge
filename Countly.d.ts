import CountlyConfig from "countly-sdk-react-native-bridge/CountlyConfig";

declare module 'countly-sdk-react-native-bridge' {

  interface CountlyEventOptions {
    eventName?: string;
    eventCount?: number;
    eventSum?: number;
    segments?: Record<string, any>;
  }

  interface CountlyUserDataBulk {
    save(): Promise<void>;
    setProperty(keyName: string, keyValue: any): string | Promise<string>;
    increment(keyName: string): string | Promise<string>;
    incrementBy(keyName: string, keyValue: any): string | Promise<string>;
    multiply(keyName: string, keyValue: any): string | Promise<string>;
    saveMax(keyName: string, keyValue: any): string | Promise<string>;
    saveMin(keyName: string, keyValue: any): string | Promise<string>;
    setOnce(keyName: string, keyValue: any): string | void;
    pushUniqueValue(keyName: string, keyValue: any): string | void;
    pushValue(keyName: string, keyValue: any): string | void;
    pullValue(keyName: string, keyValue: any): string | void;
  }

  type CountlyCallback = (message: string) => void;

  type FeedbackWidget = {
    id: string;
    type: string;
    name?: string;
  };

  type WidgetCallback = () => void;

  type CustomMetric = {
    [key: string]: string;
  };

  type TraceCustomMetric = {
    [key: string]: string | number;
  };

  type NetworkTraceData = {
    networkTraceKey: string;
    responseCode: number;
    requestPayloadSize: number;
    responsePayloadSize: number;
    startTime: number;
    endTime: number;
  };

  type ValidationFunction = (
    stringValue: string,
    stringName: string,
    functionName: string
  ) => Promise<string | null>;

  type ResultObject = (
    error: string,
    data: Object,
  ) => Promise<string | null>;

  namespace Countly {
    serverUrl: string;
    appKey: string;
    eventEmitter: any;
    CountlyReactNative: any;
    _isCrashReportingEnabled: boolean;
    _isInitialized: boolean;
    _isPushInitialized: boolean;
    userData: Object;
    userDataBulk: Object;
    widgetShownCallbackName: string;
    widgetClosedCallbackName: string;
    ratingWidgetCallbackName: string;
    pushNotificationCallbackName: string;
    TemporaryDeviceIDString: string;
    export interface messagingMode {
      DEVELOPMENT: string;
      PRODUCTION: string;
      ADHOC: string;
    };

    /**
     * Countly Feedback Module
     */
    namespace feedback {
      state: CountlyState;
      export function getAvailableFeedbackWidgets(onFinished: (retrievedWidgets: FeedbackWidget[], error: string | null) => void): Promise<ResultObject>;
      export function presentFeedbackWidget(feedbackWidget: FeedbackWidget, closeButtonText: string, widgetShownCallback: callback, widgetClosedCallback: callback): ResultObject;
      export function getFeedbackWidgetData(widgetInfo: FeedbackWidget, onFinished: (widgetInfo: FeedbackWidget, error: string | null) => void): Promise<ResultObject>;
      export function reportFeedbackWidgetManually(widgetInfo: FeedbackWidget, widgetData: Object, widgetResult: Object): Promise<ResultObject>;
    };

    /**
     * Initialize Countly
     *
     * @deprecated in 23.02.0 : use 'initWithConfig' instead of 'init'.
     *
     * @function Countly.init should be used to initialize countly
     * @param {String} serverURL server url
     * @param {String} appKey application key
     * @param {String} deviceId device ID
     */
    export function init(serverUrl: string, appKey: string, deviceId: string | null): Promise<void>;

    /**
     * Initialize Countly
     *
     * @function Countly.initWithConfig should be used to initialize countly with config
     * @param {CountlyConfig} countlyConfig countly config object
     */
    export function initWithConfig(countlyConfig: CountlyConfig): Promise<void>;

    /**
     *
     * Checks if the sdk is initialized;
     *
     * @return {bool} if true, countly sdk has been initialized
     */
    export function isInitialized(): Promise<boolean>;

    /**
     *
     * Checks if the Countly SDK onStart function has been called
     *
     * @deprecated in 23.6.0. This will be removed.
     *
     * @return {bool || String} bool or error message
     */
    export function hasBeenCalledOnStart(): string | Promise<string>;

    /**
     *
     * Used to send various types of event;
     *
     * @param {Object} options event
     * @return {String || void} error message or void
     */
    export function sendEvent(options: CountlyEventOptions): string | void;

    /**
     * Record custom view to Countly.
     *
     * @param {string} recordView - name of the view
     * @param {Map} segments - allows to add optional segmentation,
     * Supported data type for segments values are String, int, double and bool
     * @return {String || void} error message or void
     */
    export function recordView(recordView: string, segments?: Record<string, any>): string | Promise<string>;

    /**
     * Disable push notifications feature, by default it is enabled.
     * Currently implemented for iOS only
     * Should be called before Countly init
     *
     * @return {String || void} error message or void
     */
    export function disablePushNotifications(): string | void;

    /**
     * @deprecated in 23.02.0 : use 'countlyConfig.pushTokenType' instead of 'pushTokenType'.
     *
     * Set messaging mode for push notifications
     * Should be called before Countly init
     *
     * @return {String || void} error message or void
     */
    export function pushTokenType(tokenType: string, channelName: string, channelDescription: string): string | Promise<string>;
    export function sendPushToken(options: { token?: string }): void;

    /**
     * This method will ask for permission, enables push notification and send push token to countly server.
     *
     * @param {string} customSoundPath - name of custom sound for push notifications (Only for Android)
     * Custom sound should be place at 'your_project_root/android/app/src/main/res/raw'
     * Should be called after Countly init
     *
     */
    export function askForNotificationPermission(customSoundPath?: string): string | void;

    /**
     *
     * Set callback to receive push notifications
     * @param {callback listener } theListener
     * @return {NativeEventEmitter} event
     */
    export function registerForNotification(theListener: () => void): any; // The return type should be adjusted to the actual event subscription type

    /**
     * @deprecated in 23.02.0 : use 'countlyConfig.configureIntentRedirectionCheck' instead of 'configureIntentRedirectionCheck'.
     *
     * Configure intent redirection checks for push notification
     * Should be called before Countly "askForNotificationPermission"
     *
     * @param {array of allowed class names } allowedIntentClassNames set allowed intent class names
     * @param {array of allowed package names } allowedIntentPackageNames set allowed intent package names
     * @param {bool to check additional intent checks} useAdditionalIntentRedirectionChecks by default its true
     * @return {String || void} error message or void
     */
    export function configureIntentRedirectionCheck(
      allowedIntentClassNames?: string[],
      allowedIntentPackageNames?: string[],
      useAdditionalIntentRedirectionChecks?: boolean
    ): string | void;

    /**
     * @deprecated at 23.6.0 - Automatic sessions are handled by underlying SDK, this function will do nothing.
     *
     * Countly start for android
     *
     * @return {String || void} error message or void
     */
    export function start(): string | void;

    /**
     * @deprecated at 23.6.0 - Automatic sessions are handled by underlying SDK, this function will do nothing.
     *
     * Countly stop for android
     *
     * @return {String || void} error message or void
     */
    export function stop(): string | void;

    /**
     * Enable countly internal debugging logs
     * Should be called before Countly init
     *
     * @deprecated in 20.04.6
     *
     * @function Countly.setLoggingEnabled should be used to enable/disable countly internal debugging logs
     */
    export function enableLogging(): void;

    /**
     * Disable countly internal debugging logs
     *
     * @deprecated in 20.04.6
     *
     * @function Countly.setLoggingEnabled should be used to enable/disable countly internal debugging logs
     */
    export function disableLogging(): void;

    /**
     * Set to true if you want to enable countly internal debugging logs
     * Should be called before Countly init
     *
     * @param {[bool = true]} enabled server url
     */
    export function setLoggingEnabled(enabled?: boolean): void;

    /**
     * @deprecated in 23.02.0 : use 'countlyConfig.setLocation' instead of 'setLocationInit'.
     *
     * Set user initial location
     * Should be called before init
     * @param {ISO Country code for the user's country} countryCode
     * @param {Name of the user's city} city
     * @param {comma separate lat and lng values. For example, "56.42345,123.45325"} location
     * @param {IP address of user's} ipAddress
     * */
    export function setLocationInit(
      countryCode: string | null,
      city: string | null,
      location: string | null,
      ipAddress: string | null
    ): void;

    /**
     *
     * Set user location
     * @param {ISO Country code for the user's country} countryCode
     * @param {Name of the user's city} city
     * @param {comma separate lat and lng values. For example, "56.42345,123.45325"} location
     * @param {IP address of user's} ipAddress
     * */
    export function setLocation(
      countryCode: string | null,
      city: string | null,
      location: string | null,
      ipAddress: string | null
    ): string | void;

    /**
     *
     * Disable user location
     *
     * @return {String || void} error message or void
     */
    export function disableLocation(): string | void;

    /**
     *
     * Get currently used device Id.
     * Should be called after Countly init
     *
     * @return {String} device id or error message
     */
    export function getCurrentDeviceId(): Promise<string>;

    /**
     * Get currently used device Id type.
     * Should be called after Countly init
     *
     * @return {DeviceIdType || null} deviceIdType or null
     */
    export function changeDeviceId(): string | void;

    /**
     * Change the current device id
     *
     * @param {String} newDeviceID id new device id
     * @param {Boolean} onServer merge device id
     * @return {String || void} error message or void
     * */
    export function changeDeviceId(newDeviceID: string, onServer: boolean): string | void;

    /**
     *
     * Set to "true" if you want HTTP POST to be used for all requests
     * Should be called before Countly init
     * @param {bool} forceHttp force http post for all requests.
     */
    export function setHttpPostForced(boolean?: boolean): void;

    /**
     * @deprecated in 23.02.0 : use 'countlyConfig.enableCrashReporting' instead of 'enableCrashReporting'.
     *
     * Enable crash reporting to report unhandled crashes to Countly
     * Should be called before Countly init
     */
    export function enableCrashReporting(): void;

    /**
     *
     * Add crash log for Countly
     *
     * @param {String} crashLog crash log
     * @return {String || void} error message or void
     */
    export function addCrashLog(crashLog: string): string | void;

    /**
     *
     * Log exception for Countly
     *
     * @param {String} exception exception
     * @param {bool} nonfatal nonfatal
     * @param {Map} segments segments
     * @return {String || void} error message or void
     */
    export function logException(exception: string, nonfatal: boolean, segments: Record<string, any>): string | void;

    /**
     *
     * Set custom crash segment for Countly
     *
     * @param {Map} segments segments
     */
    export function setCustomCrashSegments(segments: Record<string, any>): string | void;

    /**
     *
     * Start session tracking
     *
     * @return {String || void} error message or void
     */
    export function startSession(): string | void;

    /**
     *
     * End session tracking
     *
     * @return {String || void} error message or void
     */
    export function endSession(): string | void;

    /**
     * @deprecated in 23.02.0 : use 'countlyConfig.enableParameterTamperingProtection' instead of 'enableParameterTamperingProtection'.
     *
     * Set the optional salt to be used for calculating the checksum of requested data which will be sent with each request, using the &checksum field
     * Should be called before Countly init
     *
     * @param {String} salt salt
     * @return {String || void} error message or void
     */
    export function enableParameterTamperingProtection(salt: string): string | Promise<string>;

    /**
     *
     * It will ensure that connection is made with one of the public keys specified
     * Should be called before Countly init
     *
     * @return {String || void} error message or void
     */
    export function pinnedCertificates(certificateName: string): string | Promise<string>;

    /**
     *
     * Start Event
     *
     * @param {String} eventName name of event
     * @return {String || void} error message or void
     */
    export function startEvent(eventName: string): string | Promise<string>;

    /**
     *
     * Cancel Event
     *
     * @param {String} eventName name of event
     * @return {String || void} error message or void
     */
    export function cancelEvent(eventName: string): string | Promise<string>;

    /**
     *
     * End Event
     *
     * @param {String || Object} options event options
     * @return {String || void} error message or void
     */
    export function endEvent(options: CountlyEventOptions): string | void;

    /**
     *
     * Used to send user data
     *
     * @param {Object} userData user data
     * @return {String || void} error message or void
     */
    export function setUserData(userData: CountlyUserData): string | void;
    userData: {
      export function setProperty(keyName: string, keyValue: any): string | Promise<string>;
      export function increment(keyName: string): string | Promise<string>;
      export function incrementBy(keyName: string, keyValue: any): string | Promise<string>;
      export function multiply(keyName: string, keyValue: any): string | Promise<string>;
      export function saveMax(keyName: string, keyValue: any): string | Promise<string>;
      export function saveMin(keyName: string, keyValue: any): string | Promise<string>;
      export function setOnce(keyName: string, keyValue: any): string | void;
      export function pushUniqueValue(keyName: string, keyValue: any): string | void;
      export function pushValue(keyName: string, keyValue: any): string | void;
      export function pullValue(keyName: string, keyValue: any): string | void;
    };
    userDataBulk: CountlyUserDataBulk;

    /**
     * @deprecated in 23.02.0 : use 'countlyConfig.setRequiresConsent' instead of 'setRequiresConsent'.
     *
     * Set that consent should be required for features to work.
     * Should be called before Countly init
     *
     * @param {bool} flag if true, consent is required for features to work.
     */
    export function setRequiresConsent(flag: boolean): void;

    /**
     *
     * Give consent for some features
     * Should be called after Countly init
     *
     * @param {String[]} args list of consents
     * @return {String || void} error message or void
     */
    export function giveConsent(args: string | string[]): void;

    /**
     * @deprecated in 23.02.0 : use 'countlyConfig.giveConsent' instead of 'giveConsentInit'.
     *
     * Give consent for specific features before init.
     * Should be called after Countly init
     *
     * @param {String[]} args list of consents
     */
    export function giveConsentInit(args: string | string[]): Promise<void>;

    /**
     *
     * Remove consent for some features
     * Should be called after Countly init
     *
     * @param {String[]} args list of consents
     * @return {String || void} error message or void
     */
    export function removeConsent(args: string | string[]): void;

    /**
     *
     * Give consent for all features
     * Should be called after Countly init
     *
     * @return {String || void} error message or void
     */
    export function giveAllConsent(): void;

    /**
     *
     * Remove consent for all features
     * Should be called after Countly init
     *
     * @return {String || void} error message or void
     */
    export function removeAllConsent(): void;
    export function remoteConfigUpdate(callback: CountlyCallback): void;
    export function updateRemoteConfigForKeysOnly(keyNames: string[], callback: CountlyCallback): void;
    export function updateRemoteConfigExceptKeys(keyNames: string[], callback: CountlyCallback): void;
    export function getRemoteConfigValueForKey(keyName: string, callback: (value: any) => void): void;
    export function getRemoteConfigValueForKeyP(keyName: string): Promise<any>;
    export function remoteConfigClearValues(): Promise<string>;

    /**
     * @deprecated in 23.02.0 : use 'countlyConfig.setStarRatingDialogTexts' instead of 'setStarRatingDialogTexts'.
     *
     * Set's the text's for the different fields in the star rating dialog. Set value null if for some field you want to keep the old value
     *
     * @param {String} starRatingTextTitle - dialog's title text (Only for Android)
     * @param {String} starRatingTextMessage - dialog's message text
     * @param {String} starRatingTextDismiss - dialog's dismiss buttons text (Only for Android)
     * @return {String || void} error message or void
     */
    export function setStarRatingDialogTexts(
      starRatingTextTitle: string | null,
      starRatingTextMessage: string | null,
      starRatingTextDismiss: string | null
    ): void;
    export function showStarRating(callback: CountlyCallback): void;

    /**
     * Present a Rating Popup using rating widget Id
     *
     * @param {String} widgetId - id of rating widget to present
     * @param {String} closeButtonText - text for cancel/close button
     * @param {callback listener} [ratingWidgetCallback] This parameter is optional.
     */
    export function presentRatingWidgetWithID(widgetId: string, closeButtonText: string): void;

    /**
     * Get a list of available feedback widgets as array of object to handle multiple widgets of same type.
     * @deprecated in 23.8.0 : use 'Countly.feedback.getAvailableFeedbackWidgets' instead of 'getFeedbackWidgets'.
     * @param {callback listener} [onFinished] - returns (retrievedWidgets, error). This parameter is optional.
     * @return {String || []} error message or []
     */
    export function getFeedbackWidgets(onFinished: (retrievedWidgets: FeedbackWidget[], error: string | null) => void): void;

    /**
     * Present a chosen feedback widget
     *
     * @deprecated in 23.8.0 : use 'Countly.feedback.presentFeedbackWidget' instead of 'presentFeedbackWidgetObject'.
     * @param {Object} feedbackWidget - feeback Widget with id, type and name
     * @param {String} closeButtonText - text for cancel/close button
     * @param {callback listener} [widgetShownCallback] - Callback to be executed when feedback widget is displayed. This parameter is optional.
     * @param {callback listener} [widgetClosedCallback] - Callback to be executed when feedback widget is closed. This parameter is optional.
     *
     * @return {String || void} error message or void
     */
    export function presentFeedbackWidgetObject(
      feedbackWidget: FeedbackWidget,
      closeButtonText: string,
      widgetShownCallback: WidgetCallback,
      widgetClosedCallback: WidgetCallback
    ): void;

    /**
     *
     * Events get grouped together and are sent either every minute or after the unsent event count reaches a threshold. By default it is 10
     * Should be called before Countly init
     * 
     * @param {number} size - event count
     * 
     */
    export function setEventSendThreshold(size: number): void;

    /**
     * @deprecated in 23.02.0 : use 'countlyConfig.enableApm' instead of 'enableApm'.
     *
     * Enable APM features, which includes the recording of app start time.
     * Should be called before Countly init
     */
    export function enableApm(): void;

    /**
     * @deprecated in 23.02.0 : use 'Countly.recordIndirectAttribution' instead of 'Countly'.
     *
     * Enable campaign attribution reporting to Countly.
     * For iOS use "recordAttributionID" instead of "enableAttribution"
     * Should be called before Countly init
     */
    export function enableAttribution(attributionID?: string): void;

    /**
     *
     * @deprecated in 23.02.0 : use 'Countly.recordIndirectAttribution' instead of 'recordAttributionID'.
     *
     * set attribution Id for campaign attribution reporting.
     * Currently implemented for iOS only
     */
    export function recordAttributionID(attributionID: string): void;

    /**
     * Replaces all requests with a different app key with the current app key.
     * In request queue, if there are any request whose app key is different 
     * than the current app key,
     * these requests' app key will be replaced with the current app key.
     */
    export function replaceAllAppKeysInQueueWithCurrentAppKey(): void;

    /**
     * set direct attribution Id for campaign attribution reporting.
     */
    export function recordDirectAttribution(campaignType, campaignData): void;

    /**
     * set indirect attribution Id for campaign attribution reporting.
     */
    export function recordIndirectAttribution(attributionValues): void;

    /**
     * Removes all requests with a different app key in request queue.
     * In request queue, if there are any request whose app key is different than the current app key,
     * these requests will be removed from request queue.
     */
    export function removeDifferentAppKeysFromQueue(): void;

    /**
     * Call this function when app is loaded, so that the app launch duration can be recorded.
     * Should be called after init.
     */
    export function appLoadingFinished(): void;

    /**
     * Set the metrics you want to override
     * Should be called before Countly init
     * @param {Object} customMetric - metric with key/value pair
     * Supported data type for customMetric values is String
     */
    export function setCustomMetrics(customMetric: CustomMetric): void;
    validateUserDataValue: ValidationFunction;
    validateUserDataType: ValidationFunction;
    validateValidUserData: ValidationFunction;
    validateParseInt: ValidationFunction;
    logWarning: (functionName: string, warning: string) => Promise<void>;
    export interface CountlyUserData {
      name?: string;
      username?: string;
      email?: string;
      organization?: string;
      phone?: string;
      picture?: string;
      gender?: string;
      byear?: string | Number;
      custom?: Record<string, any>;
    };
  }

  export default Countly;
}
// export function showFeedbackPopup(widgetId: string, closeButtonText: string): void;
// export function getAvailableFeedbackWidgets(): Promise<FeedbackWidget[]>;
// export function presentFeedbackWidget(widgetType: string, widgetId: string, closeButtonText: string): void;
// export function logError(tag: string, message: string): void;
// export function validateString(value: string, label: string, context: string): string | Promise<string>;
// export function setViewTracking(boolean: boolean): Promise<void>;
// export function startTrace(traceKey: string): void;
// export function cancelTrace(traceKey: string): void;
// export function clearAllTraces(): void;
// export function endTrace(traceKey: string, customMetric?: TraceCustomMetric): void;
// export function recordNetworkTrace(data: NetworkTraceData): void;

declare module 'countly-sdk-react-native-bridge/CountlyConfig' {
  /**
   *
   * Config Object for Countly Init
   * Should be called before Countly "askForNotificationPermission"
   *
   * @param {String} serverURL server url
   * @param {String} appKey application key
   */
  namespace CountlyConfig {
    /**
     * Method to set the server url
     *
     * @param {String} serverURL server url
     */
    export function setServerURL(serverURL: string): CountlyConfig;

    /**
     * Method to set the app key
     *
     * @param {String} appKey application key
     */
    export function setAppKey(appKey: string): CountlyConfig;

    /**
     * Method to set the device id
     *
     * @param {String} deviceID device id
     */
    export function setDeviceID(deviceID: string): CountlyConfig;

    /**
     * Method to enable countly internal debugging logs
     *
     * @param {bool} loggingEnabled enable
     * if true, countly sdk would log to console.
     */
    export function setLoggingEnabled(loggingEnabled: bool): CountlyConfig;

    /**
     * Method to enable crash reporting to report unhandled crashes to Countly
     */
    export function enableCrashReporting(): CountlyConfig;

    /**
     * Method to set if the consent feature is enabled.
     *
     * If set to true, no feature will work without consent being given.
     *
     * @param {bool} shouldRequireConsent required. True: It is enabled. False:
     * It is disabled.
     */
    export function setRequiresConsent(shouldRequireConsent: bool): CountlyConfig;

    /**
     * Method to give consent for specific features before init
     *
     * @param {String[]} consents consents e.g ['location', 'sessions',
     * 'attribution', 'push', 'events', 'views', 'crashes', 'users', 'push',
     * 'star-rating', 'apm', 'feedback', 'remote-config']
     */
    export function giveConsent(consents: string[]): CountlyConfig;

    /**
     * Method to set the user initial location
     *
     * @param {String} locationCountryCode country code e.g 'TR'
     * @param {String} locationCity city e.g 'Istanbul'
     * @param {String} locationGpsCoordinates gps coordinates e.g '41.0082,28.9784'
     * @param {String} locationIpAddress ip address e.g '10.2.33.12'
     */
    export function setLocation(locationCountryCode: string, locationCity: string, locationGpsCoordinates: string, locationIpAddress: string): CountlyConfig;

    /**
     * Method to enable tamper protection. This sets the optional salt to be
     * used for calculating the checksum of requested data which will be sent
     * with each request
     *
     * @param {string} tamperingProtectionSalt salt
     */
    export function enableParameterTamperingProtection(tamperingProtectionSalt: string): CountlyConfig;

    /**
     * Method to enable application performance monitoring which includes the recording of app start time.
     */
    export function enableApm(): CountlyConfig;

    /**
     * Method to set the push token type
     * @deprecated
     * Use setPushTokenType() instead to set pushToken
     * Use setPushNotificationChannelInformation() instead to set channel information
     *
     * @param {TokenType} tokenType token type
     * @param {string} channelName channel name
     * @param {string} channelDescription channel description
     */
    export function pushTokenType(tokenType: TokenType, channelName: string, channelDescription: string): CountlyConfig;

    /**
     * Method to set the push token type
     * NB: ONLY FOR iOS
     *
     * @param {Countly.messagingMode} tokenType token type
     * Possible values include 'DEVELOPMENT', 'PRODUCTION', 'ADHOC'.
     */
    export function setPushTokenType(tokenType: messagingMode): CountlyConfig;

    /**
     * Method to set the push channel name and description
     * NB: ONLY FOR ANDROID
     *
     * @param {string} name channel name
     * @param {string} description channel description
     */
    export function setPushNotificationChannelInformation(name: string, description: string): CountlyConfig;

    /**
     * Method to set the push notification accent color
     * NB: ONLY FOR ANDROID
     *
     * @param {string} accentColor notification accent color
     * example '#000000'
     */
    export function setPushNotificationAccentColor(accentColor: string): CountlyConfig;

    /**
     * Method to configure intent redirection check
     *
     * @param {string[]} allowedIntentClassNames allowed intent class names
     * @param {string[]} allowedIntentPackageNames allowed intent package name
     */
    export function configureIntentRedirectionCheck(allowedIntentClassNames: string[], allowedIntentPackageNames: string[]): CountlyConfig;

    /**
     * Method to set star rating dialog text
     *
     * @param {string} starRatingTextTitle title
     * @param {string} starRatingTextMessage message
     * @param {string} starRatingTextDismiss dismiss
     */
    export function setStarRatingDialogTexts(starRatingTextTitle: string, starRatingTextMessage: string, starRatingTextDismiss: string): CountlyConfig;

    /**
     * Report direct user attribution
     *
     * @param {string} campaignType campaign type
     * @param {Object} campaignData campaign data
     */
    export function recordDirectAttribution(campaignType: string, campaignData: Object): CountlyConfig;

    /**
     * Report indirect user attribution
     *
     * @param {Object} attributionValues attribution values
     */
    export function recordIndirectAttribution(attributionValues: Object): CountlyConfig;
  }

  export default CountlyConfig;
}
