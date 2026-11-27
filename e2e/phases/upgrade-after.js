import Countly from "countly-sdk-react-native-bridge";
import CountlyConfig from "countly-sdk-react-native-bridge/CountlyConfig";

import { APP_KEY, SERVER_URL, decoded, registerPhase, report, result, sleep } from "./common";

// The second phase of the upgrade test runs with this repository's bridge, over the data the first phase left.
registerPhase(async function () {
    await Countly.initWithConfig(new CountlyConfig(SERVER_URL, APP_KEY).setLoggingEnabled(true));
    var deviceId = await Countly.deviceId.getID();
    var deviceIdType = await Countly.deviceId.getType();
    report("AFTER", { deviceId: deviceId, deviceIdType: deviceIdType });
    await sleep(3000);

    var requests = (await Countly.test.getRequestQueue()).map(decoded);
    var events = (await Countly.test.getEventQueue()).map(decoded);
    var stored = requests.concat(events);
    var eventKept = stored.some(function (entry) {
        return entry.indexOf("upgrade-test-event") >= 0;
    });
    result(
        "upgradeEventKept",
        "An event queued before the upgrade is still queued",
        eventKept,
        eventKept ? "found" : `not in the queues: ${stored.join(" | ").substring(0, 1200)}`
    );
    var propertyKept = requests.some(function (entry) {
        return entry.indexOf("upgrade_test_property") >= 0;
    });
    result(
        "upgradeUserPropertyKept",
        "A user property saved before the upgrade is still queued",
        propertyKept,
        propertyKept ? "found" : `not in the request queue: ${requests.join(" | ").substring(0, 1200)}`
    );
    report("DONE", {});
});
