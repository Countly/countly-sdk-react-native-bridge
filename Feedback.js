import * as L from "./Logger.js";

class Feedback {
    #state;

    constructor(state) {
        this.#state = state;
    }

    /**
     * @deprecated in 26.1.0 : use 'Countly.feedback.presentNPS' instead.
     *
     * Shows the first available NPS widget that meets the criteria.
     * @param {String} [nameIDorTag] - name, id, or tag of the widget to show (optional)
     * @param {callback} [callback] - called when the widget is closed (optional)
     */
    showNPS(nameIDorTag, callback) {
        L.w("showNPS, deprecated. Use 'Countly.feedback.presentNPS(nameIDorTag, widgetShownCallback, widgetClosedCallback)' instead.");
        L.i(`showNPS, Will show NPS widget with name, id, or tag: [${nameIDorTag}], callback provided: [${typeof callback === "function"}]`);
        this.presentNPS(nameIDorTag, null, callback);
    }

    /**
     * Presents the first available NPS widget that meets the criteria.
     * @param {String} [nameIDorTag] - name, id, or tag of the widget to show (optional)
     * @param {callback} [widgetShownCallback] - called when the widget is displayed (optional)
     * @param {callback} [widgetClosedCallback] - called when the widget is closed (optional)
     */
    presentNPS(nameIDorTag, widgetShownCallback, widgetClosedCallback) {
        L.i(`presentNPS, Will show NPS widget with name, id, or tag: [${nameIDorTag}], shown callback provided: [${typeof widgetShownCallback === "function"}], closed callback provided: [${typeof widgetClosedCallback === "function"}]`);
        this.#presentDirectFeedback("presentNPS", "nps", nameIDorTag, widgetShownCallback, widgetClosedCallback);
    }

    /**
     * @deprecated in 26.1.0 : use 'Countly.feedback.presentSurvey' instead.
     *
     * Shows the first available Survey widget that meets the criteria.
     * @param {String} [nameIDorTag] - name, id, or tag of the widget to show (optional) 
     * @param {callback} [callback] - called when the widget is closed (optional)
     */
    showSurvey(nameIDorTag, callback) {
        L.w("showSurvey, deprecated. Use 'Countly.feedback.presentSurvey(nameIDorTag, widgetShownCallback, widgetClosedCallback)' instead.");
        L.i(`showSurvey, Will show Survey widget with name, id, or tag: [${nameIDorTag}], callback provided: [${typeof callback === "function"}]`);
        this.presentSurvey(nameIDorTag, null, callback);
    }

    /**
     * Presents the first available Survey widget that meets the criteria.
     * @param {String} [nameIDorTag] - name, id, or tag of the widget to show (optional)
     * @param {callback} [widgetShownCallback] - called when the widget is displayed (optional)
     * @param {callback} [widgetClosedCallback] - called when the widget is closed (optional)
     */
    presentSurvey(nameIDorTag, widgetShownCallback, widgetClosedCallback) {
        L.i(`presentSurvey, Will show Survey widget with name, id, or tag: [${nameIDorTag}], shown callback provided: [${typeof widgetShownCallback === "function"}], closed callback provided: [${typeof widgetClosedCallback === "function"}]`);
        this.#presentDirectFeedback("presentSurvey", "survey", nameIDorTag, widgetShownCallback, widgetClosedCallback);
    }

    /**
     * @deprecated in 26.1.0 : use 'Countly.feedback.presentRating' instead.
     *
     * Shows the first available Rating widget that meets the criteria.
     * @param {String} [nameIDorTag] - name, id, or tag of the widget to show (optional)
     * @param {callback} [callback] - called when the widget is closed (optional)
     */
    showRating(nameIDorTag, callback) {
        L.w("showRating, deprecated. Use 'Countly.feedback.presentRating(nameIDorTag, widgetShownCallback, widgetClosedCallback)' instead.");
        L.i(`showRating, Will show Rating widget with name, id, or tag: [${nameIDorTag}], callback provided: [${typeof callback === "function"}]`);
        this.presentRating(nameIDorTag, null, callback);
    }

    /**
     * Presents the first available Rating widget that meets the criteria.
     * @param {String} [nameIDorTag] - name, id, or tag of the widget to show (optional)
     * @param {callback} [widgetShownCallback] - called when the widget is displayed (optional)
     * @param {callback} [widgetClosedCallback] - called when the widget is closed (optional)
     */
    presentRating(nameIDorTag, widgetShownCallback, widgetClosedCallback) {
        L.i(`presentRating, Will show Rating widget with name, id, or tag: [${nameIDorTag}], shown callback provided: [${typeof widgetShownCallback === "function"}], closed callback provided: [${typeof widgetClosedCallback === "function"}]`);
        this.#presentDirectFeedback("presentRating", "rating", nameIDorTag, widgetShownCallback, widgetClosedCallback);
    }

    #normalizeNameIDorTag(nameIDorTag, functionName) {
        if (typeof nameIDorTag === "string") {
            return nameIDorTag;
        }
        if (nameIDorTag == null) {
            return "";
        }

        L.w(`${functionName}, unsupported data type of nameIDorTag: [${typeof nameIDorTag}]`);
        return "";
    }

    #registerPresentationCallbacks(widgetShownCallback, widgetClosedCallback) {
        if (this.#state.widgetShownCallback) {
            this.#state.widgetShownCallback.remove();
            this.#state.widgetShownCallback = null;
        }
        if (this.#state.widgetClosedCallback) {
            this.#state.widgetClosedCallback.remove();
            this.#state.widgetClosedCallback = null;
        }

        if (typeof widgetShownCallback === "function") {
            this.#state.widgetShownCallback = this.#state.eventEmitter.addListener(this.#state.widgetShownCallbackName, () => {
                widgetShownCallback();
                this.#state.widgetShownCallback.remove();
                this.#state.widgetShownCallback = null;
            });
        }
        if (typeof widgetClosedCallback === "function") {
            this.#state.widgetClosedCallback = this.#state.eventEmitter.addListener(this.#state.widgetClosedCallbackName, () => {
                widgetClosedCallback();
                this.#state.widgetClosedCallback.remove();
                this.#state.widgetClosedCallback = null;
            });
        }
    }

    #presentDirectFeedback(nativeMethodName, widgetType, nameIDorTag, widgetShownCallback, widgetClosedCallback) {
        if (!this.#state.isInitialized) {
            L.e(`${nativeMethodName}, 'init' must be called before '${nativeMethodName}'`);
            return;
        }

        const normalizedNameIDorTag = this.#normalizeNameIDorTag(nameIDorTag, nativeMethodName);
        const nativeMethod = this.#state.CountlyReactNative[nativeMethodName];

        if (typeof nativeMethod === "function") {
            this.#registerPresentationCallbacks(widgetShownCallback, widgetClosedCallback);
            nativeMethod.call(this.#state.CountlyReactNative, [normalizedNameIDorTag]);
            return;
        }

        L.w(`${nativeMethodName}, native direct feedback method unavailable, falling back to widget lookup`);
        this.#showInternalFeedback(widgetType, normalizedNameIDorTag, widgetShownCallback, widgetClosedCallback);
    }

    #showInternalFeedback(widgetType, nameIDorTag, widgetShownCallback, widgetClosedCallback) {
        this.getAvailableFeedbackWidgets((retrievedWidgets, error) => {
            if (error) {
                L.e(`showInternalFeedback, ${error}`);
                return;
            }
            if (!retrievedWidgets || retrievedWidgets.length === 0) {
                L.d(`showInternalFeedback, no feedback widgets found`);
                return;
            }
            L.d(`showInternalFeedback, Found [${retrievedWidgets.length}] feedback widgets`);
            let widget = retrievedWidgets.find(w => w.type === widgetType);
            try {
                if (nameIDorTag) {
                    const matchedWidget = retrievedWidgets.find(w =>
                        w.type === widgetType && (w.name === nameIDorTag || w.id === nameIDorTag || (Array.isArray(w.tags) && w.tags.includes(nameIDorTag)))
                    );
                    if (matchedWidget) {
                        widget = matchedWidget;
                        L.v(`showInternalFeedback, Found ${widgetType} widget by name, id, or tag: [${JSON.stringify(matchedWidget)}]`);
                    }
                }
            } catch (error) {
                L.e(`showInternalFeedback, Error while finding widget: ${error}`);   
            }

            if (!widget) {
                L.d(`showInternalFeedback, No ${widgetType} widget found.`);
                return;
            }
            this.presentFeedbackWidget(widget, null, widgetShownCallback, widgetClosedCallback);
        });
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

        L.d("getAvailableFeedbackWidgets, fetching available feedback widgets");
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
        if (closeButtonText == null) {
            closeButtonText = "";
        } else if (typeof closeButtonText !== "string") {
            closeButtonText = "";
            L.w(`presentFeedbackWidget, unsupported data type of closeButtonText: [${typeof closeButtonText}]`);
        }

        L.d(`presentFeedbackWidget, presentFeedbackWidget with widget:[${JSON.stringify(feedbackWidget)}]`);
        this.#registerPresentationCallbacks(widgetShownCallback, widgetClosedCallback);

        feedbackWidget.name = feedbackWidget.name || "";
        closeButtonText = closeButtonText || "";
        const widgetVersion = typeof feedbackWidget.widgetVersion === "string" ? feedbackWidget.widgetVersion : "";
        this.#state.CountlyReactNative.presentFeedbackWidget([feedbackWidget.id, feedbackWidget.type, feedbackWidget.name, closeButtonText, widgetVersion]);
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
