import * as L from "./Logger.js";

const DeviceIdType = {
    DEVELOPER_SUPPLIED: "DEVELOPER_SUPPLIED",
    SDK_GENERATED: "SDK_GENERATED",
    TEMPORARY_ID: "TEMPORARY_ID",
};

/**
 *
 * internal countly function that converts String to DeviceIdType.
 * @param {string} deviceIdType device id type as int
 *
 * @return {DeviceIdType || null} deviceIdType e.g DeviceIdType.DEVELOPER_SUPPLIED, DeviceIdType.TEMPORARY_ID, DeviceIdType.SDK_GENERATED.
 */
function stringToDeviceIDType(deviceIdType) {
    let result = null;
    switch (deviceIdType) {
    case "DS":
        result = DeviceIdType.DEVELOPER_SUPPLIED;
        break;
    case "TID":
        result = DeviceIdType.TEMPORARY_ID;
        break;
    case "SG":
        result = DeviceIdType.SDK_GENERATED;
        break;
    default:
        break;
    }
    if (result == null) {
        L.e("_getDeviceIdType, " + `unexpected deviceIdType [${deviceIdType}] from native side`);
        return null;
    }
    return result;
}

export { stringToDeviceIDType, DeviceIdType };
