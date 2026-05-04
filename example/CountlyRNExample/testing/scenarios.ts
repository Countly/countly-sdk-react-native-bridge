import Countly from "countly-sdk-react-native-bridge-np";
import { Platform } from "react-native";

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

function createStableEventQueueConfig() {
    return createCountlyConfig().disableSDKBehaviorSettingsUpdates();
}

const MANUAL_SESSION_TEST_SERVER_URL = "https://127.0.0.1:1";
const MANUAL_SESSION_UPDATE_DELAY_MS = 1200;

function createManualSessionRequestOrderConfig() {
    return createCountlyConfig()
        .setServerURL(MANUAL_SESSION_TEST_SERVER_URL)
        .setRequestTimeoutDuration(1)
        .disableSDKBehaviorSettingsUpdates();
}

function sleep(timeoutMs: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
}

function isIOSEventQueueFallbackEnabled() {
    return Platform.OS === "ios";
}

function prepareIOSEventQueueRequestFallback() {
    if (isIOSEventQueueFallbackEnabled()) {
        Countly.setEventSendThreshold(1);
    }
}

function findLastEventPayload(entries: string[], eventName: string) {
    const request = findLastRequestWithEventName(entries, eventName);
    const eventPayload = getRequestEvents(request)
        .reverse()
        .find((candidate) => extractEventName(candidate, JSON.stringify(candidate)) === eventName) || null;

    return {
        eventPayload,
        request,
    };
}

function isManualSessionRequest(params: Record<string, string>) {
    if (params.begin_session === "1" || params.end_session === "1") {
        return true;
    }

    return params.session_duration !== undefined && !params.begin_session && !params.end_session;
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
        description: "Validates that begin, update, and end session calls appear in the expected native request order.",
        async run() {
            await haltBridgeForScenario();

            await Countly.initWithConfig(createManualSessionRequestOrderConfig());

            const baselineRequestQueue = await getStableRequestQueue();

            Countly.sessions.beginSession();
            await sleep(MANUAL_SESSION_UPDATE_DELAY_MS);
            Countly.sessions.updateSession();
            Countly.sessions.endSession();

            const finalRequestQueue = await waitForRequestGrowth(baselineRequestQueue, 3);
            const appendedRequests = takeAppendedEntries(baselineRequestQueue, finalRequestQueue);
            const sessionRequests = parseQueueRequests(appendedRequests).filter((request) => isManualSessionRequest(request.params));
            const sessionRequestEntries = sessionRequests.map((request) => request.entry);

            assertCondition(
                sessionRequests.length === 3,
                `Expected 3 queued session requests, received ${sessionRequests.length}. Session entries: ${sessionRequestEntries.join(" | ")}. Appended queue entries: ${appendedRequests.join(" | ")}. Full queue: ${finalRequestQueue.join(" | ")}`
            );
            assertCondition(sessionRequests[0].params.begin_session === "1", "First queued session request is not a begin_session request.");
            assertCondition(
                sessionRequests[1].params.session_duration !== undefined && !sessionRequests[1].params.begin_session && !sessionRequests[1].params.end_session,
                "Second queued session request should be a session update request."
            );
            assertCondition(sessionRequests[2].params.end_session === "1", "Third queued session request is not an end_session request.");

            return {
                summary: "Observed the expected begin, update, and end session request order.",
                details: [
                    `Manual session queue growth: ${appendedRequests.length}`,
                    `Request queue size after session calls: ${finalRequestQueue.length}`,
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
        description: "Checks that a recorded view produces a native payload containing the requested view name.",
        async run() {
            await haltBridgeForScenario();

            prepareIOSEventQueueRequestFallback();
            await Countly.initWithConfig(createStableEventQueueConfig());
            if (!isIOSEventQueueFallbackEnabled()) {
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
            }

            const baselineRequestQueue = await getStableRequestQueue();
            await Countly.views.startAutoStoppedView("Integration Test View", { source: "testing" });

            const finalRequestQueue = await waitForRequestGrowth(baselineRequestQueue, 1);
            const appendedRequests = takeAppendedEntries(baselineRequestQueue, finalRequestQueue);
            const { eventPayload, request } = findLastEventPayload(appendedRequests, "[CLY]_view");
            const segmentation = eventPayload?.segmentation || eventPayload?.seg || {};

            assertCondition(request !== null, "Recording a view did not flush a view event into the native request queue on iOS.");
            assertCondition(segmentation.name === "Integration Test View", `Expected flushed view event name 'Integration Test View', received '${segmentation.name || ""}'.`);
            assertCondition(segmentation.source === "testing", `Expected flushed view event segmentation source 'testing', received '${segmentation.source || ""}'.`);

            return {
                summary: "Recorded view event was flushed into a native request with the expected payload.",
                details: [
                    `Appended requests after flush: ${appendedRequests.length}`,
                    `View request: ${request?.entry || ""}`,
                ],
            };
        },
    } satisfies IntegrationScenario;
}

function createEventScenario() {
    return {
        id: "event-queue-payload",
        title: "Event Queue Payload",
        description: "Records an RN event and checks the native payload for the event name and segmentation values.",
        async run() {
            await haltBridgeForScenario();

            prepareIOSEventQueueRequestFallback();
            await Countly.initWithConfig(createStableEventQueueConfig());
            if (!isIOSEventQueueFallbackEnabled()) {
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
            }

            const baselineRequestQueue = await getStableRequestQueue();
            Countly.events.recordEvent("purchase", { sku: "sku-1", qty: 2 }, 4, 19.99);

            const finalRequestQueue = await waitForRequestGrowth(baselineRequestQueue, 1);
            const appendedRequests = takeAppendedEntries(baselineRequestQueue, finalRequestQueue);
            const { eventPayload, request } = findLastEventPayload(appendedRequests, "purchase");
            const segmentation = eventPayload?.segmentation || eventPayload?.seg || {};
            const eventCount = eventPayload?.count ?? eventPayload?.c;
            const eventSum = eventPayload?.sum ?? eventPayload?.s;

            assertCondition(request !== null, "Recording an event did not flush a matching event into the native request queue on iOS.");
            assertCondition(segmentation.sku === "sku-1", "Expected recorded event segmentation to include sku=sku-1.");
            assertCondition(Number(segmentation.qty) === 2, `Expected recorded event segmentation to include qty=2, received '${segmentation.qty || ""}'.`);
            assertCondition(Number(eventCount) === 4, `Expected event count 4, received '${eventCount || ""}'.`);
            assertCondition(Number(eventSum) === 19.99, `Expected event sum 19.99, received '${eventSum || ""}'.`);

            return {
                summary: "Recorded event payload matches the expected native request payload.",
                details: [
                    `Appended requests after flush: ${appendedRequests.length}`,
                    `Event request: ${request?.entry || ""}`,
                ],
            };
        },
    } satisfies IntegrationScenario;
}

function createEventFlushBeforeCachedUserPropertyScenario() {
    return {
        id: "event-flush-before-cached-user-property",
        title: "Event Flush Before Cached User Property",
        description: "Checks that an event can flush into the request queue without forcing a cached user property into either native queue.",
        async run() {
            await haltBridgeForScenario();

            prepareIOSEventQueueRequestFallback();
            await Countly.initWithConfig(createStableEventQueueConfig());
            const baselineRequestQueue = await getStableRequestQueue();
            const baselineEventQueue = await getStableEventQueue();

            Countly.events.recordEvent("queued-before-user-property", { source: "integration-testing" });

            let queuedEvent = "";
            let flushedEventRequest = null;
            if (!isIOSEventQueueFallbackEnabled()) {
                const eventQueueWithQueuedEvent = await waitForEventGrowth(baselineEventQueue, 1);
                const queuedEvents = takeAppendedEntries(baselineEventQueue, eventQueueWithQueuedEvent);
                queuedEvent = queuedEvents[queuedEvents.length - 1] || "";

                assertCondition(queuedEvents.length >= 1, "Expected the event queue to grow before setting a user property, but no event was queued.");
            } else {
                const requestQueueWithFlushedEvent = await waitForRequestGrowth(baselineRequestQueue, 1);
                const appendedRequestsBeforeProperty = takeAppendedEntries(baselineRequestQueue, requestQueueWithFlushedEvent);
                const eventQueueAfterFlush = await getStableEventQueue();
                flushedEventRequest = findLastRequestWithEventName(appendedRequestsBeforeProperty, "queued-before-user-property");
                queuedEvent = flushedEventRequest?.entry || "";

                assertCondition(flushedEventRequest !== null, "Expected the queued event to flush into the request queue on iOS, but no matching request was appended.");
                assertCondition(
                    queuesMatch(eventQueueAfterFlush, baselineEventQueue),
                    `Expected the iOS event queue to stay at baseline after the event flushed immediately, but it changed from ${baselineEventQueue.length} item(s) to ${eventQueueAfterFlush.length}.`,
                );

                await Countly.userData.setProperty("cached_after_event", "cached-value");

                const requestQueueAfterProperty = await getStableRequestQueue();
                const eventQueueAfterProperty = await getStableEventQueue();
                const propertyRequests = takeAppendedEntries(requestQueueWithFlushedEvent, requestQueueAfterProperty);
                const cachedUserPropertyRequest = findLastRequestWithCustomUserProperty(propertyRequests, "cached_after_event");

                assertCondition(
                    queuesMatch(requestQueueAfterProperty, requestQueueWithFlushedEvent),
                    `Expected caching a user property to leave the iOS request queue unchanged after the event flush, but it grew by ${requestQueueAfterProperty.length - requestQueueWithFlushedEvent.length} item(s).`,
                );
                assertCondition(
                    queuesMatch(eventQueueAfterProperty, eventQueueAfterFlush),
                    `Expected caching a user property to leave the iOS event queue unchanged after the event flush, but it changed from ${eventQueueAfterFlush.length} item(s) to ${eventQueueAfterProperty.length}.`,
                );
                assertCondition(cachedUserPropertyRequest === null, "Expected the user property to stay cached and out of both native queues after the event flushed, but a user_details request was appended.");

                return {
                    summary: "The queued event flushed into a native request while the later user property stayed cached.",
                    details: [
                        `Flushed event request: ${flushedEventRequest?.entry || ""}`,
                        `Request queue size after property call: ${requestQueueAfterProperty.length}`,
                    ],
                };
            }

            await Countly.userData.setProperty("cached_after_event", "cached-value");

            await waitForRequestGrowth(baselineRequestQueue, 1);
            const finalRequestQueue = await getStableRequestQueue();
            const finalEventQueue = await getStableEventQueue();
            const appendedRequests = takeAppendedEntries(baselineRequestQueue, finalRequestQueue);
            flushedEventRequest = findLastRequestWithEventName(appendedRequests, "queued-before-user-property");
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
        title: "Cached User Property Flush Behavior",
        description: "Checks that a cached user property stays out of both native queues until a supported flush path moves it into the request queue.",
        async run() {
            await haltBridgeForScenario();

            prepareIOSEventQueueRequestFallback();
            await Countly.initWithConfig(createStableEventQueueConfig());
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

            if (isIOSEventQueueFallbackEnabled()) {
                const requestQueueAfterEvent = await waitForRequestGrowth(baselineRequestQueue, 1);
                const appendedRequestsAfterEvent = takeAppendedEntries(baselineRequestQueue, requestQueueAfterEvent);
                const eventRequest = findLastRequestWithEventName(appendedRequestsAfterEvent, "flushes-cached-user-property");
                const cachedUserPropertyRequestAfterEvent = findLastRequestWithCustomUserProperty(appendedRequestsAfterEvent, "cached_before_event");

                assertCondition(eventRequest !== null, "Expected recording an event to flush the event into the iOS request queue, but no matching event request was appended.");
                assertCondition(cachedUserPropertyRequestAfterEvent === null, "Expected the cached user property to remain unsent on iOS until explicit save, but a user_details request was appended with the event.");

                await Countly.userDataBulk.save();

                const finalRequestQueue = await waitForRequestGrowth(requestQueueAfterEvent, 1);
                const finalEventQueue = await getStableEventQueue();
                const appendedRequestsAfterSave = takeAppendedEntries(requestQueueAfterEvent, finalRequestQueue);
                const cachedUserPropertyRequest = findLastRequestWithCustomUserProperty(appendedRequestsAfterSave, "cached_before_event");
                const customUserDetails = getCustomUserDetails(cachedUserPropertyRequest);

                assertCondition(cachedUserPropertyRequest !== null, "Expected explicit save to flush the cached user property into the iOS request queue, but no matching user_details request was appended.");
                assertCondition(customUserDetails?.cached_before_event === "cached-value", `Expected cached user property value 'cached-value', received '${customUserDetails?.cached_before_event || ""}'.`);

                return {
                    summary: "On iOS, the cached user property stayed local through the event flush and moved into the request queue only after explicit save.",
                    details: [
                        `Event request: ${eventRequest?.entry || ""}`,
                        `User details request after save: ${cachedUserPropertyRequest?.entry || ""}`,
                        `Event queue size after save: ${finalEventQueue.length}`,
                    ],
                };
            }

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
        description: "Verifies that events stay blocked until RN gives event consent, then appear in the native payload.",
        async run() {
            await haltBridgeForScenario();

            prepareIOSEventQueueRequestFallback();
            await Countly.initWithConfig(createStableEventQueueConfig().setRequiresConsent(true));
            if (!isIOSEventQueueFallbackEnabled()) {
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
            }

            const blockedBaselineRequestQueue = await getStableRequestQueue();
            Countly.events.recordEvent("blocked-consent-event");
            const blockedRequestQueue = await getStableRequestQueue();
            const blockedRequests = takeAppendedEntries(blockedBaselineRequestQueue, blockedRequestQueue);
            const blockedEventRequest = findLastRequestWithEventName(blockedRequests, "blocked-consent-event");

            assertCondition(blockedEventRequest === null, "Expected events to stay blocked without consent, but a blocked event request was appended.");

            Countly.giveConsent(["events"]);

            const allowedBaselineRequestQueue = await getStableRequestQueue();
            Countly.events.recordEvent("allowed-consent-event", { source: "integration-testing" }, 1, 0);

            const allowedFinalRequestQueue = await waitForRequestGrowth(allowedBaselineRequestQueue, 1);
            const appendedRequests = takeAppendedEntries(allowedBaselineRequestQueue, allowedFinalRequestQueue);
            const { eventPayload, request } = findLastEventPayload(appendedRequests, "allowed-consent-event");
            const segmentation = eventPayload?.segmentation || eventPayload?.seg || {};

            assertCondition(request !== null, "Expected an event request after giving event consent on iOS, but none was appended.");
            assertCondition(segmentation.source === "integration-testing", `Expected allowed event source 'integration-testing', received '${segmentation.source || ""}'.`);

            return {
                summary: "Events stayed blocked before consent and were flushed into a native request after consent was granted.",
                details: [
                    `Blocked appended requests: ${blockedRequests.length}`,
                    `Allowed event request: ${request?.entry || ""}`,
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