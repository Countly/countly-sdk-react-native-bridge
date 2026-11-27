import Countly from "countly-sdk-react-native-bridge";
import CountlyConfig from "countly-sdk-react-native-bridge/CountlyConfig";

import { APP_KEY, SERVER_URL, registerPhase, report, requestParameter, result, sleep } from "./common";

// The second phase of the crash test starts the app again and looks for the crash the first phase recorded.
registerPhase(async function () {
    await Countly.initWithConfig(new CountlyConfig(SERVER_URL, APP_KEY).setLoggingEnabled(true).enableCrashReporting());
    await sleep(3000);
    var crashes = (await Countly.test.getRequestQueue())
        .map(function (request) {
            return requestParameter(request, "crash");
        })
        .filter(function (crash) {
            return crash !== null;
        });
    result(
        "crashRecordedOnce",
        "The crash is queued once",
        crashes.length === 1,
        `${crashes.length} crash request(s): ${crashes.join(" | ").substring(0, 1200)}`
    );

    var crash = {};
    try {
        crash = JSON.parse(crashes[0] || "{}");
    } catch (error) {
        crash = {};
    }
    var text = JSON.stringify(crash);
    result(
        "crashHasTheError",
        "The crash carries the error message",
        text.indexOf("Countly device test crash") >= 0,
        text.substring(0, 1200)
    );
    result("crashIsFatal", "The crash is recorded as fatal", String(crash._nonfatal) === "false", `_nonfatal: ${crash._nonfatal}`);
    var stackLines = String(crash._error || "").split("\n").length;
    result("crashHasTheStack", "The crash carries the JavaScript stack", stackLines > 1, `_error has ${stackLines} line(s)`);
    report("DONE", {});
});
