jest.mock('../Logger.js', () => ({
    d: jest.fn(),
    e: jest.fn(),
    w: jest.fn(),
    i: jest.fn(),
    v: jest.fn(),
}));

const Logger = require('../Logger.js');
const FeedbackModule = require('../Feedback.js');

const Feedback = FeedbackModule.default || FeedbackModule;

function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

function createFeedback({ isInitialized = true, nativeOverrides = {}, existingShownCallback = null, existingClosedCallback = null } = {}) {
    const listeners = [];
    const eventEmitter = {
        addListener: jest.fn((eventName, handler) => {
            const listener = { eventName, handler };
            const subscription = {
                remove: jest.fn(),
            };
            listener.subscription = subscription;
            listeners.push(listener);
            return subscription;
        }),
    };

    const nativeModule = {
        presentNPS: jest.fn(),
        presentSurvey: jest.fn(),
        presentRating: jest.fn(),
        getFeedbackWidgets: jest.fn().mockResolvedValue([]),
        presentFeedbackWidget: jest.fn(),
        getFeedbackWidgetData: jest.fn().mockResolvedValue({ questions: [] }),
        reportFeedbackWidgetManually: jest.fn().mockResolvedValue(undefined),
        ...nativeOverrides,
    };

    const state = {
        isInitialized,
        CountlyReactNative: nativeModule,
        eventEmitter,
        widgetShownCallbackName: 'widgetShownCallback',
        widgetClosedCallbackName: 'widgetClosedCallback',
        widgetShownCallback: existingShownCallback,
        widgetClosedCallback: existingClosedCallback,
    };

    return {
        feedback: new Feedback(state),
        nativeModule,
        state,
        listeners,
    };
}

afterEach(() => {
    jest.clearAllMocks();
});

test('presentNPS uses the direct native method and cleans up callback subscriptions', () => {
    const previousShownCallback = { remove: jest.fn() };
    const previousClosedCallback = { remove: jest.fn() };
    const widgetShownCallback = jest.fn();
    const widgetClosedCallback = jest.fn();
    const { feedback, nativeModule, state, listeners } = createFeedback({
        existingShownCallback: previousShownCallback,
        existingClosedCallback: previousClosedCallback,
    });

    feedback.presentNPS(42, widgetShownCallback, widgetClosedCallback);

    const shownListener = listeners.find((listener) => listener.eventName === 'widgetShownCallback');
    const closedListener = listeners.find((listener) => listener.eventName === 'widgetClosedCallback');

    shownListener.handler();
    closedListener.handler();

    expect(previousShownCallback.remove).toHaveBeenCalledTimes(1);
    expect(previousClosedCallback.remove).toHaveBeenCalledTimes(1);
    expect(nativeModule.presentNPS).toHaveBeenCalledWith(['']);
    expect(widgetShownCallback).toHaveBeenCalledTimes(1);
    expect(widgetClosedCallback).toHaveBeenCalledTimes(1);
    expect(shownListener.subscription.remove).toHaveBeenCalledTimes(1);
    expect(closedListener.subscription.remove).toHaveBeenCalledTimes(1);
    expect(state.widgetShownCallback).toBeNull();
    expect(state.widgetClosedCallback).toBeNull();
    expect(Logger.w).toHaveBeenCalledWith('presentNPS, unsupported data type of nameIDorTag: [number]');
});

test('presentSurvey falls back to widget lookup when the direct native method is unavailable', async () => {
    const widgetShownCallback = jest.fn();
    const widgetClosedCallback = jest.fn();
    const { feedback, nativeModule, listeners } = createFeedback({
        nativeOverrides: {
            presentSurvey: undefined,
            getFeedbackWidgets: jest.fn().mockResolvedValue([
                { id: 'survey-1', type: 'survey', name: 'Customer Survey', tags: ['vip'], widgetVersion: 'v1' },
            ]),
        },
    });

    feedback.presentSurvey('vip', widgetShownCallback, widgetClosedCallback);
    await flushPromises();

    const shownListener = listeners.find((listener) => listener.eventName === 'widgetShownCallback');
    const closedListener = listeners.find((listener) => listener.eventName === 'widgetClosedCallback');

    shownListener.handler();
    closedListener.handler();

    expect(nativeModule.presentFeedbackWidget).toHaveBeenCalledWith(['survey-1', 'survey', 'Customer Survey', '', 'v1']);
    expect(widgetShownCallback).toHaveBeenCalledTimes(1);
    expect(widgetClosedCallback).toHaveBeenCalledTimes(1);
});

test('feedback helpers validate widget input and surface async native errors', async () => {
    const onFinished = jest.fn();
    const { feedback } = createFeedback({
        nativeOverrides: {
            getFeedbackWidgets: jest.fn().mockRejectedValue(new Error('widgets failed')),
            getFeedbackWidgetData: jest.fn().mockRejectedValue(new Error('data failed')),
            reportFeedbackWidgetManually: jest.fn().mockRejectedValue(new Error('report failed')),
        },
    });

    expect(feedback.presentFeedbackWidget(null)).toEqual({ error: 'feedbackWidget should not be null or undefined' });
    expect(feedback.presentFeedbackWidget({ type: 'survey' })).toEqual({ error: 'FeedbackWidget id should not be null or empty' });
    expect(feedback.presentFeedbackWidget({ id: 'widget-1' })).toEqual({ error: 'FeedbackWidget type should not be null or empty' });

    await expect(feedback.getAvailableFeedbackWidgets(onFinished)).resolves.toEqual({ error: 'widgets failed', data: null });
    await expect(feedback.getFeedbackWidgetData({ id: 'widget-1', type: 'survey', name: 'Survey' })).resolves.toEqual({ error: 'data failed', data: null });
    await expect(feedback.reportFeedbackWidgetManually({ id: 'widget-1', type: 'survey', name: 'Survey' }, {}, {})).resolves.toEqual({ error: 'report failed' });

    expect(onFinished).toHaveBeenCalledWith(null, 'widgets failed');
});

test('presentFeedbackWidget normalizes close button text, widget name, and widget version', () => {
    const widgetShownCallback = jest.fn();
    const widgetClosedCallback = jest.fn();
    const { feedback, nativeModule, listeners } = createFeedback();

    expect(feedback.presentFeedbackWidget({ id: 'rating-1', type: 'rating' }, 99, widgetShownCallback, widgetClosedCallback)).toEqual({ error: null });

    const shownListener = listeners.find((listener) => listener.eventName === 'widgetShownCallback');
    const closedListener = listeners.find((listener) => listener.eventName === 'widgetClosedCallback');

    shownListener.handler();
    closedListener.handler();

    expect(nativeModule.presentFeedbackWidget).toHaveBeenCalledWith(['rating-1', 'rating', '', '', '']);
    expect(widgetShownCallback).toHaveBeenCalledTimes(1);
    expect(widgetClosedCallback).toHaveBeenCalledTimes(1);
    expect(Logger.w).toHaveBeenCalledWith(expect.stringContaining('presentFeedbackWidget, unsupported data type of closeButtonText'));
});

test('feedback helpers return init errors before initialization', async () => {
    const widgetInfo = { id: 'widget-1', type: 'survey', name: 'Survey' };
    const { feedback, nativeModule } = createFeedback({ isInitialized: false });

    expect(feedback.presentFeedbackWidget(widgetInfo)).toEqual({ error: "'init' must be called before 'presentFeedbackWidget'" });
    await expect(feedback.getFeedbackWidgetData(widgetInfo)).resolves.toEqual({ error: "'initWithConfig' must be called before 'getFeedbackWidgetData'", data: null });
    await expect(feedback.reportFeedbackWidgetManually(widgetInfo, {}, {})).resolves.toEqual({ error: "'initWithConfig' must be called before 'reportFeedbackWidgetManually'" });

    expect(nativeModule.presentFeedbackWidget).not.toHaveBeenCalled();
    expect(nativeModule.getFeedbackWidgetData).not.toHaveBeenCalled();
    expect(nativeModule.reportFeedbackWidgetManually).not.toHaveBeenCalled();
});

test('getFeedbackWidgetData and reportFeedbackWidgetManually forward successful payloads', async () => {
    const widgetInfo = { id: 'widget-1', type: 'survey', name: 'Survey' };
    const widgetData = { steps: [] };
    const widgetResult = { rating: 5 };
    const onFinished = jest.fn();
    const { feedback, nativeModule } = createFeedback({
        nativeOverrides: {
            getFeedbackWidgetData: jest.fn().mockResolvedValue(widgetData),
            reportFeedbackWidgetManually: jest.fn().mockResolvedValue(undefined),
        },
    });

    await expect(feedback.getFeedbackWidgetData(widgetInfo, onFinished)).resolves.toEqual({ error: null, data: widgetData });
    await expect(feedback.reportFeedbackWidgetManually(widgetInfo, widgetData, widgetResult)).resolves.toEqual({ error: null });

    expect(nativeModule.getFeedbackWidgetData).toHaveBeenCalledWith(['widget-1', 'survey', 'Survey']);
    expect(nativeModule.reportFeedbackWidgetManually).toHaveBeenCalledWith([['widget-1', 'survey', 'Survey'], widgetData, widgetResult]);
    expect(onFinished).toHaveBeenCalledWith(widgetData, null);
});