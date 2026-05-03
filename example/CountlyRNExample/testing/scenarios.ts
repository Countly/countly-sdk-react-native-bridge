import Countly from "countly-sdk-react-native-bridge";

import { createCountlyConfig } from "../Configuration";
import {
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
} from "./helpers";

interface IntegrationScenarioResult {
    details: string[];
    summary: string;
}

interface IntegrationScenario {
    description: string;
    id: string;
    run: () => Promise<IntegrationScenarioResult>;
    title: string;
}

interface ParsedQueueRequest {
    entry: string;
    params: Record<string, string>;
}

function queuesMatch(left: string[], right: string[]) {
    return left.length === right.length && left.every((entry, index) => entry === right[index]);
}

function extractEventName(eventPayload: Record<string, any> | null, rawPayload: string) {
    if (!eventPayload) {
        return rawPayload.includes("purchase") ? "purchase" : null;
    }

    return eventPayload.key || eventPayload.eventKey || eventPayload.name || null;
}

function payloadContainsString(value: unknown, expected: string): boolean {
    if (typeof value === "string") {
        return value === expected;
    }

    if (Array.isArray(value)) {
        return value.some((entry) => payloadContainsString(entry, expected));
    }

    if (value && typeof value === "object") {
        return Object.values(value).some((entry) => payloadContainsString(entry, expected));
    }

    return false;
}

function parseQueueRequests(entries: string[]) {
    return entries.map((entry) => ({ entry, params: parseQueryEntry(entry) }));
}

function findLastRequestWithField(entries: string[], fieldName: string) {
    const parsedEntries = parseQueueRequests(entries);

    for (let index = parsedEntries.length - 1; index >= 0; index -= 1) {
        if (parsedEntries[index].params[fieldName]) {
            return parsedEntries[index];
        }
    }

    return null;
}

function getRequestEvents(entry: ParsedQueueRequest | null) {
    const eventsPayload = safeParseJson(entry?.params.events || "");

    if (!Array.isArray(eventsPayload)) {
        return [];
    }

    return eventsPayload.filter((eventPayload) => eventPayload && typeof eventPayload === "object");
}

function getCustomUserDetails(entry: ParsedQueueRequest | null) {
    const userDetailsPayload = safeParseJson(entry?.params.user_details || "");

    if (!userDetailsPayload || typeof userDetailsPayload !== "object") {
        return null;
    }

    const customUserDetails = userDetailsPayload.custom;
    if (!customUserDetails || typeof customUserDetails !== "object") {
        return null;
    }

    return customUserDetails as Record<string, any>;
}

function findLastRequestWithEventName(entries: string[], eventName: string) {
    const parsedEntries = parseQueueRequests(entries);

    for (let index = parsedEntries.length - 1; index >= 0; index -= 1) {
        const requestEvents = getRequestEvents(parsedEntries[index]);
        if (requestEvents.some((eventPayload) => extractEventName(eventPayload, JSON.stringify(eventPayload)) === eventName)) {
            return parsedEntries[index];
        }
    }

    return null;
}

function findLastRequestWithCustomUserProperty(entries: string[], propertyName: string) {
    const parsedEntries = parseQueueRequests(entries);

    for (let index = parsedEntries.length - 1; index >= 0; index -= 1) {
        const customUserDetails = getCustomUserDetails(parsedEntries[index]);
        if (customUserDetails && Object.prototype.hasOwnProperty.call(customUserDetails, propertyName)) {
            return parsedEntries[index];
        }
    }

    return null;
}

function createManualSessionScenario() {
    return {
        id: "manual-session-order",
        title: "Manual Session Request Order",
        description: "Validates that begin, update, and end session calls are queued in the expected native request order.",
        async run() {
            await haltBridgeForScenario();

            const config = createCountlyConfig().enableManualSessionControl();
            await Countly.initWithConfig(config);

            const baselineQueue = await getStableRequestQueue();
            Countly.sessions.beginSession();
            Countly.sessions.updateSession();
            Countly.sessions.endSession();

            const finalQueue = await waitForRequestGrowth(baselineQueue, 3);
            const appendedRequests = takeAppendedEntries(baselineQueue, finalQueue);
            const sessionRequestEntries = appendedRequests.slice(-3);
            const sessionRequests = sessionRequestEntries.map(parseQueryEntry);

            assertCondition(sessionRequests.length === 3, `Expected 3 session requests, received ${sessionRequests.length}.`);
            assertCondition(sessionRequests[0].begin_session === "1", "First appended request is not a begin_session request.");
            assertCondition(!sessionRequests[1].begin_session && !sessionRequests[1].end_session, "Second appended request should be a session update request.");
            assertCondition(sessionRequests[2].end_session === "1", "Third appended request is not an end_session request.");

            return {
                summary: "Observed the expected begin, update, and end session request order.",
                details: [
                    `Begin request: ${sessionRequestEntries[0]}`,
                    `Update request: ${sessionRequestEntries[1]}`,
                    `End request: ${sessionRequestEntries[2]}`,
                ],
            };
        },
    } satisfies IntegrationScenario;
}

function createViewScenario() {
    return {
        id: "view-request",
        title: "View Event Queue Payload",
        description: "Checks that a recorded view appends a native event queue entry containing the requested view name.",
        async run() {
            await haltBridgeForScenario();

            await Countly.initWithConfig(createCountlyConfig());
            const baselineQueue = await getStableEventQueue();

            await Countly.views.startAutoStoppedView("Integration Test View", { source: "testing" });

            const finalQueue = await waitForEventGrowth(baselineQueue, 1);
            const appendedEvents = takeAppendedEntries(baselineQueue, finalQueue);
            const lastEvent = appendedEvents[appendedEvents.length - 1] || "";
            const parsedEvent = safeParseJson(lastEvent);
            const containsViewName = payloadContainsString(parsedEvent, "Integration Test View") || lastEvent.includes("Integration Test View");
            const containsSourceValue = payloadContainsString(parsedEvent, "testing") || lastEvent.includes("testing");

            assertCondition(appendedEvents.length >= 1, "Recording a view did not append an event to the native event queue.");
            assertCondition(containsViewName, `Expected a queued view event containing 'Integration Test View', received '${lastEvent}'.`);
            assertCondition(containsSourceValue, `Expected a queued view event containing source 'testing', received '${lastEvent}'.`);

            return {
                summary: "Recorded view event contains the expected view name and segmentation.",
                details: [
                    `Appended events: ${appendedEvents.length}`,
                    `Last view event: ${lastEvent}`,
                ],
            };
        },
    } satisfies IntegrationScenario;
}

function createEventScenario() {
    return {
        id: "event-queue-payload",
        title: "Event Queue Payload",
        description: "Records an RN event and checks the native event queue entry for the event name and segmentation values.",
        async run() {
            await haltBridgeForScenario();

            await Countly.initWithConfig(createCountlyConfig());
            const baselineQueue = await getStableEventQueue();

            Countly.events.recordEvent("purchase", { sku: "sku-1", qty: 2 }, 4, 19.99);

            const finalQueue = await waitForEventGrowth(baselineQueue, 1);
            const appendedEvents = takeAppendedEntries(baselineQueue, finalQueue);
            const lastEvent = appendedEvents[appendedEvents.length - 1] || "";
            const parsedEvent = safeParseJson(lastEvent);
            const eventName = extractEventName(parsedEvent, lastEvent);
            const segmentation = parsedEvent?.segmentation || parsedEvent?.seg || {};
            const eventCount = parsedEvent?.count ?? parsedEvent?.c;
            const eventSum = parsedEvent?.sum ?? parsedEvent?.s;

            assertCondition(appendedEvents.length >= 1, "Recording an event did not append an item to the native event queue.");
            assertCondition(eventName === "purchase", `Expected event name 'purchase', received '${eventName || ""}'.`);
            assertCondition(segmentation.sku === "sku-1", "Expected recorded event segmentation to include sku=sku-1.");
            assertCondition(Number(segmentation.qty) === 2, `Expected recorded event segmentation to include qty=2, received '${segmentation.qty || ""}'.`);
            assertCondition(Number(eventCount) === 4, `Expected event count 4, received '${eventCount || ""}'.`);
            assertCondition(Number(eventSum) === 19.99, `Expected event sum 19.99, received '${eventSum || ""}'.`);

            return {
                summary: "Recorded event payload matches the expected queue entry.",
                details: [
                    `Appended events: ${appendedEvents.length}`,
                    `Last event payload: ${lastEvent}`,
                ],
            };
        },
    } satisfies IntegrationScenario;
}

function createEventFlushBeforeCachedUserPropertyScenario() {
    return {
        id: "event-flush-before-cached-user-property",
        title: "Event Flush Before Cached User Property",
        description: "Checks that setting a user property after queueing an event flushes that event into the request queue while keeping the property out of both native queues.",
        async run() {
            await haltBridgeForScenario();

            await Countly.initWithConfig(createCountlyConfig());
            const baselineRequestQueue = await getStableRequestQueue();
            const baselineEventQueue = await getStableEventQueue();

            Countly.events.recordEvent("queued-before-user-property", { source: "integration-testing" });

            const eventQueueWithQueuedEvent = await waitForEventGrowth(baselineEventQueue, 1);
            const queuedEvents = takeAppendedEntries(baselineEventQueue, eventQueueWithQueuedEvent);
            const queuedEvent = queuedEvents[queuedEvents.length - 1] || "";

            assertCondition(queuedEvents.length >= 1, "Expected the event queue to grow before setting a user property, but no event was queued.");

            await Countly.userData.setProperty("cached_after_event", "cached-value");

            await waitForRequestGrowth(baselineRequestQueue, 1);
            const finalRequestQueue = await getStableRequestQueue();
            const finalEventQueue = await getStableEventQueue();
            const appendedRequests = takeAppendedEntries(baselineRequestQueue, finalRequestQueue);
            const flushedEventRequest = findLastRequestWithEventName(appendedRequests, "queued-before-user-property");
            const cachedUserPropertyRequest = findLastRequestWithCustomUserProperty(appendedRequests, "cached_after_event");

            assertCondition(flushedEventRequest !== null, "Expected setting a user property to flush the queued event into the request queue, but no request contained the queued event.");
            assertCondition(queuesMatch(finalEventQueue, baselineEventQueue), `Expected the event queue to return to baseline after flushing the queued event, but it changed from ${baselineEventQueue.length} item(s) to ${finalEventQueue.length}.`);
            assertCondition(cachedUserPropertyRequest === null, "Expected the user property to stay cached and out of both native queues after flushing the queued event, but a user_details request was appended.");

            return {
                summary: "Setting a user property flushed the queued event into the request queue without placing the property into either native queue.",
                details: [
                    `Queued event before property call: ${queuedEvent}`,
                    `Flushed event request: ${flushedEventRequest?.entry || ""}`,
                    `Appended requests after property call: ${appendedRequests.length}`,
                ],
            };
        },
    } satisfies IntegrationScenario;
}

function createCachedUserPropertyFlushOnEventScenario() {
    return {
        id: "cached-user-property-flush-on-event",
        title: "Cached User Property Flush On Event",
        description: "Checks that a cached user property stays out of both native queues until an event is recorded, then moves into the request queue.",
        async run() {
            await haltBridgeForScenario();

            await Countly.initWithConfig(createCountlyConfig());
            const baselineRequestQueue = await getStableRequestQueue();
            const baselineEventQueue = await getStableEventQueue();

            await Countly.userData.setProperty("cached_before_event", "cached-value");

            const requestQueueAfterProperty = await getStableRequestQueue();
            const eventQueueAfterProperty = await getStableEventQueue();

            assertCondition(
                queuesMatch(requestQueueAfterProperty, baselineRequestQueue),
                `Expected caching a user property to leave the request queue unchanged, but it grew by ${requestQueueAfterProperty.length - baselineRequestQueue.length} item(s).`,
            );
            assertCondition(
                queuesMatch(eventQueueAfterProperty, baselineEventQueue),
                `Expected caching a user property to leave the event queue unchanged, but it grew by ${eventQueueAfterProperty.length - baselineEventQueue.length} item(s).`,
            );

            Countly.events.recordEvent("flushes-cached-user-property", { source: "integration-testing" });

            await waitForRequestGrowth(baselineRequestQueue, 1);
            const finalRequestQueue = await getStableRequestQueue();
            const finalEventQueue = await getStableEventQueue();
            const appendedRequests = takeAppendedEntries(baselineRequestQueue, finalRequestQueue);
            const appendedEvents = takeAppendedEntries(baselineEventQueue, finalEventQueue);
            const cachedUserPropertyRequest = findLastRequestWithCustomUserProperty(appendedRequests, "cached_before_event");
            const customUserDetails = getCustomUserDetails(cachedUserPropertyRequest);

            assertCondition(cachedUserPropertyRequest !== null, "Expected recording an event to flush the cached user property into the request queue, but no matching user_details request was appended.");
            assertCondition(customUserDetails?.cached_before_event === "cached-value", `Expected cached user property value 'cached-value', received '${customUserDetails?.cached_before_event || ""}'.`);

            return {
                summary: "Recording an event flushed the previously cached user property into the request queue.",
                details: [
                    `User details request: ${cachedUserPropertyRequest?.entry || ""}`,
                    `Request queue growth after event: ${appendedRequests.length}`,
                    `Event queue growth after event: ${appendedEvents.length}`,
                ],
            };
        },
    } satisfies IntegrationScenario;
}

function createConsentEventScenario() {
    return {
        id: "consent-gates-events",
        title: "Consent Gates Event Queue",
        description: "Verifies that events stay blocked until RN gives event consent, then appear in the native event queue.",
        async run() {
            await haltBridgeForScenario();

            await Countly.initWithConfig(createCountlyConfig().setRequiresConsent(true));
            const blockedBaselineQueue = await getStableEventQueue();

            Countly.events.recordEvent("blocked-consent-event");

            const blockedQueue = await getStableEventQueue();
            const blockedEvents = takeAppendedEntries(blockedBaselineQueue, blockedQueue);

            assertCondition(blockedEvents.length === 0, `Expected event queue to stay unchanged without consent, but ${blockedEvents.length} event(s) were added.`);

            Countly.giveConsent(["events"]);

            const allowedBaselineQueue = await getStableEventQueue();
            Countly.events.recordEvent("allowed-consent-event", { source: "integration-testing" }, 1, 0);

            const allowedQueue = await waitForEventGrowth(allowedBaselineQueue, 1);
            const allowedEvents = takeAppendedEntries(allowedBaselineQueue, allowedQueue);
            const lastAllowedEvent = allowedEvents[allowedEvents.length - 1] || "";
            const parsedAllowedEvent = safeParseJson(lastAllowedEvent);
            const eventName = extractEventName(parsedAllowedEvent, lastAllowedEvent);

            assertCondition(allowedEvents.length >= 1, "Expected an event queue entry after giving event consent.");
            assertCondition(eventName === "allowed-consent-event", `Expected allowed event name 'allowed-consent-event', received '${eventName || ""}'.`);

            return {
                summary: "Events stayed blocked before consent and were queued after consent was granted.",
                details: [
                    `Blocked event queue growth: ${blockedEvents.length}`,
                    `Allowed event payload: ${lastAllowedEvent}`,
                ],
            };
        },
    } satisfies IntegrationScenario;
}

function createDeviceIdMergeScenario() {
    return {
        id: "device-id-merge-request",
        title: "Device ID Merge Request",
        description: "Checks that changing the device ID with merge enabled through the deviceId API appends a request containing both the new and old device IDs.",
        async run() {
            await haltBridgeForScenario();

            await Countly.initWithConfig(createCountlyConfig().setDeviceID("integration-device-1"));
            const baselineQueue = await getStableRequestQueue();

            Countly.deviceId.changeID("integration-device-2", true);

            const finalQueue = await waitForRequestGrowth(baselineQueue, 1);
            const appendedRequests = takeAppendedEntries(baselineQueue, finalQueue);
            const mergeRequest = findLastRequestWithField(appendedRequests, "old_device_id");

            assertCondition(mergeRequest !== null, "Expected a merged device ID request containing old_device_id, but none was appended.");
            assertCondition(mergeRequest?.params.device_id === "integration-device-2", `Expected merged request device_id to be 'integration-device-2', received '${mergeRequest?.params.device_id || ""}'.`);
            assertCondition(mergeRequest?.params.old_device_id === "integration-device-1", `Expected merged request old_device_id to be 'integration-device-1', received '${mergeRequest?.params.old_device_id || ""}'.`);

            return {
                summary: "Merged device ID request contains both the new and previous device IDs.",
                details: [
                    `Appended requests: ${appendedRequests.length}`,
                    `Merged device ID request: ${mergeRequest?.entry || ""}`,
                ],
            };
        },
    } satisfies IntegrationScenario;
}

function createUserDetailsScenario() {
    return {
        id: "user-details-request",
        title: "User Details Request Payload",
        description: "Sets RN user data, explicitly saves it, and verifies that the native request queue contains the expected user_details payload.",
        async run() {
            await haltBridgeForScenario();

            await Countly.initWithConfig(createCountlyConfig());
            const baselineQueue = await getStableRequestQueue();

            await Countly.setUserData({
                name: "Integration User",
                email: "integration@example.com",
                organization: "Countly QA",
            });
            await Countly.userDataBulk.save();

            const finalQueue = await waitForRequestGrowth(baselineQueue, 1);
            const appendedRequests = takeAppendedEntries(baselineQueue, finalQueue);
            const userDetailsRequest = findLastRequestWithField(appendedRequests, "user_details");
            const userDetailsPayload = safeParseJson(userDetailsRequest?.params.user_details || "");

            assertCondition(userDetailsRequest !== null, "Expected a user_details request after flushing pending user data, but none was appended.");
            assertCondition(userDetailsPayload?.name === "Integration User", `Expected user_details.name to be 'Integration User', received '${userDetailsPayload?.name || ""}'.`);
            assertCondition(userDetailsPayload?.email === "integration@example.com", `Expected user_details.email to be 'integration@example.com', received '${userDetailsPayload?.email || ""}'.`);
            assertCondition(userDetailsPayload?.organization === "Countly QA", `Expected user_details.organization to be 'Countly QA', received '${userDetailsPayload?.organization || ""}'.`);

            return {
                summary: "User details were flushed into a native request with the expected payload.",
                details: [
                    `Appended requests: ${appendedRequests.length}`,
                    `User details request: ${userDetailsRequest?.entry || ""}`,
                ],
            };
        },
    } satisfies IntegrationScenario;
}

function createMetricsScenario() {
    return {
        id: "metrics-request-payload",
        title: "Metrics Request Payload",
        description: "Sends RN metrics overrides and verifies that the native request queue contains the override inside the metrics payload.",
        async run() {
            await haltBridgeForScenario();

            await Countly.initWithConfig(createCountlyConfig());
            const baselineQueue = await getStableRequestQueue();

            Countly.recordMetrics({ integration_metric: "enabled" });

            const finalQueue = await waitForRequestGrowth(baselineQueue, 1);
            const appendedRequests = takeAppendedEntries(baselineQueue, finalQueue);
            const metricsRequest = findLastRequestWithField(appendedRequests, "metrics");
            const metricsPayload = safeParseJson(metricsRequest?.params.metrics || "");

            assertCondition(metricsRequest !== null, "Expected a metrics request after Countly.recordMetrics, but none was appended.");
            assertCondition(metricsPayload?.integration_metric === "enabled", `Expected metrics payload to include integration_metric=enabled, received '${metricsPayload?.integration_metric || ""}'.`);

            return {
                summary: "Metrics override request contains the expected custom metric.",
                details: [
                    `Appended requests: ${appendedRequests.length}`,
                    `Metrics request: ${metricsRequest?.entry || ""}`,
                ],
            };
        },
    } satisfies IntegrationScenario;
}

function createServerConfigDirectScenario() {
    return {
        id: "server-config-direct-request",
        title: "Server Config Direct Request",
        description: "Enables direct-request capture before init and checks that the automatic server configuration request is generated.",
        async run() {
            await haltBridgeForScenario();
            await enableRequestCapture();

            const baselineCapturedRequests = await getStableCapturedRequests();
            await Countly.initWithConfig(createCountlyConfig());

            const finalCapturedRequests = await waitForCapturedRequestGrowth(baselineCapturedRequests, 1);
            const appendedRequests = takeAppendedEntries(baselineCapturedRequests, finalCapturedRequests);
            const serverConfigRequest = findLastCapturedRequest(appendedRequests, (request) => (request.requestData || "").includes("method=sc"));

            assertCondition(serverConfigRequest !== null, "Expected init to generate a direct server configuration request, but none was captured.");
            assertCondition((serverConfigRequest?.customEndpoint || serverConfigRequest?.path || "").includes("/o/sdk"), `Expected server config request to target '/o/sdk', received '${serverConfigRequest?.customEndpoint || serverConfigRequest?.path || ""}'.`);

            return {
                summary: "Captured the automatic direct server configuration request created during init.",
                details: [
                    `Captured direct requests: ${appendedRequests.length}`,
                    `Server config request: ${JSON.stringify(serverConfigRequest)}`,
                ],
            };
        },
    } satisfies IntegrationScenario;
}

function createRemoteConfigDirectScenario() {
    return {
        id: "remote-config-direct-request",
        title: "Remote Config Direct Request",
        description: "Calls RN remote config update and verifies that the direct request capture log contains the generated request.",
        async run() {
            await haltBridgeForScenario();
            await enableRequestCapture();
            await Countly.initWithConfig(createCountlyConfig());

            const baselineCapturedRequests = await getStableCapturedRequests();

            await Countly.remoteConfig.update();

            const finalCapturedRequests = await waitForCapturedRequestGrowth(baselineCapturedRequests, 1);
            const appendedRequests = takeAppendedEntries(baselineCapturedRequests, finalCapturedRequests);
            const remoteConfigRequest = findLastCapturedRequest(appendedRequests, (request) => {
                const requestData = request.requestData || "";
                return requestData.includes("method=rc") || requestData.includes("method=fetch_remote_config");
            });

            assertCondition(remoteConfigRequest !== null, "Expected remoteConfigUpdate to generate a direct request, but none was captured.");
            assertCondition((remoteConfigRequest?.customEndpoint || remoteConfigRequest?.path || "").includes("/o/sdk"), `Expected remote config request to target '/o/sdk', received '${remoteConfigRequest?.customEndpoint || remoteConfigRequest?.path || ""}'.`);

            return {
                summary: "Captured the direct remote config request generated by RN.",
                details: [
                    `Captured direct requests: ${appendedRequests.length}`,
                    `Remote config request: ${JSON.stringify(remoteConfigRequest)}`,
                ],
            };
        },
    } satisfies IntegrationScenario;
}

const integrationScenarios = [
    createManualSessionScenario(),
    createViewScenario(),
    createEventScenario(),
    createEventFlushBeforeCachedUserPropertyScenario(),
    createCachedUserPropertyFlushOnEventScenario(),
    createConsentEventScenario(),
    createDeviceIdMergeScenario(),
    createUserDetailsScenario(),
    createMetricsScenario(),
    createServerConfigDirectScenario(),
    createRemoteConfigDirectScenario(),
];

export type { IntegrationScenario, IntegrationScenarioResult };
export default integrationScenarios;