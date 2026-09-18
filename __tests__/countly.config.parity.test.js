function loadUtils() {
    jest.resetModules();

    jest.doMock('../Logger.js', () => ({
        initialize: jest.fn(),
        d: jest.fn(),
        e: jest.fn(),
        w: jest.fn(),
        i: jest.fn(),
        v: jest.fn(),
    }));
    jest.doMock('react-native/Libraries/Core/Devtools/parseErrorStack.js', () => jest.fn(), { virtual: true });

    let Logger;
    let Utils;
    let CountlyConfig;
    jest.isolateModules(() => {
        Logger = require('../Logger.js');
        Utils = require('../Utils.js');
        CountlyConfig = require('../CountlyConfig.js').default;
    });

    return { ...Utils, CountlyConfig, Logger };
}

afterEach(() => {
    jest.clearAllMocks();
});

test('the new config options are fluent and reach the native payload', () => {
    const { CountlyConfig, configToJson } = loadUtils();
    const urlHandler = jest.fn();
    const metrics = { _os: 'CustomOS', _app_version: '9.9.9' };
    const config = new CountlyConfig('https://server.count.ly', 'app-key');

    expect(config.enableClearStoredDeviceId()).toBe(config);
    expect(config.setTrackOrientationChanges(true)).toBe(config);
    expect(config.setMetricOverride(metrics)).toBe(config);
    expect(config.sdkInternalLimits.setMaxValueSizePicture(2048)).toBe(config.sdkInternalLimits);
    expect(config.content.setContentUrlHandler(urlHandler, ['myapp://', 'https://example.com/app/'])).toBe(config.content);
    expect(config.content.setOverlayCornerRadius(12)).toBe(config.content);
    expect(config.content.showWidgetsWithinApp()).toBe(config.content);

    expect(config._clearStoredDeviceIdEnabled).toBe(true);
    expect(config._trackOrientationChanges).toBe(true);
    expect(config._metricOverride).toEqual(metrics);
    expect(config.sdkInternalLimits.maxValueSizePicture).toBe(2048);
    expect(config.content.contentUrlHandler).toBe(urlHandler);
    expect(config.content.contentUrlPrefixes).toEqual(['myapp://', 'https://example.com/app/']);
    expect(config.content.overlayCornerRadius).toBe(12);
    expect(config.content.widgetsWithinAppEnabled).toBe(true);

    const json = configToJson(config);

    expect(json.clearStoredDeviceId).toBe(true);
    expect(json.trackOrientationChanges).toBe(true);
    expect(json.metricOverride).toEqual(metrics);
    expect(json.maxValueSizePicture).toBe(2048);
    expect(json.contentUrlHandler).toBe(true);
    expect(json.contentUrlPrefixes).toEqual(['myapp://', 'https://example.com/app/']);
    expect(json.overlayCornerRadius).toBe(12);
    expect(json.showWidgetsWithinApp).toBe(true);
});

test('orientation tracking travels as false, which is the value that turns it off', () => {
    const { CountlyConfig, configToJson } = loadUtils();
    const config = new CountlyConfig('https://server.count.ly', 'app-key');

    config.setTrackOrientationChanges(false);

    const json = configToJson(config);

    expect(json).toHaveProperty('trackOrientationChanges');
    expect(json.trackOrientationChanges).toBe(false);
});

test('untouched options are left out of the native payload', () => {
    const { CountlyConfig, configToJson } = loadUtils();

    const json = configToJson(new CountlyConfig('https://server.count.ly', 'app-key'));

    expect(json).not.toHaveProperty('clearStoredDeviceId');
    expect(json).not.toHaveProperty('trackOrientationChanges');
    expect(json).not.toHaveProperty('metricOverride');
    expect(json).not.toHaveProperty('maxValueSizePicture');
    expect(json).not.toHaveProperty('contentUrlHandler');
    expect(json).not.toHaveProperty('contentUrlPrefixes');
    expect(json).not.toHaveProperty('overlayCornerRadius');
    expect(json).not.toHaveProperty('showWidgetsWithinApp');
});

test('an invalid picture value size is refused and never reaches the payload', () => {
    const { CountlyConfig, configToJson } = loadUtils();
    const config = new CountlyConfig('https://server.count.ly', 'app-key');

    config.sdkInternalLimits.setMaxValueSizePicture(0);
    config.sdkInternalLimits.setMaxValueSizePicture(-10);

    expect(config.sdkInternalLimits.maxValueSizePicture).toBe(0);
    expect(configToJson(config)).not.toHaveProperty('maxValueSizePicture');
});

test('a content URL handler that can not be called is refused', () => {
    const { CountlyConfig, configToJson } = loadUtils();
    const config = new CountlyConfig('https://server.count.ly', 'app-key');

    config.content.setContentUrlHandler('not-a-function', ['myapp://']);

    expect(config.content.contentUrlHandler).toBeNull();
    expect(config.content.contentUrlPrefixes).toEqual([]);
    expect(configToJson(config)).not.toHaveProperty('contentUrlHandler');
});

test('empty content URL prefixes are dropped, so every link is handed over', () => {
    const { CountlyConfig, configToJson } = loadUtils();
    const config = new CountlyConfig('https://server.count.ly', 'app-key');

    config.content.setContentUrlHandler(jest.fn(), ['', 'myapp://']);

    expect(config.content.contentUrlPrefixes).toEqual(['myapp://']);

    config.content.setContentUrlHandler(jest.fn());

    const json = configToJson(config);

    expect(json.contentUrlHandler).toBe(true);
    expect(json.contentUrlPrefixes).toEqual([]);
});
