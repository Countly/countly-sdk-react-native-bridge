jest.mock('../Logger.js', () => ({
    d: jest.fn(),
    e: jest.fn(),
    w: jest.fn(),
    i: jest.fn(),
    v: jest.fn(),
}));

jest.mock('../CountlyFlavor.js', () => ({ PUSH_NOTIFICATIONS_AVAILABLE: true }));

const Logger = require('../Logger.js');
const Validators = require('../Validators.js');

afterEach(() => {
    jest.clearAllMocks();
});

test('user data validators accept supported values and reject unsupported ones', () => {
    expect(Validators.UserDataType(42, 'value', 'setUserData')).toBeNull();
    expect(Validators.UserDataType('42', 'value', 'setUserData')).toBeNull();
    expect(Validators.ValidUserData('', 'value', 'setUserData')).toBeNull();
    expect(Validators.ParseInt('24', 'value', 'setUserData')).toBeNull();
    expect(Validators.String('plan', 'key', 'setProperty')).toBeNull();

    expect(Validators.UserDataType({}, 'value', 'setUserData')).toContain("unsupported data type 'object'");
    expect(Validators.ValidUserData(null, 'value', 'setUserData')).toBe('value should not be null or undefined');
    expect(Validators.ParseInt('twenty-four', 'value', 'setUserData')).toContain("parseable to 'integer'");
    expect(Validators.String('', 'key', 'setProperty')).toBe('key should not be null, undefined or empty');
    expect(Validators.String(7, 'key', 'setProperty')).toContain("unsupported data type 'number'");

    expect(Logger.e).toHaveBeenCalled();
    expect(Logger.d).toHaveBeenCalled();
});

test('UserDataValue composes null, type, and parse-int validation', () => {
    expect(Validators.UserDataValue('12', 'value', 'incrementBy')).toBeNull();
    expect(Validators.UserDataValue(undefined, 'value', 'incrementBy')).toBe('value should not be null or undefined');
    expect(Validators.UserDataValue({}, 'value', 'incrementBy')).toContain("unsupported data type 'object'");
    expect(Validators.UserDataValue('abc', 'value', 'incrementBy')).toContain("parseable to 'integer'");
});

test('UserDataInteger accepts whole numbers in the 32-bit range and refuses decimals, overflow and text', () => {
    [7, -3, 0, '7', '-12', ' 42 ', 2147483647, -2147483648].forEach((value) => {
        expect(Validators.UserDataInteger(value, 'value', 'incrementBy')).toBeNull();
    });

    [2.5, '2.5', 0.5, 3e9, '3000000000', -2147483649, NaN, Infinity, '', ' ', '7abc', '0x10', true, {}, null, undefined].forEach((value) => {
        expect(Validators.UserDataInteger(value, 'value', 'incrementBy')).toEqual(expect.any(String));
    });

    expect(Validators.UserDataInteger(2.5, 'value', 'incrementBy')).toBe('value should be a whole number between -2147483648 and 2147483647, received [2.5]');
    expect(Logger.e).toHaveBeenCalledWith('incrementBy, value should be a whole number between -2147483648 and 2147483647, received [2.5]');
});

test('PushAvailable lets push calls run in the push package and refuses them in the no-push package', () => {
    const noPushMessage = "push notifications are not part of the no-push package, use 'countly-sdk-react-native-bridge' for push notifications";

    expect(Validators.PushAvailable('sendPushToken')).toBeNull();
    expect(Logger.w).not.toHaveBeenCalled();

    jest.resetModules();
    jest.doMock('../CountlyFlavor.js', () => ({ PUSH_NOTIFICATIONS_AVAILABLE: false }));
    const NoPushLogger = require('../Logger.js');
    const NoPushValidators = require('../Validators.js');

    expect(NoPushValidators.PushAvailable('sendPushToken')).toBe(noPushMessage);
    expect(NoPushLogger.w).toHaveBeenCalledWith(`sendPushToken, ${noPushMessage}`);
});

test('areEventParametersValid rejects malformed event payloads and accepts zero values', () => {
    expect(Validators.areEventParametersValid('recordEvent', 'purchase', { sku: 'sku-1' }, 0, 0)).toBe(true);
    expect(Validators.areEventParametersValid('recordEvent', '', null, null, null)).toBe(false);
    expect(Validators.areEventParametersValid('recordEvent', 'purchase', 'bad-segmentation', null, null)).toBe(false);
    expect(Validators.areEventParametersValid('recordEvent', 'purchase', null, -1, null)).toBe(false);
    expect(Validators.areEventParametersValid('recordEvent', 'purchase', null, null, '19.99')).toBe(false);

    expect(Logger.w).toHaveBeenCalled();
});