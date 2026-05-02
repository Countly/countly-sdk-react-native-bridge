function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

function createNativeModuleMock(overrides = {}) {
    return {
        init: jest.fn().mockResolvedValue(undefined),
        isInitialized: jest.fn().mockResolvedValue(false),
        recordView: jest.fn(),
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
        presentFeedbackWidget: jest.fn(),
        enterContentZone: jest.fn(),
        refreshContentZone: jest.fn(),
        previewContent: jest.fn(),
        exitContentZone: jest.fn(),
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

test('session, device, and content bridge calls keep their caller order', async () => {
    const { Countly, CountlyConfig, nativeModule } = loadCountlyBridge();

    await Countly.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key').enableManualSessionControl());

    Countly.giveConsent(['sessions', 'events']);
    Countly.startSession();
    Countly.updateSession();
    Countly.endSession();
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
