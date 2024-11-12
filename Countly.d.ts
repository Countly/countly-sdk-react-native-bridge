interface Segmentation {
  [key: string]: number | string | boolean;
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

declare module "countly-sdk-react-native-bridge" {
  import type CountlyConfig from "countly-sdk-react-native-bridge/CountlyConfig";

  namespace Countly {
    string;
    string;
    any;
    any;
    boolean;
    boolean;
    boolean;
    string;
    string;
    string;
    string;
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
     * Countly Event Module
     */
    namespace events {
    /**
     * Records an event.
     * Event will be saved to the internal queue and will be sent to the server with the next trigger.
     *
     * @param {string} eventName - Name of the event (This will be displayed on the dashboard)
     * @param {Segmentation} segmentation - Extra information to send with your event as key/value pairs
     * @param {number} eventCount - Indicates how many times this event has happened (Default is 1)
     * @param {number} eventSum - A numerical value that is attached to this event (Will be summed up on the dashboard for all events with the same name)
     * @return {void}
     */
      export function recordEvent(eventName: string, segmentation?: Segmentation, eventCount?: number, eventSum?: number): void;

    /**
     *
     * Starts a Timed Event
     * If 'endEvent' is not called (with the same event name) no event will be recorded.
     *
     * @param {string} eventName - name of the event
     * @return {void}
     */
      export function startEvent(eventName: string): void;

    /**
     *
     * Ends a Timed Event if it is started.
     * Should be called after startEvent.
     * This will behave like recordEvent.
     *
     * @param {string} eventName - Name of the event (This will be displayed on the dashboard)
     * @param {Segmentation} segmentation - Extra information to send with your event as key/value pairs
     * @param {number} eventCount - Indicates how many times this event has happened (Default is 1)
     * @param {number} eventSum - A numerical value that is attached to this event (Will be summed up on the dashboard for all events with the same name)
     * @return {void} void
     */
      export function endEvent(eventName: string, segmentation?: Segmentation, eventCount?: number, eventSum?: number): void;

    /**
     *
     * Cancels a Timed Event if it is started.
     *
     * @param {string} eventName - name of the event
     * @return {void}
     */
      export function cancelEvent(eventName: string): void;
    }

    /**
     * Countly Content Module
     */
    namespace content {
      /**
       * Opt in user for the content fetching and updates
       */
      export function enterContentZone(): void;

      /**
       * Opt out user from the content fetching and updates
       */
      export function exitContentZone(): void;
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
     * @deprecated in 24.4.0 : use 'Countly.events.recordEvent' instead of this.
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

    /**
     *
     * Send push token
     * @param {object} options - object containing the push token
     * {token: string}
     *
     * @return {string | void} error message or void
     */
    export function sendPushToken(options: { readonly token?: string }): void;

    /**
     * This method will ask for permission, enables push notification and send push token to countly server.
     *
     * @param {string} customSoundPath - name of custom sound for push notifications (Only for Android)
     * Custom sound should be place at 'your_project_root/android/app/src/main/res/raw'
     * Should be called after Countly init
     *
     * @return {string | void} error message or void
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
     */
    export function start(): void;

    /**
     * @deprecated at 23.6.0 - Automatic sessions are handled by underlying SDK, this function will do nothing.
     *
     * Countly stop for android
     *
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
     * @return {string | void} error message or void
     */
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
     * @deprecated use 'Countly.deviceId.getID' instead of 'Countly.getCurrentDeviceId'
     * 
     * Get currently used device Id.
     * Should be called after Countly init
     *
     * @return {string} device id or error message
     */
    export function getCurrentDeviceId(): Promise<string> | string;

    /**
     * @deprecated use 'Countly.deviceId.getType' instead of 'Countly.getDeviceIDType'
     * 
     * Get currently used device Id type.
     * Should be called after Countly init
     *
     * @return {DeviceIdType | null} deviceIdType or null
     */
    export function getDeviceIDType(): Promise<DeviceIdType> | null;

    /**
     * @deprecated use 'Countly.deviceId.setID' instead of 'Countly.changeDeviceId'
     * 
     * Change the current device id
     *
     * @param {string} newDeviceID id new device id
     * @param {boolean} onServer merge device id
     * @return {string | void} error message or void
     */
    export function changeDeviceId(newDeviceID: string, onServer: boolean): string | void;

    namespace deviceId {
      /**
       * 
       * Get currently used device ID.
       * Should be called after Countly init
       *
       * @returns {string | null} device ID or null
       */
      export function getID(): Promise<string> | string;

      /**
       * 
       * Get currently used device ID type.
       * Should be called after Countly init
       *
       * @return {DeviceIdType | null} deviceIdType or null
       */
      export function getType(): Promise<DeviceIdType> | null;

      /**
       * Sets device ID according to the device ID Type.
       * If previous ID was Developer Supplied sets it without merge, otherwise with merge.
       *
       * @param {string} newDeviceID device ID to set
       */
      export function setID(newDeviceID: string): void;
    }

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
     * @deprecated in 24.4.0 : use 'Countly.events.startEvent' instead of this.
     *
     * @param {string} eventName name of event
     * @return {string | void} error message or void
     */
    export function startEvent(eventName: string): string | void;

    /**
     *
     * Cancel Event
     * @deprecated in 24.4.0 : use 'Countly.events.cancelEvent' instead of this.
     *
     * @param {string} eventName name of event
     * @return {string | void} error message or void
     */
    export function cancelEvent(eventName: string): string | void;

    /**
     *
     * End Event
     * @deprecated in 24.4.0 : use 'Countly.events.endEvent' instead of this.
     *
     * @param {string | object} options event options
     * @return {string | void} error message or void
     */
    export function endEvent(options: string | CountlyEventOptions): string | void;

    /**
     *
     * @deprecated 'setUserData' is deprecated use 'Countly.userProfile.setProperties' instead.
     * Used to send user data
     *
     * @param {object} userData user data
     * @return {string | void} error message or void
     */
    export function setUserData(userData: CountlyUserData): string | Promise<void>;

    namespace userProfile {
      /**
       * 
       * Set custom key and value pair for the current user
       * 
       * @param {string} keyName - user property key
       * @param {object} keyValue - user property value
       * @returns {void}
       */
      export function setProperty(keyName: string, keyValue: any): Promise<void>;
      
      /**
       * 
       * Set predefined and/or custom key and value pairs for the current user
       * 
       * @param {object} userData - custom key value pairs
       * @returns {void}
       */
      export function setProperties(userData: CountlyUserData): Promise<void>;
      
      /**
       * 
       * Increment custom user data by 1
       * 
       * @param {string} keyName - user property key
       * @returns {void}
       */
      export function increment(keyName: string): Promise<void>;
      
      /**
       * 
       * Increment custom user data by a specified value
       * 
       * @param {string} keyName - user property key
       * @param {number} keyValue - value to increment user property by
       * @returns {void}
       */
      export function incrementBy(keyName: string, keyValue: any): Promise<void>;
      
      /**
       * 
       * Multiply custom user data by a specified value
       * 
       * @param {string} keyName - user property key
       * @param {number} keyValue - value to multiply user property by
       * @returns {void}
       */
      export function multiply(keyName: string, keyValue: any): Promise<void>;
      
      /**
       * 
       * Save the max value between current and provided value
       * 
       * @param {string} keyName - user property key
       * @param {number} keyValue - user property value
       * @returns {void}
       */
      export function saveMax(keyName: string, keyValue: any): Promise<void>;
      
      /**
       * 
       * Save the min value between current and provided value
       * 
       * @param {string} keyName - user property key
       * @param {number} keyValue - user property value
       * @returns {void}
       */
      export function saveMin(keyName: string, keyValue: any): Promise<void>;
      
      /**
       * 
       * Set the property value if it does not exist
       * 
       * @param {string} keyName - user property key
       * @param {string} keyValue - user property value
       * @returns {void}
       */
      export function setOnce(keyName: string, keyValue: any): Promise<void>;
      
      /**
       * 
       * Add value to custom property (array) if value does not exist within
       * 
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @returns {void}
       */
      export function pushUnique(keyName: string, keyValue: any): Promise<void>;
      
      /**
       * 
       * Add value to custom property (array)
       * 
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @returns {void}
       */
      export function push(keyName: string, keyValue: any): Promise<void>;
      
      /**
       * 
       * Remove value from custom property (array)
       * 
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @returns {void}
       */
      export function pull(keyName: string, keyValue: any): Promise<void>;
    }

    /**
     * @deprecated Countly.userData is deprecated, use Countly.userProfile instead
     */
    namespace userData {
      /**
       * @deprecated 'Countly.userData.setProperty' is deprecated, use 'Countly.userProfile.setProperty' instead.
       * Set custom key and value pair for the current user.
       *
       * @param {string} keyName user property key
       * @param {object} keyValue user property value
       * @return {string | void} error message or void
       */
      export function setProperty(keyName: string, keyValue: any): Promise<void> | string;

      /**
       * @deprecated 'Countly.userData.increment' is deprecated, use 'Countly.userProfile.increment' instead.
       * Increment custom user data by 1
       *
       * @param {string} keyName user property key
       * @return {string | void} error message or void
       */
      export function increment(keyName: string): Promise<void> | string;

      /**
       * @deprecated 'Countly.userData.incrementBy' is deprecated, use 'Countly.userProfile.incrementBy' instead.
       * Increment custom user data by a specified value
       *
       * @param {string} keyName user property key
       * @param {string} keyValue value to increment user property by
       * @return {string | void} error message or void
       */
      export function incrementBy(keyName: string, keyValue: any): Promise<void> | string;

      /**
       * @deprecated 'Countly.userData.multiply' is deprecated, use 'Countly.userProfile.multiply' instead.
       * Multiply custom user data by a specified value
       *
       * @param {string} keyName user property key
       * @param {string} keyValue value to multiply user property by
       * @return {string | void} error message or void
       */
      export function multiply(keyName: string, keyValue: any): Promise<void> | string;

      /**
       * @deprecated 'Countly.userData.saveMax' is deprecated, use 'Countly.userProfile.saveMax' instead.
       * Save the max value between current and provided value.
       *
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @return {string | void} error message or void
       */
      export function saveMax(keyName: string, keyValue: any): Promise<void> | string;

      /**
       * @deprecated 'Countly.userData.saveMin' is deprecated, use 'Countly.userProfile.saveMin' instead.
       * Save the min value between current and provided value.
       *
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @return {string | void} error message or void
       */
      export function saveMin(keyName: string, keyValue: any): Promise<void> | string;

      /**
       * @deprecated 'Countly.userData.setOnce' is deprecated, use 'Countly.userProfile.setOnce' instead.
       * Set the property value if it does not exist.
       *
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @return {string | void} error message or void
       */
      export function setOnce(keyName: string, keyValue: any): Promise<void> | string;

      /**
       * @deprecated 'Countly.userData.pushUniqueValue' is deprecated, use 'Countly.userProfile.pushUnique' instead.
       * Add value to custom property (array) if value does not exist within.
       *
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @return {string | void} error message or void
       */
      export function pushUniqueValue(keyName: string, keyValue: any): Promise<void> | string;

      /**
       * @deprecated 'Countly.userData.pushValue' is deprecated, use 'Countly.userProfile.push' instead.
       * Add value to custom property (array).
       *
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @return {string | void} error message or void
       */
      export function pushValue(keyName: string, keyValue: any): Promise<void> | string;

      /**
       * @deprecated 'Countly.userData.pullValue' is deprecated, use 'Countly.userProfile.pull' instead.
       * Remove value to custom property (array).
       *
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @return {string | void} error message or void
       */
      export function pullValue(keyName: string, keyValue: any): Promise<void> | string;
    }

    namespace userDataBulk {
      /**
       *
       * Custom key and value pairs for the current user.
       * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
       *
       * @param {object} customAndPredefined custom key value pairs
       * @return {string | void} error message or void
       */
      export function setUserProperties(properties: object): Promise<void> | string;

      /**
       *
       * Save user data and send to server.
       *
       * @return {string | void} error message or void
       */
      export function save(): Promise<void>;

      /**
       *
       * Set custom key and value pair for the current user.
       * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
       *
       * @param {string} keyName custom user data key
       * @param {string} keyValue custom user data value
       * @return {string | void} error message or void
       */
      export function setProperty(keyName: string, keyValue: any): Promise<string> | string;

      /**
       *
       * Increment custom user data by 1
       * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
       *
       * @param {string} keyName user property key
       * @return {string | void} error message or void
       */
      export function increment(keyName: string): Promise<void> | string;

      /**
       *
       * Increment custom user data by a specified value
       * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
       *
       * @param {string} keyName user property key
       * @param {string} keyValue value to increment user property by
       * @return {string | void} error message or void
       */
      export function incrementBy(keyName: string, keyValue: any): Promise<void> | string;

      /**
       *
       * Multiply custom user data by a specified value
       * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
       *
       * @param {string} keyName user property key
       * @param {string} keyValue value to multiply user property by
       * @return {string | void} error message or void
       */
      export function multiply(keyName: string, keyValue: any): Promise<void> | string;

      /**
       *
       * Save the max value between current and provided value.
       * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
       *
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @return {string | void} error message or void
       */
      export function saveMax(keyName: string, keyValue: any): Promise<void> | string;

      /**
       *
       * Save the min value between current and provided value.
       * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
       *
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @return {string | void} error message or void
       */
      export function saveMin(keyName: string, keyValue: any): Promise<void> | string;

      /**
       *
       * Set the property value if it does not exist.
       * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
       *
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @return {string | void} error message or void
       */
      export function setOnce(keyName: string, keyValue: any): Promise<void> | string;

      /**
       *
       * Add value to custom property (array) if value does not exist within.
       * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
       *
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @return {string | void} error message or void
       */
      export function pushUniqueValue(keyName: string, keyValue: any): Promise<void> | string;

      /**
       *
       * Add value to custom property (array).
       * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
       *
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @return {string | void} error message or void
       */
      export function pushValue(keyName: string, keyValue: any): Promise<void> | string;

      /**
       *
       * Remove value to custom property (array).
       * Remember to call Countly.userDataBulk.save() after calling all userDataBulk methods to send the bulk data to server.
       *
       * @param {string} keyName user property key
       * @param {string} keyValue user property value
       * @return {string | void} error message or void
       */
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

    /**
     *
     * Replaces all stored Remote Config values with new values from server.
     *
     * @param {function} callback function to be called after fetching values.
     * @return {string | void} error message or void
     */
    export function remoteConfigUpdate(callback: CountlyCallback): string | void;

    /**
     *
     * Replace specific Remote Config key value pairs with new values from server.
     *
     * @param {string[]} keyNames array of keys to replace.
     * @param {function} callback function to be called after fetching values.
     * @return {string | void} error message or void
     */
    export function updateRemoteConfigForKeysOnly(keyNames: readonly string[], callback: CountlyCallback): string | void;

    /**
     *
     * Replace all except specific Remote Config key value pairs with new values from server.
     *
     * @param {string[]} keyNames array of keys to skip.
     * @param {function} callback function to be called after fetching values.
     * @return {string | void} error message or void
     */
    export function updateRemoteConfigExceptKeys(keyNames: readonly string[], callback: CountlyCallback): string | void;

    /**
     *
     * Replace Remote Config key value for a specific key with new values from server.
     * This takes in a callback that is called after new values are fetched.
     *
     * @param {string} keyNames key to fetch.
     * @param {function} callback function to be called after fetching new values.
     * @return {string | void} error message or void
     */
    export function getRemoteConfigValueForKey(keyName: string, callback: (value: any) => void): string | void;

    /**
     *
     * Replace Remote Config key value for a specific key with new values from server. This returns a promise that can be listened to.
     *
     * @param {string} keyName key to fetch.
     * @return {string | promise} error message or promise
     */
    export function getRemoteConfigValueForKeyP(keyName: string): string | Promise<any>;

    /**
     *
     * Clear all Remote Config values downloaded from the server.
     *
     * @return {string | promise} error message or promise
     */
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

    /**
     *
     * For getting brief feedback from your users to be displayed on the
      Countly dashboard.
     *
     * @param {function} callback function to be called after it completes.
     * @return {string | void} error message or void
     */
    export function showStarRating(callback?: CountlyCallback): string | void;

    /**
     * Present a Rating Popup using rating widget Id
     *
     * @param {string} widgetId - id of rating widget to present
     * @param {string} closeButtonText - text for cancel/close button
     * @param {callback listener} [ratingWidgetCallback] This parameter is optional.
     * @return {string | void} error message or void
     */
    export function presentRatingWidgetWithID(widgetId: string, closeButtonText: string, ratingWidgetCallback?: CountlyErrorCallback): string | void;

    /**
     * Get a list of available feedback widgets as array of object to handle multiple widgets of same type.
     * @deprecated in 23.8.0 : use 'Countly.feedback.getAvailableFeedbackWidgets' instead of 'getFeedbackWidgets'.
     * @param {callback listener} [onFinished] - returns (retrievedWidgets, error). This parameter is optional.
     * @return {string | []} error message or array of feedback widgets
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
     */
    export function setEventSendThreshold(size: number): void;

    /**
     *
     * Measure and record time taken by any operation.
     *
     * @param {string} traceKey name of trace
     * @return {string | void} error message or void
     */
    export function startTrace(traceKey: string): string | void;

    /**
     *
     * Cancel custom trace.
     *
     * @param {string} traceKey name of trace
     * @return {string | void} error message or void
     */
    export function cancelTrace(traceKey: string): string | void;

    /**
     *
     * Cancel all custom traces.
     *
     * @return {string | void} error message or void
     */
    export function clearAllTraces(): string | void;

    /**
     *
     * End a custom trace.
     *
     * @param {string} traceKey name of trace
     * @param {object} customMetric metric with key/value pair
     * @return {string | void} error message or void
     */
    export function endTrace(traceKey: string, customMetric?: TraceCustomMetric): string | void;

    /**
     *
     * Manually record a custom trace
     *
     * @param {string} networkTraceKey name of trace
     * @param {number} responseCode HTTP status code of the received
      response
     * @param {number} requestPayloadSize Size of the request's
      payload in bytes
     * @param {number} responsePayloadSize Size
      of the received response's payload in bytes
     * @param {number} startTime UNIX timestamp in milliseconds for
      the starting time of the request
     * @param {number} endTime UNIX timestamp in milliseconds for
      the ending time of the request
     * @return {string | void} error message or void
     */
    export function recordNetworkTrace(
      networkTraceKey: string,
      responseCode: number,
      requestPayloadSize: number,
      responsePayloadSize: number,
      startTime: number,
      endTime: number,
    ): string | void;

    /**
     * @deprecated in 23.02.0 : use 'countlyConfig.apm' interface instead of 'enableApm'.
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
     * @param {string} attributionID attribution ID
     * @return {string | void} error message or void
     */
    export function enableAttribution(attributionID?: string): string;

    /**
     *
     * @deprecated in 23.02.0 : use 'Countly.recordIndirectAttribution' instead of 'recordAttributionID'.
     *
     * set attribution Id for campaign attribution reporting.
     * Currently implemented for iOS only
     * @param {string} attributionID attribution ID
     * @return {string | void} error message or void
     */
    export function recordAttributionID(attributionID: string): string | void;

    /**
     * Replaces all requests with a different app key with the current app key.
     * In request queue, if there are any request whose app key is different 
     * than the current app key,
     * these requests' app key will be replaced with the current app key.
     * @return {string | void} error message or void
     */
    export function replaceAllAppKeysInQueueWithCurrentAppKey(): string | void;

    /**
     * set direct attribution Id for campaign attribution reporting.
     * @param {string} campaignType type
     * @param {string} campaignData data
     * @return {string | void} error message or void
     */
    export function recordDirectAttribution(campaignType, campaignData): void;

    /**
     * set indirect attribution Id for campaign attribution reporting.
     * @param {string} attributionValues attribution values
     * @return {string | void} error message or void
     */
    export function recordIndirectAttribution(attributionValues): void;

    /**
     * Removes all requests with a different app key in request queue.
     * In request queue, if there are any request whose app key is different than the current app key,
     * these requests will be removed from request queue.
     * @return {string | void} error message or void
     */
    export function removeDifferentAppKeysFromQueue(): string | void;

    /**
     * Call this function when app is loaded, so that the app launch duration can be recorded.
     * Should be called after init.
     * @return {string | void} error message or void
     */
    export function appLoadingFinished(): string | void;

    /**
     * Set the metrics you want to override
     * Should be called before Countly init
     * @param {object} customMetric metric with key/value pair
     * Supported data type for customMetric values is string
     * @return {string | void} error message or void
     */
    export function setCustomMetrics(customMetric: CustomMetric): string | void;
    ValidationFunction;
    ValidationFunction;
    ValidationFunction;
    ValidationFunction;
    (functionName: string, warning: string) => Promise<void>;
  }

  export default Countly;
}

declare module "countly-sdk-react-native-bridge/CountlyConfig" {
  /**
   *
   * This class holds APM specific configurations to be used with 
   * CountlyConfig class and serves as an interface.
   *
   */
  class CountlyConfigApm {
      /**
       * Enables the tracking of app start time. (For iOS after this call you 
       * will have to call [enableManualAppLoadedTrigger])
       */
      enableAppStartTimeTracking(): CountlyConfigApm;

      /**
       * Enables the automatic tracking of app foreground and background 
       * durations.
       */
      enableForegroundBackgroundTracking(): CountlyConfigApm;

      /**
       * Enables the usage of manual trigger [Countly.appLoadingFinished] to 
       * determine app start finish time.
       */
      enableManualAppLoadedTrigger(): CountlyConfigApm;

      /**
       * Gives you the ability to override the app start initial timestamp.
       * [timestamp] is the timestamp (in milliseconds)
       */
      setAppStartTimestampOverride(timestamp: number): CountlyConfigApm;
  }

  class CountlyConfigSDKInternalLimits {
    /**
     * Limits the maximum size of all string keys
     * @param keyLengthLimit - maximum char size of all string keys (default 128 chars)
     */
    setMaxKeyLength(keyLengthLimit: number) : CountlyConfigSDKInternalLimits;

    /**
     * Limits the size of all values in segmentation key-value pairs
     * @param valueSizeLimit - the maximum char size of all values in our key-value pairs (default 256 chars)
     */
    setMaxValueSize(valueSizeLimit: number) : CountlyConfigSDKInternalLimits;

    /**
     * Limits the max amount of custom segmentation in one event
     * @param segmentationAmountLimit - the maximum amount of custom segmentation in one event (default 100 key-value pairs)
     */
    setMaxSegmentationValues(segmentationAmountLimit: number) : CountlyConfigSDKInternalLimits;

    /**
     * Limits the max amount of breadcrumbs that can be recorded before the oldest one is deleted
     * @param breadcrumbCountLimit - the maximum amount of breadcrumbs that can be recorded before the oldest one is deleted (default 100)
     */
    setMaxBreadcrumbCount(breadcrumbCountLimit: number) : CountlyConfigSDKInternalLimits;

    /**
     * Limits the max amount of stack trace lines to be recorded per thread
     * @param stackTraceLinesPerThreadLimit - maximum amount of stack trace lines to be recorded per thread (default 30)
     */
    setMaxStackTraceLinesPerThread(stackTraceLinesPerThreadLimit: number) : CountlyConfigSDKInternalLimits;

    /**
     * Limits the max characters allowed per stack trace lines. Also limits the crash message length
     * @param stackTraceLineLengthLimit - maximum length of each stack trace line (default 200)
     */
    setMaxStackTraceLineLength(stackTraceLineLengthLimit: number) : CountlyConfigSDKInternalLimits;
  }

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
     * getter for CountlyConfigApm instance that is used to access CountlyConfigApm methods
     */
      apm: CountlyConfigApm;
      /**
     * getter for CountlySDKLimits instance that is used to access CountlyConfigSDKInternalLimits methods
     */
      sdkInternalLimits: CountlyConfigSDKInternalLimits;

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
     * @deprecated in 24.4.0 : use 'countlyConfig.apm' interface instead of 'config.enableApm'.
     * 
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
