/**
 * Countly SDK React Native Bridge SDK Internal Limits
 * https://github.com/Countly/countly-sdk-react-native-bridge
 * @Countly
 */

// This class holds SDK internal limits (https://support.count.ly/hc/en-us/articles/360037753291-SDK-development-guide#01H821RTQ7AZ6J858BHP4883ZC) specific configurations to be used with CountlyConfig class and serves as an interface.
// You can chain multiple configurations.
class CountlyConfigSDKInternalLimits {
    constructor() {
        _maxKeyLength = 0;
        _maxValueSize = 0;
        _maxSegmentationValues = 0;
        _maxBreadcrumbCount = 0;
        _maxStackTraceLinesPerThread = 0;
        _maxStackTraceLineLength = 0;
    }

    // getters
    get maxKeyLength() {
        return this._maxKeyLength;
    }

    get maxValueSize() {
        return this._maxValueSize;
    }

    get maxSegmentationValues() {
        return this._maxSegmentationValues;
    }

    get maxBreadcrumbCount() {
        return this._maxBreadcrumbCount;
    }

    get maxStackTraceLinesPerThread() {
        return this._maxStackTraceLinesPerThread;
    }

    get maxStackTraceLineLength() {
        return this._maxStackTraceLineLength;
    }

    // setters / methods

    // Limits the maximum size of all string keys
    // keyLengthLimit is the maximum char size of all string keys (default 128 chars)
    setMaxKeyLength(keyLengthLimit) {
        this._maxKeyLength = keyLengthLimit;
        return this;
    }

    // Limits the size of all values in segmentation key-value pairs
    // valueSizeLimit is the maximum char size of all values in our key-value pairs (default 256 chars)
    setMaxValueSize(valueSizeLimit) {
        this._maxValueSize = valueSizeLimit;
        return this;
    }

    // Limits the max amount of custom segmentation in one event
    // segmentationAmountLimit is the max amount of custom segmentation in one event (default 100 key-value pairs)
    setMaxSegmentationValues(segmentationAmountLimit) {
        this._maxSegmentationValues = segmentationAmountLimit;
        return this;
    }

    // Limits the max amount of breadcrumbs that can be recorded before the oldest one is deleted
    // breadcrumbCountLimit is the max amount of breadcrumbs that can be recorded before the oldest one is deleted (default 100)
    setMaxBreadcrumbCount(breadcrumbCountLimit) {
        this._maxBreadcrumbCount = breadcrumbCountLimit;
        return this;
    }

    // Limits the max amount of stack trace lines to be recorded per thread
    // stackTraceLinesPerThreadLimit is the max amount of stack trace lines to be recorded per thread (default 30)
    setMaxStackTraceLinesPerThread(stackTraceLinesPerThreadLimit) {
        this._maxStackTraceLinesPerThread = stackTraceLinesPerThreadLimit;
        return this;
    }

    // Limits the max characters allowed per stack trace lines. Also limits the crash message length
    // stackTraceLineLengthLimit is the max length of each stack trace line (default 200)
    setMaxStackTraceLineLength(stackTraceLineLengthLimit) {
        this._maxStackTraceLineLength = stackTraceLineLengthLimit;
        return this;
    }
}

export default CountlyConfigSDKInternalLimits;