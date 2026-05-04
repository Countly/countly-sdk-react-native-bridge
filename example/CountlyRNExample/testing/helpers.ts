import Countly from "countly-sdk-react-native-bridge-np";

const POLL_INTERVAL_MS = 1500;
const DEFAULT_TIMEOUT_MS = 3000;

function ensureTestApi() {
    if (!Countly.test || typeof Countly.test.getRequestQueue !== "function") {
        throw new Error("Countly.test helpers are unavailable. Recreate the example app with the local bridge package from this repository.");
    }
}

interface CapturedRequest {
    customEndpoint?: string;
    httpMethod?: string;
    kind?: string;
    networkingEnabled?: boolean;
    path?: string;
    requestData?: string;
    requestShouldBeDelayed?: boolean;
    serverURL?: string;
    url?: string;
}

function sleep(timeoutMs: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
}

function sameEntries(left: string[], right: string[]) {
    if (left.length !== right.length) {
        return false;
    }

    return left.every((entry, index) => entry === right[index]);
}

async function waitForStableQueue(reader: () => Promise<string[]>, timeoutMs = DEFAULT_TIMEOUT_MS) {
    let lastSnapshot = await reader();
    let stableReads = 0;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        await sleep(POLL_INTERVAL_MS);
        const currentSnapshot = await reader();
        if (sameEntries(lastSnapshot, currentSnapshot)) {
            stableReads += 1;
            if (stableReads >= 2) {
                return currentSnapshot;
            }
        } else {
            stableReads = 0;
            lastSnapshot = currentSnapshot;
        }
    }

    return lastSnapshot;
}

async function waitForQueueGrowth(reader: () => Promise<string[]>, before: string[], minGrowth: number, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const startedAt = Date.now();
    let currentSnapshot = before;

    while (Date.now() - startedAt < timeoutMs) {
        currentSnapshot = await reader();
        if (currentSnapshot.length >= before.length + minGrowth) {
            return currentSnapshot;
        }
        await sleep(POLL_INTERVAL_MS);
    }

    return currentSnapshot;
}

function takeAppendedEntries(before: string[], after: string[]) {
    if (after.length >= before.length && before.every((entry, index) => after[index] === entry)) {
        return after.slice(before.length);
    }

    return after;
}

function decodeFormComponent(value: string) {
    return decodeURIComponent(value.replace(/\+/g, " "));
}

function parseQueryEntry(entry: string) {
    const normalizedEntry = entry.replace(/^[?&]+/, "");
    const parameters: Record<string, string> = {};

    normalizedEntry.split("&").filter(Boolean).forEach((pair) => {
        const separatorIndex = pair.indexOf("=");
        const rawKey = separatorIndex >= 0 ? pair.slice(0, separatorIndex) : pair;
        const rawValue = separatorIndex >= 0 ? pair.slice(separatorIndex + 1) : "";
        const key = decodeFormComponent(rawKey || "");
        const value = decodeFormComponent(rawValue || "");
        if (key) {
            parameters[key] = value;
        }
    });

    return parameters;
}

function safeParseJson(value: string) {
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
}

function assertCondition(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(message);
    }
}

async function haltBridgeForScenario() {
    ensureTestApi();
    await Countly.test.halt();
    await sleep(POLL_INTERVAL_MS);
}

async function getStableRequestQueue() {
    ensureTestApi();
    return waitForStableQueue(() => Countly.test.getRequestQueue());
}

async function enableRequestCapture() {
    ensureTestApi();
    if (typeof Countly.test.enableRequestCapture === "function") {
        await Countly.test.enableRequestCapture();
    }
}

async function getStableCapturedRequests() {
    ensureTestApi();
    if (typeof Countly.test.getCapturedRequests !== "function") {
        return [];
    }

    return waitForStableQueue(() => Countly.test.getCapturedRequests());
}

async function getStableEventQueue() {
    ensureTestApi();
    return waitForStableQueue(() => Countly.test.getEventQueue());
}

async function waitForRequestGrowth(before: string[], minGrowth: number) {
    ensureTestApi();
    return waitForQueueGrowth(() => Countly.test.getRequestQueue(), before, minGrowth);
}

async function waitForEventGrowth(before: string[], minGrowth: number) {
    ensureTestApi();
    return waitForQueueGrowth(() => Countly.test.getEventQueue(), before, minGrowth);
}

async function waitForCapturedRequestGrowth(before: string[], minGrowth: number) {
    ensureTestApi();
    if (typeof Countly.test.getCapturedRequests !== "function") {
        return before;
    }

    return waitForQueueGrowth(() => Countly.test.getCapturedRequests(), before, minGrowth);
}

function parseCapturedRequest(entry: string) {
    const parsedEntry = safeParseJson(entry);
    if (!parsedEntry || typeof parsedEntry !== "object") {
        return null;
    }

    return parsedEntry as CapturedRequest;
}

function findLastCapturedRequest(entries: string[], predicate: (request: CapturedRequest) => boolean) {
    for (let index = entries.length - 1; index >= 0; index -= 1) {
        const request = parseCapturedRequest(entries[index]);
        if (request && predicate(request)) {
            return request;
        }
    }

    return null;
}

export {
    assertCondition,
    enableRequestCapture,
    findLastCapturedRequest,
    getStableEventQueue,
    getStableCapturedRequests,
    getStableRequestQueue,
    haltBridgeForScenario,
    parseCapturedRequest,
    parseQueryEntry,
    safeParseJson,
    takeAppendedEntries,
    waitForCapturedRequestGrowth,
    waitForEventGrowth,
    waitForRequestGrowth,
};