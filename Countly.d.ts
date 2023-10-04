declare module 'countly-sdk-react-native-bridge' {

  interface CountlyEventOptions {
    eventName?: string;
    eventCount?: number;
    eventSum?: number;
    segments?: Record<string, any>;
  }

  interface CountlyUserData {
    name?: string;
    username?: string;
    email?: string;
    organization?: string;
    phone?: string;
    picture?: string;
    gender?: string;
    byear?: string;
    custom?: Record<string, any>;
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


  export interface Countly {
    serverUrl: string;
    appKey: string;
    // _isInitialized: boolean;
    // _isPushInitialized: boolean;
    // _ratingWidgetListener?: () => void;
    // _widgetShownCallback?: () => void;
    // _widgetClosedCallback?: () => void;
    widgetShownCallbackName: string;
    widgetClosedCallbackName: string;
    ratingWidgetCallbackName: string;
    pushNotificationCallbackName: string;
    messagingMode: {
      DEVELOPMENT: string;
      PRODUCTION: string;
      ADHOC: string;
    };
    init(serverUrl: string, appKey: string, deviceId: string | null): Promise<void>;
    isInitialized(): Promise<boolean>;
    hasBeenCalledOnStart(): string | Promise<string>;
    sendEvent(options: CountlyEventOptions): string | void;
    setViewTracking(boolean: boolean): Promise<void>;
    recordView(recordView: string, segments?: Record<string, any>): string | Promise<string>;
    logError(tag: string, message: string): void;
    validateString(value: string, label: string, context: string): string | Promise<string>;
    disablePushNotifications(): string | void;
    pushTokenType(tokenType: string, channelName: string, channelDescription: string): string | Promise<string>;
    sendPushToken(options: { token?: string }): void;
    askForNotificationPermission(customSoundPath?: string): string | void;
    registerForNotification(theListener: () => void): any; // The return type should be adjusted to the actual event subscription type
    configureIntentRedirectionCheck(
      allowedIntentClassNames?: string[],
      allowedIntentPackageNames?: string[],
      useAdditionalIntentRedirectionChecks?: boolean
    ): string | void;
    start(): string | void;
    stop(): string | void;
    enableLogging(): void;
    disableLogging(): void;
    setLoggingEnabled(enabled?: boolean): void;
    setLocationInit(
      countryCode: string | null,
      city: string | null,
      location: string | null,
      ipAddress: string | null
    ): void;
    setLocation(
      countryCode: string | null,
      city: string | null,
      location: string | null,
      ipAddress: string | null
    ): string | void;
    disableLocation(): string | void;
    getCurrentDeviceId(): Promise<string>;
    changeDeviceId(newDeviceID: string, onServer: boolean): string | void;
    setHttpPostForced(boolean?: boolean): void;
    enableCrashReporting(): void;
    addCrashLog(crashLog: string): string | void;
    logException(exception: string, nonfatal: boolean, segments: Record<string, any>): string | void;
    setCustomCrashSegments(segments: Record<string, any>): string | void;
    startSession(): string | void;
    endSession(): string | void;
    enableParameterTamperingProtection(salt: string): string | Promise<string>;
    pinnedCertificates(certificateName: string): string | Promise<string>;
    startEvent(eventName: string): string | Promise<string>;
    cancelEvent(eventName: string): string | Promise<string>;
    endEvent(options: CountlyEventOptions): string | void;
    setUserData(userData: CountlyUserData): string | void;
    userData: {
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
    };
    userDataBulk: CountlyUserDataBulk;
    setRequiresConsent(flag: boolean): void;
    giveConsent(args: string | string[]): void;
    giveConsentInit(args: string | string[]): Promise<void>;
    removeConsent(args: string | string[]): void;
    giveAllConsent(): void;
    removeAllConsent(): void;
    remoteConfigUpdate(callback: CountlyCallback): void;
    updateRemoteConfigForKeysOnly(keyNames: string[], callback: CountlyCallback): void;
    updateRemoteConfigExceptKeys(keyNames: string[], callback: CountlyCallback): void;
    getRemoteConfigValueForKey(keyName: string, callback: (value: any) => void): void;
    getRemoteConfigValueForKeyP(keyName: string): Promise<any>;
    remoteConfigClearValues(): Promise<string>;
    setStarRatingDialogTexts(
      starRatingTextTitle: string | null,
      starRatingTextMessage: string | null,
      starRatingTextDismiss: string | null
    ): void;
    showStarRating(callback: CountlyCallback): void;
    showFeedbackPopup(widgetId: string, closeButtonText: string): void;
    presentRatingWidgetWithID(widgetId: string, closeButtonText: string): void;
    getFeedbackWidgets(onFinished: (retrievedWidgets: FeedbackWidget[], error: string | null) => void): void;
    getAvailableFeedbackWidgets(): Promise<FeedbackWidget[]>;
    presentFeedbackWidgetObject(
      feedbackWidget: FeedbackWidget,
      closeButtonText: string,
      widgetShownCallback: WidgetCallback,
      widgetClosedCallback: WidgetCallback
    ): void;
    presentFeedbackWidget(widgetType: string, widgetId: string, closeButtonText: string): void;
    setEventSendThreshold(size: number): void;
    startTrace(traceKey: string): void;
    cancelTrace(traceKey: string): void;
    clearAllTraces(): void;
    endTrace(traceKey: string, customMetric?: TraceCustomMetric): void;
    recordNetworkTrace(data: NetworkTraceData): void;
    enableApm(): void;
    enableAttribution(attributionID?: string): void;
    recordAttributionID(attributionID: string): void;
    replaceAllAppKeysInQueueWithCurrentAppKey(): void;
    removeDifferentAppKeysFromQueue(): void;
    appLoadingFinished(): void;
    setCustomMetrics(customMetric: CustomMetric): void;
    validateUserDataValue: ValidationFunction;
    validateUserDataType: ValidationFunction;
    validateValidUserData: ValidationFunction;
    validateParseInt: ValidationFunction;
    logWarning: (functionName: string, warning: string) => Promise<void>;
  }


  declare const Countly: Countly;
}