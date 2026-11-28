import React from "react";
import { AppRegistry, Text } from "react-native";

import { name as appName } from "../app.json";
import runAllScenarios from "./runner";

var started = false;

/**
 * The screen of the test app. Mounting it starts the scenario run once.
 *
 * @returns {Object} a text element
 */
function DeviceTestApp() {
    React.useEffect(function () {
        if (!started) {
            started = true;
            runAllScenarios();
        }
    }, []);
    return React.createElement(Text, { style: { marginTop: 80, textAlign: "center" } }, "Countly device tests");
}

AppRegistry.registerComponent(appName, function () {
    return DeviceTestApp;
});
