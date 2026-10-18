function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

function createNativeModuleMock(overrides = {}) {
    return {
        init: jest.fn().mockResolvedValue(undefined),
        isInitialized: jest.fn().mockResolvedValue(false),
        disablePushNotifications: jest.fn(),
        sendPushToken: jest.fn(),
        askForNotificationPermission: jest.fn(),
        registerForNotification: jest.fn(),
        registerForNotificationOpened: jest.fn(),
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

function loadCountlyBridge({ platform = 'ios', nativeOverrides = {}, pushAvailable = true, parseErrorStack = jest.fn(() => []) } = {}) {
    const listeners = [];
    const nativeModule = createNativeModuleMock(nativeOverrides);

    class MockNativeEventEmitter {
        constructor(module) {
            this.module = module;
        }

        addListener(eventName, handler) {
            if (typeof handler !== 'function') {
                throw new TypeError('EventEmitter.addListener(...): 2nd argument must be a function.');
            }
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

    jest.doMock('react-native/Libraries/Core/Devtools/parseErrorStack.js', () => parseErrorStack, { virtual: true });
    jest.doMock('react-native', () => ({
        Platform: {
            OS: platform,
            constants: { reactNativeVersion: { minor: 72 } },
        },
        NativeModules: { CountlyReactNative: nativeModule },
        TurboModuleRegistry: { get: jest.fn(() => nativeModule) },
        NativeEventEmitter: MockNativeEventEmitter,
    }), { virtual: true });
    jest.doMock('../CountlyFlavor.js', () => ({ PUSH_NOTIFICATIONS_AVAILABLE: pushAvailable }));

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

test('initWithConfig leaves out empty, null and non-text device IDs so the SDK generates one', async () => {
    for (const deviceID of ['', null, undefined, 42]) {
        const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();
        await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key').setDeviceID(deviceID));
        expect(getNativeInitPayload(nativeModule)).not.toHaveProperty('deviceID');
    }

    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();
    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key').setDeviceID('device-1'));
    expect(getNativeInitPayload(nativeModule).deviceID).toBe('device-1');
});

test('the JS crash title names the function and only the bundle file name, for debug URLs and embedded bundle paths', async () => {
    global.ErrorUtils = { getGlobalHandler: jest.fn(() => jest.fn()), setGlobalHandler: jest.fn() };
    const parseErrorStack = jest.fn(() => []);
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge({ parseErrorStack });
    const files = [
        ['http://localhost:8081/index.bundle//&platform=ios&dev=true&minify=false&app=com.example', 'index.bundle'],
        ['http://10.0.2.2:8081/index.bundle?platform=android&dev=true&minify=false', 'index.bundle'],
        ['index.android.bundle', 'index.android.bundle'],
        ['/private/var/containers/Bundle/Application/1A2B3C4D-0000-4000-8000-123456789ABC/AwesomeProject.app/main.jsbundle', 'main.jsbundle'],
        ['/Users/builder/project/DerivedData/Build/Products/Debug-iphoneos/main.jsbundle', 'main.jsbundle'],
        ['assets://index.android.bundle', 'index.android.bundle'],
    ];
    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key').enableCrashReporting());
    const handler = global.ErrorUtils.setGlobalHandler.mock.calls[0][0];

    files.forEach(([file]) => {
        parseErrorStack.mockReturnValueOnce([{ methodName: 'pay', file, lineNumber: 10, column: 5 }]);
        handler({ name: 'TypeError', message: 'payment failed', stack: `TypeError: payment failed\n    at pay (${file}:10:5)` }, false);
    });

    expect(nativeModule.logJSException.mock.calls.map((call) => call[0])).toEqual(files.map(([, fileName]) => `TypeError (pay@${fileName})`));
    delete global.ErrorUtils;
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
    handler(error, true);

    expect(nativeModule.logJSException).toHaveBeenNthCalledWith(1, 'TypeError', 'bridge blew up', error.stack, false);
    expect(nativeModule.logJSException).toHaveBeenNthCalledWith(2, 'TypeError', 'bridge blew up', error.stack, true);
    expect(previousHandler).toHaveBeenNthCalledWith(1, error, false);
    expect(previousHandler).toHaveBeenNthCalledWith(2, error, true);

    global.__DEV__ = true;
    handler(error, true);

    expect(nativeModule.logJSException).toHaveBeenNthCalledWith(3, 'TypeError', 'bridge blew up', error.stack, false);
    expect(previousHandler).toHaveBeenNthCalledWith(3, error, true);
    expect(nativeModule.addCrashLog).not.toHaveBeenCalled();

    global.__DEV__ = false;
    delete global.ErrorUtils;
});

test('JS crash handler reports values that are not errors and always calls the previous handler', async () => {
    const previousHandler = jest.fn();
    global.ErrorUtils = {
        getGlobalHandler: jest.fn(() => previousHandler),
        setGlobalHandler: jest.fn(),
    };

    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();
    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key').enableCrashReporting());
    const handler = global.ErrorUtils.setGlobalHandler.mock.calls[0][0];

    handler('oops', false);
    handler({ code: 1 }, false);
    handler({ name: 404, message: 'Not found', stack: ['frame'] }, false);
    handler({ state: 'x'.repeat(5000) }, false);
    nativeModule.logJSException.mockImplementationOnce(() => {
        throw new Error('native module unavailable');
    });
    handler(new Error('still forwarded'), false);

    expect(nativeModule.logJSException).toHaveBeenNthCalledWith(1, 'Error', 'oops', expect.any(String), false);
    expect(nativeModule.logJSException).toHaveBeenNthCalledWith(2, 'Error', '{"code":1}', expect.any(String), false);
    expect(nativeModule.logJSException).toHaveBeenNthCalledWith(3, 'Error', 'Not found', '', false);
    expect(nativeModule.logJSException.mock.calls[3][1]).toHaveLength(1000);
    expect(previousHandler).toHaveBeenNthCalledWith(1, 'oops', false);
    expect(previousHandler).toHaveBeenNthCalledWith(2, { code: 1 }, false);
    expect(previousHandler).toHaveBeenCalledTimes(5);

    delete global.ErrorUtils;
});

test('event APIs preserve request payload shape', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    Countly.events.recordEvent('purchase', { sku: 'sku-1', qty: 2 }, 4, 19.99);
    Countly.events.startEvent('checkout');
    Countly.events.endEvent('checkout', { step: 'payment' }, 1, 0);

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
    const notificationSubscription = Countly.registerForNotification(pushListener);
    Countly.setLoggingEnabled(false);
    Countly.setHttpPostForced(false);
    Countly.setEventSendThreshold(11);

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    Countly.sendPushToken({ token: 'push-token' });
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
    Countly.recordIndirectAttribution({ campaign: 'campaign-2' });
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
    expect(nativeModule.recordIndirectAttribution).toHaveBeenCalledWith([{ campaign: 'campaign-2' }]);
    expect(nativeModule.removeDifferentAppKeysFromQueue).toHaveBeenCalledTimes(1);
    expect(nativeModule.appLoadingFinished).toHaveBeenCalledTimes(1);
    expect(pushListener).toHaveBeenCalledWith({ aps: { alert: 'hi' } });
    expect(starRatingCallback).toHaveBeenCalledWith('rated');
    expect(typeof notificationSubscription.remove).toBe('function');
});

test('metrics, crash, and custom metric helpers normalize payloads', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    Countly.setCustomCrashSegments({ region: 'eu', retries: 2 });
    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    Countly.recordMetrics({ os: 'ios', build: 17 });
    Countly.logException('boom\nline2', true, { region: 'eu', retries: 2 });
    Countly.pinnedCertificates('cert.pem');
    await Countly.setCustomMetrics({ platform: 'ios', build: 1, release: '26.1.0' });

    expect(nativeModule.recordMetrics).toHaveBeenCalledWith(['os', 'ios', 'build', '17']);
    expect(nativeModule.logException).toHaveBeenCalledWith(['boom\nline2\n', true, 'region', 'eu', 'retries', '2']);
    expect(nativeModule.setCustomCrashSegments).toHaveBeenCalledWith(['region', 'eu', 'retries', '2']);
    expect(nativeModule.pinnedCertificates).toHaveBeenCalledWith(['cert.pem']);
    expect(nativeModule.setCustomMetrics).toHaveBeenCalledWith(['platform', 'ios', 'release', '26.1.0']);
});

test('logException records fatal only for an explicit false nonfatal flag', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    Countly.logException('fatal', false, { screen: 'home' });
    Countly.logException('omitted flag');
    Countly.logException('text flag', 'false');
    Countly.logException('empty segments', true, { missing: null, unset: undefined, screen: 'home' });

    expect(nativeModule.logException).toHaveBeenNthCalledWith(1, ['fatal\n', false, 'screen', 'home']);
    expect(nativeModule.logException).toHaveBeenNthCalledWith(2, ['omitted flag\n', true]);
    expect(nativeModule.logException).toHaveBeenNthCalledWith(3, ['text flag\n', true]);
    expect(nativeModule.logException).toHaveBeenNthCalledWith(4, ['empty segments\n', true, 'screen', 'home']);
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

test('remoteConfig.update methods await the native callback result', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge({
        nativeOverrides: {
            remoteConfigUpdate: jest.fn((_args, callback) => callback('Remote Config is updated and ready to use!')),
            updateRemoteConfigForKeysOnly: jest.fn((args, callback) => callback(`only:${args.join(',')}`)),
            updateRemoteConfigExceptKeys: jest.fn((args, callback) => callback(`except:${args.join(',')}`)),
        },
    });

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.remoteConfig.update()).resolves.toEqual({ success: true, error: null });
    await expect(Countly.remoteConfig.updateForKeysOnly(['theme', 'banner'])).resolves.toEqual({ success: true, error: null });
    await expect(Countly.remoteConfig.updateExceptKeys(['secret'])).resolves.toEqual({ success: true, error: null });

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

    await expect(Countly.remoteConfig.updateForKeysOnly(['theme'])).resolves.toEqual({ success: false, error: 'NetworkError' });
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

test('remoteConfig.getValue tells a missing key from a stored "ConfigKeyNotFound" value on ios', async () => {
    const { Countly, CountlyConfig } = loadCountlyBridge({
        nativeOverrides: {
            getRemoteConfigValueForKey: jest.fn((args, callback) => callback({ missing: null, status: 'ConfigKeyNotFound' }[args[0]])),
        },
    });

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.remoteConfig.getValue('missing')).resolves.toBeNull();
    await expect(Countly.remoteConfig.getValue('status')).resolves.toBe('ConfigKeyNotFound');
});

test('remoteConfig.getValue keeps android string values that look like other types', async () => {
    const { Countly, CountlyConfig } = loadCountlyBridge({
        platform: 'android',
        nativeOverrides: {
            getRemoteConfigValueForKey: jest.fn((args, callback) => callback({ price: '"2.10"', flag: '"true"', count: '7' }[args[0]])),
        },
    });

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.remoteConfig.getValue('price')).resolves.toBe('2.10');
    await expect(Countly.remoteConfig.getValue('flag')).resolves.toBe('true');
    await expect(Countly.remoteConfig.getValue('count')).resolves.toBe(7);
});

test('remoteConfig.clearValues resolves after clearing the native cache', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.remoteConfig.clearValues()).resolves.toBeUndefined();
    expect(nativeModule.remoteConfigClearValues).toHaveBeenCalledTimes(1);
});

test('rating widget helper preserves callback behavior', async () => {
    const ratingWidgetCallback = jest.fn();
    const { Countly, CountlyConfig, nativeModule, listeners, emit } = loadCountlyBridge();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    Countly.presentRatingWidgetWithID('rating-1', 99, ratingWidgetCallback);

    emit('ratingWidgetCallback', 'closed');

    const ratingListener = listeners.find((listener) => listener.eventName === 'ratingWidgetCallback');

    expect(nativeModule.presentRatingWidgetWithID).toHaveBeenCalledWith(['rating-1', 'Done']);
    expect(ratingWidgetCallback).toHaveBeenCalledWith('closed');
    expect(ratingListener.subscription.remove).toHaveBeenCalledTimes(1);
});

test('remoteConfig methods do not throw when the SDK is not initialized', async () => {
    const { Countly } = loadCountlyBridge();

    await expect(Countly.remoteConfig.update()).resolves.toEqual({ success: false, error: "'init' must be called before 'Countly.remoteConfig.update'" });
    await expect(Countly.remoteConfig.updateForKeysOnly(['theme'])).resolves.toEqual({ success: false, error: "'init' must be called before 'Countly.remoteConfig.updateForKeysOnly'" });
    await expect(Countly.remoteConfig.updateExceptKeys(['theme'])).resolves.toEqual({ success: false, error: "'init' must be called before 'Countly.remoteConfig.updateExceptKeys'" });
    await expect(Countly.remoteConfig.getValue('theme')).resolves.toBeNull();
    await expect(Countly.remoteConfig.clearValues()).resolves.toBeUndefined();
});

test('remoteConfig.getValue returns null for invalid keys instead of throwing', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.remoteConfig.getValue('')).resolves.toBeNull();
    expect(nativeModule.getRemoteConfigValueForKey).not.toHaveBeenCalled();
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
    global.__DEV__ = true;

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
    global.__DEV__ = false;
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

    global.__DEV__ = true;
    await expect(Countly.test.enableRequestCapture()).resolves.toBeUndefined();
    await expect(Countly.test.getCapturedRequests()).resolves.toEqual([]);

    expect(nativeModule.enableRequestCapture).toHaveBeenCalledTimes(1);
    expect(nativeModule.getCapturedRequests).toHaveBeenCalledTimes(1);
    global.__DEV__ = false;
});

test('initWithConfig refuses a missing or invalid server URL or app key without calling native init', async () => {
    const invalidConfigs = [
        [undefined, 'app-key'],
        [null, 'app-key'],
        [42, 'app-key'],
        ['', 'app-key'],
        ['https://server.count.ly', undefined],
        ['https://server.count.ly', null],
        ['https://server.count.ly', ''],
        ['https://server.count.ly', 7],
    ];

    for (const [serverURL, appKey] of invalidConfigs) {
        const { Countly, CountlyConfig, CountlyState, nativeModule } = loadCountlyBridge();
        await expect(Countly.initWithConfig(new CountlyConfig(serverURL, appKey))).resolves.toBeUndefined();
        expect(nativeModule.init).not.toHaveBeenCalled();
        expect(CountlyState.isInitialized).toBe(false);
    }

    const { Countly, CountlyConfig, CountlyState, nativeModule } = loadCountlyBridge();
    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));
    expect(nativeModule.init).toHaveBeenCalledTimes(1);
    expect(CountlyState.isInitialized).toBe(true);
});

test('initWithConfig settles without marking the SDK initialized when native init fails', async () => {
    const { Countly, CountlyConfig, CountlyState, nativeModule } = loadCountlyBridge({
        nativeOverrides: { init: jest.fn().mockRejectedValue(new Error('server URL host is missing')) },
    });

    await expect(Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'))).resolves.toBeUndefined();

    expect(nativeModule.init).toHaveBeenCalledTimes(1);
    expect(CountlyState.isInitialized).toBe(false);
});

test('sendPushToken needs init and a token text', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    expect(Countly.sendPushToken({ token: 'push-token' })).toBe("'init' must be called before 'sendPushToken'");
    expect(nativeModule.sendPushToken).not.toHaveBeenCalled();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    expect(Countly.sendPushToken({ token: '' })).toBe('token should not be null, undefined or empty');
    expect(Countly.sendPushToken({})).toBe('token should not be null, undefined or empty');
    expect(Countly.sendPushToken(null)).toBe('token should not be null, undefined or empty');
    expect(nativeModule.sendPushToken).not.toHaveBeenCalled();

    expect(Countly.sendPushToken({ token: 'push-token' })).toBeUndefined();
    expect(nativeModule.sendPushToken).toHaveBeenCalledWith(['push-token']);
});

test('askForNotificationPermission sends a text sound path even when null is passed', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge({ platform: 'android' });

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));
    Countly.askForNotificationPermission(null);
    Countly.askForNotificationPermission();
    Countly.askForNotificationPermission('ding');

    expect(nativeModule.askForNotificationPermission).toHaveBeenNthCalledWith(1, ['null']);
    expect(nativeModule.askForNotificationPermission).toHaveBeenNthCalledWith(2, ['null']);
    expect(nativeModule.askForNotificationPermission).toHaveBeenNthCalledWith(3, ['ding']);
});

test('registerForNotification keeps one subscription so each push reaches JS once', () => {
    const firstListener = jest.fn();
    const secondListener = jest.fn();
    const { Countly, listeners, emit } = loadCountlyBridge({ platform: 'android' });

    const firstSubscription = Countly.registerForNotification(firstListener);
    const secondSubscription = Countly.registerForNotification(secondListener);
    emit('pushNotificationCallback', '{"c.i":"push-1"}');

    expect(firstSubscription.remove).toHaveBeenCalledTimes(1);
    expect(secondSubscription.remove).not.toHaveBeenCalled();
    expect(firstListener).not.toHaveBeenCalled();
    expect(secondListener).toHaveBeenCalledTimes(1);
    expect(secondListener).toHaveBeenCalledWith('{"c.i":"push-1"}');
    expect(listeners.filter((listener) => listener.eventName === 'pushNotificationCallback' && !listener.removed)).toHaveLength(1);
});

test('a push listener that is not a function is refused, keeps the current listener and gets a subscription that does nothing', () => {
    const receivedListener = jest.fn();
    const openedListener = jest.fn();
    const { Countly, nativeModule, emit } = loadCountlyBridge({ platform: 'android' });

    const receivedSubscription = Countly.registerForNotification(receivedListener);
    const openedSubscription = Countly.registerForNotificationOpened(openedListener);
    const refusedReceived = Countly.registerForNotification('not a function');
    const refusedOpened = Countly.registerForNotificationOpened('not a function');
    emit('pushNotificationCallback', '{"c.i":"push-1"}');
    emit('pushNotificationOpenedCallback', JSON.stringify({ notification: { 'c.i': 'push-1' }, actionIndex: 0 }));

    expect(() => refusedReceived.remove()).not.toThrow();
    expect(() => refusedOpened.remove()).not.toThrow();
    expect(receivedSubscription.remove).not.toHaveBeenCalled();
    expect(openedSubscription.remove).not.toHaveBeenCalled();
    expect(receivedListener).toHaveBeenCalledWith('{"c.i":"push-1"}');
    expect(openedListener).toHaveBeenCalledWith({ 'c.i': 'push-1' }, 0);
    expect(nativeModule.registerForNotification).toHaveBeenCalledTimes(1);
    expect(nativeModule.registerForNotificationOpened).toHaveBeenCalledTimes(1);
});

test('push calls and push options reach the native module only in the push package', async () => {
    const noPushMessage = "push notifications are not part of the no-push package, use 'countly-sdk-react-native-bridge' for push notifications";

    for (const pushAvailable of [true, false]) {
        const { Countly, CountlyConfig, nativeModule, listeners } = loadCountlyBridge({ pushAvailable });
        const config = new CountlyConfig('https://server.count.ly', 'app-key')
            .setPushTokenType('DEVELOPMENT')
            .setPushNotificationChannelInformation('Alerts', 'Countly alerts')
            .setPushNotificationAccentColor('#ffffff')
            .configureIntentRedirectionCheck(['MainActivity'], ['com.example.app'])
            .disableAdditionalIntentRedirectionChecks();
        await Countly.initWithConfig(config);

        const receivedSubscription = Countly.registerForNotification(jest.fn());
        const openedSubscription = Countly.registerForNotificationOpened(jest.fn());
        const tokenResult = Countly.sendPushToken({ token: 'push-token' });
        const permissionResult = Countly.askForNotificationPermission('ding');
        const payload = getNativeInitPayload(nativeModule);
        const pushListeners = listeners.filter((listener) => listener.eventName.startsWith('pushNotification'));

        expect(() => receivedSubscription.remove()).not.toThrow();
        expect(() => openedSubscription.remove()).not.toThrow();
        if (pushAvailable) {
            expect(tokenResult).toBeUndefined();
            expect(permissionResult).toBeUndefined();
            expect(nativeModule.sendPushToken).toHaveBeenCalledWith(['push-token']);
            expect(nativeModule.askForNotificationPermission).toHaveBeenCalledWith(['ding']);
            expect(nativeModule.registerForNotification).toHaveBeenCalledWith([]);
            expect(nativeModule.registerForNotificationOpened).toHaveBeenCalledWith([]);
            expect(pushListeners.map((listener) => listener.eventName)).toEqual(['pushNotificationCallback', 'pushNotificationOpenedCallback']);
            expect(payload.pushNotification).toEqual({ tokenType: '1', channelName: 'Alerts', channelDescription: 'Countly alerts', accentColor: '#ffffff' });
            expect(payload.allowedIntentClassNames).toEqual(['MainActivity']);
            expect(payload.allowedIntentPackageNames).toEqual(['com.example.app']);
            expect(payload.disableAdditionalIntentRedirectionChecks).toBe(true);
        } else {
            expect(tokenResult).toBe(noPushMessage);
            expect(permissionResult).toBe(noPushMessage);
            expect(nativeModule.sendPushToken).not.toHaveBeenCalled();
            expect(nativeModule.askForNotificationPermission).not.toHaveBeenCalled();
            expect(nativeModule.registerForNotification).not.toHaveBeenCalled();
            expect(nativeModule.registerForNotificationOpened).not.toHaveBeenCalled();
            expect(pushListeners).toEqual([]);
            expect(payload.pushNotification).toBeUndefined();
            expect(payload.allowedIntentClassNames).toBeUndefined();
            expect(payload.allowedIntentPackageNames).toBeUndefined();
            expect(payload.disableAdditionalIntentRedirectionChecks).toBeUndefined();
        }
    }
});

test('registerForNotificationOpened passes the tapped notification and button index and keeps one subscription', () => {
    const firstListener = jest.fn();
    const openedListener = jest.fn();
    const { Countly, nativeModule, emit } = loadCountlyBridge({ platform: 'android' });

    const firstSubscription = Countly.registerForNotificationOpened(firstListener);
    Countly.registerForNotificationOpened(openedListener);
    emit('pushNotificationOpenedCallback', JSON.stringify({ notification: { 'c.i': 'push-1', title: 'Sale' }, actionIndex: 2 }));
    emit('pushNotificationOpenedCallback', 'not json');

    expect(nativeModule.registerForNotificationOpened).toHaveBeenCalledWith([]);
    expect(firstSubscription.remove).toHaveBeenCalledTimes(1);
    expect(firstListener).not.toHaveBeenCalled();
    expect(openedListener).toHaveBeenCalledTimes(1);
    expect(openedListener).toHaveBeenCalledWith({ 'c.i': 'push-1', title: 'Sale' }, 2);
});

test('recordMetrics returns before init without calling native code', () => {
    const { Countly, nativeModule } = loadCountlyBridge({ platform: 'android' });

    expect(Countly.recordMetrics({ os: 'android' })).toBe("'init' must be called before 'recordMetrics'");
    expect(nativeModule.recordMetrics).not.toHaveBeenCalled();
});

test('logException reports Error objects and refuses values that are neither text nor errors', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();
    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    const error = new Error('payment failed');
    error.stack = 'Error: payment failed\n    at pay (index.bundle:10:5)';
    expect(Countly.logException(error, true, { step: 'pay' })).toBeUndefined();
    expect(nativeModule.logException).toHaveBeenNthCalledWith(1, ['Error: payment failed\n    at pay (index.bundle:10:5)\n', true, 'step', 'pay']);

    const stacklessError = { name: 'TypeError', message: 'x is undefined' };
    expect(Countly.logException(stacklessError)).toBeUndefined();
    expect(nativeModule.logException).toHaveBeenNthCalledWith(2, ['TypeError: x is undefined\n', true]);

    expect(Countly.logException(42)).toBe('exception should be a text or an Error object');
    expect(Countly.logException(null)).toBe('exception should be a text or an Error object');
    expect(nativeModule.logException).toHaveBeenCalledTimes(2);
});

test('setCustomCrashSegments skips null values and refuses calls after init', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    expect(Countly.setCustomCrashSegments({ missing: null, unset: undefined, region: 'eu', retries: 2 })).toBeUndefined();
    expect(nativeModule.setCustomCrashSegments).toHaveBeenCalledWith(['region', 'eu', 'retries', '2']);

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    expect(Countly.setCustomCrashSegments({ region: 'us' })).toBe("'setCustomCrashSegments' has no effect after init, set crash segments before 'initWithConfig'");
    expect(nativeModule.setCustomCrashSegments).toHaveBeenCalledTimes(1);
});

test('user profile number operations accept whole numbers only', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge({ platform: 'android' });
    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    const operations = [
        ['incrementBy', 'userData_incrementBy', Countly.userData],
        ['multiply', 'userData_multiply', Countly.userData],
        ['saveMax', 'userData_saveMax', Countly.userData],
        ['saveMin', 'userData_saveMin', Countly.userData],
        ['incrementBy', 'userDataBulk_incrementBy', Countly.userDataBulk],
        ['multiply', 'userDataBulk_multiply', Countly.userDataBulk],
        ['saveMax', 'userDataBulk_saveMax', Countly.userDataBulk],
        ['saveMin', 'userDataBulk_saveMin', Countly.userDataBulk],
    ];

    for (const [method, nativeMethod, api] of operations) {
        await expect(api[method]('score', 2.5)).resolves.toBe('value should be a whole number between -2147483648 and 2147483647, received [2.5]');
        await expect(api[method]('score', '0.5')).resolves.toBe('value should be a whole number between -2147483648 and 2147483647, received [0.5]');
        await expect(api[method]('score', 3e9)).resolves.toBe('value should be a whole number between -2147483648 and 2147483647, received [3000000000]');
        expect(nativeModule[nativeMethod]).not.toHaveBeenCalled();

        await api[method]('score', 0);
        await api[method]('score', ' -7 ');
        expect(nativeModule[nativeMethod]).toHaveBeenNthCalledWith(1, ['score', '0']);
        expect(nativeModule[nativeMethod]).toHaveBeenNthCalledWith(2, ['score', '-7']);
    }
});

test('setEventSendThreshold accepts positive whole numbers only', () => {
    const { Countly, nativeModule } = loadCountlyBridge({ platform: 'android' });

    expect(Countly.setEventSendThreshold(10.5)).toBe('size should be a whole number between 1 and 2147483647, received [10.5]');
    expect(Countly.setEventSendThreshold(0)).toBe('size should be a whole number between 1 and 2147483647, received [0]');
    expect(Countly.setEventSendThreshold('many')).toBe('size should be a whole number between 1 and 2147483647, received [many]');
    expect(Countly.setEventSendThreshold(undefined)).toBe('size should be a whole number between 1 and 2147483647, received [undefined]');
    expect(nativeModule.setEventSendThreshold).not.toHaveBeenCalled();

    expect(Countly.setEventSendThreshold(25)).toBeUndefined();
    expect(nativeModule.setEventSendThreshold).toHaveBeenCalledWith(['25']);
});

test('giveConsent and removeConsent refuse a missing list and drop entries that are not names', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge({ platform: 'android' });
    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    expect(Countly.giveConsent()).toBe('features should be a feature name or a list of feature names');
    expect(Countly.removeConsent({ events: true })).toBe('features should be a feature name or a list of feature names');
    expect(nativeModule.giveConsent).not.toHaveBeenCalled();
    expect(nativeModule.removeConsent).not.toHaveBeenCalled();

    Countly.giveConsent(['events', 5, null, 'metrics']);
    Countly.removeConsent('views');

    expect(nativeModule.giveConsent).toHaveBeenCalledWith(['events', 'metrics']);
    expect(nativeModule.removeConsent).toHaveBeenCalledWith(['views']);
});

test('runtime attribution sends campaign data as JSON text and refuses indirect attribution that is not an object', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();
    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    Countly.recordDirectAttribution('countly', { cid: 'campaign-1', cuid: 'user-1' });
    expect(nativeModule.recordDirectAttribution).toHaveBeenCalledWith(['countly', '{"cid":"campaign-1","cuid":"user-1"}']);

    expect(Countly.recordDirectAttribution('countly', null)).toBe('direct attribution needs a campaign type and campaign data');
    expect(nativeModule.recordDirectAttribution).toHaveBeenCalledTimes(1);

    Countly.recordIndirectAttribution({ adid: 'ad-1', count: 5, skipNull: null });
    expect(nativeModule.recordIndirectAttribution).toHaveBeenCalledWith([{ adid: 'ad-1', count: '5' }]);

    expect(Countly.recordIndirectAttribution('campaign-2')).toBe('indirect attribution values must be an object of text values');
    expect(Countly.recordIndirectAttribution(null)).toBe('indirect attribution values must be an object of text values');
    expect(nativeModule.recordIndirectAttribution).toHaveBeenCalledTimes(1);
});

test('test helpers do nothing in release builds', async () => {
    const { Countly, CountlyConfig, CountlyState, nativeModule } = loadCountlyBridge();
    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await expect(Countly.test.enableRequestCapture()).resolves.toBeUndefined();
    await expect(Countly.test.getCapturedRequests()).resolves.toEqual([]);
    await expect(Countly.test.getRequestQueue()).resolves.toEqual([]);
    await expect(Countly.test.getEventQueue()).resolves.toEqual([]);
    await expect(Countly.test.halt()).resolves.toBeUndefined();

    expect(nativeModule.enableRequestCapture).not.toHaveBeenCalled();
    expect(nativeModule.getCapturedRequests).not.toHaveBeenCalled();
    expect(nativeModule.getRequestQueue).not.toHaveBeenCalled();
    expect(nativeModule.getEventQueue).not.toHaveBeenCalled();
    expect(nativeModule.halt).not.toHaveBeenCalled();
    expect(CountlyState.isInitialized).toBe(true);
});
