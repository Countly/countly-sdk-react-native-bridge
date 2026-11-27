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

test('setListener passes every level to the listener while logging is disabled', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const Logger = loadLogger();
    const lines = [];

    Logger.initialize(false);
    Logger.setListener((message, level) => lines.push([message, level]));
    Logger.e('boom');
    Logger.w('careful');
    Logger.i('called');
    Logger.d('details');
    Logger.v('verbose');
    Logger.notifyListener('[Countly] [Info] native line', 'info');

    expect(lines).toEqual([
        ['[CountlyReactNative] boom', 'error'],
        ['[CountlyReactNative] careful', 'warning'],
        ['[CountlyReactNative] called', 'info'],
        ['[CountlyReactNative] details', 'debug'],
        ['[CountlyReactNative] verbose', 'verbose'],
        ['[Countly] [Info] native line', 'info'],
    ]);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
});

test('a throwing listener does not break logging and is reported only while logging is enabled', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    const Logger = loadLogger();
    const listener = jest.fn(() => {
        throw new Error('listener failure');
    });

    Logger.initialize(false);
    Logger.setListener(listener);
    expect(() => Logger.w('first')).not.toThrow();
    expect(errorSpy).not.toHaveBeenCalled();

    Logger.initialize(true);
    expect(() => Logger.w('second')).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith('[CountlyReactNative] second');
    expect(errorSpy).toHaveBeenCalledWith('[CountlyReactNative] [Logger] notifyListener, the log listener threw an error: Error: listener failure');
    expect(listener).toHaveBeenCalledTimes(3);
});

test('setListener with anything but a function removes the listener', () => {
    const Logger = loadLogger();
    const listener = jest.fn();

    Logger.setListener(listener);
    Logger.setListener('not a function');
    Logger.e('boom');

    expect(listener).not.toHaveBeenCalled();
});
