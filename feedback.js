import {NativeModules, NativeEventEmitter} from 'react-native';
import Countly from "./Countly.js";

/**
 * Get a list of available feedback widgets as array of object to handle multiple widgets of same type.
 * @param {callback listener} onFinished - returns (retrievedWidgets, error)
 * @return {String || []} error message or []
 */
async function getAvailableFeedbackWidgets(onFinished) {
  if (!_isInitialized) {
      const message = "'init' must be called before 'getFeedbackWidgets'";
      Countly.logError('getFeedbackWidgets', message);
      return message;
  }
  let result = [];
  let error = null;
  try {
      result = await CountlyReactNative.getFeedbackWidgets();
  } catch (e) {
      error = e.message;
  }
  if (onFinished) {
      onFinished(result, error);
  }
  return result;
}

/**
 * Present a chosen feedback widget
 *
 * @param {Object} feedbackWidget - feeback Widget with id, type and name
 * @param {String} closeButtonText - text for cancel/close button
 * @param {callback listener} widgetShownCallback - Callback to be executed when feedback widget is displayed
 * @param {callback listener} widgetClosedCallback - Callback to be executed when feedback widget is closed
 * 
 * @return {String || void} error message or void
 */
function presentFeedbackWidget(feedbackWidget, closeButtonText, widgetShownCallback, widgetClosedCallback) {
  if (!_isInitialized) {
      const msg = "'init' must be called before 'presentFeedbackWidgetObject'";
      Countly.logError('presentFeedbackWidgetObject', msg);
      return msg;
  }
  let message = null;
  if (!feedbackWidget) {
      message = 'feedbackWidget should not be null or undefined';
      Countly.logError('presentFeedbackWidgetObject', message);
      return message;
  }
  if (!feedbackWidget.id) {
      message = 'FeedbackWidget id should not be null or empty';
      Countly.logError('presentFeedbackWidgetObject', message);
      return message;
  }
  if (!feedbackWidget.type) {
      message = 'FeedbackWidget type should not be null or empty';
      Countly.logError('presentFeedbackWidgetObject', message);
      return message;
  }
  if (typeof closeButtonText !== 'string') {
      closeButtonText = '';
      Countly.logWarning('presentFeedbackWidgetObject', `unsupported data type of closeButtonText : '${typeof args}'`);
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
  CountlyReactNative.presentFeedbackWidget([feedbackWidget.id, feedbackWidget.type, feedbackWidget.name, closeButtonText]);
}
/**
  * Get a list of available feedback widgets as array of object to handle multiple widgets of same type.
  * @param {Object} widgetInfo - identifies the specific widget for which the feedback is filled out
  * @param {callback listener} onFinished - returns (Object retrievedWidgetData, error)
  * @return {String || []} error message or Object retrievedWidgetData
  */
function getFeedbackWidgetData() {
  if (!_isInitialized) {
    const message = "'initWithConfig' must be called before 'getFeedbackWidgetData'";
    Countly.logError('getFeedbackWidgetData', message);
    onFinished(null, message);
    return message;
  }
  const widgetId = widgetInfo.id;
  const widgetType = widgetInfo.type;
  Countly.logInfo('getFeedbackWidgetData', 'Calling "getFeedbackWidgetData" with Type:[' + widgetType + ']');
  const args = [];
  args.push(widgetId);
  args.push(widgetType);
  args.push(widgetInfo.name);
  let result = null;
  let error = null;
  try {
      result = await CountlyReactNative.getFeedbackWidgetData(args);
  } catch (e) {
      error = e.message;
  }
  if (onFinished) {
      onFinished(result, error);
  }
  return result;
}

/**
  * Get a list of available feedback widgets as array of object to handle multiple widgets of same type.
  * @param {Object} widgetInfo - identifies the specific widget for which the feedback is filled out
  * @param {Object} widgetData - widget data for this specific widget
  * @param {Object} widgetResult - segmentation of the filled out feedback. If this segmentation is null, it will be assumed that the survey was closed before completion and mark it appropriately
  */
function reportFeedbackWidgetManually() {
  if (!_isInitialized) {
    const message = "'initWithConfig' must be called before 'reportFeedbackWidgetManually'";
    Countly.logError('reportFeedbackWidgetManually', message);
    return message;
  }
  const widgetId = widgetInfo.id;
  const widgetType = widgetInfo.type;
  Countly.logInfo('reportFeedbackWidgetManually', 'Calling "reportFeedbackWidgetManually" with Type:[' + widgetType + ']');
  const widgetInfoList = [];
  widgetInfoList.push(widgetId);
  widgetInfoList.push(widgetType);
  widgetInfoList.push(widgetInfo.name);

  const args = [];
  args.push(widgetInfoList);
  args.push(widgetData);
  args.push(widgetResult);

  try {
    return await CountlyReactNative.reportFeedbackWidgetManually(args);
  } catch (e) {
    return e.message;
  }
}

const Feedback = {};

Feedback.getAvailableFeedbackWidgets = getAvailableFeedbackWidgets;
Feedback.presentFeedbackWidget = presentFeedbackWidget;
Feedback.getFeedbackWidgetData = getFeedbackWidgetData;
Feedback.reportFeedbackWidgetManually = reportFeedbackWidgetManually;

export default Feedback;
