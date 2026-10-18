#!/usr/bin/env node
/**
 * Generates the no-push package (countly-sdk-react-native-bridge-np) from this repository.
 *
 * Usage: node scripts/generate-no-push.js <output-directory>
 *
 * The output directory must be missing or empty. The script copies every file git knows about (tracked, or new and
 * not ignored), removes the push notification parts and renames the package. Every change must apply: when a change
 * finds nothing to edit, the script stops with an error, so the no-push package never keeps push code silently.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PACKAGE_NAME = "countly-sdk-react-native-bridge";
const NO_PUSH_PACKAGE_NAME = "countly-sdk-react-native-bridge-np";

const NO_PUSH_TOKEN_FETCHER = `package ly.count.android.sdk.react;

import android.content.Context;

/**
 * The no-push package has no push notifications, so it never requests a push token.
 */
final class CountlyPushTokenFetcher {

    private CountlyPushTokenFetcher() {
    }

    /**
     * Does nothing, as the no-push package does not depend on Firebase.
     *
     * @param context any context of the app
     */
    static void fetchToken(Context context) {
        CountlyReactNativeImpl.log("askForNotificationPermission, push notifications are not part of the no-push package, ignoring the call", CountlyReactNativeImpl.LogLevel.WARNING);
    }
}
`;

const NO_PUSH_CHANGELOG_START = `## 24.4.0-np
* This flavor is a "no Push Notification" variant of the Countly React Native SDK branched from the same version.
* All FCM related code is removed.
* All Push Notification related methods would be ignored.

* The underlying Android SDK version is 24.4.0
* The underlying iOS SDK version is 24.4.0
`;

const DELETED_FILES = [
    "scripts/generate-no-push.js",
    "android/src/main/java/ly/count/android/sdk/react/CountlyMessagingService.java",
    "ios/src/CountlyRNPushNotifications.h",
    "ios/src/CountlyRNPushNotifications.m",
];

const REPLACED_FILES = {
    "android/src/main/java/ly/count/android/sdk/react/CountlyPushTokenFetcher.java": NO_PUSH_TOKEN_FETCHER,
};

const PUSH_DECLARATIONS = [
    "\n    export function disablePushNotifications(",
    "\n    export function sendPushToken(",
    "\n    export function askForNotificationPermission(",
    "\n    export function registerForNotification(",
    "\n    export function registerForNotificationOpened(",
    "\n    disableAdditionalIntentRedirectionChecks(",
    "\n    setPushTokenType(",
    "\n    setPushNotificationChannelInformation(",
    "\n    setPushNotificationAccentColor(",
    "\n    configureIntentRedirectionCheck(",
];

/**
 * Creates a change that replaces a text, failing unless the text occurs exactly the expected number of times.
 *
 * @param {string | RegExp} from - text or global pattern to replace
 * @param {string} to - replacement
 * @param {number} expectedCount - how many times it must occur
 * @return {function(string, string): string} the change
 */
function replace(from, to, expectedCount = 1) {
    return (text, file) => {
        const count = typeof from === "string" ? text.split(from).length - 1 : (text.match(from) || []).length;
        if (count !== expectedCount) {
            throw new Error(`${file}: expected ${expectedCount} match(es) of ${String(from)}, found ${count}`);
        }
        return typeof from === "string" ? text.split(from).join(to) : text.replace(from, to);
    };
}

/**
 * Creates a change that removes everything from a heading to the end of the file.
 *
 * @param {string} heading - first line that is removed
 * @return {function(string, string): string} the change
 */
function cutFrom(heading) {
    return (text, file) => {
        const index = text.indexOf(heading);
        if (index < 0) {
            throw new Error(`${file}: '${heading.trim()}' not found`);
        }
        return text.slice(0, index);
    };
}

/**
 * Marks the type declaration of a push call as deprecated in its JSDoc block.
 *
 * @param {string} declarationStart - unique text the declaration starts with
 * @return {function(string, string): string} the change
 */
function deprecate(declarationStart) {
    return (text, file) => {
        const index = text.indexOf(declarationStart);
        if (index < 0 || text.indexOf(declarationStart, index + 1) >= 0) {
            throw new Error(`${file}: expected one declaration starting with '${declarationStart.trim()}'`);
        }
        const docStart = text.lastIndexOf("/**", index);
        const docEnd = text.lastIndexOf("*/", index);
        if (docStart < 0 || docEnd < docStart) {
            throw new Error(`${file}: no JSDoc block before '${declarationStart.trim()}'`);
        }
        const indent = text.slice(text.lastIndexOf("\n", docStart) + 1, docStart);
        return `${text.slice(0, docStart + 3)}\n${indent} * @deprecated FOR PUSH VERSION ONLY${text.slice(docStart + 3)}`;
    };
}

/**
 * Adds "-np" to every version heading and replaces the history before the first no-push release with its start note.
 *
 * @param {string} text - CHANGELOG.md content
 * @return {string} the no-push CHANGELOG
 */
function noPushChangelog(text) {
    const firstNoPushRelease = "\n## 24.4.0\n";
    const index = text.indexOf(firstNoPushRelease);
    if (index < 0) {
        throw new Error("CHANGELOG.md: '## 24.4.0' heading not found");
    }
    const kept = text.slice(0, index + 1);
    if (!/^## \S+$/m.test(kept)) {
        throw new Error("CHANGELOG.md: no version headings before '## 24.4.0'");
    }
    return kept.replace(/^## (\S+)$/gm, "## $1-np") + NO_PUSH_CHANGELOG_START;
}

const FILE_CHANGES = {
    "CountlyFlavor.js": [replace("const PUSH_NOTIFICATIONS_AVAILABLE = true;", "const PUSH_NOTIFICATIONS_AVAILABLE = false;")],
    "package.json": [
        replace(`"name": "${PACKAGE_NAME}",`, `"name": "${NO_PUSH_PACKAGE_NAME}",`),
        replace("mobile analytics and push notifications platform.", "mobile analytics platform."),
    ],
    "package-lock.json": [replace(`"name": "${PACKAGE_NAME}",`, `"name": "${NO_PUSH_PACKAGE_NAME}",`, 2)],
    "README.md": [
        replace("# Countly React Native Bridge SDK\n", "# Countly React Native Bridge SDK - No Push\n"),
        replace("* [Push Notifications](https://support.count.ly/hc/en-us/articles/4405405459225-Push-Notifications)\n", ""),
    ],
    "CHANGELOG.md": [noPushChangelog],
    "Countly.d.ts": [replace(`"${PACKAGE_NAME}`, `"${NO_PUSH_PACKAGE_NAME}`, 3), ...PUSH_DECLARATIONS.map(deprecate)],
    "CountlyReactNative.podspec": [
        replace("    core.dependency 'React'\n", "    core.pod_target_xcconfig = { 'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) COUNTLY_EXCLUDE_PUSHNOTIFICATIONS=1' }\n    core.dependency 'React'\n"),
        replace(/\n\n {2}s\.subspec 'NotificationService' do \|ns\|\n(?: {4}[^\n]*\n)+ {2}end\n/g, "\n"),
    ],
    "android/build.gradle": [replace(/\n\n *\/\/[^\n]*\n *implementation platform\('com\.google\.firebase:firebase-bom:[^']+'\)\n *implementation "com\.google\.firebase:firebase-messaging"\n/g, "\n")],
    "android/src/main/AndroidManifest.xml": [
        replace('    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>\n', ""),
        replace('    <uses-permission android:name="${applicationId}.CountlyPush.BROADCAST_PERMISSION" />\n', ""),
        replace('    <uses-permission android:name="android.permission.BROADCAST_CLOSE_SYSTEM_DIALOGS" android:maxSdkVersion="30" />\n', ""),
        replace('    <permission android:name="${applicationId}.CountlyPush.BROADCAST_PERMISSION"\n        android:protectionLevel="signature" />\n', ""),
        replace(/ {4}<application>\n {8}<service android:name="ly\.count\.android\.sdk\.react\.CountlyMessagingService"[\s\S]*?<\/service>\n {4}<\/application>\n/g, ""),
    ],
    "android/src/main/java/ly/count/android/sdk/react/CountlyReactNativeImpl.java": [replace('"js-rnb-android"', '"js-rnbnp-android"')],
    "example/README.md": [cutFrom("## iOS Push Notification Documentation")],
    "example/create_app.py": [replace(PACKAGE_NAME, NO_PUSH_PACKAGE_NAME, 3)],
};

/**
 * Lists the files git knows about: tracked ones that still exist, and new ones that are not ignored.
 *
 * @return {string[]} paths relative to the repository root, with forward slashes
 */
function listRepositoryFiles() {
    const output = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: ROOT });
    return [...new Set(output.toString("utf8").split("\0").filter(Boolean))].filter((file) => fs.existsSync(path.join(ROOT, file)));
}

/**
 * Applies the changes to a text file, keeping its line endings.
 *
 * @param {string} file - path relative to the repository root
 * @param {string} content - file content
 * @param {Array<function(string, string): string>} changes - changes to apply in order
 * @return {string} the changed content
 */
function applyChanges(file, content, changes) {
    const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
    let text = content.replace(/\r\n/g, "\n");
    for (const change of changes) {
        text = change(text, file);
    }
    return lineEnding === "\n" ? text : text.replace(/\n/g, lineEnding);
}

/**
 * Generates the no-push package into the output directory.
 *
 * @param {string} outputDirectory - target directory, missing or empty
 */
function generate(outputDirectory) {
    const target = path.resolve(outputDirectory);
    if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
        throw new Error(`output directory '${target}' is not empty`);
    }
    if (target === ROOT || target.startsWith(ROOT + path.sep)) {
        throw new Error("the output directory must be outside the repository");
    }

    const files = listRepositoryFiles();
    const pending = new Set([...DELETED_FILES, ...Object.keys(REPLACED_FILES), ...Object.keys(FILE_CHANGES)]);
    let exampleImports = 0;

    for (const file of files) {
        const source = path.join(ROOT, file);
        const destination = path.join(target, file);
        if (DELETED_FILES.includes(file)) {
            pending.delete(file);
            continue;
        }
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        if (REPLACED_FILES[file] !== undefined) {
            fs.writeFileSync(destination, REPLACED_FILES[file]);
            pending.delete(file);
            continue;
        }
        if (FILE_CHANGES[file]) {
            fs.writeFileSync(destination, applyChanges(file, fs.readFileSync(source, "utf8"), FILE_CHANGES[file]));
            pending.delete(file);
            continue;
        }
        if (/^example\/CountlyRNExample\/.+\.(ts|tsx|js)$/.test(file)) {
            const content = fs.readFileSync(source, "utf8");
            const importPattern = /from (["'])countly-sdk-react-native-bridge(?=["'/])/g;
            const imports = (content.match(importPattern) || []).length;
            if (imports > 0) {
                exampleImports += imports;
                fs.writeFileSync(destination, content.replace(importPattern, `from $1${NO_PUSH_PACKAGE_NAME}`));
                continue;
            }
        }
        fs.copyFileSync(source, destination);
    }

    if (pending.size > 0) {
        throw new Error(`files to change were not found: ${[...pending].join(", ")}`);
    }
    if (exampleImports === 0) {
        throw new Error("no example imports of the package were found");
    }
    const firebaseFiles = files.filter((file) => file.startsWith("android/") && fs.existsSync(path.join(target, file)) && /com\.google\.firebase/.test(fs.readFileSync(path.join(target, file), "utf8")));
    if (firebaseFiles.length > 0) {
        throw new Error(`Firebase is still used in: ${firebaseFiles.join(", ")}`);
    }
    console.log(`Generated ${NO_PUSH_PACKAGE_NAME} in ${target} (${files.length - DELETED_FILES.length} files, ${exampleImports} example imports renamed).`);
}

if (process.argv.length !== 3) {
    console.error("Usage: node scripts/generate-no-push.js <output-directory>");
    process.exit(1);
}
try {
    generate(process.argv[2]);
} catch (error) {
    console.error(`generate-no-push: ${error.message}`);
    process.exit(1);
}
