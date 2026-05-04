import * as L from "./Logger.js";
import * as Validate from "./Validators.js";

function formatLogValue(value) {
    if (typeof value === "string") {
        return value;
    }

    try {
        const serializedValue = JSON.stringify(value);
        if (serializedValue !== undefined) {
            return serializedValue;
        }
    } catch {
        // Fall back to the default string representation for non-serializable values.
    }

    return String(value);
}

function logViewCall(functionName, ...details) {
    const formattedDetails = details.map(({ label, value }) => `${label}: [${formatLogValue(value)}]`).join(", ");
    L.i(`${functionName}, called with ${formattedDetails}`);
}

function isSegmentationValid(functionName, segmentation, allowEmpty = true) {
    if (segmentation == null) {
        return allowEmpty;
    }

    if (typeof segmentation !== "object" || Array.isArray(segmentation)) {
        L.w(`${functionName}, provided segmentation: [${segmentation}]. It must be an object!`);
        return false;
    }

    return true;
}

function appendSegmentationArgs(args, segmentation) {
    if (!segmentation) {
        return args;
    }

    for (const key in segmentation) {
        args.push(key);
        args.push(segmentation[key]);
    }

    return args;
}

class Views {
    #state;

    constructor(state) {
        this.#state = state;
    }

    async startAutoStoppedView(viewName, segmentation) {
        logViewCall("startAutoStoppedView", { label: "view name", value: viewName }, { label: "segmentation", value: segmentation });

        if (!this.#state.isInitialized) {
            L.e("startAutoStoppedView, 'init' must be called before 'Countly.views.startAutoStoppedView'");
            return null;
        }

        const message = Validate.String(viewName, "view name", "startAutoStoppedView");
        if (message || !isSegmentationValid("startAutoStoppedView", segmentation)) {
            return null;
        }

        const args = appendSegmentationArgs([String(viewName)], segmentation);
        return (await this.#state.CountlyReactNative.startAutoStoppedView(args)) ?? null;
    }

    async startView(viewName, segmentation) {
        logViewCall("startView", { label: "view name", value: viewName }, { label: "segmentation", value: segmentation });

        if (!this.#state.isInitialized) {
            L.e("startView, 'init' must be called before 'Countly.views.startView'");
            return null;
        }

        const message = Validate.String(viewName, "view name", "startView");
        if (message || !isSegmentationValid("startView", segmentation)) {
            return null;
        }

        const args = appendSegmentationArgs([String(viewName)], segmentation);
        return (await this.#state.CountlyReactNative.startView(args)) ?? null;
    }

    stopViewWithName(viewName, segmentation) {
        logViewCall("stopViewWithName", { label: "view name", value: viewName }, { label: "segmentation", value: segmentation });

        if (!this.#state.isInitialized) {
            L.e("stopViewWithName, 'init' must be called before 'Countly.views.stopViewWithName'");
            return;
        }

        const message = Validate.String(viewName, "view name", "stopViewWithName");
        if (message || !isSegmentationValid("stopViewWithName", segmentation)) {
            return;
        }

        const args = appendSegmentationArgs([String(viewName)], segmentation);
        this.#state.CountlyReactNative.stopViewWithName(args);
    }

    stopViewWithID(viewID, segmentation) {
        logViewCall("stopViewWithID", { label: "view ID", value: viewID }, { label: "segmentation", value: segmentation });

        if (!this.#state.isInitialized) {
            L.e("stopViewWithID, 'init' must be called before 'Countly.views.stopViewWithID'");
            return;
        }

        const message = Validate.String(viewID, "view ID", "stopViewWithID");
        if (message || !isSegmentationValid("stopViewWithID", segmentation)) {
            return;
        }

        const args = appendSegmentationArgs([String(viewID)], segmentation);
        this.#state.CountlyReactNative.stopViewWithID(args);
    }

    stopAllViews(segmentation) {
        logViewCall("stopAllViews", { label: "segmentation", value: segmentation });

        if (!this.#state.isInitialized) {
            L.e("stopAllViews, 'init' must be called before 'Countly.views.stopAllViews'");
            return;
        }

        if (!isSegmentationValid("stopAllViews", segmentation)) {
            return;
        }

        this.#state.CountlyReactNative.stopAllViews(appendSegmentationArgs([], segmentation));
    }

    pauseViewWithID(viewID) {
        logViewCall("pauseViewWithID", { label: "view ID", value: viewID });

        if (!this.#state.isInitialized) {
            L.e("pauseViewWithID, 'init' must be called before 'Countly.views.pauseViewWithID'");
            return;
        }

        const message = Validate.String(viewID, "view ID", "pauseViewWithID");
        if (message) {
            return;
        }

        this.#state.CountlyReactNative.pauseViewWithID([String(viewID)]);
    }

    resumeViewWithID(viewID) {
        logViewCall("resumeViewWithID", { label: "view ID", value: viewID });

        if (!this.#state.isInitialized) {
            L.e("resumeViewWithID, 'init' must be called before 'Countly.views.resumeViewWithID'");
            return;
        }

        const message = Validate.String(viewID, "view ID", "resumeViewWithID");
        if (message) {
            return;
        }

        this.#state.CountlyReactNative.resumeViewWithID([String(viewID)]);
    }

    addSegmentationToViewWithID(viewID, segmentation) {
        logViewCall("addSegmentationToViewWithID", { label: "view ID", value: viewID }, { label: "segmentation", value: segmentation });

        if (!this.#state.isInitialized) {
            L.e("addSegmentationToViewWithID, 'init' must be called before 'Countly.views.addSegmentationToViewWithID'");
            return;
        }

        const message = Validate.String(viewID, "view ID", "addSegmentationToViewWithID");
        if (message || !isSegmentationValid("addSegmentationToViewWithID", segmentation, false)) {
            return;
        }

        const args = appendSegmentationArgs([String(viewID)], segmentation);
        this.#state.CountlyReactNative.addSegmentationToViewWithID(args);
    }

    addSegmentationToViewWithName(viewName, segmentation) {
        logViewCall("addSegmentationToViewWithName", { label: "view name", value: viewName }, { label: "segmentation", value: segmentation });

        if (!this.#state.isInitialized) {
            L.e("addSegmentationToViewWithName, 'init' must be called before 'Countly.views.addSegmentationToViewWithName'");
            return;
        }

        const message = Validate.String(viewName, "view name", "addSegmentationToViewWithName");
        if (message || !isSegmentationValid("addSegmentationToViewWithName", segmentation, false)) {
            return;
        }

        const args = appendSegmentationArgs([String(viewName)], segmentation);
        this.#state.CountlyReactNative.addSegmentationToViewWithName(args);
    }

    setGlobalViewSegmentation(segmentation) {
        logViewCall("setGlobalViewSegmentation", { label: "segmentation", value: segmentation });

        if (!this.#state.isInitialized) {
            L.e("setGlobalViewSegmentation, 'init' must be called before 'Countly.views.setGlobalViewSegmentation'");
            return;
        }

        if (!isSegmentationValid("setGlobalViewSegmentation", segmentation)) {
            return;
        }

        this.#state.CountlyReactNative.setGlobalViewSegmentation(appendSegmentationArgs([], segmentation));
    }

    updateGlobalViewSegmentation(segmentation) {
        logViewCall("updateGlobalViewSegmentation", { label: "segmentation", value: segmentation });

        if (!this.#state.isInitialized) {
            L.e("updateGlobalViewSegmentation, 'init' must be called before 'Countly.views.updateGlobalViewSegmentation'");
            return;
        }

        if (!isSegmentationValid("updateGlobalViewSegmentation", segmentation, false)) {
            return;
        }

        this.#state.CountlyReactNative.updateGlobalViewSegmentation(appendSegmentationArgs([], segmentation));
    }
}

export default Views;