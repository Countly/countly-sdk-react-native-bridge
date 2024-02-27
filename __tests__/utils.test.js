const { stringToDeviceIDType, DeviceIdType } = require("../UtilsCrash.js");

test("'SG' returns DeviceIdType.SDK_GENERATED", () => {
    expect(stringToDeviceIDType("SG")).toBe(DeviceIdType.SDK_GENERATED);
});

test("'DS' returns DeviceIdType.DEVELOPER_SUPPLIED", () => {
    expect(stringToDeviceIDType("DS")).toBe(DeviceIdType.DEVELOPER_SUPPLIED);
});

test("'TID' returns DeviceIdType.TEMPORARY_ID", () => {
    expect(stringToDeviceIDType("TID")).toBe(DeviceIdType.TEMPORARY_ID);
});

test("Invalid input returns null", () => {
    expect(stringToDeviceIDType("")).toBe(null);
});