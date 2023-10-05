const Feedback = {};
/**
 * Get a list of available feedback widgets as an array of objects.
 * @param {callback listener} onFinished - returns (retrievedWidgets, error)
 * @return {Object} Object {error: String or Null, values: Array or null }
 */
async function getAvailableFeedbackWidgets(onFinished) {
    if (!Feedback.state.isInitialized) {
        const message = "'init' must be called before 'getAvailableFeedbackWidgets'";
        Feedback.instance.logError('getAvailableFeedbackWidgets', message);
        return { error: message, values: null };
    }

    let result = null;
    let error = null;
    try {
        result = await Feedback.state.CountlyReactNative.getFeedbackWidgets();
    } catch (e) {
        error = e.message;
    }
    if (onFinished) {
        onFinished(result, error);
    }
    return { error: error, values: result };
}

/**
 * Present a chosen feedback widget
 *
 * @param {Object} feedbackWidget - feedback Widget with id, type and name
 * @param {String} closeButtonText - text for cancel/close button
 * @param {callback listener} widgetShownCallback - Callback to be executed when feedback widget is displayed
 * @param {callback listener} widgetClosedCallback - Callback to be executed when feedback widget is closed
 *
 * @return {Object} Object {error: String or null}
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
 * Get a feedback widget's data as an Object.
 * @param {Object} widgetInfo - widget to get data for. You should get this from 'getAvailableFeedbackWidgets' method.
 * @param {callback listener} onFinished - returns (Object retrievedWidgetData, error)
 * @return {Object} Object {error: String, data: Object or null}
 */
async function getFeedbackWidgetData(widgetInfo, onFinished) {
    if (!Feedback.state.isInitialized) {
        const message = "'initWithConfig' must be called before 'getFeedbackWidgetData'";
        Feedback.instance.logError('getFeedbackWidgetData', message);
        onFinished(null, message);
        return { error: message, data: null };
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
    return { error: error, data: result };
}

/**
 * Report manually for a feedback widget.
 * @param {Object} widgetInfo -  the widget you are targeting. You should get this from 'getAvailableFeedbackWidgets' method.
 * @param {Object} widgetData - data of that widget. You should get this from 'getFeedbackWidgetData' method.
 * @param {Object} widgetResult - Information you want to report.
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
