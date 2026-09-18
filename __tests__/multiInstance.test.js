jest.mock('../Logger.js', () => ({
    initialize: jest.fn(),
    d: jest.fn(),
    e: jest.fn(),
    w: jest.fn(),
    i: jest.fn(),
    v: jest.fn(),
}));

const Logger = require('../Logger.js');
const CountlyInstanceModule = require('../lib/countly_instance.js');
const CountlyConfigModule = require('../CountlyConfig.js');
const { payloadForInstance } = require('../Utils.js');

const CountlyInstance = CountlyInstanceModule.default || CountlyInstanceModule;
const CountlyConfig = CountlyConfigModule.default || CountlyConfigModule;

function createInstance(instanceName = 'shop', nativeOverrides = {}) {
    const listeners = [];
    const eventEmitter = {
        addListener: jest.fn((eventName, handler) => {
            const subscription = { remove: jest.fn() };
            listeners.push({ eventName, handler, subscription });
            return subscription;
        }),
    };

    const nativeModule = {
        init: jest.fn().mockResolvedValue(undefined),
        isInitialized: jest.fn().mockResolvedValue(true),
        halt: jest.fn().mockResolvedValue(undefined),
        removeInstance: jest.fn().mockResolvedValue('removeInstance: success'),
        haltAllInstances: jest.fn().mockResolvedValue('haltAllInstances: success'),
        startSession: jest.fn(),
        recordEvent: jest.fn(),
        startView: jest.fn().mockResolvedValue('view-id'),
        giveAllConsent: jest.fn(),
        enterContentZone: jest.fn(),
        disableLocation: jest.fn(),
        startTrace: jest.fn(),
        addCrashLog: jest.fn(),
        recordDirectAttribution: jest.fn(),
        userData_increment: jest.fn().mockResolvedValue(undefined),
        getRequestQueue: jest.fn().mockResolvedValue([]),
        ...nativeOverrides,
    };

    return { instance: new CountlyInstance(instanceName, nativeModule, eventEmitter), nativeModule, listeners };
}

afterEach(() => {
    jest.clearAllMocks();
});

test('every call an instance makes names the instance it is for', async () => {
    const { instance, nativeModule } = createInstance('shop');

    await instance.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    instance.sessions.beginSession();
    instance.consent.giveAllConsent();
    instance.content.enterContentZone();
    instance.location.disableLocation();
    instance.apm.startTrace('checkout');
    instance.crashes.addCrashLog('added to cart');
    instance.attribution.recordDirectAttribution('countly', '{"cid":"1"}');
    await instance.userProfile.increment('visits');

    expect(instance.name).toBe('shop');
    expect(nativeModule.init).toHaveBeenCalledWith([expect.any(String)], 'shop');
    expect(nativeModule.startSession).toHaveBeenCalledWith('shop');
    expect(nativeModule.giveAllConsent).toHaveBeenCalledWith('shop');
    expect(nativeModule.enterContentZone).toHaveBeenCalledWith('shop');
    expect(nativeModule.disableLocation).toHaveBeenCalledWith('shop');
    expect(nativeModule.startTrace).toHaveBeenCalledWith(['checkout'], 'shop');
    expect(nativeModule.addCrashLog).toHaveBeenCalledWith(['added to cart'], 'shop');
    expect(nativeModule.recordDirectAttribution).toHaveBeenCalledWith(['countly', '{"cid":"1"}'], 'shop');
    expect(nativeModule.userData_increment).toHaveBeenCalledWith(['visits'], 'shop');
});

test('an instance refuses to start without a server URL or an app key', async () => {
    const { instance, nativeModule } = createInstance('shop');

    await instance.initWithConfig(new CountlyConfig('', 'app-key'));
    await instance.initWithConfig(new CountlyConfig('https://server.count.ly', ''));

    expect(nativeModule.init).not.toHaveBeenCalled();
    expect(Logger.e).toHaveBeenCalledTimes(2);
});

test('a second init on a started instance is ignored', async () => {
    const { instance, nativeModule } = createInstance('shop');
    const config = new CountlyConfig('https://server.count.ly', 'app-key');

    await instance.initWithConfig(config);
    await instance.initWithConfig(config);

    expect(nativeModule.init).toHaveBeenCalledTimes(1);
});

test('calls made before init are refused rather than reaching the native side', async () => {
    const { instance, nativeModule } = createInstance('shop');

    await instance.userProfile.increment('visits');

    expect(nativeModule.userData_increment).not.toHaveBeenCalled();
    expect(Logger.e).toHaveBeenCalledWith(expect.stringContaining('userProfile.increment'));
});

test('halt and remove end the instance and are reported back', async () => {
    const { instance, nativeModule } = createInstance('shop');
    await instance.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));

    await instance.halt();
    expect(nativeModule.halt).toHaveBeenCalledWith('shop');

    await instance.initWithConfig(new CountlyConfig('https://server.count.ly', 'app-key'));
    const removal = await instance.remove();

    expect(removal).toBe('removeInstance: success');
    expect(nativeModule.removeInstance).toHaveBeenCalledWith('shop');

    await instance.userProfile.increment('visits');
    expect(nativeModule.userData_increment).not.toHaveBeenCalled();
});

test('an instance receives the content callbacks its own configuration asked for', async () => {
    const { instance, listeners } = createInstance('shop');
    const contentCallback = jest.fn();
    const contentUrlHandler = jest.fn();

    const config = new CountlyConfig('https://server.count.ly', 'app-key');
    config.content.setGlobalContentCallback(contentCallback);
    config.content.setContentUrlHandler(contentUrlHandler, ['myapp://']);
    await instance.initWithConfig(config);

    const content = listeners.find((listener) => listener.eventName === 'globalContentCallback');
    const url = listeners.find((listener) => listener.eventName === 'contentUrlHandler');

    content.handler(JSON.stringify({ status: 'shown', data: { id: 'c1' }, instanceName: 'shop' }));
    content.handler(JSON.stringify({ status: 'shown', data: { id: 'c2' }, instanceName: '' }));
    url.handler(JSON.stringify({ url: 'myapp://cart', instanceName: 'shop' }));
    url.handler(JSON.stringify({ url: 'myapp://home', instanceName: 'other' }));

    expect(contentCallback).toHaveBeenCalledTimes(1);
    expect(contentCallback).toHaveBeenCalledWith('shown', { id: 'c1' });
    expect(contentUrlHandler).toHaveBeenCalledTimes(1);
    expect(contentUrlHandler).toHaveBeenCalledWith('myapp://cart');

    await instance.halt();
    expect(content.subscription.remove).toHaveBeenCalledTimes(1);
    expect(url.subscription.remove).toHaveBeenCalledTimes(1);
});

test('removing an instance reports it back so it is not handed out again', async () => {
    const forgotten = [];
    const listeners = [];
    const eventEmitter = { addListener: jest.fn(() => ({ remove: jest.fn() })) };
    const nativeModule = { removeInstance: jest.fn().mockResolvedValue('removeInstance: success') };
    const instance = new CountlyInstance('shop', nativeModule, eventEmitter, (name) => forgotten.push(name));

    await instance.remove();

    expect(forgotten).toEqual(['shop']);
    expect(listeners).toEqual([]);
});

test('a callback payload is only taken by the instance it was tagged with', () => {
    const shopPayload = JSON.stringify({ url: 'myapp://cart', instanceName: 'shop' });
    const defaultPayload = JSON.stringify({ url: 'myapp://home', instanceName: '' });

    expect(payloadForInstance(shopPayload, 'shop')).toEqual({ url: 'myapp://cart', instanceName: 'shop' });
    expect(payloadForInstance(shopPayload, '')).toBeNull();
    expect(payloadForInstance(defaultPayload, '')).toEqual({ url: 'myapp://home', instanceName: '' });
    expect(payloadForInstance(defaultPayload, 'shop')).toBeNull();
});

test('an untagged or unreadable callback payload belongs to the default instance only', () => {
    expect(payloadForInstance(JSON.stringify({ url: 'myapp://home' }), '')).toEqual({ url: 'myapp://home' });
    expect(payloadForInstance(JSON.stringify({ url: 'myapp://home' }), 'shop')).toBeNull();
    expect(payloadForInstance('not json', '')).toBeNull();
    expect(payloadForInstance(null, '')).toBeNull();
});
