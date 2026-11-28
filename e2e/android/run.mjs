#!/usr/bin/env node
/**
 * Runs the React Native device tests on the Android device adb is connected to, and writes the results as JUnit.
 *
 *   node e2e/android/run.mjs <apk> <scenarios.json> <junit.xml> [strictmode.log]
 *
 * Installs the test app, clears its data, starts it, and follows the CLY_E2E lines the app writes to logcat until the
 * DONE line, the app process ends, or 25 minutes pass. Each scenario in scenarios.json becomes one test case; one more
 * case checks that the whole run finished. With a fourth argument, every StrictMode line of the run goes into that file
 * for e2e/android/strictmode_audit.py. Exits with 1 when any case failed.
 */
import fs from 'node:fs';
import {
  clearLogcat, describeDevice, followMessages, forceStop, install, launch, recordStrictMode, resultCase, waitFor,
  writeJUnit,
} from './lib.mjs';

const RUN_TIMEOUT_MS = 25 * 60e3;

const [apk, scenarioFile, junitFile, strictModeFile] = process.argv.slice(2);
if (!apk || !scenarioFile || !junitFile) {
  console.error('usage: node e2e/android/run.mjs <apk> <scenarios.json> <junit.xml> [strictmode.log]');
  process.exit(2);
}

/** Installs and starts the test app, follows its results and writes the JUnit file. */
async function main() {
  const expected = JSON.parse(fs.readFileSync(scenarioFile, 'utf8'));
  describeDevice();
  install(apk, { fresh: true });
  clearLogcat();

  const results = new Map();
  let start = null;
  let done = null;
  const stopFollowing = followMessages((kind, payload) => {
    if (kind === 'START') {
      start = payload;
    } else if (kind === 'DONE') {
      done = payload;
    } else if (kind === 'RESULT') {
      results.set(payload.id, payload);
      console.log(`${payload.passed ? 'passed' : 'FAILED'} ${payload.id} (${payload.durationMs} ms)${payload.passed ? '' : `: ${payload.message}`}`);
    }
  });
  const stopRecording = strictModeFile ? recordStrictMode(strictModeFile) : () => {};

  launch();
  const ended = await waitFor(() => done !== null, RUN_TIMEOUT_MS);
  if (ended !== 'done') {
    console.log(ended === 'exited' ? 'The test app process ended before DONE.' : 'The test app did not finish in time.');
  }
  stopFollowing();
  stopRecording();
  forceStop();

  const problems = [];
  if (!start) problems.push('The test app never reported START: it did not load the bundle or it crashed.');
  if (!done) problems.push(`The test app did not report DONE. Scenarios with a result: ${[...results.keys()].join(', ') || 'none'}.`);
  const cases = [{ name: 'allScenariosFinished', failure: problems.join(' ') }];
  for (const id of expected) {
    cases.push(results.has(id) ? resultCase(results.get(id)) : { name: id, failure: `${id} reported no result.` });
  }
  const failures = writeJUnit(junitFile, 'CountlyDeviceTests', cases);
  console.log(`${expected.length} scenarios, ${results.size} reported, ${failures} failed test cases; JUnit at ${junitFile}`);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
