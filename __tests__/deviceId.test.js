jest.mock('../Logger.js', () => ({
    d: jest.fn(),
    e: jest.fn(),
    w: jest.fn(),
    i: jest.fn(),
    v: jest.fn(),
}));

jest.mock('../Utils.js', () => ({
    intToDeviceIDType: jest.fn(() => 'DEVELOPER_SUPPLIED'),
}));

const Logger = require('../Logger.js');
const Utils = require('../Utils.js');
const DeviceIdModule = require('../DeviceId.js');

const DeviceId = DeviceIdModule.default || DeviceIdModule;

function createDeviceId(isInitialized = true, overrides = {}) {
    const nativeModule = {
        getCurrentDeviceId: jest.fn().mockResolvedValue('device-1'),
        getDeviceIDType: jest.fn().mockResolvedValue(20202),
        setID: jest.fn(),
        changeDeviceId: jest.fn(),
        ...overrides,
    };

    return {
        deviceId: new DeviceId({ isInitialized, CountlyReactNative: nativeModule }),
        nativeModule,
    };
}

afterEach(() => {
    jest.clearAllMocks();
});

test('getID and getType return null before init and do not hit native code', async () => {
    const { deviceId, nativeModule } = createDeviceId(false);

    await expect(deviceId.getID()).resolves.toBeNull();
    await expect(deviceId.getType()).resolves.toBeNull();

    deviceId.setID('device-2');
    deviceId.changeID('device-3', true);

    expect(nativeModule.getCurrentDeviceId).not.toHaveBeenCalled();
    expect(nativeModule.getDeviceIDType).not.toHaveBeenCalled();
    expect(nativeModule.setID).not.toHaveBeenCalled();
    expect(nativeModule.changeDeviceId).not.toHaveBeenCalled();
    expect(Logger.w).toHaveBeenCalled();
});

test('getID and getType forward native values when initialized', async () => {
    const { deviceId, nativeModule } = createDeviceId(true);

    await expect(deviceId.getID()).resolves.toBe('device-1');
    await expect(deviceId.getType()).resolves.toBe('DEVELOPER_SUPPLIED');

    expect(nativeModule.getCurrentDeviceId).toHaveBeenCalledTimes(1);
    expect(nativeModule.getDeviceIDType).toHaveBeenCalledTimes(1);
    expect(Utils.intToDeviceIDType).toHaveBeenCalledWith(20202);
});

test('setID and changeID validate input before forwarding normalized payloads', () => {
    const { deviceId, nativeModule } = createDeviceId(true);

    deviceId.setID('device-2');
    deviceId.setID('');
    deviceId.changeID('device-3', true);
    deviceId.changeID('device-4', 'merge');
    deviceId.changeID('', false);

    expect(nativeModule.setID).toHaveBeenCalledWith('device-2');
    expect(nativeModule.changeDeviceId).toHaveBeenCalledWith(['device-3', '1']);
    expect(nativeModule.changeDeviceId).toHaveBeenCalledTimes(1);
    expect(Logger.w).toHaveBeenCalled();
});