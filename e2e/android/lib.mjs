/**
 * What the Android device test drivers share: adb calls for the test app, the CLY_E2E lines its JavaScript writes to
 * logcat, and JUnit output. Every function uses the adb on PATH, so the drivers work with an emulator and with any
 * device adb reaches.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

export const APP_ID = 'com.helloworld';
const ACTIVITY = `${APP_ID}/.MainActivity`;
const PREFIX = 'CLY_E2E ';

/** Runs adb with the given arguments and returns its output. */
export function adb(...args) {
  return execFileSync('adb', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/** Resolves after `ms` milliseconds. */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Prints the model and Android version of the device. */
export function describeDevice() {
  console.log(`device: ${adb('shell', 'getprop', 'ro.product.model')} (Android ${adb('shell', 'getprop', 'ro.build.version.release')})`);
}

/**
 * Installs the app. A fresh install also stops the app and deletes its data; otherwise the app keeps its data, as an
 * app update from a store does.
 */
export function install(apk, { fresh }) {
  console.log(adb('install', '-r', '-t', '-g', apk));
  adb('shell', 'am', 'force-stop', APP_ID);
  if (fresh) {
    adb('shell', 'pm', 'clear', APP_ID);
  }
}

/** Starts the app's main activity and waits until it is shown. */
export function launch() {
  console.log(adb('shell', 'am', 'start', '-W', '-n', ACTIVITY));
}

/** Stops the app. */
export function forceStop() {
  adb('shell', 'am', 'force-stop', APP_ID);
}

/** Whether a process of the app runs. */
export function isRunning() {
  try {
    return adb('shell', 'pidof', APP_ID) !== '';
  } catch {
    return false;
  }
}

/** Deletes the logcat buffers, so the next follower reads only new lines. */
export function clearLogcat() {
  adb('logcat', '-c');
}

/**
 * Follows logcat and calls `onMessage(kind, payload)` for every CLY_E2E line the app writes (tag ReactNativeJS), and
 * prints the lines of an app crash (tag AndroidRuntime). Returns a function that stops following.
 */
export function followMessages(onMessage) {
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
        if (line.startsWith('FATAL EXCEPTION') || line.startsWith('Process: ') || line.startsWith('Caused by') || line.includes('Exception:')) {
          console.log(`logcat: ${line}`);
        }
        continue;
      }
      const rest = line.slice(at + PREFIX.length);
      const space = rest.indexOf(' ');
      try {
        onMessage(rest.slice(0, space), JSON.parse(rest.slice(space + 1)));
      } catch {
        console.log(`logcat: unreadable ${line}`);
      }
    }
  });
  return () => logcat.kill();
}

/** Copies every StrictMode line of logcat into `file` until the returned function is called. */
export function recordStrictMode(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const out = fs.createWriteStream(file);
  const logcat = spawn('adb', ['logcat', '-v', 'raw', '-s', 'StrictMode:V'], { stdio: ['ignore', 'pipe', 'inherit'] });
  logcat.stdout.pipe(out);
  return () => logcat.kill();
}

/**
 * Waits until `done()` is true, the app process ends, or `timeoutMs` passes. Returns why it stopped waiting: "done",
 * "exited" or "timeout". The process is checked every 15 seconds, and once more two seconds after it is gone, so the
 * last lines of logcat still arrive.
 */
export async function waitFor(done, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastCheck = Date.now();
  while (Date.now() < deadline) {
    if (done()) {
      return 'done';
    }
    await sleep(1000);
    if (Date.now() - lastCheck > 15000) {
      lastCheck = Date.now();
      if (!isRunning()) {
        await sleep(2000);
        return done() ? 'done' : 'exited';
      }
    }
  }
  return 'timeout';
}

/** Escapes text for an XML attribute or text node. */
function xml(text) {
  const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' };
  return String(text ?? '').replace(/[<>&"']/g, (c) => entities[c]);
}

/**
 * Writes `cases` ({ name, time, failure, details }; an empty failure passes) as one JUnit suite and returns the number
 * of failed cases.
 */
export function writeJUnit(file, suite, cases) {
  const failures = cases.filter((c) => c.failure).length;
  const body = cases.map((c) => {
    const open = `    <testcase classname="${xml(suite)}" name="${xml(c.name)}" time="${(c.time || 0).toFixed(3)}"`;
    if (!c.failure) return `${open}/>`;
    return `${open}>\n      <failure message="${xml(c.failure)}">${xml(c.details || c.failure)}</failure>\n    </testcase>`;
  }).join('\n');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n  <testsuite name="${xml(suite)}" tests="${cases.length}" failures="${failures}">\n${body}\n  </testsuite>\n</testsuites>\n`);
  return failures;
}

/** Turns a RESULT payload into a JUnit case. */
export function resultCase(result) {
  return {
    name: result.id,
    time: (result.durationMs || 0) / 1000,
    failure: result.passed ? '' : `${result.title}: ${result.message}`,
    details: result.stack || '',
  };
}
