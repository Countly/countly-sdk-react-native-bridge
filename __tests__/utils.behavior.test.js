function loadUtils(platform = { OS: 'ios', constants: { reactNativeVersion: { minor: 72 } } }) {
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
    jest.doMock('react-native', () => ({ Platform: platform }), { virtual: true });
    jest.doMock('../CountlyFlavor.js', () => ({ PUSH_NOTIFICATIONS_AVAILABLE: true }));

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
        campaignData: '{"id":"campaign-1"}',
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
        tokenType: '1',
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
    const { getStackTrace, mockParseErrorStack } = loadUtils({ OS: 'android', constants: { reactNativeVersion: { minor: 72 } } });
    const parsedStack = [{ file: 'index.js' }];

    mockParseErrorStack.mockReturnValue(parsedStack);

    expect(getStackTrace({ stack: 'stack-value' })).toEqual(parsedStack);
    expect(mockParseErrorStack).toHaveBeenCalledWith('stack-value');
});

test('getStackTrace uses the error object for React Native 0.63', () => {
    const { getStackTrace, mockParseErrorStack } = loadUtils({ OS: 'ios', constants: { reactNativeVersion: { minor: 63 } } });
    const error = new Error('boom');

    mockParseErrorStack.mockReturnValue([{ method: 'legacy' }]);

    expect(getStackTrace(error)).toEqual([{ method: 'legacy' }]);
    expect(mockParseErrorStack).toHaveBeenCalledWith(error);
});

test('getStackTrace uses the error object for React Native versions without Platform constants', () => {
    const { getStackTrace, mockParseErrorStack } = loadUtils({ OS: 'ios' });
    const error = new Error('boom');

    mockParseErrorStack.mockReturnValue([{ method: 'older' }]);

    expect(getStackTrace(error)).toEqual([{ method: 'older' }]);
    expect(mockParseErrorStack).toHaveBeenCalledWith(error);
});

test('getStackTrace returns null when stack parsing throws', () => {
    const { getStackTrace, mockParseErrorStack } = loadUtils();

    mockParseErrorStack.mockImplementation(() => {
        throw new Error('parse failed');
    });

    expect(getStackTrace({ stack: 'stack-value' })).toBeNull();
});

test('configToJson leaves out device IDs that are empty, null or not text', () => {
    const { CountlyConfig, configToJson } = loadUtils();

    [undefined, null, '', 42, { id: 'x' }].forEach((deviceID) => {
        const config = new CountlyConfig('https://server.count.ly', 'app-key').setDeviceID(deviceID);
        expect(configToJson(config)).not.toHaveProperty('deviceID');
    });

    expect(configToJson(new CountlyConfig('https://server.count.ly', 'app-key').setDeviceID('device-1')).deviceID).toBe('device-1');
});

test('configToJson sends the push block only when a push option is set', () => {
    const { CountlyConfig, configToJson } = loadUtils();

    expect(configToJson(new CountlyConfig('https://server.count.ly', 'app-key'))).not.toHaveProperty('pushNotification');
    expect(configToJson(new CountlyConfig('https://server.count.ly', 'app-key').setPushTokenType('PRODUCTION')).pushNotification).toEqual({ tokenType: '0' });
    expect(configToJson(new CountlyConfig('https://server.count.ly', 'app-key').setPushNotificationAccentColor('#000000')).pushNotification).toEqual({ accentColor: '#000000' });
});

test('configToJson maps documented push token type names and messaging mode codes to codes', () => {
    const { CountlyConfig, Logger, configToJson } = loadUtils();
    const tokenTypeOf = (tokenType) => configToJson(new CountlyConfig('https://server.count.ly', 'app-key').setPushTokenType(tokenType)).pushNotification;

    expect(tokenTypeOf('DEVELOPMENT')).toEqual({ tokenType: '1' });
    expect(tokenTypeOf('ADHOC')).toEqual({ tokenType: '2' });
    expect(tokenTypeOf('PRODUCTION')).toEqual({ tokenType: '0' });
    expect(tokenTypeOf('1')).toEqual({ tokenType: '1' });
    expect(tokenTypeOf('2')).toEqual({ tokenType: '2' });
    expect(tokenTypeOf('0')).toEqual({ tokenType: '0' });
    expect(tokenTypeOf('STAGING')).toBeUndefined();
    expect(tokenTypeOf(1)).toBeUndefined();
    expect(Logger.e).toHaveBeenCalledWith(expect.stringContaining('push token type [STAGING] is not supported'));
});

test('configToJson sends campaign data as JSON text and leaves out incomplete direct attribution', () => {
    const { CountlyConfig, Logger, configToJson } = loadUtils();

    const objectData = configToJson(new CountlyConfig('https://server.count.ly', 'app-key').recordDirectAttribution('countly', { cid: 'campaign-1', cuid: 'user-1' }));
    expect(objectData.campaignType).toBe('countly');
    expect(objectData.campaignData).toBe('{"cid":"campaign-1","cuid":"user-1"}');

    const textData = configToJson(new CountlyConfig('https://server.count.ly', 'app-key').recordDirectAttribution('countly', '{"cid":"campaign-2"}'));
    expect(textData.campaignData).toBe('{"cid":"campaign-2"}');

    [undefined, null, ''].forEach((campaignData) => {
        const json = configToJson(new CountlyConfig('https://server.count.ly', 'app-key').recordDirectAttribution('countly', campaignData));
        expect(json).not.toHaveProperty('campaignType');
        expect(json).not.toHaveProperty('campaignData');
    });
    expect(configToJson(new CountlyConfig('https://server.count.ly', 'app-key').recordDirectAttribution(7, '{"cid":"c"}'))).not.toHaveProperty('campaignType');
    expect(Logger.e).toHaveBeenCalledWith(expect.stringContaining('direct attribution needs a campaign type and campaign data'));
});

test('configToJson sends indirect attribution values as text and leaves out input that is not an object', () => {
    const { CountlyConfig, Logger, configToJson } = loadUtils();

    const json = configToJson(new CountlyConfig('https://server.count.ly', 'app-key').recordIndirectAttribution({ adid: 'ad-1', count: 5, skipNull: null, skipUndefined: undefined }));
    expect(json.attributionValues).toEqual({ adid: 'ad-1', count: '5' });

    ['campaign-2', ['adid', 'ad-1'], 5].forEach((attributionValues) => {
        expect(configToJson(new CountlyConfig('https://server.count.ly', 'app-key').recordIndirectAttribution(attributionValues))).not.toHaveProperty('attributionValues');
    });
    expect(Logger.e).toHaveBeenCalledWith(expect.stringContaining('indirect attribution values must be an object'));
});

test('configToJson sends an explicit logging choice and leaves it out when none was made', () => {
    const { CountlyConfig, configToJson } = loadUtils();

    expect(configToJson(new CountlyConfig('https://server.count.ly', 'app-key'))).not.toHaveProperty('loggingEnabled');
    expect(configToJson(new CountlyConfig('https://server.count.ly', 'app-key').setLoggingEnabled(false)).loggingEnabled).toBe(false);
    expect(configToJson(new CountlyConfig('https://server.count.ly', 'app-key').setLoggingEnabled(true)).loggingEnabled).toBe(true);
});

test('configToJson sends consents as a list of feature names', () => {
    const { CountlyConfig, configToJson } = loadUtils();

    expect(configToJson(new CountlyConfig('https://server.count.ly', 'app-key').giveConsent('sessions')).consents).toEqual(['sessions']);
    expect(configToJson(new CountlyConfig('https://server.count.ly', 'app-key').giveConsent(['events', 3, null, 'views'])).consents).toEqual(['events', 'views']);

    const directlyAssigned = new CountlyConfig('https://server.count.ly', 'app-key');
    directlyAssigned.consents = 'crashes';
    expect(configToJson(directlyAssigned).consents).toEqual(['crashes']);
});