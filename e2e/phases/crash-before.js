import Countly from "countly-sdk-react-native-bridge";
import CountlyConfig from "countly-sdk-react-native-bridge/CountlyConfig";

import { APP_KEY, SERVER_URL, registerPhase, report } from "./common";

// The first phase of the crash test runs as a release build, where an uncaught JavaScript error ends the app, as it
// does for users.
registerPhase(async function () {
    await Countly.initWithConfig(new CountlyConfig(SERVER_URL, APP_KEY).setLoggingEnabled(true).enableCrashReporting());
    report("BEFORE", { deviceId: await Countly.deviceId.getID() });
    setTimeout(function crashTheDeviceTestApp() {
        throw new Error("Countly device test crash");
    }, 2000);
});
