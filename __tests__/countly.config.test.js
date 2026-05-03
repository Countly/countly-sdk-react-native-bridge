jest.mock('../Logger.js', () => ({
    initialize: jest.fn(),
    d: jest.fn(),
    e: jest.fn(),
    w: jest.fn(),
    i: jest.fn(),
    v: jest.fn(),
}));

const Logger = require('../Logger.js');
const CountlyConfigModule = require('../CountlyConfig.js');

const CountlyConfig = CountlyConfigModule.default || CountlyConfigModule;

afterEach(() => {
    jest.clearAllMocks();
});

test('CountlyConfig setters and nested interfaces persist fluent configuration', () => {
    const contentCallback = jest.fn();
    const customHeaders = { Authorization: 'Bearer test-token' };
    const sdkBehaviorSettings = { sessions: { retry: false } };
    const config = new CountlyConfig('https://server.count.ly', 'app-key');

    expect(config.setServerURL('https://new.server.count.ly')).toBe(config);
    expect(config.setAppKey('updated-app-key')).toBe(config);
    expect(config.setDeviceID('device-123')).toBe(config);
    expect(config.setRequestTimeoutDuration(15)).toBe(config);
    expect(config.enableManualSessionControl()).toBe(config);
    expect(config.enableManualSessionControlHybridMode()).toBe(config);
    expect(config.addCustomNetworkRequestHeaders(customHeaders)).toBe(config);
    expect(config.disableGradualRequestCleaner()).toBe(config);
    expect(config.disableViewRestartForManualRecording()).toBe(config);
    expect(config.enableAutomaticViewTracking()).toBe(config);
    expect(config.setAutomaticViewTrackingExclusionList(['HiddenActivity'])).toBe(config);
    expect(config.setGlobalViewSegmentation({ plan: 'pro' })).toBe(config);
    expect(config.setLoggingEnabled(true)).toBe(config);
    expect(config.enableCrashReporting()).toBe(config);
    expect(config.setRequiresConsent(true)).toBe(config);
    expect(config.giveConsent(['sessions', 'events'])).toBe(config);
    expect(config.setLocation('US', 'Boston', '42.3601,-71.0589', '10.0.0.1')).toBe(config);
    expect(config.enableParameterTamperingProtection('salt')).toBe(config);
    expect(config.disableAdditionalIntentRedirectionChecks()).toBe(config);
    expect(config.disableSDKBehaviorSettingsUpdates()).toBe(config);
    expect(config.disableBackoffMechanism()).toBe(config);
    expect(config.setSDKBehaviorSettings(sdkBehaviorSettings)).toBe(config);
    expect(config.setPushTokenType('DEVELOPMENT')).toBe(config);
    expect(config.setPushNotificationChannelInformation('Alerts', 'Countly alerts')).toBe(config);
    expect(config.setPushNotificationAccentColor('#ffffff')).toBe(config);
    expect(config.configureIntentRedirectionCheck(['AllowedActivity'], ['com.countly.allowed'])).toBe(config);
    expect(config.setStarRatingDialogTexts('Title', 'Message', 'Dismiss')).toBe(config);
    expect(config.recordDirectAttribution('push', { id: 'campaign-1' })).toBe(config);
    expect(config.recordIndirectAttribution({ source: 'newsletter' })).toBe(config);

    expect(config.apm.enableAppStartTimeTracking()).toBe(config.apm);
    expect(config.apm.enableForegroundBackgroundTracking()).toBe(config.apm);
    expect(config.apm.enableManualAppLoadedTrigger()).toBe(config.apm);
    expect(config.apm.setAppStartTimestampOverride(2500)).toBe(config.apm);

    expect(config.experimental.enablePreviousNameRecording()).toBe(config.experimental);
    expect(config.experimental.enableVisibilityTracking()).toBe(config.experimental);

    expect(config.content.setZoneTimerInterval(25)).toBe(config.content);
    expect(config.content.setGlobalContentCallback(contentCallback)).toBe(config.content);
    expect(config.content.setWebViewDisplayOption('SAFE_AREA')).toBe(config.content);

    expect(config.sdkInternalLimits.setMaxKeyLength(64)).toBe(config.sdkInternalLimits);
    expect(config.sdkInternalLimits.setMaxValueSize(128)).toBe(config.sdkInternalLimits);
    expect(config.sdkInternalLimits.setMaxSegmentationValues(12)).toBe(config.sdkInternalLimits);
    expect(config.sdkInternalLimits.setMaxBreadcrumbCount(9)).toBe(config.sdkInternalLimits);
    expect(config.sdkInternalLimits.setMaxStackTraceLinesPerThread(15)).toBe(config.sdkInternalLimits);
    expect(config.sdkInternalLimits.setMaxStackTraceLineLength(220)).toBe(config.sdkInternalLimits);

    expect(Logger.initialize).toHaveBeenCalledWith(true);
    expect(config.serverURL).toBe('https://new.server.count.ly');
    expect(config.appKey).toBe('updated-app-key');
    expect(config.deviceID).toBe('device-123');
    expect(config._requestTimeoutDuration).toBe(15);
    expect(config._manualSessionControl).toBe(true);
    expect(config._manualSessionControlHybridMode).toBe(true);
    expect(config._customNetworkRequestHeaders).toEqual(customHeaders);
    expect(config._disableGradualRequestCleaner).toBe(true);
    expect(config._disableViewRestartForManualRecording).toBe(true);
    expect(config._enableAutomaticViewTracking).toBe(true);
    expect(config._automaticViewTrackingExclusionList).toEqual(['HiddenActivity']);
    expect(config._globalViewSegmentation).toEqual({ plan: 'pro' });
    expect(config.loggingEnabled).toBe(true);
    expect(config._crashReporting).toBe(true);
    expect(config.shouldRequireConsent).toBe(true);
    expect(config.consents).toEqual(['sessions', 'events']);
    expect(config.locationCountryCode).toBe('US');
    expect(config.locationCity).toBe('Boston');
    expect(config.locationGpsCoordinates).toBe('42.3601,-71.0589');
    expect(config.locationIpAddress).toBe('10.0.0.1');
    expect(config.tamperingProtectionSalt).toBe('salt');
    expect(config._disableIntentRedirectionCheck).toBe(true);
    expect(config._disableSDKBehaviorSettingsUpdates).toBe(true);
    expect(config._disableBackoff).toBe(true);
    expect(config._sdkBehaviorSettings).toEqual(sdkBehaviorSettings);
    expect(config.tokenType).toBe('DEVELOPMENT');
    expect(config.channelName).toBe('Alerts');
    expect(config.channelDescription).toBe('Countly alerts');
    expect(config.accentColor).toBe('#ffffff');
    expect(config.allowedIntentClassNames).toEqual(['AllowedActivity']);
    expect(config.allowedIntentPackageNames).toEqual(['com.countly.allowed']);
    expect(config.starRatingTextTitle).toBe('Title');
    expect(config.starRatingTextMessage).toBe('Message');
    expect(config.starRatingTextDismiss).toBe('Dismiss');
    expect(config.campaignType).toBe('push');
    expect(config.campaignData).toEqual({ id: 'campaign-1' });
    expect(config.attributionValues).toEqual({ source: 'newsletter' });
    expect(config.apm.trackAppStartTime).toBe(true);
    expect(config.apm.foregroundBackground).toBe(true);
    expect(config.apm.manualAppLoaded).toBe(true);
    expect(config.apm.startTSOverride).toBe(2500);
    expect(config.experimental.previousNameRecording).toBe(true);
    expect(config.experimental.visibilityTracking).toBe(true);
    expect(config.content.timerInterval).toBe(25);
    expect(config.content.contentCallback).toBe(contentCallback);
    expect(config.content.webViewDisplayOption).toBe('SAFE_AREA');
    expect(config.sdkInternalLimits.maxKeyLength).toBe(64);
    expect(config.sdkInternalLimits.maxValueSize).toBe(128);
    expect(config.sdkInternalLimits.maxSegmentationValues).toBe(12);
    expect(config.sdkInternalLimits.maxBreadcrumbCount).toBe(9);
    expect(config.sdkInternalLimits.maxStackTraceLinesPerThread).toBe(15);
    expect(config.sdkInternalLimits.maxStackTraceLineLength).toBe(220);
});

test('APM start timestamp override ignores non-positive values', () => {
    const config = new CountlyConfig('https://server.count.ly', 'app-key');

    config.apm.setAppStartTimestampOverride(3500);
    config.apm.setAppStartTimestampOverride(0);
    config.apm.setAppStartTimestampOverride(-10);

    expect(config.apm.startTSOverride).toBe(3500);
});