const Feedback = {};
/**
 * Get a list of available feedback widgets as array of object to handle multiple widgets of same type.
 * @param {callback listener} onFinished - returns (retrievedWidgets, error)
 * @return {Object} Object {error: String, values: []}
 */
async function getAvailableFeedbackWidgets(onFinished) {
    if (!Feedback.state.isInitialized) {
        const message = "'init' must be called before 'getAvailableFeedbackWidgets'";
        Feedback.instance.logError('getAvailableFeedbackWidgets', message);
        return { error: message };
    }

    let result = [];
    let error = null;
    try {
        result = await Feedback.state.CountlyReactNative.getFeedbackWidgets();
    } catch (e) {
        error = e.message;
    }
    if (onFinished) {
        onFinished(result, error);
    }
    return { error: error, result: result };
}

/**
 * Present a chosen feedback widget
 *
 * @param {Object} feedbackWidget - feedback Widget with id, type and name
 * @param {String} closeButtonText - text for cancel/close button
 * @param {callback listener} widgetShownCallback - Callback to be executed when feedback widget is displayed
 * @param {callback listener} widgetClosedCallback - Callback to be executed when feedback widget is closed
 *
 * @return {Object} Object {error: String}
 */
function presentFeedbackWidget(feedbackWidget, closeButtonText, widgetShownCallback, widgetClosedCallback) {
    if (!Feedback.state.isInitialized) {
        const message = "'init' must be called before 'presentFeedbackWidget'";
        Feedback.instance.logError('presentFeedbackWidget', msg);
        return { error: message };
    }
    let message = null;
    if (!feedbackWidget) {
        message = 'feedbackWidget should not be null or undefined';
        Feedback.instance.logError('presentFeedbackWidget', message);
        return { error: message };
    }
    if (!feedbackWidget.id) {
        message = 'FeedbackWidget id should not be null or empty';
        Feedback.instance.logError('presentFeedbackWidget', message);
        return { error: message };
    }
    if (!feedbackWidget.type) {
        message = 'FeedbackWidget type should not be null or empty';
        Feedback.instance.logError('presentFeedbackWidget', message);
        return { error: message };
    }
    if (typeof closeButtonText !== 'string') {
        closeButtonText = '';
        Feedback.instance.logWarning('presentFeedbackWidget', `unsupported data type of closeButtonText : '${typeof args}'`);
    }

    if (widgetShownCallback) {
        _widgetShownCallback = eventEmitter.addListener(widgetShownCallbackName, () => {
            widgetShownCallback();
            _widgetShownCallback.remove();
        });
    }
    if (widgetClosedCallback) {
        _widgetClosedCallback = eventEmitter.addListener(widgetClosedCallbackName, () => {
            widgetClosedCallback();
            _widgetClosedCallback.remove();
        });
    }

    feedbackWidget.name = feedbackWidget.name || '';
    closeButtonText = closeButtonText || '';
    Feedback.state.CountlyReactNative.presentFeedbackWidget([feedbackWidget.id, feedbackWidget.type, feedbackWidget.name, closeButtonText]);
    return { error: null };
}

/**
 * Get a list of available feedback widgets as array of object to handle multiple widgets of same type.
 * @param {Object} widgetInfo - identifies the specific widget for which the feedback is filled out
 * @param {callback listener} onFinished - returns (Object retrievedWidgetData, error)
 * @return {Object} Object {error: String, result: []}
 */
async function getFeedbackWidgetData(widgetInfo, onFinished) {
    if (!Feedback.state.isInitialized) {
        const message = "'initWithConfig' must be called before 'getFeedbackWidgetData'";
        Feedback.instance.logError('getFeedbackWidgetData', message);
        onFinished(null, message);
        return { error: message };
    }
    const widgetId = widgetInfo.id;
    const widgetType = widgetInfo.type;
    Feedback.instance.logInfo('getFeedbackWidgetData', 'Calling "getFeedbackWidgetData" with Type:[' + widgetType + ']');
    const args = [];
    args.push(widgetId);
    args.push(widgetType);
    args.push(widgetInfo.name);
    let result = null;
    let error = null;
    try {
        result = await Feedback.state.CountlyReactNative.getFeedbackWidgetData(args);
    } catch (e) {
        error = e.message;
    }
    if (onFinished) {
        onFinished(result, error);
    }
    return { error: error, result: result };
}

/**
 * Get a list of available feedback widgets as array of object to handle multiple widgets of same type.
 * @param {Object} widgetInfo - identifies the specific widget for which the feedback is filled out
 * @param {Object} widgetData - widget data for this specific widget
 * @param {Object} widgetResult - segmentation of the filled out feedback. If this segmentation is null, it will be assumed that the survey was closed before completion and mark it appropriately
 * @return {Object} Object {error: String}
 */
function reportFeedbackWidgetManually(widgetInfo, widgetData, widgetResult) {
    if (!Feedback.state.isInitialized) {
        const message = "'initWithConfig' must be called before 'reportFeedbackWidgetManually'";
        Feedback.instance.logError('reportFeedbackWidgetManually', message);
        return { error: message };
    }
    const widgetId = widgetInfo.id;
    const widgetType = widgetInfo.type;
    Feedback.instance.logInfo('reportFeedbackWidgetManually', 'Calling "reportFeedbackWidgetManually" with Type:[' + widgetType + ']');
    const widgetInfoList = [];
    widgetInfoList.push(widgetId);
    widgetInfoList.push(widgetType);
    widgetInfoList.push(widgetInfo.name);

    const args = [];
    args.push(widgetInfoList);
    args.push(widgetData);
    args.push(widgetResult);

    let error = null;
    try {
        Feedback.state.CountlyReactNative.reportFeedbackWidgetManually(args);
    } catch (e) {
      error = e.message;
    }
    return { error: error };
}

Feedback.getAvailableFeedbackWidgets = getAvailableFeedbackWidgets;
Feedback.presentFeedbackWidget = presentFeedbackWidget;
Feedback.getFeedbackWidgetData = getFeedbackWidgetData;
Feedback.reportFeedbackWidgetManually = reportFeedbackWidgetManually;

export default Feedback;
