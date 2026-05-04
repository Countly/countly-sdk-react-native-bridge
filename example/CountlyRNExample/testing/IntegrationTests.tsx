/* eslint-disable react-native/no-inline-styles */
import React from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";

import Countly from "countly-sdk-react-native-bridge";

import CountlyButton from "../CountlyButton";
import { lightGreen, lightOrange } from "../Constants";
import integrationScenarios, { IntegrationScenario, IntegrationScenarioResult } from "./scenarios";

type ScenarioStatus = "idle" | "running" | "passed" | "failed";
type ExecutionLogLevel = "info" | "error";

interface ScenarioRunState {
    description: string;
    details: string[];
    durationMs: number;
    id: string;
    run: IntegrationScenario["run"];
    summary: string;
    title: string;
    status: ScenarioStatus;
}

interface QueueSnapshot {
    capturedRequests: string[];
    rawEventQueue: string[];
    rawRequestQueue: string[];
}

function createInitialScenarioState() {
    return integrationScenarios.map((scenario) => ({
        id: scenario.id,
        title: scenario.title,
        description: scenario.description,
        run: scenario.run,
        status: "idle" as ScenarioStatus,
        summary: "Not run yet.",
        details: [],
        durationMs: 0,
    }));
}

function statusColor(status: ScenarioStatus) {
    if (status === "passed") {
        return lightGreen;
    }
    if (status === "failed") {
        return "#B42318";
    }
    if (status === "running") {
        return lightOrange;
    }
    return "#667085";
}

function QueuePreview({ title, entries, limit = 5 }: { entries: string[]; title: string; limit?: number }) {
    return (
        <View style={{ marginHorizontal: 20, marginTop: 16, padding: 12, borderRadius: 10, backgroundColor: "#F5F5F5" }}>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>{title}</Text>
            {entries.length === 0 ? <Text style={{ color: "#475467" }}>Queue is empty.</Text> : null}
            {entries.slice(-limit).map((entry, index) => (
                <Text key={`${title}-${index}`} style={{ color: "#101828", marginBottom: 6 }}>
                    {entry}
                </Text>
            ))}
        </View>
    );
}

function IntegrationTestsScreen() {
    const [isRunning, setIsRunning] = React.useState(false);
    const [capturedRequests, setCapturedRequests] = React.useState<string[]>([]);
    const [executionLog, setExecutionLog] = React.useState<string[]>([]);
    const [rawRequestQueue, setRawRequestQueue] = React.useState<string[]>([]);
    const [rawEventQueue, setRawEventQueue] = React.useState<string[]>([]);
    const [scenarios, setScenarios] = React.useState<ScenarioRunState[]>(createInitialScenarioState);

    const updateScenario = React.useCallback((scenarioId: string, updates: Partial<ScenarioRunState>) => {
        setScenarios((currentScenarios) => currentScenarios.map((scenario) => (scenario.id === scenarioId ? { ...scenario, ...updates } : scenario)));
    }, []);

    const appendExecutionLog = React.useCallback((level: ExecutionLogLevel, message: string, details: string[] = []) => {
        const timestamp = new Date().toISOString();
        const lines = [`${timestamp} [${level.toUpperCase()}] ${message}`, ...details.map((detail) => `${timestamp} [${level.toUpperCase()}] ${detail}`)];

        if (level === "error") {
            console.error(`[IntegrationTests] ${message}`);
            details.forEach((detail) => console.error(`[IntegrationTests] ${detail}`));
        } else {
            console.log(`[IntegrationTests] ${message}`);
            details.forEach((detail) => console.log(`[IntegrationTests] ${detail}`));
        }

        setExecutionLog((currentLog) => [...currentLog, ...lines].slice(-200));
    }, []);

    const buildQueueSnapshotDetails = React.useCallback((snapshot: QueueSnapshot) => {
        const details = [
            `Queue sizes: requests=${snapshot.rawRequestQueue.length}, events=${snapshot.rawEventQueue.length}, directRequests=${snapshot.capturedRequests.length}`,
        ];

        const lastRequest = snapshot.rawRequestQueue[snapshot.rawRequestQueue.length - 1];
        const lastEvent = snapshot.rawEventQueue[snapshot.rawEventQueue.length - 1];
        const lastDirectRequest = snapshot.capturedRequests[snapshot.capturedRequests.length - 1];

        if (lastRequest) {
            details.push(`Last request queue entry: ${lastRequest}`);
        }
        if (lastEvent) {
            details.push(`Last event queue entry: ${lastEvent}`);
        }
        if (lastDirectRequest) {
            details.push(`Last direct request capture: ${lastDirectRequest}`);
        }

        return details;
    }, []);

    const refreshQueues = React.useCallback(async () => {
        if (!Countly.test) {
            setRawRequestQueue(["Countly.test helpers are unavailable in this installed package."]);
            setRawEventQueue([]);
            setCapturedRequests([]);
            return {
                capturedRequests: [],
                rawEventQueue: [],
                rawRequestQueue: ["Countly.test helpers are unavailable in this installed package."],
            } satisfies QueueSnapshot;
        }

        const [requestQueue, eventQueue, directRequestLog] = await Promise.all([
            Countly.test.getRequestQueue(),
            Countly.test.getEventQueue(),
            typeof Countly.test.getCapturedRequests === "function" ? Countly.test.getCapturedRequests() : Promise.resolve([]),
        ]);
        setRawRequestQueue(requestQueue);
        setRawEventQueue(eventQueue);
        setCapturedRequests(directRequestLog);

        return {
            capturedRequests: directRequestLog,
            rawEventQueue: eventQueue,
            rawRequestQueue: requestQueue,
        } satisfies QueueSnapshot;
    }, []);

    React.useEffect(() => {
        void refreshQueues();
    }, [refreshQueues]);

    const executeScenario = React.useCallback(async (scenario: IntegrationScenario) => {
        updateScenario(scenario.id, { status: "running", summary: "Running...", details: [], durationMs: 0 });
        const startedAt = Date.now();
        appendExecutionLog("info", `Starting scenario '${scenario.title}' (${scenario.id}).`, [scenario.description]);

        try {
            const result: IntegrationScenarioResult = await scenario.run();
            const durationMs = Date.now() - startedAt;
            updateScenario(scenario.id, {
                status: "passed",
                summary: result.summary,
                details: result.details,
                durationMs,
            });
            appendExecutionLog("info", `Scenario passed: '${scenario.title}' (${scenario.id}) in ${durationMs}ms.`, [result.summary, ...result.details]);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const durationMs = Date.now() - startedAt;
            const errorDetails = error instanceof Error && error.stack ? [message, error.stack] : [message];
            updateScenario(scenario.id, {
                status: "failed",
                summary: message,
                details: [message],
                durationMs,
            });
            appendExecutionLog("error", `Scenario failed: '${scenario.title}' (${scenario.id}) in ${durationMs}ms.`, errorDetails);
        }

        const queueSnapshot = await refreshQueues();
        appendExecutionLog("info", `Queue snapshot after '${scenario.title}' (${scenario.id}).`, buildQueueSnapshotDetails(queueSnapshot));
    }, [appendExecutionLog, buildQueueSnapshotDetails, refreshQueues, updateScenario]);

    const runScenario = React.useCallback(async (scenario: IntegrationScenario) => {
        if (isRunning) {
            return;
        }

        setIsRunning(true);
        try {
            await executeScenario(scenario);
        } finally {
            setIsRunning(false);
        }
    }, [executeScenario, isRunning]);

    const runAllScenarios = React.useCallback(async () => {
        setIsRunning(true);
        try {
            appendExecutionLog("info", `Starting full scenario run with ${integrationScenarios.length} scenarios.`);
            for (const scenario of integrationScenarios) {
                await executeScenario(scenario);
            }
            appendExecutionLog("info", "Completed full scenario run.");
        } finally {
            setIsRunning(false);
        }
    }, [appendExecutionLog, executeScenario]);

    const haltBridge = React.useCallback(async () => {
        if (!Countly.test || isRunning) {
            return;
        }

        setIsRunning(true);
        try {
            await Countly.test.halt();
            setScenarios(createInitialScenarioState());
            setExecutionLog([]);
            await refreshQueues();
        } finally {
            setIsRunning(false);
        }
    }, [isRunning, refreshQueues]);

    return (
        <SafeAreaView>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: "bold", textAlign: "center", marginTop: 12 }}>Countly RN Integration Tests</Text>
                <Text style={{ marginHorizontal: 20, marginTop: 10, color: "#475467", textAlign: "center" }}>
                    Run RN-triggered scenarios and validate the native request and event queues through Countly.test helper methods.
                </Text>

                <CountlyButton title={isRunning ? "Running..." : "Run All Scenarios"} onPress={() => void runAllScenarios()} color={lightGreen} lightText={true} disabled={isRunning} />
                <CountlyButton title="Refresh Queues" onPress={() => void refreshQueues()} color={lightOrange} disabled={isRunning} />
                <CountlyButton title="Halt And Reset Bridge" onPress={() => void haltBridge()} color="#F97066" lightText={true} disabled={isRunning} />

                {scenarios.map((scenario) => (
                    <View key={scenario.id} style={{ marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: statusColor(scenario.status) }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: "#101828" }}>{scenario.title}</Text>
                        <Text style={{ marginTop: 6, color: "#475467" }}>{scenario.description}</Text>
                        <Text style={{ marginTop: 8, fontWeight: "600", color: statusColor(scenario.status) }}>
                            {scenario.status.toUpperCase()} {scenario.durationMs > 0 ? `(${scenario.durationMs}ms)` : ""}
                        </Text>
                        <Text style={{ marginTop: 6, color: "#101828" }}>{scenario.summary}</Text>
                        {scenario.details.map((detail, index) => (
                            <Text key={`${scenario.id}-detail-${index}`} style={{ marginTop: 4, color: "#344054" }}>
                                - {detail}
                            </Text>
                        ))}
                        <CountlyButton
                            title={scenario.status === "running" ? "Running..." : `Run ${scenario.title}`}
                            onPress={() => void runScenario(scenario)}
                            color={statusColor(scenario.status)}
                            lightText={true}
                            disabled={isRunning || scenario.status === "running"}
                        />
                    </View>
                ))}

                <QueuePreview title="Request Queue Preview" entries={rawRequestQueue} />
                <QueuePreview title="Event Queue Preview" entries={rawEventQueue} />
                <QueuePreview title="Direct Request Capture Preview" entries={capturedRequests} />
                <QueuePreview title="Execution Log" entries={executionLog} limit={20} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default IntegrationTestsScreen;