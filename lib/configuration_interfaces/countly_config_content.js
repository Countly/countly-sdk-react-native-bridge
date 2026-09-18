import { i } from "../../Logger";

/**
 *
 * This class holds content feature configurations to be used with CountlyConfig 
 * class and serves as an interface.
 */
class CountlyConfigContent {
    constructor() {
        this._intervalLimit = 0;
        this._globalContentCallback = null;
        this._webViewDisplayOption = null;
        this._contentUrlHandler = null;
        this._contentUrlPrefixes = [];
        this._overlayCornerRadius = null;
        this._widgetsWithinAppEnabled = false;
    }

    get timerInterval() {
        return this._intervalLimit;
    }

    get contentCallback() {
        return this._globalContentCallback;
    }

    get webViewDisplayOption() {
        return this._webViewDisplayOption;
    }

    get contentUrlHandler() {
        return this._contentUrlHandler;
    }

    get contentUrlPrefixes() {
        return this._contentUrlPrefixes;
    }

    get overlayCornerRadius() {
        return this._overlayCornerRadius;
    }

    get widgetsWithinAppEnabled() {
        return this._widgetsWithinAppEnabled;
    }

    /**
     * Set the interval limit for zone timers. (minimum 15, default 30, seconds)
     * @param {Number} interval - interval limit for zone timers
     * @returns CountlyConfigContent
     */
    setZoneTimerInterval(interval) {
        this._intervalLimit = interval;
        return this;
    }

    /**
     * Set the global content callback
     * @param {Function} callback - callback function to be called for global content
     * @returns CountlyConfigContent
     */
    setGlobalContentCallback(callback) {
        this._globalContentCallback = callback;
        return this;
    }

    /**
     * Controls how content and feedback widgets are displayed.
     * @param {String} displayOption - "IMMERSIVE" or "SAFE_AREA"
     * @returns CountlyConfigContent
     */
    setWebViewDisplayOption(displayOption) {
        this._webViewDisplayOption = displayOption;
        return this;
    }

    /**
     * Take over the links opened from content blocks and feedback widgets, which is how an application
     * routes its own deep links. A link whose URL starts with one of the given prefixes, compared
     * ignoring case, is handed to the handler and not opened by the SDK; every other link is opened by
     * the SDK as usual. Without prefixes every link is handed over and the SDK opens none of them, since
     * it can not wait for the application's answer.
     * @param {Function} handler - called with each matching URL
     * @param {String[]} urlPrefixes - the beginnings of the URLs the application handles, such as "myapp://" or "https://example.com/app/"
     * @returns CountlyConfigContent
     */
    setContentUrlHandler(handler, urlPrefixes = []) {
        if (typeof handler !== "function") {
            i("setContentUrlHandler, the handler must be a function, the call is ignored");
            return this;
        }
        this._contentUrlHandler = handler;
        this._contentUrlPrefixes = Array.isArray(urlPrefixes) ? urlPrefixes.filter((prefix) => typeof prefix === "string" && prefix.length > 0) : [];
        return this;
    }

    /**
     * Set the corner radius of the overlay, in points, when widgets are shown within the application's
     * window. Left unset, the radius is read from the window. Only has an effect together with
     * showWidgetsWithinApp.
     * macOS only, ignored on every other platform
     * @param {Number} radius - corner radius in points
     * @returns CountlyConfigContent
     */
    setOverlayCornerRadius(radius) {
        this._overlayCornerRadius = radius;
        return this;
    }

    /**
     * Show content blocks and feedback widgets inside the application's own window rather than over the
     * whole screen, so they move with the window and never paint over anything else.
     * macOS only, ignored on every other platform
     * @returns CountlyConfigContent
     */
    showWidgetsWithinApp() {
        this._widgetsWithinAppEnabled = true;
        return this;
    }
}

export default CountlyConfigContent;
