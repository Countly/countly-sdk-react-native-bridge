function loadLogger() {
    jest.resetModules();

    let Logger;
    jest.isolateModules(() => {
        Logger = require('../Logger.js');
    });

    return Logger;
}

afterEach(() => {
    jest.restoreAllMocks();
});

test('initialize(true) enables prefixed logging across levels', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const Logger = loadLogger();

    Logger.initialize(true);
    Logger.e('boom');
    Logger.w('careful');
    Logger.i('called');
    Logger.d('details');
    Logger.v('verbose');

    expect(infoSpy).toHaveBeenNthCalledWith(1, '[CountlyReactNative] [Logger] initializing the module');
    expect(errorSpy).toHaveBeenCalledWith('[CountlyReactNative] boom');
    expect(warnSpy).toHaveBeenCalledWith('[CountlyReactNative] careful');
    expect(infoSpy).toHaveBeenNthCalledWith(2, '[CountlyReactNative] called');
    expect(debugSpy).toHaveBeenCalledWith('[CountlyReactNative] details');
    expect(logSpy).toHaveBeenCalledWith('[VERBOSE][CountlyReactNative] verbose');
});

test('initialize(false) disables logger output', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const Logger = loadLogger();

    Logger.initialize(false);
    Logger.e('boom');
    Logger.w('careful');
    Logger.i('called');
    Logger.d('details');
    Logger.v('verbose');

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
});