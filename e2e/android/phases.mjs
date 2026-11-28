#!/usr/bin/env node
/**
 * Runs a two-phase device test on the Android device adb is connected to, and writes the results as JUnit.
 *
 *   node e2e/android/phases.mjs <name> <before.apk> <after.apk> <junit.xml> [--before-crashes]
 *
 * Both apps are the same app (com.helloworld, signed with the same key). The first phase installs the "before" app
 * with no data and runs it until it writes its BEFORE line, then, with --before-crashes, until it crashes. The second
 * phase installs the "after" app over it, which keeps the data the first phase left, as a store update does, and runs
 * it until DONE. Each RESULT line of the second phase becomes a test case. When both phases report a device ID, one
 * more case checks that they are the same. Exits with 1 when any case failed.
 */
import {
  clearLogcat, describeDevice, followMessages, forceStop, install, launch, resultCase, waitFor,
  writeJUnit,
} from './lib.mjs';

const BEFORE_TIMEOUT_MS = 4 * 60e3;
const CRASH_TIMEOUT_MS = 60e3;
const AFTER_TIMEOUT_MS = 6 * 60e3;

const args = process.argv.slice(2);
const beforeCrashes = args.includes('--before-crashes');
const [name, beforeApk, afterApk, junitFile] = args.filter((arg) => !arg.startsWith('--'));
if (!name || !beforeApk || !afterApk || !junitFile) {
  console.error('usage: node e2e/android/phases.mjs <name> <before.apk> <after.apk> <junit.xml> [--before-crashes]');
  process.exit(2);
}

/** Runs one app until `done()` or the timeout, collecting its messages into `messages`. */
async function runPhase(apk, fresh, messages, done, timeoutMs) {
  install(apk, { fresh });
  clearLogcat();
  const stop = followMessages((kind, payload) => {
    messages.push({ kind, payload });
    if (kind === 'RESULT') {
      console.log(`${payload.passed ? 'passed' : 'FAILED'} ${payload.id}${payload.passed ? '' : `: ${payload.message}`}`);
    } else {
      console.log(`${kind} ${JSON.stringify(payload)}`);
    }
  });
  launch();
  const ended = await waitFor(() => done(messages), timeoutMs);
  stop();
  return ended;
}

/** Returns the payload of the first message of `kind`, or null. */
function first(messages, kind) {
  const message = messages.find((m) => m.kind === kind);
  return message ? message.payload : null;
}

/** Runs both phases and writes the JUnit file. */
async function main() {
  describeDevice();
  const cases = [];

  console.log(`--- ${name}: before`);
  const beforeMessages = [];
  // A crashing first app is followed until its process ends, so the crash shows in the log.
  const beforeDone = beforeCrashes ? () => false : (m) => first(m, 'BEFORE') !== null;
  const beforeEnded = await runPhase(beforeApk, true, beforeMessages, beforeDone, BEFORE_TIMEOUT_MS + (beforeCrashes ? CRASH_TIMEOUT_MS : 0));
  const before = first(beforeMessages, 'BEFORE');
  let beforeFailure = before ? '' : 'The first app never reported BEFORE.';
  if (before && beforeCrashes && beforeEnded !== 'exited') {
    beforeFailure = 'The first app was expected to crash, but its process did not end.';
  }
  const beforeError = first(beforeMessages, 'ERROR');
  if (beforeError) {
    beforeFailure = `${beforeFailure} The first app reported: ${beforeError.message}`.trim();
  }
  cases.push({ name: 'beforePhase', failure: beforeFailure });
  forceStop();

  console.log(`--- ${name}: after`);
  const afterMessages = [];
  const ended = await runPhase(afterApk, false, afterMessages, (m) => first(m, 'DONE') !== null, AFTER_TIMEOUT_MS);
  forceStop();
  for (const { kind, payload } of afterMessages) {
    if (kind === 'RESULT') {
      cases.push(resultCase(payload));
    }
  }
  const afterError = first(afterMessages, 'ERROR');
  const afterProblems = [];
  if (afterError) afterProblems.push(`The second app reported: ${afterError.message}`);
  if (!first(afterMessages, 'DONE')) afterProblems.push(`The second app did not report DONE (${ended}).`);
  cases.push({ name: 'afterPhase', failure: afterProblems.join(' ') });

  const after = first(afterMessages, 'AFTER');
  if (before && before.deviceId !== undefined && after && after.deviceId !== undefined) {
    const kept = before.deviceId === after.deviceId && before.deviceIdType === after.deviceIdType;
    cases.push({
      name: 'deviceIdKept',
      failure: kept ? '' : `The device ID was ${before.deviceId} (${before.deviceIdType}) before and ${after.deviceId} (${after.deviceIdType}) after.`,
    });
  }

  const failures = writeJUnit(junitFile, name, cases);
  console.log(`${name}: ${cases.length} test cases, ${failures} failed; JUnit at ${junitFile}`);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
