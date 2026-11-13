// In each request scenario the bridge hands the native SDK the calls api/requests/<scenario>.json records, each with
// its method and arguments. The scenarios make the calls the other Countly SDKs make in their own request tests; the
// native SDKs' own records hold the requests those calls send. A deliberate change: run
// COUNTLY_UPDATE_REQUESTS=1 npx jest __tests__/requestScenarios.test.js, which writes the records, check the difference
// and add a line to CHANGELOG.md.
/* global Proxy */
const fs = require('fs');
const path = require('path');

const MAX_INT = 2147483647;
const RECORDS = path.join(__dirname, '..', 'api', 'requests');

// what the native module answers, for the calls whose answer the bridge reads
const ANSWERS = {
    isInitialized: false,
    startView: 'view-id',
    startAutoStoppedView: 'view-id',
    getCurrentDeviceId: 'parity-device-001',
};

/**
 * A copy of a call argument as the record keeps it: the keys of every object sorted and callbacks named.
 * @param {*} value - argument
 * @returns {*} the copy
 */
function recorded(value) {
    if (typeof value === 'function') {
        return '<callback>';
    }
    if (Array.isArray(value)) {
        return value.map(recorded);
    }
    if (value && typeof value === 'object') {
        return Object.keys(value).sort().reduce((copy, key) => {
            copy[key] = recorded(value[key]);
            return copy;
        }, {});
    }
    return value;
}

/**
 * A native module that keeps every call the bridge makes, with its arguments, and answers each with a resolved promise.
 * @param {Object[]} calls - where the calls go
 * @returns {Object} the module
 */
function recordingNativeModule(calls) {
    return new Proxy({}, {
        get(target, name) {
            // "then" would make the module look like a promise
            if (typeof name !== 'string' || name === 'then') {
                return undefined;
            }
            return (...args) => {
                calls.push({ method: name, args: recorded(args) });
                return Promise.resolve(ANSWERS[name]);
            };
        },
    });
}

/**
 * Loads the bridge against a recording native module.
 * @returns {Object} Countly, CountlyConfig and the calls the native module gets
 */
function loadBridge() {
    const calls = [];
    const nativeModule = recordingNativeModule(calls);
    jest.resetModules();
    global.__DEV__ = false;
    jest.doMock('react-native/Libraries/Core/Devtools/parseErrorStack.js', () => jest.fn(() => []), { virtual: true });
    jest.doMock('react-native', () => ({
        Platform: { OS: 'ios', constants: { reactNativeVersion: { minor: 72 } } },
        NativeModules: { CountlyReactNative: nativeModule },
        TurboModuleRegistry: { get: jest.fn(() => nativeModule) },
        NativeEventEmitter: class {
            addListener() {
                return { remove: jest.fn() };
            }
        },
    }), { virtual: true });
    jest.doMock('../CountlyFlavor.js', () => ({ PUSH_NOTIFICATIONS_AVAILABLE: true }));
    let bridge;
    jest.isolateModules(() => {
        const Countly = require('../Countly.js');
        const CountlyConfig = require('../CountlyConfig.js');
        bridge = { Countly: Countly.default || Countly, CountlyConfig: CountlyConfig.default || CountlyConfig, calls };
    });
    return bridge;
}

/**
 * Runs a scenario on a freshly loaded bridge and compares the calls it handed the native SDK with the record of the
 * scenario, or writes the record when COUNTLY_UPDATE_REQUESTS is set.
 * @param {string} name - scenario name, the record file name without .json
 * @param {Function} configure - changes the scenario makes to the common config
 * @param {Function} scenario - the calls, given Countly
 * @returns {Promise<void>} resolves when the calls are compared
 */
async function checkCalls(name, configure, scenario) {
    const { Countly, CountlyConfig, calls } = loadBridge();
    const config = new CountlyConfig('https://parity.example', 'parity-app-key').setDeviceID('parity-device-001').enableManualSessionControl();
    configure(config);
    await Countly.initWithConfig(config);
    await scenario(Countly);
    await new Promise((resolve) => setImmediate(resolve));

    const current = `${JSON.stringify(calls, null, 2)}\n`;
    const file = path.join(RECORDS, `${name}.json`);
    if (process.env.COUNTLY_UPDATE_REQUESTS) {
        fs.mkdirSync(RECORDS, { recursive: true });
        fs.writeFileSync(file, current);
        return;
    }
    const committed = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : `(no api/requests/${name}.json)\n`;
    try {
        expect(current).toBe(committed);
    } catch (error) {
        error.message = `The calls of the ${name} scenario differ from api/requests/${name}.json. If that is deliberate, run COUNTLY_UPDATE_REQUESTS=1 npx jest __tests__/requestScenarios.test.js, check the difference and add a line to CHANGELOG.md.\n\n${error.message}`;
        throw error;
    }
}

afterEach(() => {
    jest.resetModules();
});

test('parity: a session with an event of every segmentation value type, the user details and a session update', async () => {
    await checkCalls('parity', () => {}, async (Countly) => {
        Countly.sessions.beginSession();
        Countly.events.recordEvent('purchase', {
            nar: 'uto',
            sasuke: MAX_INT,
            sakura: false,
            itachi: Number.MAX_VALUE,
            kakaski: Number.MIN_VALUE,
            hashirama: -MAX_INT,
            tobi: { obito: 'uchiha', zetsu: 'white' },
            stringList: ['value1', 'value2', 'value3'],
            intList: [1, 2, 3],
            doubleList: [1.1, 2.2, 3.3],
            boolList: [true, false, true],
            mixedList: ['value1', 2, 3.3, true],
            mapList: [{ key1: 'value1', key2: 2 }, { key1: 'value2', key2: 3 }, { key1: 'value3', key2: 4 }],
        }, 2, 9.99);
        await Countly.userDataBulk.setUserProperties({
            name: 'John Doe',
            username: 'john_d',
            email: 'john@example.com',
            organization: 'Countly',
            phone: '1234567890',
            picture: 'https://example.com/picture.jpg',
            gender: 'M',
            byear: 1980,
            tier: 'gold',
            age: 30,
        });
        await Countly.userDataBulk.save();
        Countly.sessions.updateSession();
        Countly.sessions.endSession();
    });
});

test('views: two views in a session, the first with segmentation', async () => {
    await checkCalls('views', () => {}, async (Countly) => {
        Countly.sessions.beginSession();
        await Countly.views.startView('Home', { source: 'scenario' });
        Countly.views.stopViewWithName('Home');
        await Countly.views.startView('Settings');
        Countly.sessions.endSession();
    });
});

test('crash: a handled exception with a breadcrumb and segmentation', async () => {
    await checkCalls('crash', () => {}, async (Countly) => {
        Countly.addCrashLog('breadcrumb one');
        Countly.logException('parity crash', true, { tier: 'gold' });
    });
});

test('consent: given for sessions and events, then taken back for events', async () => {
    await checkCalls('consent', (config) => config.setRequiresConsent(true), async (Countly) => {
        Countly.giveConsent(['sessions', 'events']);
        Countly.sessions.beginSession();
        Countly.events.recordEvent('consented');
        Countly.removeConsent(['events']);
        Countly.events.recordEvent('not_consented');
        Countly.sessions.endSession();
    });
});

test('device-id: a change with merge, then one without', async () => {
    await checkCalls('device-id', () => {}, async (Countly) => {
        Countly.sessions.beginSession();
        Countly.deviceId.changeID('parity-device-002', true);
        Countly.events.recordEvent('after_merge');
        Countly.deviceId.changeID('parity-device-003', false);
        Countly.events.recordEvent('after_new_id');
        Countly.sessions.endSession();
    });
});
