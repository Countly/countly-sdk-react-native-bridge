import { Platform } from "react-native";

import integrationScenarios from "./testing/scenarios";

const PREFIX = "CLY_E2E";
const SCENARIO_TIMEOUT_MS = 120000;
const TEXT_LIMIT = 1500;

/**
 * Writes one line for the test driver. The Android driver reads it from logcat (tag ReactNativeJS) and the iOS test
 * reads it from the React Native log, so each line has to stay below the logcat line limit.
 *
 * @param {string} kind START, RESULT or DONE
 * @param {Object} payload the data of the line
 */
function report(kind, payload) {
    console.log(`${PREFIX} ${kind} ${JSON.stringify(payload)}`);
}

/**
 * Shortens a text to the length a log line can carry.
 *
 * @param {string} text any text
 * @returns {string} the text, cut at TEXT_LIMIT characters
 */
function clip(text) {
    var value = String(text === undefined || text === null ? "" : text);
    return value.length > TEXT_LIMIT ? `${value.substring(0, TEXT_LIMIT)}...` : value;
}

/**
 * Runs one scenario and stops waiting for it after SCENARIO_TIMEOUT_MS.
 *
 * @param {Object} scenario an integration scenario
 * @returns {Promise<Object>} the result of the scenario
 */
function runWithTimeout(scenario) {
    return new Promise(function (resolve, reject) {
        var timer = setTimeout(function () {
            reject(new Error(`The scenario did not finish in ${SCENARIO_TIMEOUT_MS / 1000} seconds.`));
        }, SCENARIO_TIMEOUT_MS);
        scenario.run().then(function (result) {
            clearTimeout(timer);
            resolve(result);
        }, function (error) {
            clearTimeout(timer);
            reject(error);
        });
    });
}

/**
 * Runs every integration scenario of the example app one after another and reports each result.
 *
 * @returns {Promise<void>} resolves after the DONE line
 */
async function runAllScenarios() {
    var passed = 0;
    var failed = 0;
    report("START", { count: integrationScenarios.length, platform: Platform.OS });
    for (var i = 0; i < integrationScenarios.length; i++) {
        var scenario = integrationScenarios[i];
        var startedAt = Date.now();
        try {
            // eslint-disable-next-line no-await-in-loop
            var result = await runWithTimeout(scenario);
            passed++;
            report("RESULT", { id: scenario.id, title: scenario.title, passed: true, durationMs: Date.now() - startedAt, message: clip(result.summary) });
        } catch (error) {
            failed++;
            var message = error instanceof Error ? error.message : String(error);
            var stack = error instanceof Error && error.stack ? error.stack : "";
            report("RESULT", { id: scenario.id, title: scenario.title, passed: false, durationMs: Date.now() - startedAt, message: clip(message), stack: clip(stack) });
        }
    }
    report("DONE", { passed: passed, failed: failed });
}

export default runAllScenarios;
