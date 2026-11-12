// A jest test file that only .github/workflows/public_api.yml runs: it copies the file into the root of a checkout, selects
// it there with --testRegex, and the test loads that checkout's SDK with React Native mocked and writes the public
// surface as sorted "<path> <kind>" lines to the file named by PUBLIC_API_OUT.
// The .cjs extension keeps it out of the repository's own jest run, and jest skips the hidden .github folder.
const fs = require("fs");
const path = require("path");

const MAX_DEPTH = 4;

/**
 * Returns the kind printed for a value: its typeof, with null and arrays told apart.
 * @param {*} value the value to describe
 * @returns {string} "null", "array" or the typeof of the value
 */
function kindOf(value) {
    if (value === null) {
        return "null";
    }
    return Array.isArray(value) ? "array" : typeof value;
}

/**
 * Adds a line for the value at path and, for objects and functions, for each public member below it.
 * Names that start with an underscore are private by convention and skipped, and array elements are data.
 * @param {*} value the value to describe
 * @param {string} at the dotted path that reaches the value
 * @param {string[]} lines the lines collected so far
 * @param {WeakSet<object>} seen the objects already described, so cycles end
 * @param {number} depth how many members deep the value is
 */
function describeValue(value, at, lines, seen, depth) {
    const kind = kindOf(value);
    lines.push(`${at} ${kind}`);
    if ((kind !== "object" && kind !== "function") || depth >= MAX_DEPTH || seen.has(value)) {
        return;
    }
    seen.add(value);
    for (const key of Object.keys(value)) {
        if (!key.startsWith("_")) {
            describeValue(value[key], `${at}.${key}`, lines, seen, depth + 1);
        }
    }
    if (kind === "function" && value.prototype) {
        for (const key of Object.getOwnPropertyNames(value.prototype)) {
            if (key !== "constructor" && !key.startsWith("_")) {
                lines.push(`${at}.prototype.${key} ${kindOf(value.prototype[key])}`);
            }
        }
    }
}

/**
 * Returns a native module stand-in whose every member is a jest mock function.
 * @returns {object} a proxy that answers any property with a mock function
 */
function nativeModuleMock() {
    return new Proxy({}, { get: () => jest.fn() });
}

test("writes the public API", () => {
    jest.doMock("react-native", () => ({
        Platform: { OS: "android", constants: { reactNativeVersion: { minor: 72 } } },
        NativeModules: { CountlyReactNative: nativeModuleMock() },
        TurboModuleRegistry: { get: () => nativeModuleMock() },
        NativeEventEmitter: class {
            /** Returns a subscription that does nothing when removed. */
            addListener() {
                return { remove() {} };
            }
        },
    }), { virtual: true });
    jest.doMock("react-native/Libraries/Core/Devtools/parseErrorStack.js", () => () => [], { virtual: true });

    const root = process.cwd();
    const lines = [];
    for (const [name, file] of [["Countly", "Countly.js"], ["CountlyConfig", "CountlyConfig.js"]]) {
        const loaded = require(path.join(root, file));
        describeValue(loaded.default ?? loaded, name, lines, new WeakSet(), 0);
    }
    fs.writeFileSync(process.env.PUBLIC_API_OUT, [...new Set(lines)].sort().join("\n") + "\n");
});
