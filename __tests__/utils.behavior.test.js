function loadUtils() {
    jest.resetModules();
    const mockParseErrorStack = jest.fn();

    jest.doMock('../Logger.js', () => ({
        initialize: jest.fn(),
        d: jest.fn(),
        e: jest.fn(),
        w: jest.fn(),
        i: jest.fn(),
        v: jest.fn(),
    }));
    jest.doMock('react-native/Libraries/Core/Devtools/parseErrorStack.js', () => mockParseErrorStack, { virtual: true });

    let Logger;
    let Utils;
    let CountlyConfig;
    jest.isolateModules(() => {
        Logger = require('../Logger.js');
        Utils = require('../Utils.js');
        CountlyConfig = require('../CountlyConfig.js').default;
    });

    return { ...Utils, CountlyConfig, Logger, mockParseErrorStack };
}

afterEach(() => {
    jest.clearAllMocks();
    delete global.Platform;
    delete global.__DEV__;
});

test('configToJson serializes allowed intent package names and advanced init options', () => {
    const { CountlyConfig, configToJson } = loadUtils();
    const contentCallback = jest.fn();
    const headers = { Authorization: 'Bearer abc' };
    const sdkBehaviorSettings = { sessions: { retry: false } };

    global.__DEV__ = false;

    const config = new CountlyConfig('https://server.count.ly', 'app-key')
        .setDeviceID('device-1')
        .setLoggingEnabled(true)
        .enableCrashReporting()
        .setRequiresConsent(true)
        .giveConsent(['sessions', 'events'])
        .setLocation('US', 'Boston', '42.3601,-71.0589', '10.0.0.1')
        .enableParameterTamperingProtection('salt')
        .disableAdditionalIntentRedirectionChecks()
        .disableSDKBehaviorSettingsUpdates()
        .disableBackoffMechanism()
        .disableGradualRequestCleaner()
        .disableViewRestartForManualRecording()
        .setRequestTimeoutDuration(15)
        .enableAutomaticViewTracking()
        .setAutomaticViewTrackingExclusionList(['HiddenActivity'])
        .setGlobalViewSegmentation({ plan: 'pro' })
        .enableManualSessionControlHybridMode()
        .addCustomNetworkRequestHeaders(headers)
        .setSDKBehaviorSettings(sdkBehaviorSettings)
        .setPushTokenType('DEVELOPMENT')
        .setPushNotificationChannelInformation('Alerts', 'Countly alerts')
        .setPushNotificationAccentColor('#ffffff')
        .configureIntentRedirectionCheck(undefined, ['com.countly.allowed'])
        .setStarRatingDialogTexts('Title', 'Message', 'Dismiss')
        .recordDirectAttribution('push', { id: 'campaign-1' })
        .recordIndirectAttribution({ source: 'newsletter' });

    config.apm.enableAppStartTimeTracking().enableForegroundBackgroundTracking().enableManualAppLoadedTrigger().setAppStartTimestampOverride(2500);
    config.experimental.enablePreviousNameRecording().enableVisibilityTracking();
    config.content.setZoneTimerInterval(25).setGlobalContentCallback(contentCallback).setWebViewDisplayOption('SAFE_AREA');
    config.sdkInternalLimits
        .setMaxKeyLength(64)
        .setMaxValueSize(128)
        .setMaxSegmentationValues(12)
        .setMaxBreadcrumbCount(9)
        .setMaxStackTraceLinesPerThread(15)
        .setMaxStackTraceLineLength(220);

    const json = configToJson(config);

    expect(json).toMatchObject({
        serverURL: 'https://server.count.ly',
        appKey: 'app-key',
        deviceID: 'device-1',
        loggingEnabled: true,
        crashReporting: true,
        shouldRequireConsent: true,
        consents: ['sessions', 'events'],
        locationCountryCode: 'US',
        locationCity: 'Boston',
        locationGpsCoordinates: '42.3601,-71.0589',
        locationIpAddress: '10.0.0.1',
        tamperingProtectionSalt: 'salt',
        enableForegroundBackground: true,
        enableManualAppLoaded: true,
        startTSOverride: 2500,
        trackAppStartTime: true,
        enablePreviousNameRecording: true,
        enableVisibilityTracking: true,
        setZoneTimerInterval: 25,
        setGlobalContentCallback: true,
        webViewDisplayOption: 'SAFE_AREA',
        disableAdditionalIntentRedirectionChecks: true,
        allowedIntentPackageNames: ['com.countly.allowed'],
        starRatingTextTitle: 'Title',
        starRatingTextMessage: 'Message',
        starRatingTextDismiss: 'Dismiss',
        campaignType: 'push',
        campaignData: { id: 'campaign-1' },
        requestTimeoutDuration: 15,
        enableAutomaticViewTracking: true,
        automaticViewTrackingExclusionList: ['HiddenActivity'],
        globalViewSegmentation: { plan: 'pro' },
        manualSessionHandling: true,
        enableManualSessionControlHybridMode: true,
        customNetworkRequestHeaders: headers,
        attributionValues: { source: 'newsletter' },
        maxKeyLength: 64,
        maxValueSize: 128,
        maxSegmentationValues: 12,
        maxBreadcrumbCount: 9,
        maxStackTraceLinesPerThread: 15,
        maxStackTraceLineLength: 220,
        disableSDKBehaviorSettingsUpdates: true,
        disableBackoffMechanism: true,
        disableGradualRequestCleaner: true,
        disableViewRestartForManualRecording: true,
        sdkBehaviorSettings,
    });
    expect(json.allowedIntentClassNames).toBeUndefined();
    expect(json.pushNotification).toEqual({
        tokenType: 'DEVELOPMENT',
        channelName: 'Alerts',
        channelDescription: 'Countly alerts',
        accentColor: '#ffffff',
    });
});

test('configToJson skips invalid limits and handles broken config objects', () => {
    const { CountlyConfig, Logger, configToJson } = loadUtils();
    const config = new CountlyConfig('https://server.count.ly', 'app-key');

    config.sdkInternalLimits
        .setMaxKeyLength(-1)
        .setMaxValueSize(-2)
        .setMaxSegmentationValues(-3)
        .setMaxBreadcrumbCount(-4)
        .setMaxStackTraceLinesPerThread(-5)
        .setMaxStackTraceLineLength(-6);

    const json = configToJson(config);
    const brokenConfig = {};

    Object.defineProperty(brokenConfig, 'serverURL', {
        get() {
            throw new Error('broken config');
        },
    });

    expect(json.maxKeyLength).toBeUndefined();
    expect(json.maxValueSize).toBeUndefined();
    expect(json.maxSegmentationValues).toBeUndefined();
    expect(json.maxBreadcrumbCount).toBeUndefined();
    expect(json.maxStackTraceLinesPerThread).toBeUndefined();
    expect(json.maxStackTraceLineLength).toBeUndefined();
    expect(Logger.w).toHaveBeenCalledWith('configToJson, Provided value for maxKeyLength is invalid!');
    expect(Logger.w).toHaveBeenCalledWith('configToJson, Provided value for maxValueSize is invalid!');
    expect(Logger.w).toHaveBeenCalledWith('configToJson, Provided value for maxSegmentationValues is invalid!');
    expect(Logger.w).toHaveBeenCalledWith('configToJson, Provided value for maxBreadcrumbCount is invalid!');
    expect(Logger.w).toHaveBeenCalledWith('configToJson, Provided value for maxStackTraceLinesPerThread is invalid!');
    expect(Logger.w).toHaveBeenCalledWith('configToJson, Provided value for maxStackTraceLineLength is invalid!');
    expect(configToJson(brokenConfig)).toEqual({});
    expect(Logger.e).toHaveBeenCalledWith(expect.stringContaining('configToJson, Exception occured during converting config to json.Error: broken config'));
});

test('getStackTrace uses stack strings for React Native 0.64 and newer', () => {
    const { getStackTrace, mockParseErrorStack } = loadUtils();
    const parsedStack = [{ file: 'index.js' }];

    global.Platform = {
        constants: { reactNativeVersion: { minor: 72 } },
    };
    mockParseErrorStack.mockReturnValue(parsedStack);

    expect(getStackTrace({ stack: 'stack-value' })).toEqual(parsedStack);
    expect(mockParseErrorStack).toHaveBeenCalledWith('stack-value');
});

test('getStackTrace uses the error object for React Native 0.63 and older', () => {
    const { getStackTrace, mockParseErrorStack } = loadUtils();
    const error = new Error('boom');

    global.Platform = {
        constants: { reactNativeVersion: { minor: 63 } },
    };
    mockParseErrorStack.mockReturnValue([{ method: 'legacy' }]);

    expect(getStackTrace(error)).toEqual([{ method: 'legacy' }]);
    expect(mockParseErrorStack).toHaveBeenCalledWith(error);

    global.Platform = {};
    mockParseErrorStack.mockClear();
    mockParseErrorStack.mockReturnValue([{ method: 'older' }]);

    expect(getStackTrace(error)).toEqual([{ method: 'older' }]);
    expect(mockParseErrorStack).toHaveBeenCalledWith(error);
});

test('getStackTrace returns null when stack parsing throws', () => {
    const { getStackTrace, mockParseErrorStack } = loadUtils();

    global.Platform = {
        constants: { reactNativeVersion: { minor: 72 } },
    };
    mockParseErrorStack.mockImplementation(() => {
        throw new Error('parse failed');
    });

    expect(getStackTrace({ stack: 'stack-value' })).toBeNull();
});