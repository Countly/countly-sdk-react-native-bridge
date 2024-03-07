const { intToDeviceIDType, DeviceIdType } = require("../Utils.js");

// 'intToDeviceIDType'
// 10101 is provided as input
// The function should return DeviceIdType.SDK_GENERATED
test("10101 maps to DeviceIdType.SDK_GENERATED", () => {
    expect(intToDeviceIDType(10101)).toBe(DeviceIdType.SDK_GENERATED);
});

// 'intToDeviceIDType'
// 20202 is provided as input
// The function should return DeviceIdType.DEVELOPER_SUPPLIED
test("20202 maps to DeviceIdType.DEVELOPER_SUPPLIED", () => {
    expect(intToDeviceIDType(20202)).toBe(DeviceIdType.DEVELOPER_SUPPLIED);
});

// 'intToDeviceIDType'
// 30303 is provided as input
// The function should return DeviceIdType.TEMPORARY_ID
test("30303 maps to DeviceIdType.TEMPORARY_ID", () => {
    expect(intToDeviceIDType(30303)).toBe(DeviceIdType.TEMPORARY_ID);
});

// 'intToDeviceIDType'
// An 0 is provided as input
// The function should return DeviceIdType.SDK_GENERATED
test("0 input results in DeviceIdType.SDK_GENERATED", () => {
    expect(intToDeviceIDType(0)).toBe(DeviceIdType.SDK_GENERATED);
});

// 'intToDeviceIDType'
// 1337 is provided as input
// The function should return DeviceIdType.TEMPORARY_ID
test("1337 maps to DeviceIdType.TEMPORARY_ID", () => {
    expect(intToDeviceIDType(1337)).toBe(DeviceIdType.SDK_GENERATED);
});

// 'intToDeviceIDType'
// An -1 is provided as input
// The function should return DeviceIdType.SDK_GENERATED
test("-1 input results in DeviceIdType.SDK_GENERATED", () => {
    expect(intToDeviceIDType(-1)).toBe(DeviceIdType.SDK_GENERATED);
});

// 'intToDeviceIDType'
// An empty string is provided as input
// The function should return DeviceIdType.SDK_GENERATED
test("Invalid input results in DeviceIdType.SDK_GENERATED", () => {
    expect(intToDeviceIDType("")).toBe(DeviceIdType.SDK_GENERATED);
});

// 'intToDeviceIDType'
// An 'null' is provided as input
// The function should return DeviceIdType.SDK_GENERATED
test("'null' input results in DeviceIdType.SDK_GENERATED", () => {
    expect(intToDeviceIDType(null)).toBe(DeviceIdType.SDK_GENERATED);
});

// 'intToDeviceIDType'
// An 'dsaifedos' is provided as input
// The function should return DeviceIdType.SDK_GENERATED
test("'dsaifedos' input results in DeviceIdType.SDK_GENERATED", () => {
    expect(intToDeviceIDType("dsaifedos")).toBe(DeviceIdType.SDK_GENERATED);
});

// 'intToDeviceIDType'
// An 'undefined' is provided as input
// The function should return DeviceIdType.SDK_GENERATED
test("'undefined' input results in DeviceIdType.SDK_GENERATED", () => {
    expect(intToDeviceIDType(undefined)).toBe(DeviceIdType.SDK_GENERATED);
});
