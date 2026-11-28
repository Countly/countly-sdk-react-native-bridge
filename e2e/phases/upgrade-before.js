import Countly from "countly-sdk-react-native-bridge";
import CountlyConfig from "countly-sdk-react-native-bridge/CountlyConfig";

import { APP_KEY, SERVER_URL, registerPhase, report, sleep } from "./common";

// The first phase of the upgrade test runs with the published bridge it upgrades from, so it uses only calls that
// version has. It leaves an event and a user property in the queues, as the server cannot be reached.
registerPhase(async function () {
    await Countly.initWithConfig(new CountlyConfig(SERVER_URL, APP_KEY).setLoggingEnabled(true));
    Countly.events.recordEvent("upgrade-test-event", { phase: "before" }, 1);
    await Countly.userDataBulk.setUserProperties({ upgrade_test_property: "kept" });
    await Countly.userDataBulk.save();
    var deviceId = await Countly.deviceId.getID();
    var deviceIdType = await Countly.deviceId.getType();
    await sleep(5000);
    report("BEFORE", { deviceId: deviceId, deviceIdType: deviceIdType });
});
