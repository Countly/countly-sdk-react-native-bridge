jest.mock('../Logger.js', () => ({
    d: jest.fn(),
    e: jest.fn(),
    w: jest.fn(),
    i: jest.fn(),
    v: jest.fn(),
}));

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

test('areEventParametersValid rejects malformed event payloads and accepts zero values', () => {
    expect(Validators.areEventParametersValid('recordEvent', 'purchase', { sku: 'sku-1' }, 0, 0)).toBe(true);
    expect(Validators.areEventParametersValid('recordEvent', '', null, null, null)).toBe(false);
    expect(Validators.areEventParametersValid('recordEvent', 'purchase', 'bad-segmentation', null, null)).toBe(false);
    expect(Validators.areEventParametersValid('recordEvent', 'purchase', null, -1, null)).toBe(false);
    expect(Validators.areEventParametersValid('recordEvent', 'purchase', null, null, '19.99')).toBe(false);

    expect(Logger.w).toHaveBeenCalled();
});