import * as L from "./Logger.js";

class Feedback {
    #state;

    constructor(state) {
        this.#state = state;
    }

    /**
     * Get a list of available feedback widgets as an array of objects.
     * @param {callback} [onFinished] - returns (retrievedWidgets, error). This parameter is optional.
     * @return {object} object {error: String or null, data: Array or null }
     */
    async getAvailableFeedbackWidgets(onFinished) {
        if (!this.#state.isInitialized) {
            const message = "'init' must be called before 'getAvailableFeedbackWidgets'";
            L.e(`getAvailableFeedbackWidgets, ${message}`);
            return { error: message, data: null };
        }

        L.d("getAvailableFeedbackWidgets, getAvailableFeedbackWidgets");
        let result = null;
        let error = null;
        try {
            result = await this.#state.CountlyReactNative.getFeedbackWidgets();
        } catch (e) {
            error = e.message;
        }
        if (onFinished) {
            onFinished(result, error);
        }
        return { error: error, data: result };
    }

    /**
     * Present a chosen feedback widget
     *
     * @param {object} feedbackWidget - feedback Widget with id, type and name
     * @param {string} closeButtonText - text for cancel/close button
     * @param {callback} [widgetShownCallback] - Callback to be executed when feedback widget is displayed. This parameter is optional.
     * @param {callback} [widgetClosedCallback] - Callback to be executed when feedback widget is closed. This parameter is optional.
     *
     * @return {object} object {error: string or null}
     */
    presentFeedbackWidget(feedbackWidget, closeButtonText, widgetShownCallback, widgetClosedCallback) {
        if (!this.#state.isInitialized) {
            const message = "'init' must be called before 'presentFeedbackWidget'";
            L.e(`presentFeedbackWidget, ${message}`);
            return { error: message };
        }
        let message = null;
        if (!feedbackWidget) {
            message = "feedbackWidget should not be null or undefined";
            L.e(`presentFeedbackWidget, ${message}`);
            return { error: message };
        }
        if (!feedbackWidget.id) {
            message = "FeedbackWidget id should not be null or empty";
            L.e(`presentFeedbackWidget, ${message}`);
            return { error: message };
        }
        if (!feedbackWidget.type) {
            message = "FeedbackWidget type should not be null or empty";
            L.e(`presentFeedbackWidget, ${message}`);
            return { error: message };
        }
        if (typeof closeButtonText !== "string") {
            closeButtonText = "";
            L.w(`presentFeedbackWidget, unsupported data type of closeButtonText : [${typeof args}]`);
        }

        L.d(`presentFeedbackWidget, presentFeedbackWidget with widget:[${JSON.stringify(feedbackWidget)}]`);
        if (widgetShownCallback) {
            this.#state.widgetShownCallback = this.#state.eventEmitter.addListener(this.#state.widgetShownCallbackName, () => {
                widgetShownCallback();
                this.#state.widgetShownCallback.remove();
            });
        }
        if (widgetClosedCallback) {
            this.#state.widgetClosedCallback = this.#state.eventEmitter.addListener(this.#state.widgetClosedCallbackName, () => {
                widgetClosedCallback();
                this.#state.widgetClosedCallback.remove();
            });
        }

        feedbackWidget.name = feedbackWidget.name || "";
        closeButtonText = closeButtonText || "";
        this.#state.CountlyReactNative.presentFeedbackWidget([feedbackWidget.id, feedbackWidget.type, feedbackWidget.name, closeButtonText]);
        return { error: null };
    }

    /**
     * Get a feedback widget's data as an object.
     * @param {object} widgetInfo - widget to get data for. You should get this from 'getAvailableFeedbackWidgets' method.
     * @param {callback} [onFinished] - returns (object retrievedWidgetData, error). This parameter is optional.
     * @return {object} object {error: string, data: object or null}
     */
    async getFeedbackWidgetData(widgetInfo, onFinished) {
        if (!this.#state.isInitialized) {
            const message = "'initWithConfig' must be called before 'getFeedbackWidgetData'";
            L.e(`getFeedbackWidgetData, ${message}`);
            return { error: message, data: null };
        }
        const widgetId = widgetInfo.id;
        const widgetType = widgetInfo.type;
        L.d(`getFeedbackWidgetData, Calling "getFeedbackWidgetData" with Type:[${widgetType}]`);
        const args = [];
        args.push(widgetId);
        args.push(widgetType);
        args.push(widgetInfo.name);
        let result = null;
        let error = null;
        try {
            result = await this.#state.CountlyReactNative.getFeedbackWidgetData(args);
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
     * @param {object} widgetInfo -  the widget you are targeting. You should get this from 'getAvailableFeedbackWidgets' method.
     * @param {object} widgetData - data of that widget. You should get this from 'getFeedbackWidgetData' method.
     * @param {object} widgetResult - Information you want to report.
     * @return {object} object {error: string}
     */
    async reportFeedbackWidgetManually(widgetInfo, widgetData, widgetResult) {
        if (!this.#state.isInitialized) {
            const message = "'initWithConfig' must be called before 'reportFeedbackWidgetManually'";
            L.e(`reportFeedbackWidgetManually, ${message}`);
            return { error: message };
        }
        const widgetId = widgetInfo.id;
        const widgetType = widgetInfo.type;
        L.d(`reportFeedbackWidgetManually, Calling "reportFeedbackWidgetManually" with Type:[${widgetType}]`);
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
            await this.#state.CountlyReactNative.reportFeedbackWidgetManually(args);
        } catch (e) {
            error = e.message;
        }
        return { error: error };
    }
}

export default Feedback;
