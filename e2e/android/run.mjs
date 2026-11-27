#!/usr/bin/env node
/**
 * Runs the React Native device tests on the Android device adb is connected to, and writes the results as JUnit.
 *
 *   node e2e/android/run.mjs <apk> <scenarios.json> <junit.xml>
 *
 * Installs the test app, clears its data, starts it, and follows the CLY_E2E lines the app writes to logcat (tag
 * ReactNativeJS) until the DONE line, the app process ends, or 25 minutes pass. Each scenario in scenarios.json
 * becomes one test case; one more case checks that the whole run finished. Exits with 1 when any case failed.
 * Uses the adb on PATH, so it works with an emulator and with the device farm's adb tunnel alike.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

const APP_ID = 'com.helloworld';
const ACTIVITY = `${APP_ID}/.MainActivity`;
const RUN_TIMEOUT_MS = 25 * 60e3;
const PROCESS_CHECK_MS = 15e3;
const PREFIX = 'CLY_E2E ';

const [apk, scenarioFile, junitFile] = process.argv.slice(2);
if (!apk || !scenarioFile || !junitFile) {
  console.error('usage: node e2e/android/run.mjs <apk> <scenarios.json> <junit.xml>');
  process.exit(2);
}

/** Runs adb with the given arguments and returns its output. */
function adb(...args) {
  return execFileSync('adb', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/** Escapes text for an XML attribute or text node. */
function xml(text) {
  const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' };
  return String(text ?? '').replace(/[<>&"']/g, (c) => entities[c]);
}

/** Writes the JUnit file: the run check first, then one case per expected scenario. Returns the failed case count. */
function writeJUnit(expected, results, start, done) {
  const cases = [];
  const runProblems = [];
  if (!start) runProblems.push('The test app never reported START: it did not load the bundle or it crashed.');
  if (!done) runProblems.push(`The test app did not report DONE. Scenarios with a result: ${[...results.keys()].join(', ') || 'none'}.`);
  cases.push({ name: 'allScenariosFinished', time: 0, failure: runProblems.join(' ') });
  for (const id of expected) {
    const result = results.get(id);
    if (!result) {
      cases.push({ name: id, time: 0, failure: `${id} reported no result.` });
    } else {
      cases.push({
        name: id,
        time: (result.durationMs || 0) / 1000,
        failure: result.passed ? '' : `${result.title}: ${result.message}`,
        details: result.stack || '',
      });
    }
  }
  const failures = cases.filter((c) => c.failure).length;
  const body = cases.map((c) => {
    const open = `    <testcase classname="CountlyDeviceTests" name="${xml(c.name)}" time="${c.time.toFixed(3)}"`;
    if (!c.failure) return `${open}/>`;
    return `${open}>\n      <failure message="${xml(c.failure)}">${xml(c.details || c.failure)}</failure>\n    </testcase>`;
  }).join('\n');
  fs.mkdirSync(path.dirname(junitFile), { recursive: true });
  fs.writeFileSync(junitFile, `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n  <testsuite name="CountlyDeviceTests" tests="${cases.length}" failures="${failures}">\n${body}\n  </testsuite>\n</testsuites>\n`);
  return failures;
}

/** Installs and starts the test app, follows its results and writes the JUnit file. */
async function main() {
  const expected = JSON.parse(fs.readFileSync(scenarioFile, 'utf8'));
  console.log(`device: ${adb('shell', 'getprop', 'ro.product.model')} (Android ${adb('shell', 'getprop', 'ro.build.version.release')})`);
  console.log(adb('install', '-r', '-t', '-g', apk));
  adb('shell', 'am', 'force-stop', APP_ID);
  adb('shell', 'pm', 'clear', APP_ID);
  adb('logcat', '-c');

  const results = new Map();
  let start = null;
  let done = null;
  const logcat = spawn('adb', ['logcat', '-v', 'raw', '-s', 'ReactNativeJS:V', 'AndroidRuntime:E'], { stdio: ['ignore', 'pipe', 'inherit'] });
  let buffered = '';
  logcat.stdout.setEncoding('utf8');
  logcat.stdout.on('data', (chunk) => {
    buffered += chunk;
    const lines = buffered.split('\n');
    buffered = lines.pop();
    for (const raw of lines) {
      const line = raw.trim();
      const at = line.indexOf(PREFIX);
      if (at < 0) {
        if (line.startsWith('FATAL EXCEPTION') || line.startsWith('Process: ') || line.startsWith('Caused by')) console.log(`logcat: ${line}`);
        continue;
      }
      const rest = line.slice(at + PREFIX.length);
      const space = rest.indexOf(' ');
      let payload;
      try {
        payload = JSON.parse(rest.slice(space + 1));
      } catch {
        continue;
      }
      const kind = rest.slice(0, space);
      if (kind === 'START') {
        start = payload;
      } else if (kind === 'DONE') {
        done = payload;
      } else if (kind === 'RESULT') {
        results.set(payload.id, payload);
        console.log(`${payload.passed ? 'passed' : 'FAILED'} ${payload.id} (${payload.durationMs} ms)${payload.passed ? '' : `: ${payload.message}`}`);
      }
    }
  });

  console.log(adb('shell', 'am', 'start', '-W', '-n', ACTIVITY));
  const deadline = Date.now() + RUN_TIMEOUT_MS;
  let lastCheck = Date.now();
  while (!done && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1000));
    if (Date.now() - lastCheck > PROCESS_CHECK_MS) {
      lastCheck = Date.now();
      let pid = '';
      try {
        pid = adb('shell', 'pidof', APP_ID);
      } catch {
        pid = '';
      }
      if (!pid) {
        console.log('The test app process ended before DONE.');
        await new Promise((r) => setTimeout(r, 2000));
        break;
      }
    }
  }
  logcat.kill();
  adb('shell', 'am', 'force-stop', APP_ID);
  const failures = writeJUnit(expected, results, start, done);
  console.log(`${expected.length} scenarios, ${results.size} reported, ${failures} failed test cases; JUnit at ${junitFile}`);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
