const CountlyState = {};

/**
 * Name of the instance this state belongs to. The empty string is the default instance, which is
 * what the root level "Countly" calls use.
 */
CountlyState.instanceName = "";

CountlyState.isInitialized = false;
CountlyState.CountlyReactNative = null;
CountlyState.eventEmitter = null;

// Feedback module related variables
CountlyState.widgetShownCallbackName = "widgetShownCallback";
CountlyState.widgetClosedCallbackName = "widgetClosedCallback";
/*
 * Callback to be executed when feedback widget is displayed
 */
CountlyState.widgetShownCallback;
/*
 * Callback to be executed when feedback widget is closed
 */
CountlyState.widgetClosedCallback;

export default CountlyState;
