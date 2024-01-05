interface Segmentation {
  [key: string]: string;
}

interface CountlyEventOptions {
    eventName: string;
    eventCount?: number;
    eventSum?: number | string;
    segments?: Segmentation;
}

interface FeedbackWidget {
    id: string;
    type: string;
    name?: string;
}

interface FeedbackWidgetResultObject {
    error: string,
    data: FeedbackWidget[],
}

interface CountlyUserData {
    name?: string;
    username?: string;
    email?: string;
    organization?: string;
    phone?: string;
    picture?: string;
    gender?: string;
    byear?: number | string;
    custom?: Record<string, any>;
}
type CountlyCallback = (message: string) => void;
type CountlyErrorCallback = (error: string | null) => void;

type WidgetCallback = () => void;
type FeedbackWidgetCallback = (retrievedWidgets: FeedbackWidget[], error: string | null) => void;
type WidgetInfoCallback = (widgetInfo: FeedbackWidget[], error: string | null) => void;

interface RatingWidgetResult {
    rating: number,
  comment: string,
}

interface CustomMetric {
  [key: string]: string;
}

interface TraceCustomMetric {
  [key: string]: number | string;
}

type ValidationFunction = (
  stringValue: string,
  stringName: string,
  functionName: string
) => Promise<string | null>;

interface ResultObject {
    error: string,
    data: object,
}
interface ErrorObject { error: string | null }

declare module 'countly-sdk-react-native-bridge' {
    import type CountlyConfig from 'countly-sdk-react-native-bridge/CountlyConfig'

    namespace Countly {
        serverUrl: string;
        appKey: string;
        eventEmitter: any;
        CountlyReactNative: any;
        _isCrashReportingEnabled: boolean;
        _isInitialized: boolean;
        _isPushInitialized: boolean;
        widgetShownCallbackName: string;
        widgetClosedCallbackName: string;
        ratingWidgetCallbackName: string;
        pushNotificationCallbackName: string;
        export const TemporaryDeviceIDString: string;
        export interface messagingMode {
            DEVELOPMENT: string;
            PRODUCTION: string;
            ADHOC: string;
        }

        /**
         * Countly Feedback Module
         */
        namespace feedback {
            /**
             * Get a list of available feedback widgets as an array of objects.
             * @param {FeedbackWidgetCallback} [onFinished] - returns (retrievedWidgets, error). This parameter is optional.
             * @return {FeedbackWidgetResultObject} object {error: string or null, data: FeedbackWidget[] or null }
             */
            export function getAvailableFeedbackWidgets(onFinished?: FeedbackWidgetCallback): Promise<FeedbackWidgetResultObject>;

            /**
             * Present a chosen feedback widget
             *
             * @param {object} feedbackWidget - feedback Widget with id, type and name
             * @param {string} closeButtonText - text for cancel/close button
             * @param {callback} [widgetShownCallback] - Callback to be executed when feedback widget is displayed. This parameter is optional.
             * @param {callback} [widgetClosedCallback] - Callback to be executed when feedback widget is closed. This parameter is optional.
             *
             * @return {ErrorObject} object {error: string or null}
             */
            export function presentFeedbackWidget(feedbackWidget: FeedbackWidget, closeButtonText: string, widgetShownCallback: callback, widgetClosedCallback: callback): ErrorObject;

            /**
             * Get a feedback widget's data as an object.
             * @param {FeedbackWidget} widgetInfo - widget to get data for. You should get this from 'getAvailableFeedbackWidgets' method.
             * @param {WidgetInfoCallback} [onFinished] - returns (object retrievedWidgetData, error). This parameter is optional.
             * @return {ResultObject} object {error: string, data: object or null}
             */
            export function getFeedbackWidgetData(widgetInfo: FeedbackWidget, onFinished?: WidgetInfoCallback): Promise<ResultObject>;

            /**
             * Report manually for a feedback widget.
             * @param {FeedbackWidget} widgetInfo -  the widget you are targeting. You should get this from 'getAvailableFeedbackWidgets' method.
             * @param {object} widgetData - data of that widget. You should get this from 'getFeedbackWidgetData' method.
             * @param {RatingWidgetResult | object} widgetResult - Information you want to report.
             * @return {ErrorObject} object {error: string}
             */
            export function reportFeedbackWidgetManually(widgetInfo: FeedbackWidget, widgetData: object, widgetResult: RatingWidgetResult | object): Promise<ErrorObject>;
        }

        /**
         * Initialize Countly
         *
         * @deprecated in 23.02.0 : use 'initWithConfig' instead of 'init'.
         *
         * @function Countly.init should be used to initialize countly
         * @param {string} serverURL server url
         * @param {string} appKey application key
         * @param {string | null} deviceId device ID
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
         * @return {Promise<boolean>} if true, countly sdk has been initialized
         */
        export function isInitialized(): Promise<boolean>;

        /**
         *
         * Checks if the Countly SDK onStart function has been called
         *
         * @deprecated in 23.6.0. This will be removed.
         *
         * @return {Promise<string> | string} boolean or error message
         */
        export function hasBeenCalledOnStart(): Promise<string> | string;

        /**
         *
         * Used to send various types of event;
         *
         * @param {CountlyEventOptions} options event
         * @return {string | void} error message or void
         */
        export function sendEvent(options: CountlyEventOptions): string | void;

        /**
         * Record custom view to Countly.
         *
         * @param {string} recordView - name of the view
         * @param {Segmentation} segments - allows to add optional segmentation,
         * Supported data type for segments values are string, int, double and boolean
         * @return {string | null} error message or void
         */
        export function recordView(recordView: string, segments?: Segmentation): string | null;

        /**
         * Disable push notifications feature, by default it is enabled.
         * Currently implemented for iOS only
         * Should be called before Countly init
         *
         * @return {string | void} error message or void
         */
        export function disablePushNotifications(): string | void;

        /**
         * @deprecated in 23.02.0 : use 'countlyConfig.pushTokenType' instead of 'pushTokenType'.
         *
         * @param {string} tokenType - Token type
         * @param {string} channelName - Channel name
         * @param {string} channelDescription - Description for the channel
         * Set messaging mode for push notifications
         * Should be called before Countly init
         *
         * @return {string | void} error message or void
         */
        export function pushTokenType(tokenType: string, channelName: string, channelDescription: string): Promise<string> | string;
        export function sendPushToken(options: { readonly token?: string }): void;

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
        export function registerForNotification(theListener: (theNotification: string) => void): any; // The return type should be adjusted to the actual event subscription type

        /**
         * @deprecated in 23.02.0 : use 'countlyConfig.configureIntentRedirectionCheck' instead of 'configureIntentRedirectionCheck'.
         *
         * Configure intent redirection checks for push notification
         * Should be called before Countly "askForNotificationPermission"
         *
         * @param {string[]} allowedIntentClassNames allowed intent class names
         * @param {string[]} allowedIntentPackageNames allowed intent package names
         * @param {boolean} useAdditionalIntentRedirectionChecks to check additional intent checks. It is by default its true
         * @return {string | void} error message or void
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
         * @return {string | void} error message or void
         */
        export function start(): void;

        /**
         * @deprecated at 23.6.0 - Automatic sessions are handled by underlying SDK, this function will do nothing.
         *
         * Countly stop for android
         *
         * @return {string | void} error message or void
         */
        export function stop(): void;

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
         * @param {[boolean = true]} enabled server url
         */
        export function setLoggingEnabled(enabled?: boolean): void;

        /**
         * @deprecated in 23.02.0 : use 'countlyConfig.setLocation' instead of 'setLocationInit'.
         *
         * Set user initial location
         * Should be called before init
         * @param {string | null} countryCode ISO Country code for the user's country
         * @param {string | null} city Name of the user's city
         * @param {string | null} location comma separate lat and lng values. For example, "56.42345,123.45325"
         * @param {string | null} ipAddress IP address of user's
         */
        export function setLocationInit(
      countryCode: string | null,
      city: string | null,
      location: string | null,
      ipAddress: string | null,
    ): void;

        /**
         *
         * Set user location
         * @param {string | null} countryCode ISO Country code for the user's country
         * @param {string | null} city Name of the user's city
         * @param {string | null} location comma separate lat and lng values. For example, "56.42345,123.45325"
         * @param {string | null} ipAddress IP address of user's
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
         * @return {string | void} error message or void
         */
        export function disableLocation(): string | void;

        /**
         *
         * Get currently used device Id.
         * Should be called after Countly init
         *
         * @return {string} device id or error message
         */
        export function getCurrentDeviceId(): Promise<string> | string;

        /**
         * Get currently used device Id type.
         * Should be called after Countly init
         *
         * @return {DeviceIdType | null} deviceIdType or null
         * */
        export function getDeviceIDType(): Promise<DeviceIdType> | null;


        /**
         * Change the current device id
         *
         * @param {string} newDeviceID id new device id
         * @param {boolean} onServer merge device id
         * @return {string | void} error message or void
         * */
        export function changeDeviceId(newDeviceID: string, onServer: boolean): string | void;

        /**
         *
         * Set to "true" if you want HTTP POST to be used for all requests
         * Should be called before Countly init
         * @param {boolean} forceHttp force http post for all requests. Default value is true
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
         * @param {string} crashLog crash log
         * @return {string | void} error message or void
         */
        export function addCrashLog(crashLog: string): string | void;

        /**
         *
         * Log exception for Countly
         *
         * @param {string} exception exception
         * @param {boolean} nonfatal nonfatal
         * @param {object} segments segments
         * @return {string | void} error message or void
         */
        export function logException(exception: string, nonfatal: boolean, segments: Record<string, any>): string | void;

        /**
         *
         * Set custom crash segment for Countly
         *
         * @param {Map} segments segments
         */
        export function setCustomCrashSegments(segments: Record<string, any>): void;

        /**
         *
         * Start session tracking
         *
         * @return {string | void} error message or void
         */
        export function startSession(): string | void;

        /**
         *
         * End session tracking
         *
         * @return {string | void} error message or void
         */
        export function endSession(): string | void;

        /**
         * @deprecated in 23.02.0 : use 'countlyConfig.enableParameterTamperingProtection' instead of 'enableParameterTamperingProtection'.
         *
         * Set the optional salt to be used for calculating the checksum of requested data which will be sent with each request, using the &checksum field
         * Should be called before Countly init
         *
         * @param {string} salt salt
         * @return {string | void} error message or void
         */
        export function enableParameterTamperingProtection(salt: string): string | void;

        /**
         *
         * It will ensure that connection is made with one of the public keys specified
         * Should be called before Countly init
         *
         * @return {string | void} error message or void
         */
        export function pinnedCertificates(certificateName: string): string | void;

        /**
         *
         * Start Event
         *
         * @param {string} eventName name of event
         * @return {string | void} error message or void
         */
        export function startEvent(eventName: string): string | void;

        /**
         *
         * Cancel Event
         *
         * @param {string} eventName name of event
         * @return {string | void} error message or void
         */
        export function cancelEvent(eventName: string): string | void;

        /**
         *
         * End Event
         *
         * @param {string | object} options event options
         * @return {string | void} error message or void
         */
        export function endEvent(options: string | CountlyEventOptions): string | void;

        /**
         *
         * Used to send user data
         *
         * @param {object} userData user data
         * @return {string | void} error message or void
         */
        export function setUserData(userData: CountlyUserData): string | Promise<void>;

        namespace userData {
            export function setProperty(keyName: string, keyValue: any): Promise<void> | string;
            export function increment(keyName: string): Promise<void> | string;
            export function incrementBy(keyName: string, keyValue: any): Promise<void> | string;
            export function multiply(keyName: string, keyValue: any): Promise<void> | string;
            export function saveMax(keyName: string, keyValue: any): Promise<void> | string;
            export function saveMin(keyName: string, keyValue: any): Promise<void> | string;
            export function setOnce(keyName: string, keyValue: any): Promise<void> | string;
            export function pushUniqueValue(keyName: string, keyValue: any): Promise<void> | string;
            export function pushValue(keyName: string, keyValue: any): Promise<void> | string;
            export function pullValue(keyName: string, keyValue: any): Promise<void> | string;
        }

        namespace userDataBulk {
            export function setUserProperties(properties: object): Promise<void> | string;
            export function save(): Promise<void>;
            export function setProperty(keyName: string, keyValue: any): Promise<string> | string;
            export function increment(keyName: string): Promise<void> | string;
            export function incrementBy(keyName: string, keyValue: any): Promise<void> | string;
            export function multiply(keyName: string, keyValue: any): Promise<void> | string;
            export function saveMax(keyName: string, keyValue: any): Promise<void> | string;
            export function saveMin(keyName: string, keyValue: any): Promise<void> | string;
            export function setOnce(keyName: string, keyValue: any): Promise<void> | string;
            export function pushUniqueValue(keyName: string, keyValue: any): Promise<void> | string;
            export function pushValue(keyName: string, keyValue: any): Promise<void> | string;
            export function pullValue(keyName: string, keyValue: any): Promise<void> | string;
        }

        /**
         * @deprecated in 23.02.0 : use 'countlyConfig.setRequiresConsent' instead of 'setRequiresConsent'.
         *
         * Set that consent should be required for features to work.
         * Should be called before Countly init
         *
         * @param {boolean} flag if true, consent is required for features to work.
         */
        export function setRequiresConsent(flag: boolean): void;

        /**
         *
         * Give consent for some features
         * Should be called after Countly init
         *
         * @param {string[] | string} args list of consents
         * @return {string | void} error message or void
         */
        export function giveConsent(args: string[] | string): string | void;

        /**
         * @deprecated in 23.02.0 : use 'countlyConfig.giveConsent' instead of 'giveConsentInit'.
         *
         * Give consent for specific features before init.
         * Should be called after Countly init
         *
         * @param {string[] | string} args list of consents
         */
        export function giveConsentInit(args: string[] | string): Promise<void>;

        /**
         *
         * Remove consent for some features
         * Should be called after Countly init
         *
         * @param {string[] | string} args list of consents
         * @return {string | void} error message or void
         */
        export function removeConsent(args: string[] | string): string | void;

        /**
         *
         * Give consent for all features
         * Should be called after Countly init
         *
         * @return {string | void} error message or void
         */
        export function giveAllConsent(): string | void;

        /**
         *
         * Remove consent for all features
         * Should be called after Countly init
         *
         * @return {string | void} error message or void
         */
        export function removeAllConsent(): string | void;
        export function remoteConfigUpdate(callback: CountlyCallback): string | void;
        export function updateRemoteConfigForKeysOnly(keyNames: readonly string[], callback: CountlyCallback): string | void;
        export function updateRemoteConfigExceptKeys(keyNames: readonly string[], callback: CountlyCallback): string | void;
        export function getRemoteConfigValueForKey(keyName: string, callback: (value: any) => void): string | void;
        export function getRemoteConfigValueForKeyP(keyName: string): string | Promise<any>;
        export function remoteConfigClearValues(): string | Promise<string>;

        /**
         * @deprecated in 23.02.0 : use 'countlyConfig.setStarRatingDialogTexts' instead of 'setStarRatingDialogTexts'.
         *
         * Set's the text's for the different fields in the star rating dialog. Set value null if for some field you want to keep the old value
         *
         * @param {string} starRatingTextTitle - dialog's title text (Only for Android)
         * @param {string} starRatingTextMessage - dialog's message text
         * @param {string} starRatingTextDismiss - dialog's dismiss buttons text (Only for Android)
         * @return {string | void} error message or void
         */
        export function setStarRatingDialogTexts(
      starRatingTextTitle: string,
      starRatingTextMessage: string,
      starRatingTextDismiss: string,
    ): void;
        export function showStarRating(callback?: CountlyCallback): string | void;

        /**
         * Present a Rating Popup using rating widget Id
         *
         * @param {string} widgetId - id of rating widget to present
         * @param {string} closeButtonText - text for cancel/close button
         * @param {callback listener} [ratingWidgetCallback] This parameter is optional.
         */
        export function presentRatingWidgetWithID(widgetId: string, closeButtonText: string, ratingWidgetCallback?: CountlyErrorCallback): string | void;

        /**
         * Get a list of available feedback widgets as array of object to handle multiple widgets of same type.
         * @deprecated in 23.8.0 : use 'Countly.feedback.getAvailableFeedbackWidgets' instead of 'getFeedbackWidgets'.
         * @param {callback listener} [onFinished] - returns (retrievedWidgets, error). This parameter is optional.
         * @return {string | []} error message or []
         */
        export function getFeedbackWidgets(onFinished?: FeedbackWidgetCallback): Promise<any> | string;

        /**
         * Present a chosen feedback widget
         *
         * @deprecated in 23.8.0 : use 'Countly.feedback.presentFeedbackWidget' instead of 'presentFeedbackWidgetObject'.
         * @param {FeedbackWidget} feedbackWidget - feeback Widget with id, type and name
         * @param {string} closeButtonText - text for cancel/close button
         * @param {callback listener} [widgetShownCallback] - Callback to be executed when feedback widget is displayed. This parameter is optional.
         * @param {callback listener} [widgetClosedCallback] - Callback to be executed when feedback widget is closed. This parameter is optional.
         *
         * @return {string | void} error message or void
         */
        export function presentFeedbackWidgetObject(
      feedbackWidget: FeedbackWidget,
      closeButtonText: string,
      widgetShownCallback: WidgetCallback,
      widgetClosedCallback: WidgetCallback
    ): string | void;

        /**
         *
         * Events get grouped together and are sent either every minute or after the unsent event count reaches a threshold. By default it is 10
         * Should be called before Countly init
         *
         * @param {number} size - event count
         *
         */
        export function setEventSendThreshold(size: number): void;

        export function startTrace(traceKey: string): string | void;
        export function cancelTrace(traceKey: string): string | void;
        export function clearAllTraces(): string | void;
        export function endTrace(traceKey: string, customMetric?: TraceCustomMetric): string | void;
        export function recordNetworkTrace(
      networkTraceKey: string,
      responseCode: number,
      requestPayloadSize: number,
      responsePayloadSize: number,
      startTime: number,
      endTime: number,
    ): string | void;

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
        export function enableAttribution(attributionID?: string): string;

        /**
         *
         * @deprecated in 23.02.0 : use 'Countly.recordIndirectAttribution' instead of 'recordAttributionID'.
         *
         * set attribution Id for campaign attribution reporting.
         * Currently implemented for iOS only
         */
        export function recordAttributionID(attributionID: string): string | void;

        /**
         * Replaces all requests with a different app key with the current app key.
         * In request queue, if there are any request whose app key is different
         * than the current app key,
         * these requests' app key will be replaced with the current app key.
         */
        export function replaceAllAppKeysInQueueWithCurrentAppKey(): string | void;

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
        export function removeDifferentAppKeysFromQueue(): string | void;

        /**
         * Call this function when app is loaded, so that the app launch duration can be recorded.
         * Should be called after init.
         */
        export function appLoadingFinished(): string | void;

        /**
         * Set the metrics you want to override
         * Should be called before Countly init
         * @param {object} customMetric - metric with key/value pair
         * Supported data type for customMetric values is string
         */
        export function setCustomMetrics(customMetric: CustomMetric): string | void;
        validateUserDataValue: ValidationFunction;
        validateUserDataType: ValidationFunction;
        validateValidUserData: ValidationFunction;
        validateParseInt: ValidationFunction;
        logWarning: (functionName: string, warning: string) => Promise<void>;
    }

    export default Countly;
}

declare module 'countly-sdk-react-native-bridge/CountlyConfig' {
    /**
     *
     * Config object for Countly Init
     * Should be called before Countly "askForNotificationPermission"
     *
     */
    declare class CountlyConfig {
        /**
         * @param {string} serverURL server url
         * @param {string} appKey application key
         */
        constructor(serverURL: string, appKey: string);

        /**
         * Method to set the server url
         *
         * @param {string} serverURL server url
         */
        setServerURL(serverURL: string): CountlyConfig;

        /**
         * Method to set the app key
         *
         * @param {string} appKey application key
         */
        setAppKey(appKey: string): CountlyConfig;

        /**
         * Method to set the device id
         *
         * @param {string} deviceID device id
         */
        setDeviceID(deviceID: string): CountlyConfig;

        /**
         * Method to enable countly internal debugging logs
         *
         * @param {boolean} loggingEnabled enable
         * if true, countly sdk would log to console.
         */
        setLoggingEnabled(loggingEnabled: boolean): CountlyConfig;

        /**
         * Method to enable crash reporting to report unhandled crashes to Countly
         */
        enableCrashReporting(): CountlyConfig;

        /**
         * Method to set if the consent feature is enabled.
         *
         * If set to true, no feature will work without consent being given.
         *
         * @param {boolean} shouldRequireConsent required. True: It is enabled. False:
         * It is disabled.
         */
        setRequiresConsent(shouldRequireConsent: boolean): CountlyConfig;

        /**
         * Method to give consent for specific features before init
         *
         * @param {string[]} consents consents e.g ['location', 'sessions',
         * 'attribution', 'push', 'events', 'views', 'crashes', 'users', 'push',
         * 'star-rating', 'apm', 'feedback', 'remote-config']
         */
        giveConsent(consents: readonly string[]): CountlyConfig;

        /**
         * Method to set the user initial location
         *
         * @param {string} locationCountryCode country code e.g 'TR'
         * @param {string} locationCity city e.g 'Istanbul'
         * @param {string} locationGpsCoordinates gps coordinates e.g '41.0082,28.9784'
         * @param {string} locationIpAddress ip address e.g '10.2.33.12'
         */
        setLocation(locationCountryCode: string, locationCity: string, locationGpsCoordinates: string, locationIpAddress: string): CountlyConfig;

        /**
         * Method to enable tamper protection. This sets the optional salt to be
         * used for calculating the checksum of requested data which will be sent
         * with each request
         *
         * @param {string} tamperingProtectionSalt salt
         */
        enableParameterTamperingProtection(tamperingProtectionSalt: string): CountlyConfig;

        /**
         * Method to enable application performance monitoring which includes the recording of app start time.
         */
        enableApm(): CountlyConfig;

        /**
         * AdditionalIntentRedirectionChecks are enabled by default.
         * This method should be used to disable them.
         */
        disableAdditionalIntentRedirectionChecks(): CountlyConfig;

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
        pushTokenType(tokenType: TokenType, channelName: string, channelDescription: string): CountlyConfig;

        /**
         * Method to set the push token type
         * NB: ONLY FOR iOS
         *
         * @param {Countly.messagingMode} tokenType token type
         * Possible values include 'DEVELOPMENT', 'PRODUCTION', 'ADHOC'.
         */
        setPushTokenType(tokenType: messagingMode): CountlyConfig;

        /**
         * Method to set the push channel name and description
         * NB: ONLY FOR ANDROID
         *
         * @param {string} name channel name
         * @param {string} description channel description
         */
        setPushNotificationChannelInformation(name: string, description: string): CountlyConfig;

        /**
         * Method to set the push notification accent color
         * NB: ONLY FOR ANDROID
         *
         * @param {string} accentColor notification accent color
         * example '#000000'
         */
        setPushNotificationAccentColor(accentColor: string): CountlyConfig;

        /**
         * Method to configure intent redirection check
         *
         * @param {string[]} allowedIntentClassNames allowed intent class names
         * @param {string[]} allowedIntentPackageNames allowed intent package name
         */
        configureIntentRedirectionCheck(allowedIntentClassNames: readonly string[], allowedIntentPackageNames: readonly string[]): CountlyConfig;

        /**
         * Method to set star rating dialog text
         *
         * @param {string} starRatingTextTitle title
         * @param {string} starRatingTextMessage message
         * @param {string} starRatingTextDismiss dismiss
         */
        setStarRatingDialogTexts(starRatingTextTitle: string, starRatingTextMessage: string, starRatingTextDismiss: string): CountlyConfig;

        /**
         * Report direct user attribution
         *
         * @param {string} campaignType campaign type
         * @param {object} campaignData campaign data
         */
        recordDirectAttribution(campaignType: string, campaignData: object): CountlyConfig;

        /**
         * Report indirect user attribution
         *
         * @param {object} attributionValues attribution values
         */
        recordIndirectAttribution(attributionValues: object): CountlyConfig;
    }

    export default CountlyConfig;
}
