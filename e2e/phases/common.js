import React from "react";
import { AppRegistry, Text } from "react-native";

import { name as appName } from "../app.json";

const SERVER_URL = "https://device-tests.invalid";
const APP_KEY = "device-tests-app-key";

/**
 * Writes one line for e2e/android/phases.mjs, which reads it from logcat (tag ReactNativeJS).
 *
 * @param {string} kind BEFORE, AFTER, RESULT, ERROR or DONE
 * @param {Object} payload the data of the line
 */
function report(kind, payload) {
    console.log(`CLY_E2E ${kind} ${JSON.stringify(payload)}`);
}

/**
 * Writes a RESULT line.
 *
 * @param {string} id the test case name
 * @param {string} title what the case checks
 * @param {boolean} passed whether it passed
 * @param {string} message what was found
 */
function result(id, title, passed, message) {
    report("RESULT", { id: id, title: title, passed: passed, durationMs: 0, message: message });
}

/**
 * Resolves after the given time.
 *
 * @param {number} ms milliseconds to wait
 * @returns {Promise<void>} resolves after ms
 */
function sleep(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

/**
 * Returns one parameter of a queued request, decoded, or null.
 *
 * @param {string} request a request of the native queue, as "a=1&b=2"
 * @param {string} name the parameter name
 * @returns {string|null} the decoded value
 */
function requestParameter(request, name) {
    var parts = String(request).split("&");
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].indexOf(`${name}=`) === 0) {
            var value = parts[i].substring(name.length + 1);
            try {
                return decodeURIComponent(value.replace(/\+/g, " "));
            } catch (error) {
                return value;
            }
        }
    }
    return null;
}

/**
 * Decodes a queued request for a text search, or returns it unchanged when it is not valid percent-encoding.
 *
 * @param {string} entry a request or event of the native queues
 * @returns {string} the decoded text
 */
function decoded(entry) {
    try {
        return decodeURIComponent(String(entry).replace(/\+/g, " "));
    } catch (error) {
        return String(entry);
    }
}

/**
 * Registers the app's root component, which runs the phase once it is shown and reports an error the phase throws.
 *
 * @param {Function} run the phase, an async function
 */
function registerPhase(run) {
    var started = false;

    /**
     * The screen of the test app.
     *
     * @returns {Object} a text element
     */
    function PhaseApp() {
        React.useEffect(function () {
            if (!started) {
                started = true;
                run().catch(function (error) {
                    report("ERROR", { message: error instanceof Error ? `${error.message}\n${error.stack}` : String(error) });
                });
            }
        }, []);
        return React.createElement(Text, { style: { marginTop: 80, textAlign: "center" } }, "Countly device test phase");
    }

    AppRegistry.registerComponent(appName, function () {
        return PhaseApp;
    });
}

export { APP_KEY, SERVER_URL, decoded, registerPhase, report, requestParameter, result, sleep };
