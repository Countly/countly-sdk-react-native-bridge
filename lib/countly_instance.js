import * as L from "../Logger.js";
import * as Utils from "../Utils.js";
import * as Validate from "../Validators.js";
import DeviceId from "../DeviceId.js";
import Event from "../Event.js";
import Feedback from "../Feedback.js";
import RemoteConfig from "../RemoteConfig.js";
import Sessions from "../Sessions.js";
import Views from "../Views.js";

/**
 * Flattens an object into the consecutive key and value list the native side reads.
 *
 * @param {Object} pairs - the values to flatten, which may be undefined
 * @return {String[]} the flattened list, empty when there is nothing to flatten
 */
function flattenPairs(pairs) {
    const flattened = [];
    for (const key in pairs) {
        flattened.push(String(key));
        flattened.push(String(pairs[key]));
    }
    return flattened;
}

/**
 * A named Countly instance, with its own app key, server, device ID, request queue and storage.
 *
 * Every call made through it carries the instance name to the native side, so it lands on that
 * instance rather than the default one. The root level "Countly" calls are the default instance.
 */
class CountlyInstance {
    #state;

    #subscriptions = [];

    #onRemoved;

    /**
     * @param {String} instanceName - name of the instance, which its stored data is namespaced by
     * @param {Object} nativeModule - the native module every call is forwarded to
     * @param {Object} eventEmitter - the emitter the native side sends callbacks through
     * @param {Function} onRemoved - called once the instance has been removed, to forget it
     */
    constructor(instanceName, nativeModule, eventEmitter, onRemoved = () => {}) {
        this.#state = {
            instanceName,
            isInitialized: false,
            CountlyReactNative: nativeModule,
            eventEmitter,
            widgetShownCallbackName: "widgetShownCallback",
            widgetClosedCallbackName: "widgetClosedCallback",
        };

        this.events = new Event(this.#state);
        this.sessions = new Sessions(this.#state);
        this.views = new Views(this.#state);
        this.deviceId = new DeviceId(this.#state);
        this.remoteConfig = new RemoteConfig(this.#state);
        this.feedback = new Feedback(this.#state);
        this.#onRemoved = onRemoved;

        this.userProfile = this.#buildUserProfile();
        this.consent = this.#buildConsent();
        this.crashes = this.#buildCrashes();
        this.location = this.#buildLocation();
        this.apm = this.#buildApm();
        this.attribution = this.#buildAttribution();
        this.content = this.#buildContent();
    }

    /**
     * Subscribes the callbacks the configuration asked for, each filtered to this instance.
     *
     * @param {CountlyConfig} countlyConfig - the configuration being started with
     */
    #registerConfigCallbacks(countlyConfig) {
        this.#removeSubscriptions();

        if (countlyConfig.content.contentCallback) {
            this.#subscriptions.push(this.#state.eventEmitter.addListener("globalContentCallback", (data) => {
                const payload = Utils.payloadForInstance(data, this.name);
                if (payload) {
                    countlyConfig.content.contentCallback(payload.status, payload.data);
                }
            }));
        }

        if (countlyConfig.content.contentUrlHandler) {
            this.#subscriptions.push(this.#state.eventEmitter.addListener("contentUrlHandler", (data) => {
                const payload = Utils.payloadForInstance(data, this.name);
                if (payload) {
                    countlyConfig.content.contentUrlHandler(payload.url);
                }
            }));
        }
    }

    /**
     * Drops every callback this instance subscribed.
     */
    #removeSubscriptions() {
        const widgetListeners = [this.#state.widgetShownCallback, this.#state.widgetClosedCallback];
        for (const subscription of [...this.#subscriptions, ...widgetListeners]) {
            if (subscription && typeof subscription.remove === "function") {
                subscription.remove();
            }
        }
        this.#subscriptions = [];
        this.#state.widgetShownCallback = null;
        this.#state.widgetClosedCallback = null;
    }

    /**
     * Name of this instance.
     *
     * @return {String} the instance name
     */
    get name() {
        return this.#state.instanceName;
    }

    /**
     * Starts this instance.
     *
     * @param {CountlyConfig} countlyConfig - the configuration to start with
     * @return {Promise<void>}
     */
    async initWithConfig(countlyConfig) {
        if (this.#state.isInitialized) {
            L.d(`init, instance [${this.name}] is already initialized`);
            return;
        }
        if (!countlyConfig.serverURL) {
            L.e(`init, Server URL is required to initialize instance [${this.name}]`);
            return;
        }
        if (!countlyConfig.appKey) {
            L.e(`init, App Key is required to initialize instance [${this.name}]`);
            return;
        }

        L.d(`init, Initializing instance [${this.name}]`);
        this.#registerConfigCallbacks(countlyConfig);
        await this.#state.CountlyReactNative.init([JSON.stringify(Utils.configToJson(countlyConfig))], this.name);
        this.#state.isInitialized = true;
    }

    /**
     * Whether this instance has been started.
     *
     * @return {Promise<boolean>} true when it is running
     */
    async isInitialized() {
        const result = await this.#state.CountlyReactNative.isInitialized(this.name);
        this.#state.isInitialized = result === true || result === "true";
        return this.#state.isInitialized;
    }

    /**
     * Stops this instance and erases what it stored. Testing purposes only.
     *
     * @return {Promise<void>}
     */
    async halt() {
        await this.#state.CountlyReactNative.halt(this.name);
        this.#removeSubscriptions();
        this.#state.isInitialized = false;
    }

    /**
     * Stops this instance and drops it from the registry, keeping its stored data.
     *
     * @return {Promise<String>} the outcome reported by the native side
     */
    async remove() {
        const result = await this.#state.CountlyReactNative.removeInstance(this.name);
        this.#removeSubscriptions();
        this.#state.isInitialized = false;
        this.#onRemoved(this.name);
        return result;
    }

    /**
     * Whether a call may reach the native side yet, logging the refusal when it may not.
     *
     * @param {String} method - name of the call, for the message
     * @return {boolean} true once this instance has been started
     */
    #started(method) {
        if (this.#state.isInitialized) {
            return true;
        }
        L.e(`${method}, 'initWithConfig' must be called before '${method}'`);
        return false;
    }

    /**
     * Builds the user profile calls of this instance.
     *
     * @return {Object} the user profile interface
     */
    #buildUserProfile() {
        const state = this.#state;
        // One entry per call, so a new property operation is a line rather than another guarded body.
        const singleKey = { increment: "userData_increment" };
        const keyAndValue = {
            setProperty: "userData_setProperty",
            incrementBy: "userData_incrementBy",
            multiply: "userData_multiply",
            saveMax: "userData_saveMax",
            saveMin: "userData_saveMin",
            setOnce: "userData_setOnce",
            pushUniqueValue: "userData_pushUniqueValue",
            pushValue: "userData_pushValue",
            pullValue: "userData_pullValue",
        };

        const userProfile = {
            setProperties: async (properties) => {
                if (!this.#started("userProfile.setProperties")) {
                    return;
                }
                await state.CountlyReactNative.userDataBulk_setUserProperties(properties, state.instanceName);
            },
            save: async () => {
                if (!this.#started("userProfile.save")) {
                    return;
                }
                await state.CountlyReactNative.userDataBulk_save([], state.instanceName);
            },
        };

        for (const [name, nativeMethod] of Object.entries(singleKey)) {
            userProfile[name] = async (keyName) => {
                if (!this.#started(`userProfile.${name}`) || Validate.String(keyName, "key", `userProfile.${name}`)) {
                    return;
                }
                await state.CountlyReactNative[nativeMethod]([String(keyName)], state.instanceName);
            };
        }

        for (const [name, nativeMethod] of Object.entries(keyAndValue)) {
            userProfile[name] = async (keyName, keyValue) => {
                if (!this.#started(`userProfile.${name}`) || Validate.String(keyName, "key", `userProfile.${name}`)) {
                    return;
                }
                const value = name === "setProperty" ? keyValue : String(keyValue);
                await state.CountlyReactNative[nativeMethod]([String(keyName), value], state.instanceName);
            };
        }

        return userProfile;
    }

    /**
     * Builds the consent calls of this instance.
     *
     * @return {Object} the consent interface
     */
    #buildConsent() {
        const state = this.#state;
        // A single feature name is accepted as well as a list, the same as the default instance.
        const asList = (features) => (Array.isArray(features) ? features : [features]);

        return {
            giveConsent: (features) => this.#started("consent.giveConsent") && state.CountlyReactNative.giveConsent(asList(features), state.instanceName),
            removeConsent: (features) => this.#started("consent.removeConsent") && state.CountlyReactNative.removeConsent(asList(features), state.instanceName),
            giveAllConsent: () => this.#started("consent.giveAllConsent") && state.CountlyReactNative.giveAllConsent(state.instanceName),
            removeAllConsent: () => this.#started("consent.removeAllConsent") && state.CountlyReactNative.removeAllConsent(state.instanceName),
        };
    }

    /**
     * Builds the crash reporting calls of this instance.
     *
     * @return {Object} the crashes interface
     */
    #buildCrashes() {
        const state = this.#state;

        return {
            addCrashLog: (crashLog) => {
                if (!this.#started("crashes.addCrashLog") || Validate.String(crashLog, "crash log", "crashes.addCrashLog")) {
                    return;
                }
                state.CountlyReactNative.addCrashLog([String(crashLog)], state.instanceName);
            },
            logException: (exception, nonfatal, segments) => {
                if (!this.#started("crashes.logException") || Validate.String(exception, "exception", "crashes.logException")) {
                    return;
                }
                state.CountlyReactNative.logException([String(exception), nonfatal || false, ...flattenPairs(segments)], state.instanceName);
            },
            setCustomCrashSegments: (segments) => {
                if (!this.#started("crashes.setCustomCrashSegments")) {
                    return;
                }
                state.CountlyReactNative.setCustomCrashSegments(flattenPairs(segments), state.instanceName);
            },
        };
    }

    /**
     * Builds the location calls of this instance.
     *
     * @return {Object} the location interface
     */
    #buildLocation() {
        const state = this.#state;

        return {
            setLocation: (countryCode, city, location, ipAddress) => {
                if (!this.#started("location.setLocation")) {
                    return;
                }
                state.CountlyReactNative.setLocation(
                    [countryCode || "null", city || "null", location || "null", ipAddress || "null"],
                    state.instanceName,
                );
            },
            disableLocation: () => this.#started("location.disableLocation") && state.CountlyReactNative.disableLocation(state.instanceName),
        };
    }

    /**
     * Builds the performance monitoring calls of this instance.
     *
     * @return {Object} the apm interface
     */
    #buildApm() {
        const state = this.#state;

        return {
            startTrace: (traceKey) => {
                if (!this.#started("apm.startTrace") || Validate.String(traceKey, "trace key", "apm.startTrace")) {
                    return;
                }
                state.CountlyReactNative.startTrace([String(traceKey)], state.instanceName);
            },
            cancelTrace: (traceKey) => {
                if (!this.#started("apm.cancelTrace") || Validate.String(traceKey, "trace key", "apm.cancelTrace")) {
                    return;
                }
                state.CountlyReactNative.cancelTrace([String(traceKey)], state.instanceName);
            },
            clearAllTraces: () => this.#started("apm.clearAllTraces") && state.CountlyReactNative.clearAllTraces([], state.instanceName),
            endTrace: (traceKey, customMetric) => {
                if (!this.#started("apm.endTrace") || Validate.String(traceKey, "trace key", "apm.endTrace")) {
                    return;
                }
                state.CountlyReactNative.endTrace([String(traceKey), ...flattenPairs(customMetric)], state.instanceName);
            },
            recordNetworkTrace: (networkTraceKey, responseCode, requestPayloadSize, responsePayloadSize, startTime, endTime) => {
                if (!this.#started("apm.recordNetworkTrace") || Validate.String(networkTraceKey, "trace key", "apm.recordNetworkTrace")) {
                    return;
                }
                state.CountlyReactNative.recordNetworkTrace(
                    [String(networkTraceKey), String(responseCode), String(requestPayloadSize), String(responsePayloadSize), String(startTime), String(endTime)],
                    state.instanceName,
                );
            },
            appLoadingFinished: () => this.#started("apm.appLoadingFinished") && state.CountlyReactNative.appLoadingFinished(state.instanceName),
        };
    }

    /**
     * Builds the attribution calls of this instance.
     *
     * @return {Object} the attribution interface
     */
    #buildAttribution() {
        const state = this.#state;

        return {
            recordDirectAttribution: (campaignType, campaignData) => {
                if (!this.#started("attribution.recordDirectAttribution")) {
                    return;
                }
                state.CountlyReactNative.recordDirectAttribution([String(campaignType), String(campaignData)], state.instanceName);
            },
            recordIndirectAttribution: (attributionValues) => {
                if (!this.#started("attribution.recordIndirectAttribution")) {
                    return;
                }
                state.CountlyReactNative.recordIndirectAttribution([attributionValues], state.instanceName);
            },
        };
    }

    /**
     * Builds the content zone calls of this instance.
     *
     * @return {Object} the content interface
     */
    #buildContent() {
        const state = this.#state;

        return {
            enterContentZone: () => this.#started("content.enterContentZone") && state.CountlyReactNative.enterContentZone(state.instanceName),
            refreshContentZone: () => this.#started("content.refreshContentZone") && state.CountlyReactNative.refreshContentZone(state.instanceName),
            exitContentZone: () => this.#started("content.exitContentZone") && state.CountlyReactNative.exitContentZone(state.instanceName),
            previewContent: (contentId) => {
                if (!this.#started("content.previewContent") || Validate.String(contentId, "content id", "content.previewContent")) {
                    return;
                }
                state.CountlyReactNative.previewContent([String(contentId)], state.instanceName);
            },
        };
    }

    /**
     * The requests this instance has queued. Testing purposes only.
     *
     * @return {Promise<String[]>} the queued requests
     */
    async getRequestQueue() {
        return (await this.#state.CountlyReactNative.getRequestQueue(this.name)) || [];
    }

    /**
     * The events this instance has recorded but not sent yet. Testing purposes only.
     *
     * @return {Promise<String[]>} the recorded events
     */
    async getEventQueue() {
        return (await this.#state.CountlyReactNative.getEventQueue(this.name)) || [];
    }
}

export default CountlyInstance;
