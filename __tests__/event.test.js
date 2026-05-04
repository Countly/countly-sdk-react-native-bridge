jest.mock('../Logger.js', () => ({
    d: jest.fn(),
    e: jest.fn(),
    w: jest.fn(),
    i: jest.fn(),
    v: jest.fn(),
}));

jest.mock('../Validators.js', () => ({
    areEventParametersValid: jest.fn(() => true),
}));

const Validate = require('../Validators.js');
const EventModule = require('../Event.js');

const Event = EventModule.default || EventModule;

function createEvent(isInitialized = true) {
    const nativeModule = {
        recordEvent: jest.fn(),
        startEvent: jest.fn(),
        cancelEvent: jest.fn(),
        endEvent: jest.fn(),
    };

    return {
        event: new Event({ isInitialized, CountlyReactNative: nativeModule }),
        nativeModule,
    };
}

afterEach(() => {
    jest.clearAllMocks();
    Validate.areEventParametersValid.mockReturnValue(true);
});

test('recordEvent and timed-event helpers forward expected payloads', () => {
    const { event, nativeModule } = createEvent(true);

    event.recordEvent('purchase');
    event.recordEvent('upgrade', { tier: 'pro' }, 2, 19.99);
    event.startEvent('checkout');
    event.cancelEvent('checkout');
    event.endEvent('checkout', { step: 'payment' }, 1, 0);

    expect(nativeModule.recordEvent).toHaveBeenNthCalledWith(1, { n: 'purchase', c: 1, s: 0 });
    expect(nativeModule.recordEvent).toHaveBeenNthCalledWith(2, { n: 'upgrade', c: 2, s: 19.99, g: ['tier', 'pro'] });
    expect(nativeModule.startEvent).toHaveBeenCalledWith(['checkout']);
    expect(nativeModule.cancelEvent).toHaveBeenCalledWith(['checkout']);
    expect(nativeModule.endEvent).toHaveBeenCalledWith({ n: 'checkout', c: 1, s: 0, g: ['step', 'payment'] });
});

test('event helpers do nothing before init', () => {
    const { event, nativeModule } = createEvent(false);

    event.recordEvent('purchase');
    event.startEvent('checkout');
    event.cancelEvent('checkout');
    event.endEvent('checkout');

    expect(nativeModule.recordEvent).not.toHaveBeenCalled();
    expect(nativeModule.startEvent).not.toHaveBeenCalled();
    expect(nativeModule.cancelEvent).not.toHaveBeenCalled();
    expect(nativeModule.endEvent).not.toHaveBeenCalled();
});

test('event helpers stop when validation fails', () => {
    const { event, nativeModule } = createEvent(true);

    Validate.areEventParametersValid.mockReturnValue(false);

    event.recordEvent('purchase');
    event.startEvent('checkout');
    event.cancelEvent('checkout');
    event.endEvent('checkout');

    expect(nativeModule.recordEvent).not.toHaveBeenCalled();
    expect(nativeModule.startEvent).not.toHaveBeenCalled();
    expect(nativeModule.cancelEvent).not.toHaveBeenCalled();
    expect(nativeModule.endEvent).not.toHaveBeenCalled();
});