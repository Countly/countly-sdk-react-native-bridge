// Importing necessary functions and constants from Utils.js
const { stringToDeviceIDType, DeviceIdType } = require("../Utils.js");

// Test case for 'SG' input, expecting DeviceIdType.SDK_GENERATED
test("'SG' returns DeviceIdType.SDK_GENERATED", () => {
    // Asserting that the function correctly maps 'SG' to SDK_GENERATED type
    expect(stringToDeviceIDType("SG")).toBe(DeviceIdType.SDK_GENERATED);
});

// Test case for 'DS' input, expecting DeviceIdType.DEVELOPER_SUPPLIED
test("'DS' returns DeviceIdType.DEVELOPER_SUPPLIED", () => {
    // Asserting that the function correctly maps 'DS' to DEVELOPER_SUPPLIED type
    expect(stringToDeviceIDType("DS")).toBe(DeviceIdType.DEVELOPER_SUPPLIED);
});

// Test case for 'TID' input, expecting DeviceIdType.TEMPORARY_ID
test("'TID' returns DeviceIdType.TEMPORARY_ID", () => {
    // Asserting that the function correctly maps 'TID' to TEMPORARY_ID type
    expect(stringToDeviceIDType("TID")).toBe(DeviceIdType.TEMPORARY_ID);
});

// Test case for invalid input, expecting null
test("Invalid input returns null", () => {
    // Asserting that an invalid input results in null, indicating an invalid input
    expect(stringToDeviceIDType("")).toBe(null);
});
