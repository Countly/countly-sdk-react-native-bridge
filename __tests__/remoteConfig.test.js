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

    await expect(remoteConfig.updateForKeysOnly('theme')).resolves.toEqual({ success: false, error: 'keyNames must be an array of strings' });
    await expect(remoteConfig.updateExceptKeys(['theme', '', 7])).resolves.toEqual({ success: true, error: null });

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

    await expect(remoteConfig.update()).resolves.toEqual({ success: false, error: 'update failed' });

    expect(Logger.e).toHaveBeenCalledWith('remoteConfig.remoteConfigUpdate, update failed');
});
test.each([
    ['update', 'remoteConfigUpdate', []],
    ['updateForKeysOnly', 'updateRemoteConfigForKeysOnly', [['theme']]],
    ['updateExceptKeys', 'updateRemoteConfigExceptKeys', [['theme']]],
])('%s resolves the native success and failure as an update result', async (functionName, nativeMethodName, functionArgs) => {
    const { Logger, RemoteConfig } = loadRemoteConfig();
    const nativeMethod = jest.fn()
        .mockImplementationOnce((args, callback) => callback('Remote Config is updated and ready to use!'))
        .mockImplementationOnce((args, callback) => callback('There was an error while updating Remote Config: remote config consent is not given'));
    const remoteConfig = new RemoteConfig({
        isInitialized: true,
        CountlyReactNative: { [nativeMethodName]: nativeMethod },
    });

    await expect(remoteConfig[functionName](...functionArgs)).resolves.toEqual({ success: true, error: null });
    expect(Logger.e).not.toHaveBeenCalled();

    await expect(remoteConfig[functionName](...functionArgs)).resolves.toEqual({ success: false, error: 'remote config consent is not given' });
    expect(Logger.e).toHaveBeenCalledWith(`remoteConfig.${nativeMethodName}, There was an error while updating Remote Config: remote config consent is not given`);
    expect(nativeMethod).toHaveBeenCalledTimes(2);
});

test('update results explain why no download was started', async () => {
    const { RemoteConfig } = loadRemoteConfig();
    const nativeModule = {
        remoteConfigUpdate: jest.fn(),
        updateRemoteConfigForKeysOnly: jest.fn(),
        updateRemoteConfigExceptKeys: jest.fn(),
    };
    const state = { isInitialized: false, CountlyReactNative: nativeModule };
    const remoteConfig = new RemoteConfig(state);

    await expect(remoteConfig.update()).resolves.toEqual({ success: false, error: "'init' must be called before 'Countly.remoteConfig.update'" });
    await expect(remoteConfig.updateForKeysOnly(['theme'])).resolves.toEqual({ success: false, error: "'init' must be called before 'Countly.remoteConfig.updateForKeysOnly'" });

    state.isInitialized = true;
    await expect(remoteConfig.updateForKeysOnly([])).resolves.toEqual({ success: false, error: 'No valid keys provided' });
    await expect(remoteConfig.updateExceptKeys(['', null])).resolves.toEqual({ success: false, error: 'No valid keys provided' });
    await expect(remoteConfig.updateExceptKeys(null)).resolves.toEqual({ success: false, error: 'keyNames must be an array of strings' });

    expect(nativeModule.remoteConfigUpdate).not.toHaveBeenCalled();
    expect(nativeModule.updateRemoteConfigForKeysOnly).not.toHaveBeenCalled();
    expect(nativeModule.updateRemoteConfigExceptKeys).not.toHaveBeenCalled();
});
