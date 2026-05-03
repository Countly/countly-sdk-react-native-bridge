function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

function createNativeModuleMock(overrides = {}) {
    return {
        init: jest.fn().mockResolvedValue(undefined),
        isInitialized: jest.fn().mockResolvedValue(false),
        recordView: jest.fn(),
        disablePushNotifications: jest.fn(),
        sendPushToken: jest.fn(),
        askForNotificationPermission: jest.fn(),
        registerForNotification: jest.fn(),
        setLoggingEnabled: jest.fn(),
        setLocation: jest.fn(),
        disableLocation: jest.fn(),
        setHttpPostForced: jest.fn(),
        addCrashLog: jest.fn(),
        recordMetrics: jest.fn(),
        logException: jest.fn(),
        setCustomCrashSegments: jest.fn(),
        pinnedCertificates: jest.fn(),
        startAutoStoppedView: jest.fn().mockResolvedValue('auto-view-id'),
        startView: jest.fn().mockResolvedValue('manual-view-id'),
        stopViewWithName: jest.fn(),
        stopViewWithID: jest.fn(),
        stopAllViews: jest.fn(),
        pauseViewWithID: jest.fn(),
        resumeViewWithID: jest.fn(),
        addSegmentationToViewWithID: jest.fn(),
        addSegmentationToViewWithName: jest.fn(),
        setGlobalViewSegmentation: jest.fn(),
        updateGlobalViewSegmentation: jest.fn(),
        recordEvent: jest.fn(),
        startEvent: jest.fn(),
        endEvent: jest.fn(),
        cancelEvent: jest.fn(),
        setRequiresConsent: jest.fn(),
        giveConsent: jest.fn(),
        giveConsentInit: jest.fn().mockResolvedValue(undefined),
        removeConsent: jest.fn(),
        giveAllConsent: jest.fn(),
        removeAllConsent: jest.fn(),
        startSession: jest.fn(),
        updateSession: jest.fn(),
        endSession: jest.fn(),
        changeDeviceId: jest.fn(),
        addCustomNetworkRequestHeaders: jest.fn(),
        logJSException: jest.fn(),
        getRequestQueue: jest.fn().mockResolvedValue([]),
        getEventQueue: jest.fn().mockResolvedValue([]),
        halt: jest.fn().mockResolvedValue(undefined),
        remoteConfigUpdate: jest.fn((_args, callback) => callback('ok')),
        updateRemoteConfigForKeysOnly: jest.fn((_args, callback) => callback('ok')),
        updateRemoteConfigExceptKeys: jest.fn((_args, callback) => callback('ok')),
        getRemoteConfigValueForKey: jest.fn((_args, callback) => callback('{}')),
        getRemoteConfigValueForKeyP: jest.fn().mockResolvedValue('{}'),
        remoteConfigClearValues: jest.fn().mockResolvedValue(true),
        getFeedbackWidgets: jest.fn().mockResolvedValue([]),
        getFeedbackWidgetData: jest.fn().mockResolvedValue({}),
        presentFeedbackWidget: jest.fn(),
        reportFeedbackWidgetManually: jest.fn().mockResolvedValue(undefined),
        showStarRating: jest.fn(),
        presentRatingWidgetWithID: jest.fn(),
        setEventSendThreshold: jest.fn(),
        startTrace: jest.fn(),
        cancelTrace: jest.fn(),
        clearAllTraces: jest.fn(),
        endTrace: jest.fn(),
        recordNetworkTrace: jest.fn(),
        replaceAllAppKeysInQueueWithCurrentAppKey: jest.fn(),
        recordDirectAttribution: jest.fn(),
        recordIndirectAttribution: jest.fn(),
        removeDifferentAppKeysFromQueue: jest.fn(),
        appLoadingFinished: jest.fn(),
        setCustomMetrics: jest.fn(),
        enterContentZone: jest.fn(),
        refreshContentZone: jest.fn(),
        previewContent: jest.fn(),
        exitContentZone: jest.fn(),
        setUserData: jest.fn().mockResolvedValue(undefined),
        userData_setProperty: jest.fn().mockResolvedValue(undefined),
        userData_increment: jest.fn().mockResolvedValue(undefined),
        userData_incrementBy: jest.fn().mockResolvedValue(undefined),
        userData_multiply: jest.fn().mockResolvedValue(undefined),
        userData_saveMax: jest.fn().mockResolvedValue(undefined),
        userData_saveMin: jest.fn().mockResolvedValue(undefined),
        userData_setOnce: jest.fn().mockResolvedValue(undefined),
        userData_pushUniqueValue: jest.fn().mockResolvedValue(undefined),
        userData_pushValue: jest.fn().mockResolvedValue(undefined),
        userData_pullValue: jest.fn().mockResolvedValue(undefined),
        userDataBulk_setUserProperties: jest.fn().mockResolvedValue(undefined),
        userDataBulk_save: jest.fn().mockResolvedValue(undefined),
        userDataBulk_setProperty: jest.fn().mockResolvedValue(undefined),
        userDataBulk_increment: jest.fn().mockResolvedValue(undefined),
        userDataBulk_incrementBy: jest.fn().mockResolvedValue(undefined),
        userDataBulk_multiply: jest.fn().mockResolvedValue(undefined),
        userDataBulk_saveMax: jest.fn().mockResolvedValue(undefined),
        userDataBulk_saveMin: jest.fn().mockResolvedValue(undefined),
        userDataBulk_setOnce: jest.fn().mockResolvedValue(undefined),
        userDataBulk_pushUniqueValue: jest.fn().mockResolvedValue(undefined),
        userDataBulk_pushValue: jest.fn().mockResolvedValue(undefined),
        userDataBulk_pullValue: jest.fn().mockResolvedValue(undefined),
        enableRequestCapture: jest.fn().mockResolvedValue(undefined),
        getCapturedRequests: jest.fn().mockResolvedValue([]),
        getCurrentDeviceId: jest.fn().mockResolvedValue('device-id'),
        getDeviceIDType: jest.fn().mockResolvedValue(20202),
        setID: jest.fn(),
        ...overrides,
    };
}

function loadCountlyBridge({ platform = 'ios', nativeOverrides = {} } = {}) {
    const listeners = [];
    const nativeModule = createNativeModuleMock(nativeOverrides);

    class MockNativeEventEmitter {
        constructor(module) {
            this.module = module;
        }

        addListener(eventName, handler) {
            const listener = { eventName, handler, removed: false };
            const subscription = {
                remove: jest.fn(() => {
                    listener.removed = true;
                }),
            };
            listener.subscription = subscription;
            listeners.push(listener);
            return subscription;
        }
    }

    jest.resetModules();
    global.__DEV__ = false;

    jest.doMock('react-native/Libraries/Core/Devtools/parseErrorStack.js', () => jest.fn(() => []), { virtual: true });
    jest.doMock('react-native', () => ({
        Platform: {
            OS: platform,
            constants: { reactNativeVersion: { minor: 72 } },
        },
        NativeModules: { CountlyReactNative: nativeModule },
        TurboModuleRegistry: { get: jest.fn(() => nativeModule) },
        NativeEventEmitter: MockNativeEventEmitter,
    }), { virtual: true });

    let Countly;
    let CountlyConfig;
    let CountlyState;

    jest.isolateModules(() => {
        const countlyModule = require('../Countly.js');
        const countlyConfigModule = require('../CountlyConfig.js');
        const countlyStateModule = require('../CountlyState.js');

        Countly = countlyModule.default || countlyModule;
        CountlyConfig = countlyConfigModule.default || countlyConfigModule;
        CountlyState = countlyStateModule.default || countlyStateModule;
    });

    function emit(eventName, payload) {
        listeners.filter((listener) => listener.eventName === eventName && !listener.removed).forEach((listener) => listener.handler(payload));
    }

    return { Countly, CountlyConfig, CountlyState, nativeModule, listeners, emit };
}

function getNativeInitPayload(nativeModule) {
    const initArgs = nativeModule.init.mock.calls[0][0];
    return JSON.parse(initArgs[0]);
}

afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
});

test('initWithConfig serializes 26.1.0 init options and wires the global content callback', async () => {
    const { Countly, CountlyConfig, CountlyState, nativeModule, listeners, emit } = loadCountlyBridge();
    const contentCallback = jest.fn();
    const config = new CountlyConfig('https://server.count.ly', 'app-key')
        .setDeviceID('device-1')
        .setRequestTimeoutDuration(15)
        .enableAutomaticViewTracking()
        .setAutomaticViewTrackingExclusionList(['com.example.HiddenActivity'])
        .setGlobalViewSegmentation({ region: 'eu', beta: true })
        .enableManualSessionControlHybridMode()
        .addCustomNetworkRequestHeaders({ Authorization: 'Bearer token', 'X-Countly': 'bridge' })
        .disableSDKBehaviorSettingsUpdates()
        .disableBackoffMechanism()
        .disableGradualRequestCleaner()
        .disableViewRestartForManualRecording();

    config.content.setGlobalContentCallback(contentCallback).setWebViewDisplayOption(Countly.webViewDisplayOption.SAFE_AREA);

    await Countly.initWithConfig(config);

    const payload = getNativeInitPayload(nativeModule);

    expect(payload).toMatchObject({
        serverURL: 'https://server.count.ly',
        appKey: 'app-key',
        deviceID: 'device-1',
        requestTimeoutDuration: 15,
        enableAutomaticViewTracking: true,
        automaticViewTrackingExclusionList: ['com.example.HiddenActivity'],
        globalViewSegmentation: { region: 'eu', beta: true },
        manualSessionHandling: true,
        enableManualSessionControlHybridMode: true,
        customNetworkRequestHeaders: { Authorization: 'Bearer token', 'X-Countly': 'bridge' },
        disableSDKBehaviorSettingsUpdates: true,
        disableBackoffMechanism: true,
        disableGradualRequestCleaner: true,
        disableViewRestartForManualRecording: true,
        setGlobalContentCallback: true,
        webViewDisplayOption: Countly.webViewDisplayOption.SAFE_AREA,
    });
    expect(listeners.map((listener) => listener.eventName)).toContain('globalContentCallback');
    expect(CountlyState.isInitialized).toBe(true);

    emit('globalContentCallback', JSON.stringify({ status: 'shown', data: { id: 'content-1' } }));
    expect(contentCallback).toHaveBeenCalledWith('shown', { id: 'content-1' });
});

test('initWithConfig clears empty device IDs before serializing config', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();
    const config = new CountlyConfig('https://server.count.ly', 'app-key').setDeviceID('');

    await Countly.initWithConfig(config);

    expect(getNativeInitPayload(nativeModule).deviceID).toBeNull();
});

test('initWithConfig installs the JS crash handler when crash reporting is enabled', async () => {
    const previousHandler = jest.fn();
    global.ErrorUtils = {
        getGlobalHandler: jest.fn(() => previousHandler),
        setGlobalHandler: jest.fn(),
    };

    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();
    const config = new CountlyConfig('https://server.count.ly', 'app-key').enableCrashReporting();
    const error = {
        name: 'TypeError',
        message: 'bridge blew up',
        stack: 'TypeError: bridge blew up\n    at init (index.bundle:1:1)',
    };

    await Countly.initWithConfig(config);

    expect(global.ErrorUtils.setGlobalHandler).toHaveBeenCalledTimes(1);

    const handler = global.ErrorUtils.setGlobalHandler.mock.calls[0][0];
    handler(error, false);

    expect(nativeModule.logJSException).toHaveBeenCalledWith('TypeError', 'bridge blew up', error.stack);
    expect(previousHandler).toHaveBeenCalledWith(error, false);

    delete global.ErrorUtils;
});

test('recordView and event APIs preserve request payload shape', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    Countly.recordView('Home', { region: 'eu', premium: true, visits: 3 });
    Countly.events.recordEvent('purchase', { sku: 'sku-1', qty: 2 }, 4, 19.99);
    Countly.events.startEvent('checkout');
    Countly.events.endEvent('checkout', { step: 'payment' }, 1, 0);

    expect(nativeModule.recordView).toHaveBeenCalledWith(['Home', 'region', 'eu', 'premium', true, 'visits', 3]);
    expect(nativeModule.recordEvent).toHaveBeenCalledWith({
        n: 'purchase',
        c: 4,
        s: 19.99,
        g: ['sku', 'sku-1', 'qty', 2],
    });
    expect(nativeModule.startEvent).toHaveBeenCalledWith(['checkout']);
    expect(nativeModule.endEvent).toHaveBeenCalledWith({
        n: 'checkout',
        c: 1,
        s: 0,
        g: ['step', 'payment'],
    });
    expect(nativeModule.startEvent.mock.invocationCallOrder[0]).toBeLessThan(nativeModule.endEvent.mock.invocationCallOrder[0]);
});

test('views interface forwards payloads and resolves view IDs', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge({
        nativeOverrides: {
            startAutoStoppedView: jest.fn().mockResolvedValue('auto-1'),
            startView: jest.fn().mockResolvedValue('manual-1'),
        },
    });

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.views.startAutoStoppedView('Home', { region: 'eu', premium: true, labels: ['vip', 'beta'] })).resolves.toBe('auto-1');
    await expect(Countly.views.startView('Checkout', { step: 2 })).resolves.toBe('manual-1');

    Countly.views.pauseViewWithID('manual-1');
    Countly.views.resumeViewWithID('manual-1');
    Countly.views.addSegmentationToViewWithID('manual-1', { result: 'pending' });
    Countly.views.addSegmentationToViewWithName('Checkout', { stage: 'payment' });
    Countly.views.stopViewWithID('manual-1', { result: 'success' });
    Countly.views.stopViewWithName('Checkout', { source: 'button' });
    Countly.views.setGlobalViewSegmentation({ app: 'example' });
    Countly.views.updateGlobalViewSegmentation({ tab: 'views' });
    Countly.views.stopAllViews({ closedBy: 'test' });

    expect(nativeModule.startAutoStoppedView).toHaveBeenCalledWith(['Home', 'region', 'eu', 'premium', true, 'labels', ['vip', 'beta']]);
    expect(nativeModule.startView).toHaveBeenCalledWith(['Checkout', 'step', 2]);
    expect(nativeModule.pauseViewWithID).toHaveBeenCalledWith(['manual-1']);
    expect(nativeModule.resumeViewWithID).toHaveBeenCalledWith(['manual-1']);
    expect(nativeModule.addSegmentationToViewWithID).toHaveBeenCalledWith(['manual-1', 'result', 'pending']);
    expect(nativeModule.addSegmentationToViewWithName).toHaveBeenCalledWith(['Checkout', 'stage', 'payment']);
    expect(nativeModule.stopViewWithID).toHaveBeenCalledWith(['manual-1', 'result', 'success']);
    expect(nativeModule.stopViewWithName).toHaveBeenCalledWith(['Checkout', 'source', 'button']);
    expect(nativeModule.setGlobalViewSegmentation).toHaveBeenCalledWith(['app', 'example']);
    expect(nativeModule.updateGlobalViewSegmentation).toHaveBeenCalledWith(['tab', 'views']);
    expect(nativeModule.stopAllViews).toHaveBeenCalledWith(['closedBy', 'test']);
});

test('sessions, device, and content bridge calls keep their caller order', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key').enableManualSessionControl());

    Countly.giveConsent(['sessions', 'events']);
    Countly.sessions.beginSession();
    Countly.sessions.updateSession();
    Countly.sessions.endSession();
    Countly.deviceId.setID('device-2');
    Countly.content.enterContentZone();
    Countly.content.refreshContentZone();
    Countly.content.previewContent('content-42');
    Countly.content.exitContentZone();

    expect(nativeModule.giveConsent).toHaveBeenCalledWith(['sessions', 'events']);
    expect(nativeModule.setID).toHaveBeenCalledWith('device-2');
    expect(nativeModule.previewContent).toHaveBeenCalledWith(['content-42']);

    const callOrder = [
        nativeModule.giveConsent.mock.invocationCallOrder[0],
        nativeModule.startSession.mock.invocationCallOrder[0],
        nativeModule.updateSession.mock.invocationCallOrder[0],
        nativeModule.endSession.mock.invocationCallOrder[0],
        nativeModule.setID.mock.invocationCallOrder[0],
        nativeModule.enterContentZone.mock.invocationCallOrder[0],
        nativeModule.refreshContentZone.mock.invocationCallOrder[0],
        nativeModule.previewContent.mock.invocationCallOrder[0],
        nativeModule.exitContentZone.mock.invocationCallOrder[0],
    ];

    expect(callOrder).toEqual([...callOrder].sort((left, right) => left - right));
});

test('session APIs return undefined before init and deprecated root aliases still forward after init', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    expect(Countly.sessions.beginSession()).toBeUndefined();
    expect(Countly.sessions.updateSession()).toBeUndefined();
    expect(Countly.sessions.endSession()).toBeUndefined();
    expect(Countly.startSession()).toBe("'init' must be called before 'startSession'");
    expect(Countly.updateSession()).toBe("'init' must be called before 'updateSession'");
    expect(Countly.endSession()).toBe("'init' must be called before 'endSession'");

    expect(nativeModule.startSession).not.toHaveBeenCalled();
    expect(nativeModule.updateSession).not.toHaveBeenCalled();
    expect(nativeModule.endSession).not.toHaveBeenCalled();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key').enableManualSessionControl());

    expect(Countly.startSession()).toBeUndefined();
    expect(Countly.updateSession()).toBeUndefined();
    expect(Countly.endSession()).toBeUndefined();

    expect(nativeModule.startSession).toHaveBeenCalledTimes(1);
    expect(nativeModule.updateSession).toHaveBeenCalledTimes(1);
    expect(nativeModule.endSession).toHaveBeenCalledTimes(1);
});

test('deviceId.changeID forwards explicit merge selection to the native bridge', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    Countly.deviceId.changeID('device-2', true);
    Countly.deviceId.changeID('device-3', false);

    expect(nativeModule.changeDeviceId).toHaveBeenNthCalledWith(1, ['device-2', '1']);
    expect(nativeModule.changeDeviceId).toHaveBeenNthCalledWith(2, ['device-3', '0']);
});

test('addCustomNetworkRequestHeaders skips invalid values and stringifies the rest', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    Countly.addCustomNetworkRequestHeaders({
        Authorization: 'Bearer token',
        attempts: 3,
        empty: '',
        skipNull: null,
        skipUndefined: undefined,
    });

    expect(nativeModule.addCustomNetworkRequestHeaders).toHaveBeenCalledWith(['Authorization', 'Bearer token', 'attempts', '3', 'empty', '']);
});

test('notification, location, trace, and attribution helpers forward expected payloads', async () => {
    const pushListener = jest.fn();
    const starRatingCallback = jest.fn();
    const { Countly, CountlyConfig, nativeModule, emit } = loadCountlyBridge({ platform: 'ios' });

    Countly.disablePushNotifications();
    Countly.sendPushToken({ token: 'push-token' });
    const notificationSubscription = Countly.registerForNotification(pushListener);
    Countly.setLoggingEnabled(false);
    Countly.setHttpPostForced(false);
    Countly.setEventSendThreshold(11);

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    Countly.askForNotificationPermission('ding.wav');
    Countly.setLocation('US', 'Boston', '1.2,3.4', '8.8.8.8');
    Countly.disableLocation();
    Countly.addCrashLog('line 1');
    Countly.showStarRating(starRatingCallback);
    Countly.startTrace('trace-1');
    Countly.cancelTrace('trace-2');
    Countly.clearAllTraces();
    Countly.endTrace('trace-3', { db: 2 });
    Countly.recordNetworkTrace('GET /users', 200, 10, 20, 1000, 2000);
    Countly.replaceAllAppKeysInQueueWithCurrentAppKey();
    Countly.recordDirectAttribution('click', 'ad-1');
    Countly.recordIndirectAttribution('campaign-2');
    Countly.removeDifferentAppKeysFromQueue();
    await Countly.appLoadingFinished();

    emit('pushNotificationCallback', { aps: { alert: 'hi' } });
    nativeModule.showStarRating.mock.calls[0][1]('rated');

    expect(nativeModule.disablePushNotifications).toHaveBeenCalledTimes(1);
    expect(nativeModule.sendPushToken).toHaveBeenCalledWith(['push-token']);
    expect(nativeModule.registerForNotification).toHaveBeenCalledWith([]);
    expect(nativeModule.setLoggingEnabled).toHaveBeenCalledWith([false]);
    expect(nativeModule.setHttpPostForced).toHaveBeenCalledWith(['0']);
    expect(nativeModule.setEventSendThreshold).toHaveBeenCalledWith(['11']);
    expect(nativeModule.askForNotificationPermission).toHaveBeenCalledWith(['ding.wav']);
    expect(nativeModule.setLocation).toHaveBeenCalledWith(['US', 'Boston', '1.2,3.4', '8.8.8.8']);
    expect(nativeModule.disableLocation).toHaveBeenCalledTimes(1);
    expect(nativeModule.addCrashLog).toHaveBeenCalledWith(['line 1']);
    expect(nativeModule.showStarRating).toHaveBeenCalledWith([], expect.any(Function));
    expect(nativeModule.startTrace).toHaveBeenCalledWith(['trace-1']);
    expect(nativeModule.cancelTrace).toHaveBeenCalledWith(['trace-2']);
    expect(nativeModule.clearAllTraces).toHaveBeenCalledWith([]);
    expect(nativeModule.endTrace).toHaveBeenCalledWith(['trace-3', 'db', '2']);
    expect(nativeModule.recordNetworkTrace).toHaveBeenCalledWith(['GET /users', '200', '10', '20', '1000', '2000']);
    expect(nativeModule.replaceAllAppKeysInQueueWithCurrentAppKey).toHaveBeenCalledTimes(1);
    expect(nativeModule.recordDirectAttribution).toHaveBeenCalledWith(['click', 'ad-1']);
    expect(nativeModule.recordIndirectAttribution).toHaveBeenCalledWith(['campaign-2']);
    expect(nativeModule.removeDifferentAppKeysFromQueue).toHaveBeenCalledTimes(1);
    expect(nativeModule.appLoadingFinished).toHaveBeenCalledTimes(1);
    expect(pushListener).toHaveBeenCalledWith({ aps: { alert: 'hi' } });
    expect(starRatingCallback).toHaveBeenCalledWith('rated');
    expect(typeof notificationSubscription.remove).toBe('function');
});

test('metrics, crash, and custom metric helpers normalize payloads', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    Countly.recordMetrics({ os: 'ios', build: 17 });
    Countly.logException('boom\nline2', true, { region: 'eu', retries: 2 });
    Countly.setCustomCrashSegments({ region: 'eu', retries: 2 });
    Countly.pinnedCertificates('cert.pem');
    await Countly.setCustomMetrics({ platform: 'ios', build: 1, release: '26.1.0' });

    expect(nativeModule.recordMetrics).toHaveBeenCalledWith(['os', 'ios', 'build', '17']);
    expect(nativeModule.logException).toHaveBeenCalledWith(['boom\nline2\n', true, 'region', 'eu', 'retries', '2']);
    expect(nativeModule.setCustomCrashSegments).toHaveBeenCalledWith(['region', 'eu', 'retries', '2']);
    expect(nativeModule.pinnedCertificates).toHaveBeenCalledWith(['cert.pem']);
    expect(nativeModule.setCustomMetrics).toHaveBeenCalledWith(['platform', 'ios', 'release', '26.1.0']);
});

test('user data helpers normalize aliases and forward payloads', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await Countly.setUserData({
        name: 'Ada',
        org: 'Countly',
        byear: 1990,
        premium: true,
        tags: ['vip'],
    });

    await Countly.userData.setProperty('plan', 'pro');
    await Countly.userData.increment('visits');
    await Countly.userData.incrementBy('coins', '7');
    await Countly.userData.multiply('xp', '3');
    await Countly.userData.saveMax('maxLevel', '9');
    await Countly.userData.saveMin('minLevel', '2');
    await Countly.userData.setOnce('joined', 'yes');
    await Countly.userData.pushUniqueValue('labels', 'alpha');
    await Countly.userData.pushValue('labels', 'beta');
    await Countly.userData.pullValue('labels', 'beta');

    await Countly.userDataBulk.setUserProperties({ org: 'Countly', byear: 1991, plan: 'enterprise' });
    await Countly.userDataBulk.save();
    await Countly.userDataBulk.setProperty('tier', 'gold');
    await Countly.userDataBulk.increment('logins');
    await Countly.userDataBulk.incrementBy('coins', '4');
    await Countly.userDataBulk.multiply('xp', '2');
    await Countly.userDataBulk.saveMax('best', '10');
    await Countly.userDataBulk.saveMin('worst', '1');
    await Countly.userDataBulk.setOnce('firstSeen', 'today');
    await Countly.userDataBulk.pushUniqueValue('segments', 'beta');
    await Countly.userDataBulk.pushValue('segments', 'vip');
    await Countly.userDataBulk.pullValue('segments', 'vip');

    expect(nativeModule.setUserData).toHaveBeenCalledWith([{ name: 'Ada', organization: 'Countly', byear: '1990', premium: true, tags: ['vip'] }]);
    expect(nativeModule.userData_setProperty).toHaveBeenCalledWith(['plan', 'pro']);
    expect(nativeModule.userData_increment).toHaveBeenCalledWith(['visits']);
    expect(nativeModule.userData_incrementBy).toHaveBeenCalledWith(['coins', '7']);
    expect(nativeModule.userData_multiply).toHaveBeenCalledWith(['xp', '3']);
    expect(nativeModule.userData_saveMax).toHaveBeenCalledWith(['maxLevel', '9']);
    expect(nativeModule.userData_saveMin).toHaveBeenCalledWith(['minLevel', '2']);
    expect(nativeModule.userData_setOnce).toHaveBeenCalledWith(['joined', 'yes']);
    expect(nativeModule.userData_pushUniqueValue).toHaveBeenCalledWith(['labels', 'alpha']);
    expect(nativeModule.userData_pushValue).toHaveBeenCalledWith(['labels', 'beta']);
    expect(nativeModule.userData_pullValue).toHaveBeenCalledWith(['labels', 'beta']);
    expect(nativeModule.userDataBulk_setUserProperties).toHaveBeenCalledWith({ organization: 'Countly', byear: '1991', plan: 'enterprise' });
    expect(nativeModule.userDataBulk_save).toHaveBeenCalledWith([]);
    expect(nativeModule.userDataBulk_setProperty).toHaveBeenCalledWith(['tier', 'gold']);
    expect(nativeModule.userDataBulk_increment).toHaveBeenCalledWith(['logins']);
    expect(nativeModule.userDataBulk_incrementBy).toHaveBeenCalledWith(['coins', '4']);
    expect(nativeModule.userDataBulk_multiply).toHaveBeenCalledWith(['xp', '2']);
    expect(nativeModule.userDataBulk_saveMax).toHaveBeenCalledWith(['best', '10']);
    expect(nativeModule.userDataBulk_saveMin).toHaveBeenCalledWith(['worst', '1']);
    expect(nativeModule.userDataBulk_setOnce).toHaveBeenCalledWith(['firstSeen', 'today']);
    expect(nativeModule.userDataBulk_pushUniqueValue).toHaveBeenCalledWith(['segments', 'beta']);
    expect(nativeModule.userDataBulk_pushValue).toHaveBeenCalledWith(['segments', 'vip']);
    expect(nativeModule.userDataBulk_pullValue).toHaveBeenCalledWith(['segments', 'vip']);
});

test('disablePushNotifications returns the android stub message without calling native', () => {
    const { Countly, nativeModule } = loadCountlyBridge({ platform: 'android' });

    expect(Countly.disablePushNotifications()).toBe('disablePushNotifications : To be implemented');
    expect(nativeModule.disablePushNotifications).not.toHaveBeenCalled();
});

test('feedback.showNPS selects the matching widget and removes the close listener after callback', async () => {
    const widgets = [
        { id: 'survey-1', type: 'survey', name: 'Survey', tags: ['beta'] },
        { id: 'nps-2', type: 'nps', name: 'Priority NPS', tags: ['vip'], widgetVersion: 'v2' },
    ];
    const { Countly, CountlyConfig, nativeModule, listeners, emit } = loadCountlyBridge({
        nativeOverrides: {
            getFeedbackWidgets: jest.fn().mockResolvedValue(widgets),
        },
    });
    const widgetClosedCallback = jest.fn();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    Countly.feedback.showNPS('vip', widgetClosedCallback);
    await flushPromises();

    expect(nativeModule.presentFeedbackWidget).toHaveBeenCalledWith(['nps-2', 'nps', 'Priority NPS', '', 'v2']);

    const closedListener = listeners.find((listener) => listener.eventName === 'widgetClosedCallback');
    emit('widgetClosedCallback');

    expect(widgetClosedCallback).toHaveBeenCalledTimes(1);
    expect(closedListener.subscription.remove).toHaveBeenCalledTimes(1);
});

test('remote config key filters forward their arrays and callback results', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge({
        nativeOverrides: {
            updateRemoteConfigForKeysOnly: jest.fn((args, callback) => callback(`only:${args.join(',')}`)),
            updateRemoteConfigExceptKeys: jest.fn((args, callback) => callback(`except:${args.join(',')}`)),
        },
    });
    const onlyCallback = jest.fn();
    const exceptCallback = jest.fn();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    Countly.updateRemoteConfigForKeysOnly(['theme', 'banner'], onlyCallback);
    Countly.updateRemoteConfigExceptKeys(['secret'], exceptCallback);

    expect(nativeModule.updateRemoteConfigForKeysOnly).toHaveBeenCalledWith(['theme', 'banner'], expect.any(Function));
    expect(nativeModule.updateRemoteConfigExceptKeys).toHaveBeenCalledWith(['secret'], expect.any(Function));
    expect(onlyCallback).toHaveBeenCalledWith('only:theme,banner');
    expect(exceptCallback).toHaveBeenCalledWith('except:secret');
});

test('remoteConfig.update methods await the native callback result', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge({
        nativeOverrides: {
            remoteConfigUpdate: jest.fn((_args, callback) => callback('Remote Config is updated and ready to use!')),
            updateRemoteConfigForKeysOnly: jest.fn((args, callback) => callback(`only:${args.join(',')}`)),
            updateRemoteConfigExceptKeys: jest.fn((args, callback) => callback(`except:${args.join(',')}`)),
        },
    });

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.remoteConfig.update()).resolves.toBeUndefined();
    await expect(Countly.remoteConfig.updateForKeysOnly(['theme', 'banner'])).resolves.toBeUndefined();
    await expect(Countly.remoteConfig.updateExceptKeys(['secret'])).resolves.toBeUndefined();

    expect(nativeModule.remoteConfigUpdate).toHaveBeenCalledWith([], expect.any(Function));
    expect(nativeModule.updateRemoteConfigForKeysOnly).toHaveBeenCalledWith(['theme', 'banner'], expect.any(Function));
    expect(nativeModule.updateRemoteConfigExceptKeys).toHaveBeenCalledWith(['secret'], expect.any(Function));
});

test('remoteConfig.updateForKeysOnly resolves when the native layer reports an update error', async () => {
    const { Countly, CountlyConfig } = loadCountlyBridge({
        nativeOverrides: {
            updateRemoteConfigForKeysOnly: jest.fn((_args, callback) => callback('There was an error while updating Remote Config: NetworkError')),
        },
    });

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.remoteConfig.updateForKeysOnly(['theme'])).resolves.toBeUndefined();
});

test('remoteConfig.getValue returns null when the key is missing', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge({
        platform: 'android',
        nativeOverrides: {
            getRemoteConfigValueForKey: jest.fn((_args, callback) => callback('ConfigKeyNotFound')),
        },
    });

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.remoteConfig.getValue('missing-key')).resolves.toBeNull();
    expect(nativeModule.getRemoteConfigValueForKey).toHaveBeenCalledWith(['missing-key'], expect.any(Function));
});

test('remoteConfig.getValue parses JSON payloads on android', async () => {
    const { Countly, CountlyConfig } = loadCountlyBridge({
        platform: 'android',
        nativeOverrides: {
            getRemoteConfigValueForKey: jest.fn((_args, callback) => callback('{"enabled":true}')),
        },
    });

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.remoteConfig.getValue('feature-flag')).resolves.toEqual({ enabled: true });
});

test('remoteConfig.clearValues resolves after clearing the native cache', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.remoteConfig.clearValues()).resolves.toBeUndefined();
    expect(nativeModule.remoteConfigClearValues).toHaveBeenCalledTimes(1);
});

test('legacy remote config and rating widget helpers preserve callback behavior', async () => {
    const remoteConfigUpdateCallback = jest.fn();
    const keysOnlyCallback = jest.fn();
    const exceptKeysCallback = jest.fn();
    const getValueCallback = jest.fn();
    const ratingWidgetCallback = jest.fn();
    const { Countly, CountlyConfig, nativeModule, listeners, emit } = loadCountlyBridge({
        platform: 'android',
        nativeOverrides: {
            remoteConfigUpdate: jest.fn((_args, callback) => callback('updated')),
            updateRemoteConfigForKeysOnly: jest.fn((args, callback) => callback(`only:${args.join(',')}`)),
            updateRemoteConfigExceptKeys: jest.fn((args, callback) => callback(`except:${args.join(',')}`)),
            getRemoteConfigValueForKey: jest.fn((_args, callback) => callback('{"feature":true}')),
        },
    });

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    Countly.remoteConfigUpdate(remoteConfigUpdateCallback);
    Countly.updateRemoteConfigForKeysOnly(['theme'], keysOnlyCallback);
    Countly.updateRemoteConfigExceptKeys(['secret'], exceptKeysCallback);
    Countly.getRemoteConfigValueForKey('feature', getValueCallback);
    Countly.presentRatingWidgetWithID('rating-1', 99, ratingWidgetCallback);

    emit('ratingWidgetCallback', 'closed');

    const ratingListener = listeners.find((listener) => listener.eventName === 'ratingWidgetCallback');

    expect(remoteConfigUpdateCallback).toHaveBeenCalledWith('updated');
    expect(keysOnlyCallback).toHaveBeenCalledWith('only:theme');
    expect(exceptKeysCallback).toHaveBeenCalledWith('except:secret');
    expect(getValueCallback).toHaveBeenCalledWith({ feature: true });
    expect(nativeModule.presentRatingWidgetWithID).toHaveBeenCalledWith(['rating-1', 'Done']);
    expect(ratingWidgetCallback).toHaveBeenCalledWith('closed');
    expect(ratingListener.subscription.remove).toHaveBeenCalledTimes(1);
});

test('remoteConfig methods do not throw when the SDK is not initialized', async () => {
    const { Countly } = loadCountlyBridge();

    await expect(Countly.remoteConfig.update()).resolves.toBeUndefined();
    await expect(Countly.remoteConfig.updateForKeysOnly(['theme'])).resolves.toBeUndefined();
    await expect(Countly.remoteConfig.updateExceptKeys(['theme'])).resolves.toBeUndefined();
    await expect(Countly.remoteConfig.getValue('theme')).resolves.toBeNull();
    await expect(Countly.remoteConfig.clearValues()).resolves.toBeUndefined();
});

test('remoteConfig.getValue returns null for invalid keys instead of throwing', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.remoteConfig.getValue('')).resolves.toBeNull();
    expect(nativeModule.getRemoteConfigValueForKey).not.toHaveBeenCalled();
});

test('getRemoteConfigValueForKeyP returns ConfigKeyNotFound on android when the native promise rejects for a missing key', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge({
        platform: 'android',
        nativeOverrides: {
            getRemoteConfigValueForKeyP: jest.fn().mockResolvedValue('ConfigKeyNotFound'),
        },
    });

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.getRemoteConfigValueForKeyP('missing-key')).resolves.toBe('ConfigKeyNotFound');
    expect(nativeModule.getRemoteConfigValueForKeyP).toHaveBeenCalledWith('missing-key');
});

test('getRemoteConfigValueForKeyP parses JSON payloads on android', async () => {
    const { Countly, CountlyConfig } = loadCountlyBridge({
        platform: 'android',
        nativeOverrides: {
            getRemoteConfigValueForKeyP: jest.fn().mockResolvedValue('{"enabled":true}'),
        },
    });

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.getRemoteConfigValueForKeyP('feature-flag')).resolves.toEqual({ enabled: true });
});

test('test helpers expose native queues and halt resets JS bridge state for reinit', async () => {
    const firstContentCallback = jest.fn();
    const secondContentCallback = jest.fn();
    const { Countly, CountlyConfig, CountlyState, nativeModule, emit } = loadCountlyBridge({
        nativeOverrides: {
            getRequestQueue: jest.fn().mockResolvedValue(['begin_session=1']),
            getEventQueue: jest.fn().mockResolvedValue(['{"key":"purchase"}']),
            halt: jest.fn().mockResolvedValue(undefined),
        },
    });

    const firstConfig = new CountlyConfig('https://server.count.ly', 'app-key');
    firstConfig.content.setGlobalContentCallback(firstContentCallback);
    await Countly.initWithConfig(firstConfig);

    await expect(Countly.test.getRequestQueue()).resolves.toEqual(['begin_session=1']);
    await expect(Countly.test.getEventQueue()).resolves.toEqual(['{"key":"purchase"}']);

    await Countly.test.halt();

    expect(nativeModule.halt).toHaveBeenCalledTimes(1);
    expect(CountlyState.isInitialized).toBe(false);

    const secondConfig = new CountlyConfig('https://server.count.ly', 'app-key');
    secondConfig.content.setGlobalContentCallback(secondContentCallback);
    await Countly.initWithConfig(secondConfig);

    emit('globalContentCallback', JSON.stringify({ status: 'updated', data: { id: 'content-2' } }));

    expect(firstContentCallback).not.toHaveBeenCalled();
    expect(secondContentCallback).toHaveBeenCalledWith('updated', { id: 'content-2' });
});

test('content helpers guard before init and test helpers normalize null native results', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge({
        nativeOverrides: {
            getCapturedRequests: jest.fn().mockResolvedValue(null),
        },
    });

    expect(Countly.content.enterContentZone()).toBeUndefined();
    expect(Countly.content.refreshContentZone()).toBeUndefined();
    expect(Countly.content.previewContent('content-1')).toBe("'init' must be called before 'previewContent'");
    expect(Countly.content.previewContent('')).toBe('contentId should not be null, undefined or empty');
    expect(Countly.content.exitContentZone()).toBeUndefined();

    expect(nativeModule.enterContentZone).not.toHaveBeenCalled();
    expect(nativeModule.refreshContentZone).not.toHaveBeenCalled();
    expect(nativeModule.previewContent).not.toHaveBeenCalled();
    expect(nativeModule.exitContentZone).not.toHaveBeenCalled();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.test.enableRequestCapture()).resolves.toBeUndefined();
    await expect(Countly.test.getCapturedRequests()).resolves.toEqual([]);

    expect(nativeModule.enableRequestCapture).toHaveBeenCalledTimes(1);
    expect(nativeModule.getCapturedRequests).toHaveBeenCalledTimes(1);
});
