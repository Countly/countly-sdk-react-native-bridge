const { stringToDeviceIDType, DeviceIdType } = require("../Utils.js");

// 'stringToDeviceIDType'
// 'SG' is provided as input
// The function should return DeviceIdType.SDK_GENERATED
test("'SG' maps to DeviceIdType.SDK_GENERATED", () => {
    expect(stringToDeviceIDType("SG")).toBe(DeviceIdType.SDK_GENERATED);
});

// 'stringToDeviceIDType'
// 'DS' is provided as input
// The function should return DeviceIdType.DEVELOPER_SUPPLIED
test("'DS' maps to DeviceIdType.DEVELOPER_SUPPLIED", () => {
    expect(stringToDeviceIDType("DS")).toBe(DeviceIdType.DEVELOPER_SUPPLIED);
});

// 'stringToDeviceIDType'
// 'TID' is provided as input
// The function should return DeviceIdType.TEMPORARY_ID
test("'TID' maps to DeviceIdType.TEMPORARY_ID", () => {
    expect(stringToDeviceIDType("TID")).toBe(DeviceIdType.TEMPORARY_ID);
});

// 'stringToDeviceIDType'
// An empty string is provided as input
// The function should return 'null', indicating an invalid input
test("Invalid input results in 'null'", () => {
    expect(stringToDeviceIDType("")).toBe(null);
});

// 'stringToDeviceIDType'
// An 'null' is provided as input
// The function should return 'null', indicating an invalid input
test("'null' input results in 'null'", () => {
    expect(stringToDeviceIDType(null)).toBe(null);
});

// 'stringToDeviceIDType'
// An 'dsaifedos' is provided as input
// The function should return 'null', indicating an invalid input
test("'dsaifedos' input results in 'null'", () => {
    expect(stringToDeviceIDType("dsaifedos")).toBe(null);
});

// 'stringToDeviceIDType'
// An 0 is provided as input
// The function should return 'null', indicating an invalid input
test("0 input results in 'null'", () => {
    expect(stringToDeviceIDType(0)).toBe(null);
});

// 'stringToDeviceIDType'
// An 'undefined' is provided as input
// The function should return 'null', indicating an invalid input
test("'undefined' input results in 'null'", () => {
    expect(stringToDeviceIDType(undefined)).toBe(null);
});
