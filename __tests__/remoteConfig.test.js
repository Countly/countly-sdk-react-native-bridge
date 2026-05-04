function loadRemoteConfig(platform = 'ios') {
    jest.resetModules();
    jest.doMock('../Logger.js', () => ({
        d: jest.fn(),
        e: jest.fn(),
        w: jest.fn(),
        i: jest.fn(),
        v: jest.fn(),
    }));
    jest.doMock('react-native', () => ({
        Platform: { OS: platform },
    }), { virtual: true });

    let Logger;
    let RemoteConfig;
    jest.isolateModules(() => {
        Logger = require('../Logger.js');
        const module = require('../RemoteConfig.js');
        RemoteConfig = module.default || module;
    });

    return { Logger, RemoteConfig };
}

afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
});

test('getValue returns null and logs native errors', async () => {
    const { Logger, RemoteConfig } = loadRemoteConfig('android');
    const remoteConfig = new RemoteConfig({
        isInitialized: true,
        CountlyReactNative: {
            getRemoteConfigValueForKey: jest.fn(() => {
                throw new Error('fetch failed');
            }),
        },
    });

    await expect(remoteConfig.getValue('theme')).resolves.toBeNull();

    expect(Logger.e).toHaveBeenCalledWith('remoteConfig.getValue, fetch failed');
});

test('clearValues logs rejected native calls', async () => {
    const { Logger, RemoteConfig } = loadRemoteConfig();
    const remoteConfig = new RemoteConfig({
        isInitialized: true,
        CountlyReactNative: {
            remoteConfigClearValues: jest.fn().mockRejectedValue(new Error('clear failed')),
        },
    });

    await expect(remoteConfig.clearValues()).resolves.toBeUndefined();

    expect(Logger.e).toHaveBeenCalledWith('remoteConfig.clearValues, clear failed');
});

test('update helpers reject invalid key arrays and skip invalid entries', async () => {
    const { Logger, RemoteConfig } = loadRemoteConfig();
    const nativeModule = {
        updateRemoteConfigForKeysOnly: jest.fn(),
        updateRemoteConfigExceptKeys: jest.fn((args, callback) => callback({ status: 'ok' })),
    };
    const remoteConfig = new RemoteConfig({
        isInitialized: true,
        CountlyReactNative: nativeModule,
    });

    await expect(remoteConfig.updateForKeysOnly('theme')).resolves.toBeUndefined();
    await expect(remoteConfig.updateExceptKeys(['theme', '', 7])).resolves.toBeUndefined();

    expect(nativeModule.updateRemoteConfigForKeysOnly).not.toHaveBeenCalled();
    expect(nativeModule.updateRemoteConfigExceptKeys).toHaveBeenCalledWith(['theme'], expect.any(Function));
    expect(Logger.e).toHaveBeenCalledWith('remoteConfig.updateForKeysOnly, keyNames must be an array of strings');
    expect(Logger.w).toHaveBeenCalledWith('remoteConfig.updateExceptKeys, keyNames[1] should not be null, undefined or empty');
    expect(Logger.w).toHaveBeenCalledWith("remoteConfig.updateExceptKeys, skipping value for 'keyNames[2]', due to unsupported data type 'number', its data type should be 'string'");
    expect(Logger.d).toHaveBeenCalledWith('remoteConfig.updateRemoteConfigExceptKeys, completed with result: [object Object]');
});

test('update logs thrown native errors without rejecting', async () => {
    const { Logger, RemoteConfig } = loadRemoteConfig();
    const remoteConfig = new RemoteConfig({
        isInitialized: true,
        CountlyReactNative: {
            remoteConfigUpdate: jest.fn(() => {
                throw new Error('update failed');
            }),
        },
    });

    await expect(remoteConfig.update()).resolves.toBeUndefined();

    expect(Logger.e).toHaveBeenCalledWith('remoteConfig.remoteConfigUpdate, update failed');
});