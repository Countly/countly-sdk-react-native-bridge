// CountlyReactNative.swift
//
// This code is provided under the MIT License.
//
// Please visit www.count.ly for more information.

import Countly
import CoreLocation
import Foundation
import React
import UserNotifications

/// The React Native module: every call the JavaScript layer makes lands here and
/// is forwarded to the Countly Swift SDK.
///
/// Arguments arrive as the loosely typed arrays the bridge allows, so each method
/// reads what it needs defensively. A bad argument is logged and dropped rather
/// than crashing the host application.
@objc(CountlyReactNative)
public class CountlyReactNative: RCTEventEmitter {

    // MARK: - Identity

    static let sdkVersion = "26.1.0"
    static let sdkName = "js-rnb-ios"

    // MARK: - Event names

    static let widgetShownCallbackName = "widgetShownCallback"
    static let widgetClosedCallbackName = "widgetClosedCallback"
    static let ratingWidgetCallbackName = "ratingWidgetCallback"
    static let pushNotificationCallbackName = "pushNotificationCallback"
    static let contentCallbackName = "globalContentCallback"

    // MARK: - State

    /// The configuration being assembled until `init` runs. The JavaScript layer
    /// is allowed to touch a few settings before init, so this outlives a single
    /// call.
    static var config: CountlyConfig?

    /// The widgets the last fetch returned, so a later call can find one by ID.
    static var feedbackWidgetList: [CountlyFeedbackWidget] = []

    /// Mirrors the SDK's debug flag for `isLoggingEnabled`, which JavaScript may
    /// ask for before init.
    static var loggingEnabled = false

    /// The emitter the push bridge and the content callback send events through.
    static weak var shared: CountlyReactNative?

    // MARK: - Lifecycle

    public override init() {
        super.init()
        Self.shared = self
    }

    public override static func requiresMainQueueSetup() -> Bool {
        false
    }

    public override func supportedEvents() -> [String] {
        [
            Self.pushNotificationCallbackName,
            Self.ratingWidgetCallbackName,
            Self.widgetShownCallbackName,
            Self.widgetClosedCallbackName,
            Self.contentCallbackName,
        ]
    }

    // MARK: - Helpers

    static func log(_ message: String) {
        guard loggingEnabled else { return }
        NSLog("[CountlyReactNativePlugin] %@", message)
    }

    /// Reads a flag the JavaScript layer sent.
    ///
    /// The bridge delivers booleans as real booleans from a JSON payload, but as
    /// the strings `"true"`, `"1"` and `"0"` from the argument arrays. Reading
    /// those numerically yields false for `"true"`, which leaves a flag looking
    /// configured while behaving as though it were not.
    static func asBool(_ value: Any?) -> Bool {
        switch value {
        case let number as NSNumber:
            return number.boolValue
        case let text as String:
            switch text.lowercased() {
            case "true", "1", "yes": return true
            default: return false
            }
        default:
            return false
        }
    }

    static func asString(_ value: Any?) -> String? {
        guard let text = value as? String, !(value is NSNull) else { return nil }
        return text
    }

    /// The configuration under assembly, created on first use.
    static func ensureConfig() -> CountlyConfig {
        if let existing = config { return existing }
        let created = CountlyConfig()
        config = created
        return created
    }

    /// Reads the flat `[key, value, key, value]` form the JavaScript layer uses
    /// for segmentation and metric arguments.
    static func keyValuePairs(from arguments: [Any], startIndex: Int) -> [String: Any]? {
        guard arguments.count > startIndex else { return nil }

        var pairs: [String: Any] = [:]
        var index = startIndex
        while index + 1 < arguments.count {
            defer { index += 2 }
            guard let key = arguments[index] as? String else { continue }
            let value = arguments[index + 1]
            if value is NSNull { continue }
            pairs[key] = value
        }

        return pairs.isEmpty ? nil : pairs
    }

    /// Parses the `"latitude,longitude"` string the JavaScript layer sends.
    static func coordinate(from gpsCoordinate: String?) -> CLLocationCoordinate2D {
        guard let gpsCoordinate else { return kCLLocationCoordinate2DInvalid }

        guard gpsCoordinate.contains(",") else {
            log("Invalid location Coordinates:[\(gpsCoordinate)], lat and long values should be comma separated")
            return kCLLocationCoordinate2DInvalid
        }

        let parts = gpsCoordinate.components(separatedBy: ",")
        if parts.count > 2 {
            log("Invalid location Coordinates:[\(gpsCoordinate)], it should contains only two comma seperated values")
        }

        let latitude = Double(parts[0].trimmingCharacters(in: .whitespaces)) ?? 0
        let longitude = Double(parts[1].trimmingCharacters(in: .whitespaces)) ?? 0
        if latitude == 0 || longitude == 0 {
            log("Invalid location Coordinates, One of the values parsed to a 0, double check that given coordinates are correct:[\(gpsCoordinate)]")
        }

        return CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    static func toJSONString(_ object: Any) -> String? {
        guard JSONSerialization.isValidJSONObject(object),
              let data = try? JSONSerialization.data(withJSONObject: object, options: []) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    /// Forwards an event to JavaScript, if the emitter is alive.
    static func emit(_ name: String, body: Any?) {
        Self.shared?.sendEvent(withName: name, body: body)
    }

    /// Runs on the main queue, as every call from the old Objective-C bridge did.
    static func onMain(_ work: @escaping () -> Void) {
        if Thread.isMainThread {
            work()
        } else {
            DispatchQueue.main.async(execute: work)
        }
    }

    // MARK: - Init

    @objc(initialize:resolver:rejecter:)
    func initialize(_ arguments: [Any],
                    resolver resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            guard let argsString = arguments.first as? String,
                  let data = argsString.data(using: .utf8),
                  let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
                reject("init_failure", "init was called with arguments that are not a JSON object", nil)
                return
            }

            let config = self.populateConfig(json)
            config.sdkName = Self.sdkName
            config.sdkVersion = Self.sdkVersion

            #if !COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
            if CountlyRNPushNotifications.shared.enablePushNotifications {
                config.features.append(.pushNotifications)
            }
            #endif

            guard !config.host.isEmpty else {
                reject("init_failure", "init was called without a server URL", nil)
                return
            }

            Countly.shared.start(with: config)

            #if !COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
            CountlyRNPushNotifications.shared.recordPushActions()
            #endif

            resolve("Success")
        }
    }

    /// Turns the JSON the JavaScript layer sends into a configuration.
    ///
    /// A key the JavaScript layer considers off is left out of the payload
    /// entirely, so for those flags the key being present is what turns them on.
    private func populateConfig(_ json: [String: Any]) -> CountlyConfig {
        let config = Self.ensureConfig()

        config.appKey = json["appKey"] as? String ?? ""
        config.host = json["serverURL"] as? String ?? ""
        config.enrollABOnRCDownload = true

        if let deviceID = Self.asString(json["deviceID"]), !deviceID.isEmpty {
            if deviceID == "TemporaryDeviceID" {
                config.temporaryDeviceIDMode = true
            } else {
                config.deviceID = deviceID
            }
        }

        if json["loggingEnabled"] != nil {
            config.enableDebug = true
            config.internalLogLevel = .verbose
            Self.loggingEnabled = true
        } else {
            config.enableDebug = false
            Self.loggingEnabled = false
        }

        if json["shouldRequireConsent"] != nil {
            config.requiresConsent = true
        }

        if let salt = json["tamperingProtectionSalt"] as? String {
            config.secretSalt = salt
        }

        if let consents = json["consents"] as? [String] {
            config.consents = consents.compactMap { wireName in
                guard let feature = ConsentFeature(wireName: wireName) else {
                    Self.log("init configuration, unknown consent name: [\(wireName)], omitting it")
                    return nil
                }
                return feature
            }
        }

        // Limits -----------------------------------------------
        if let maxKeyLength = json["maxKeyLength"] as? Int {
            config.sdkInternalLimits.maxKeyLength = maxKeyLength
        }
        if let maxValueSize = json["maxValueSize"] as? Int {
            config.sdkInternalLimits.maxValueSize = maxValueSize
        }
        if let maxSegmentationValues = json["maxSegmentationValues"] as? Int {
            config.sdkInternalLimits.maxSegmentationValues = maxSegmentationValues
        }
        if let maxBreadcrumbCount = json["maxBreadcrumbCount"] as? Int {
            config.sdkInternalLimits.maxBreadcrumbCount = maxBreadcrumbCount
        }
        if let maxStackTraceLineLength = json["maxStackTraceLineLength"] as? Int {
            config.sdkInternalLimits.maxStackTraceLineLength = maxStackTraceLineLength
        }
        if let maxStackTraceLinesPerThread = json["maxStackTraceLinesPerThread"] as? Int {
            config.sdkInternalLimits.maxStackTraceLinesPerThread = maxStackTraceLinesPerThread
        }
        // Limits End -------------------------------------------

        if let zoneTimerInterval = json["setZoneTimerInterval"] as? Int {
            config.content.zoneTimerInterval = zoneTimerInterval
        }

        if json["setGlobalContentCallback"] != nil {
            config.content.globalContentCallback = { status, data in
                let payload: [String: Any] = ["status": status.rawValue, "data": data]
                Self.emit(Self.contentCallbackName, body: Self.toJSONString(payload))
            }
        }

        if let displayOption = json["webViewDisplayOption"] as? String {
            config.content.webViewDisplayOption = displayOption == "SAFE_AREA" ? .safeArea : .immersive
        }

        // APM ------------------------------------------------
        if let enableForegroundBackground = json["enableForegroundBackground"] {
            config.apm.enableForegroundBackgroundTracking = Self.asBool(enableForegroundBackground)
        }
        if let enableManualAppLoaded = json["enableManualAppLoaded"] {
            config.apm.enableManualAppLoadedTrigger = Self.asBool(enableManualAppLoaded)
        }
        if let trackAppStartTime = json["trackAppStartTime"] {
            config.apm.enableAppStartTimeTracking = Self.asBool(trackAppStartTime)
        }
        if let startTSOverride = json["startTSOverride"] as? NSNumber {
            config.apm.appStartTimestampOverride = startTSOverride.int64Value
        }
        // APM END --------------------------------------------

        if json["enablePreviousNameRecording"] != nil {
            config.experimental.enablePreviousNameRecording = true
        }
        if json["enableVisibilityTracking"] != nil {
            config.experimental.enableVisibilityTracking = true
        }
        if let enableAutomaticViewTracking = json["enableAutomaticViewTracking"] {
            config.enableAutomaticViewTracking = Self.asBool(enableAutomaticViewTracking)
        }
        if let exclusionList = json["automaticViewTrackingExclusionList"] as? [String] {
            config.automaticViewTrackingExclusionList = exclusionList
        }
        if let globalViewSegmentation = json["globalViewSegmentation"] as? [String: Any] {
            config.globalViewSegmentation = globalViewSegmentation
        }

        if json["crashReporting"] != nil {
            config.features.append(.crashReporting)
        }

        #if !COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
        if let pushJson = json["pushNotification"] as? [String: Any] {
            config.sendPushTokenAlways = true
            // The JavaScript layer sends the Android numbering, where "1" is
            // development and "2" is ad hoc. Anything else is production, which the
            // Swift SDK expresses by leaving the test mode unset.
            switch pushJson["tokenType"] as? String {
            case "1": config.pushTestMode = .development
            case "2": config.pushTestMode = .testFlightOrAdHoc
            default: config.pushTestMode = nil
            }
        }
        #endif

        if json["locationCountryCode"] != nil {
            let countryCode = Self.asString(json["locationCountryCode"])
            let city = Self.asString(json["locationCity"])
            let locationString = Self.asString(json["locationGpsCoordinates"])
            let ipAddress = Self.asString(json["locationIpAddress"])

            if let locationString, locationString != "null" {
                config.location = Self.coordinate(from: locationString)
            }
            if let city, city != "null" {
                config.city = city
            }
            if let countryCode, countryCode != "null" {
                config.isoCountryCode = countryCode
            }
            if let ipAddress, ipAddress != "null" {
                config.ipAddress = ipAddress
            }
        }

        if let campaignType = json["campaignType"] as? String {
            config.campaignType = campaignType
            config.campaignData = json["campaignData"] as? String
        }

        if let attributionValues = json["attributionValues"] as? [String: String] {
            config.indirectAttribution = attributionValues
        }

        if let timeout = json["requestTimeoutDuration"] as? NSNumber {
            if timeout.intValue > 0 {
                config.requestTimeoutDuration = TimeInterval(timeout.intValue)
            } else {
                Self.log("setRequestTimeoutDuration: failure, timeout value must be greater than 0")
            }
        }

        if let manualSessionHandling = json["manualSessionHandling"] {
            config.manualSessionHandling = Self.asBool(manualSessionHandling)
        }
        if let hybridMode = json["enableManualSessionControlHybridMode"] {
            config.enableManualSessionControlHybridMode = Self.asBool(hybridMode)
        }

        if let headers = json["customNetworkRequestHeaders"] as? [String: String], !headers.isEmpty {
            var merged = config.customNetworkRequestHeaders ?? [:]
            for (key, value) in headers where !key.isEmpty {
                merged[key] = value
            }
            config.customNetworkRequestHeaders = merged
        }

        if let disableViewRestart = json["disableViewRestartForManualRecording"] {
            config.disableViewRestartForManualRecording = Self.asBool(disableViewRestart)
        }

        // The capture protocol has to sit on the session the SDK will use, so it is
        // installed here rather than when capture is switched on.
        config.urlSessionConfiguration = CountlyRNRequestCapture.configuration(from: config.urlSessionConfiguration)
        CountlyRNRequestCapture.capturedHost = URLComponents(string: config.host)?.host

        if let disableSDKBehaviorSettingsUpdates = json["disableSDKBehaviorSettingsUpdates"] {
            config.disableSDKBehaviorSettingsUpdates = Self.asBool(disableSDKBehaviorSettingsUpdates)
        }
        if let disableBackoffMechanism = json["disableBackoffMechanism"] {
            config.disableBackoffMechanism = Self.asBool(disableBackoffMechanism)
        }
        if let settings = json["sdkBehaviorSettings"] {
            if let settingsString = settings as? String {
                config.sdkBehaviorSettings = settingsString
            } else if let settingsString = Self.toJSONString(settings) {
                config.sdkBehaviorSettings = settingsString
            } else {
                Self.log("Error serializing sdkBehaviorSettings")
            }
        }

        return config
    }

    // MARK: - Device ID

    @objc(setID:)
    func setID(_ newDeviceID: String) {
        Self.onMain {
            if newDeviceID == "TemporaryDeviceID" {
                Countly.shared.deviceID.enableTemporaryIDMode()
            } else {
                Countly.shared.deviceID.setID(newDeviceID)
            }
        }
    }

    @objc(changeDeviceId:)
    func changeDeviceId(_ arguments: [Any]) {
        Self.onMain {
            guard let newDeviceID = Self.asString(arguments.first) else { return }
            if newDeviceID == "TemporaryDeviceID" {
                Countly.shared.deviceID.enableTemporaryIDMode()
                return
            }

            let onServer = arguments.count > 1 && Self.asBool(arguments[1])
            if onServer {
                Countly.shared.deviceID.changeWithMerge(newDeviceID)
            } else {
                Countly.shared.deviceID.changeWithoutMerge(newDeviceID)
            }
        }
    }

    @objc(getCurrentDeviceId:rejecter:)
    func getCurrentDeviceId(_ resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            resolve(Countly.shared.deviceID.current ?? "deviceIdNotFound")
        }
    }

    @objc(getDeviceIDType:rejecter:)
    func getDeviceIDType(_ resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            // The JavaScript layer maps these numbers back to its own enum.
            switch Countly.shared.deviceID.type {
            case .developerSupplied: resolve(20202)
            case .temporary: resolve(30303)
            default: resolve(10101)
            }
        }
    }

    // MARK: - Events

    @objc(recordEvent:)
    func recordEvent(_ arguments: [String: Any]) {
        Self.onMain {
            guard let key = arguments["n"] as? String else { return }
            let count = (arguments["c"] as? NSNumber)?.intValue ?? 1
            let sum = (arguments["s"] as? NSNumber)?.doubleValue ?? 0
            let segmentation = Self.keyValuePairs(from: arguments["g"] as? [Any] ?? [], startIndex: 0)

            Countly.shared.events.recordEvent(key, segmentation: segmentation, count: count, sum: sum)
        }
    }

    @objc(startEvent:)
    func startEvent(_ arguments: [Any]) {
        Self.onMain {
            guard let key = Self.asString(arguments.first) else { return }
            Countly.shared.events.startEvent(key)
        }
    }

    @objc(cancelEvent:)
    func cancelEvent(_ arguments: [Any]) {
        Self.onMain {
            guard let key = Self.asString(arguments.first) else { return }
            Countly.shared.events.cancelEvent(key)
        }
    }

    @objc(endEvent:)
    func endEvent(_ arguments: [String: Any]) {
        Self.onMain {
            guard let key = arguments["n"] as? String else { return }
            let count = (arguments["c"] as? NSNumber)?.intValue ?? 1
            let sum = (arguments["s"] as? NSNumber)?.doubleValue ?? 0
            let segmentation = Self.keyValuePairs(from: arguments["g"] as? [Any] ?? [], startIndex: 0)

            Countly.shared.events.endEvent(key, segmentation: segmentation, count: count, sum: sum)
        }
    }

    @objc(setEventSendThreshold:)
    func setEventSendThreshold(_ arguments: [Any]) {
        Self.onMain {
            guard let size = arguments.first else { return }
            let threshold = (size as? NSNumber)?.intValue ?? Int(Self.asString(size) ?? "") ?? 0
            Self.ensureConfig().eventSendThreshold = threshold
        }
    }

    // MARK: - Views

    @objc(recordView:)
    func recordView(_ arguments: [Any]) {
        Self.onMain {
            guard let viewName = Self.asString(arguments.first) else { return }
            let segmentation = Self.keyValuePairs(from: arguments, startIndex: 1)
            _ = Countly.shared.views.startAutoStoppedView(viewName, segmentation: segmentation)
        }
    }

    @objc(startAutoStoppedView:resolver:rejecter:)
    func startAutoStoppedView(_ arguments: [Any],
                              resolver resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            guard let viewName = Self.asString(arguments.first) else {
                resolve(NSNull())
                return
            }
            let segmentation = Self.keyValuePairs(from: arguments, startIndex: 1)
            resolve(Countly.shared.views.startAutoStoppedView(viewName, segmentation: segmentation) ?? NSNull())
        }
    }

    @objc(startView:resolver:rejecter:)
    func startView(_ arguments: [Any],
                   resolver resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            guard let viewName = Self.asString(arguments.first) else {
                resolve(NSNull())
                return
            }
            let segmentation = Self.keyValuePairs(from: arguments, startIndex: 1)
            resolve(Countly.shared.views.startView(viewName, segmentation: segmentation) ?? NSNull())
        }
    }

    @objc(stopViewWithName:)
    func stopViewWithName(_ arguments: [Any]) {
        Self.onMain {
            guard let viewName = Self.asString(arguments.first) else { return }
            Countly.shared.views.stopView(name: viewName, segmentation: Self.keyValuePairs(from: arguments, startIndex: 1))
        }
    }

    @objc(stopViewWithID:)
    func stopViewWithID(_ arguments: [Any]) {
        Self.onMain {
            guard let viewID = Self.asString(arguments.first) else { return }
            Countly.shared.views.stopView(id: viewID, segmentation: Self.keyValuePairs(from: arguments, startIndex: 1))
        }
    }

    @objc(stopAllViews:)
    func stopAllViews(_ arguments: [Any]) {
        Self.onMain {
            Countly.shared.views.stopAllViews(segmentation: Self.keyValuePairs(from: arguments, startIndex: 0))
        }
    }

    @objc(pauseViewWithID:)
    func pauseViewWithID(_ arguments: [Any]) {
        Self.onMain {
            guard let viewID = Self.asString(arguments.first) else { return }
            Countly.shared.views.pauseView(id: viewID)
        }
    }

    @objc(resumeViewWithID:)
    func resumeViewWithID(_ arguments: [Any]) {
        Self.onMain {
            guard let viewID = Self.asString(arguments.first) else { return }
            Countly.shared.views.resumeView(id: viewID)
        }
    }

    @objc(addSegmentationToViewWithID:)
    func addSegmentationToViewWithID(_ arguments: [Any]) {
        Self.onMain {
            guard let viewID = Self.asString(arguments.first),
                  let segmentation = Self.keyValuePairs(from: arguments, startIndex: 1) else { return }
            Countly.shared.views.addSegmentation(toViewWithID: viewID, segmentation: segmentation)
        }
    }

    @objc(addSegmentationToViewWithName:)
    func addSegmentationToViewWithName(_ arguments: [Any]) {
        Self.onMain {
            guard let viewName = Self.asString(arguments.first),
                  let segmentation = Self.keyValuePairs(from: arguments, startIndex: 1) else { return }
            Countly.shared.views.addSegmentation(toViewWithName: viewName, segmentation: segmentation)
        }
    }

    @objc(setGlobalViewSegmentation:)
    func setGlobalViewSegmentation(_ arguments: [Any]) {
        Self.onMain {
            Countly.shared.views.setGlobalViewSegmentation(Self.keyValuePairs(from: arguments, startIndex: 0) ?? [:])
        }
    }

    @objc(updateGlobalViewSegmentation:)
    func updateGlobalViewSegmentation(_ arguments: [Any]) {
        Self.onMain {
            Countly.shared.views.updateGlobalViewSegmentation(Self.keyValuePairs(from: arguments, startIndex: 0) ?? [:])
        }
    }

    // MARK: - Sessions

    @objc(startSession)
    func startSession() {
        Self.onMain { Countly.shared.sessions.beginSession() }
    }

    @objc(updateSession)
    func updateSession() {
        Self.onMain { Countly.shared.sessions.updateSession() }
    }

    @objc(endSession)
    func endSession() {
        Self.onMain { Countly.shared.sessions.endSession() }
    }

    // MARK: - Configuration touched after construction

    @objc(setLoggingEnabled:)
    func setLoggingEnabled(_ arguments: [Any]) {
        Self.onMain {
            let enabled = Self.asBool(arguments.first)
            let config = Self.ensureConfig()
            config.enableDebug = enabled
            if enabled {
                config.internalLogLevel = .verbose
            }
            Self.loggingEnabled = enabled
        }
    }

    @objc(isLoggingEnabled:rejecter:)
    func isLoggingEnabled(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain { resolve(Self.loggingEnabled) }
    }

    @objc(isInitialized:rejecter:)
    func isInitialized(_ resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain { resolve(Countly.shared.isStarted) }
    }

    @objc(setHttpPostForced:)
    func setHttpPostForced(_ arguments: [Any]) {
        Self.onMain {
            Self.ensureConfig().alwaysUsePOST = Self.asBool(arguments.first)
        }
    }

    @objc(pinnedCertificates:)
    func pinnedCertificates(_ arguments: [Any]) {
        Self.onMain {
            guard let certificateName = Self.asString(arguments.first) else { return }
            Self.ensureConfig().pinnedCertificates = [certificateName]
        }
    }

    @objc(setCustomMetrics:)
    func setCustomMetrics(_ arguments: [Any]) {
        Self.onMain {
            let metrics = Self.keyValuePairs(from: arguments, startIndex: 0) ?? [:]
            Self.ensureConfig().customMetrics = metrics.compactMapValues { $0 as? String }
        }
    }

    @objc(recordMetrics:)
    func recordMetrics(_ arguments: [Any]) {
        Self.onMain {
            let metrics = Self.keyValuePairs(from: arguments, startIndex: 0) ?? [:]
            Countly.shared.recordMetrics(metrics.compactMapValues { $0 as? String })
        }
    }

    @objc(addCustomNetworkRequestHeaders:)
    func addCustomNetworkRequestHeaders(_ arguments: [Any]) {
        Self.onMain {
            let headers = Self.keyValuePairs(from: arguments, startIndex: 0) ?? [:]
            Countly.shared.addCustomNetworkRequestHeaders(headers.compactMapValues { $0 as? String })
        }
    }

    @objc(replaceAllAppKeysInQueueWithCurrentAppKey)
    func replaceAllAppKeysInQueueWithCurrentAppKey() {
        Self.onMain { Countly.shared.requestQueue.replaceAllAppKeysInQueueWithCurrentAppKey() }
    }

    @objc(removeDifferentAppKeysFromQueue)
    func removeDifferentAppKeysFromQueue() {
        Self.onMain { Countly.shared.requestQueue.removeDifferentAppKeysFromQueue() }
    }

    // MARK: - Location

    @objc(setLocation:)
    func setLocation(_ arguments: [Any]) {
        Self.onMain {
            func value(_ index: Int) -> String? {
                guard arguments.count > index, let text = Self.asString(arguments[index]), text != "null" else { return nil }
                return text
            }

            Countly.shared.location.recordLocation(Self.coordinate(from: value(2)),
                                                   city: value(1),
                                                   isoCountryCode: value(0),
                                                   ipAddress: value(3))
        }
    }

    @objc(disableLocation)
    func disableLocation() {
        Self.onMain { Countly.shared.location.disableLocationInfo() }
    }

    // MARK: - Crashes

    @objc(addCrashLog:)
    func addCrashLog(_ arguments: [Any]) {
        Self.onMain {
            guard let log = Self.asString(arguments.first) else { return }
            Countly.shared.crashes.addCrashBreadcrumb(log)
        }
    }

    @objc(setCustomCrashSegments:)
    func setCustomCrashSegments(_ arguments: [Any]) {
        Self.onMain {
            let segmentation = Self.keyValuePairs(from: arguments, startIndex: 0) ?? [:]
            if Countly.shared.isStarted {
                Countly.shared.crashes.setCrashSegmentation(segmentation)
            } else {
                Self.ensureConfig().crashSegmentation = segmentation
            }
        }
    }

    @objc(logException:)
    func logException(_ arguments: [Any]) {
        Self.onMain {
            guard let exceptionString = Self.asString(arguments.first) else { return }

            var segmentation = Self.keyValuePairs(from: arguments, startIndex: 2) ?? [:]
            // The fatality flag rides along as segmentation, which is what the
            // Objective-C bridge did and what the dashboard already shows.
            segmentation["nonfatal"] = arguments.count > 1 ? arguments[1] : true

            let exception = NSException(name: NSExceptionName("Exception"),
                                        reason: exceptionString,
                                        userInfo: nil)
            // Always handled, the same as the Android bridge: the JavaScript layer's
            // fatality argument has never chosen the crash type on either platform.
            Countly.shared.crashes.recordException(exception,
                                                   isFatal: false,
                                                   stackTrace: exceptionString.components(separatedBy: "\n"),
                                                   segmentation: segmentation)
        }
    }

    @objc(logJSException:withMessage:withStack:)
    func logJSException(_ errTitle: String, withMessage message: String, withStack stackTrace: String) {
        Self.onMain {
            let exception = NSException(name: NSExceptionName(errTitle), reason: message, userInfo: nil)
            Countly.shared.crashes.recordException(exception,
                                                   isFatal: false,
                                                   stackTrace: stackTrace.components(separatedBy: "\n"),
                                                   segmentation: ["nonfatal": "1"])
        }
    }

    // MARK: - User profile

    @objc(setUserData:resolver:rejecter:)
    func setUserData(_ arguments: [Any],
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            self.setUserDataInternal(arguments.first as? [String: Any])
            resolve("Success")
        }
    }

    @objc(userDataBulk_setUserProperties:resolver:rejecter:)
    func userDataBulkSetUserProperties(_ userProperties: [String: Any],
                                       resolver resolve: @escaping RCTPromiseResolveBlock,
                                       rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            self.setUserDataInternal(userProperties)
            resolve("Success")
        }
    }

    /// Applies a user data payload: predefined fields land on their own fields and
    /// everything else, including the contents of an explicit `custom` object,
    /// becomes a custom property.
    private func setUserDataInternal(_ userData: [String: Any]?) {
        guard var data = userData else { return }

        if let explicitCustom = data.removeValue(forKey: "custom") as? [String: Any] {
            for (key, value) in explicitCustom {
                data[key] = value
            }
        }

        guard !data.isEmpty else { return }
        Countly.shared.userProfile.setProperties(data)
    }

    @objc(userData_setProperty:resolver:rejecter:)
    func userDataSetProperty(_ arguments: [Any],
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first) {
                Countly.shared.userProfile.setCustomProperty(key, value: arguments.count > 1 ? arguments[1] : nil)
            }
            resolve("Success")
        }
    }

    @objc(userData_increment:resolver:rejecter:)
    func userDataIncrement(_ arguments: [Any],
                           resolver resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first) {
                Countly.shared.userProfile.increment(key)
            }
            resolve("Success")
        }
    }

    @objc(userData_incrementBy:resolver:rejecter:)
    func userDataIncrementBy(_ arguments: [Any],
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first) {
                Countly.shared.userProfile.incrementBy(key, value: Self.number(arguments, at: 1))
            }
            resolve("Success")
        }
    }

    @objc(userData_multiply:resolver:rejecter:)
    func userDataMultiply(_ arguments: [Any],
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first) {
                Countly.shared.userProfile.multiply(key, value: Self.number(arguments, at: 1))
            }
            resolve("Success")
        }
    }

    @objc(userData_saveMax:resolver:rejecter:)
    func userDataSaveMax(_ arguments: [Any],
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first) {
                Countly.shared.userProfile.max(key, value: Self.number(arguments, at: 1))
            }
            resolve("Success")
        }
    }

    @objc(userData_saveMin:resolver:rejecter:)
    func userDataSaveMin(_ arguments: [Any],
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first) {
                Countly.shared.userProfile.min(key, value: Self.number(arguments, at: 1))
            }
            resolve("Success")
        }
    }

    @objc(userData_setOnce:resolver:rejecter:)
    func userDataSetOnce(_ arguments: [Any],
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first), arguments.count > 1 {
                Countly.shared.userProfile.setOnce(key, value: arguments[1])
            }
            resolve("Success")
        }
    }

    @objc(userData_pushUniqueValue:resolver:rejecter:)
    func userDataPushUniqueValue(_ arguments: [Any],
                                 resolver resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first), arguments.count > 1 {
                Countly.shared.userProfile.pushUnique(key, value: arguments[1])
            }
            resolve("Success")
        }
    }

    @objc(userData_pushValue:resolver:rejecter:)
    func userDataPushValue(_ arguments: [Any],
                           resolver resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first), arguments.count > 1 {
                Countly.shared.userProfile.push(key, value: arguments[1])
            }
            resolve("Success")
        }
    }

    @objc(userData_pullValue:resolver:rejecter:)
    func userDataPullValue(_ arguments: [Any],
                           resolver resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first), arguments.count > 1 {
                Countly.shared.userProfile.pull(key, value: arguments[1])
            }
            resolve("Success")
        }
    }

    @objc(userDataBulk_save:resolver:rejecter:)
    func userDataBulkSave(_ arguments: [Any],
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            Countly.shared.userProfile.save()
            resolve("Success")
        }
    }

    // The bulk variants stage the same operations; the SDK sends them when the
    // queue is flushed or `userDataBulk_save` is called.
    @objc(userDataBulk_setProperty:resolver:rejecter:)
    func userDataBulkSetProperty(_ arguments: [Any],
                                 resolver resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataSetProperty(arguments, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_increment:resolver:rejecter:)
    func userDataBulkIncrement(_ arguments: [Any],
                               resolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataIncrement(arguments, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_incrementBy:resolver:rejecter:)
    func userDataBulkIncrementBy(_ arguments: [Any],
                                 resolver resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataIncrementBy(arguments, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_multiply:resolver:rejecter:)
    func userDataBulkMultiply(_ arguments: [Any],
                              resolver resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataMultiply(arguments, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_saveMax:resolver:rejecter:)
    func userDataBulkSaveMax(_ arguments: [Any],
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataSaveMax(arguments, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_saveMin:resolver:rejecter:)
    func userDataBulkSaveMin(_ arguments: [Any],
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataSaveMin(arguments, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_setOnce:resolver:rejecter:)
    func userDataBulkSetOnce(_ arguments: [Any],
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataSetOnce(arguments, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_pushUniqueValue:resolver:rejecter:)
    func userDataBulkPushUniqueValue(_ arguments: [Any],
                                     resolver resolve: @escaping RCTPromiseResolveBlock,
                                     rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataPushUniqueValue(arguments, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_pushValue:resolver:rejecter:)
    func userDataBulkPushValue(_ arguments: [Any],
                               resolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataPushValue(arguments, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_pullValue:resolver:rejecter:)
    func userDataBulkPullValue(_ arguments: [Any],
                               resolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataPullValue(arguments, resolver: resolve, rejecter: reject)
    }

    /// Reads a numeric modifier argument, which the JavaScript layer sends as a
    /// string.
    private static func number(_ arguments: [Any], at index: Int) -> Double {
        guard arguments.count > index else { return 0 }
        if let number = arguments[index] as? NSNumber { return number.doubleValue }
        if let text = arguments[index] as? String { return Double(text) ?? 0 }
        return 0
    }

    // MARK: - Consent

    @objc(giveConsent:)
    func giveConsent(_ arguments: [Any]) {
        Self.onMain {
            Countly.shared.consent.giveConsent(for: Self.features(from: arguments))
        }
    }

    @objc(removeConsent:)
    func removeConsent(_ arguments: [Any]) {
        Self.onMain {
            Countly.shared.consent.cancelConsent(for: Self.features(from: arguments))
        }
    }

    @objc(giveAllConsent)
    func giveAllConsent() {
        Self.onMain { Countly.shared.consent.giveAllConsents() }
    }

    @objc(removeAllConsent)
    func removeAllConsent() {
        Self.onMain { Countly.shared.consent.cancelAllConsents() }
    }

    /// Maps the wire names the JavaScript layer sends onto features, dropping any
    /// name this SDK does not know.
    private static func features(from arguments: [Any]) -> [ConsentFeature] {
        arguments.compactMap { argument in
            guard let wireName = argument as? String else { return nil }
            guard let feature = ConsentFeature(wireName: wireName) else {
                log("unknown consent name: [\(wireName)], omitting it")
                return nil
            }
            return feature
        }
    }

    // MARK: - Attribution

    @objc(recordDirectAttribution:)
    func recordDirectAttribution(_ arguments: [Any]) {
        Self.onMain {
            guard let campaignType = Self.asString(arguments.first),
                  arguments.count > 1, let campaignData = Self.asString(arguments[1]) else { return }

            if Countly.shared.isStarted {
                Countly.shared.attribution.recordDirectAttribution(campaignType: campaignType, campaignData: campaignData)
            } else {
                let config = Self.ensureConfig()
                config.campaignType = campaignType
                config.campaignData = campaignData
            }
        }
    }

    @objc(recordIndirectAttribution:)
    func recordIndirectAttribution(_ arguments: [Any]) {
        Self.onMain {
            guard let attribution = arguments.first as? [String: String] else { return }
            if Countly.shared.isStarted {
                Countly.shared.attribution.recordIndirectAttribution(attribution)
            } else {
                Self.ensureConfig().indirectAttribution = attribution
            }
        }
    }

    // MARK: - Remote config

    @objc(remoteConfigUpdate:callback:)
    func remoteConfigUpdate(_ arguments: [Any], callback: @escaping RCTResponseSenderBlock) {
        Self.onMain {
            Countly.shared.remoteConfig.downloadKeys { result, error, _, _ in
                callback([[Self.remoteConfigMessage(result, error, success: "Remote Config is updated and ready to use!")]])
            }
        }
    }

    @objc(updateRemoteConfigForKeysOnly:callback:)
    func updateRemoteConfigForKeysOnly(_ arguments: [Any], callback: @escaping RCTResponseSenderBlock) {
        Self.onMain {
            let keys = arguments.compactMap { $0 as? String }
            Countly.shared.remoteConfig.downloadSpecificKeys(keys) { result, error, _, _ in
                callback([[Self.remoteConfigMessage(result, error, success: "Remote Config is updated only for given keys and ready to use!")]])
            }
        }
    }

    @objc(updateRemoteConfigExceptKeys:callback:)
    func updateRemoteConfigExceptKeys(_ arguments: [Any], callback: @escaping RCTResponseSenderBlock) {
        Self.onMain {
            let keys = arguments.compactMap { $0 as? String }
            Countly.shared.remoteConfig.downloadOmittingKeys(keys) { result, error, _, _ in
                callback([[Self.remoteConfigMessage(result, error, success: "Remote Config is updated except for given keys and ready to use !")]])
            }
        }
    }

    @objc(getRemoteConfigValueForKey:callback:)
    func getRemoteConfigValueForKey(_ arguments: [Any], callback: @escaping RCTResponseSenderBlock) {
        Self.onMain {
            guard let key = Self.asString(arguments.first) else {
                callback(["ConfigKeyNotFound"])
                return
            }
            callback([Countly.shared.remoteConfig.getValue(key).value ?? "ConfigKeyNotFound"])
        }
    }

    @objc(remoteConfigClearValues:rejecter:)
    func remoteConfigClearValues(_ resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            Countly.shared.remoteConfig.clearAll()
            resolve("Remote Config Cleared.")
        }
    }

    private static func remoteConfigMessage(_ result: RequestResult, _ error: Error?, success: String) -> String {
        guard result == .success, error == nil else {
            let description = error.map { String(describing: $0) } ?? "request failed"
            return "There was an error while updating Remote Config: \(description)"
        }
        return success
    }

    // MARK: - Feedback widgets

    @objc(getFeedbackWidgets:rejecter:)
    func getFeedbackWidgets(_ resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            Countly.shared.feedback.getAvailableFeedbackWidgets { widgets, error in
                if let error {
                    reject("getFeedbackWidgets_failure", error.localizedDescription, nil)
                    return
                }

                let widgets = widgets ?? []
                Self.feedbackWidgetList = widgets
                resolve(widgets.map { widget in
                    [
                        "id": widget.id,
                        "type": widget.type.wireName,
                        "name": widget.name,
                        "tags": widget.tags,
                        "widgetVersion": widget.widgetVersion as Any? ?? NSNull(),
                    ]
                })
            }
        }
    }

    @objc(getAvailableFeedbackWidgets:rejecter:)
    func getAvailableFeedbackWidgets(_ resolve: @escaping RCTPromiseResolveBlock,
                                     rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            Countly.shared.feedback.getAvailableFeedbackWidgets { widgets, error in
                if let error {
                    reject("getAvailableFeedbackWidgets_failure", error.localizedDescription, nil)
                    return
                }

                var byType: [String: String] = [:]
                for widget in widgets ?? [] {
                    byType[widget.type.wireName] = widget.id
                }
                resolve(byType)
            }
        }
    }

    @objc(getFeedbackWidgetData:resolver:rejecter:)
    func getFeedbackWidgetData(_ arguments: [Any],
                               resolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            let widgetID = Self.asString(arguments.first) ?? ""
            guard let widget = Self.feedbackWidget(widgetID) else {
                let message = "No feedbackWidget is found against widget Id : '\(widgetID)', always call 'getAvailableFeedbackWidgets' to get an updated list of feedback widgets."
                Self.log(message)
                reject("getFeedbackWidgetData_failure", message, nil)
                return
            }

            widget.getWidgetData { data, error in
                if let error {
                    reject("getFeedbackWidgetData_failure", "getFeedbackWidgetData failed: \(error.localizedDescription)", nil)
                } else {
                    resolve(data ?? [:])
                }
            }
        }
    }

    @objc(reportFeedbackWidgetManually:resolver:rejecter:)
    func reportFeedbackWidgetManually(_ arguments: [Any],
                                      resolver resolve: @escaping RCTPromiseResolveBlock,
                                      rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            let widgetInfo = arguments.first as? [Any] ?? []
            let widgetID = Self.asString(widgetInfo.first) ?? ""
            let widgetResult = arguments.count > 2 ? arguments[2] as? [String: Any] : nil

            guard let widget = Self.feedbackWidget(widgetID) else {
                let message = "No feedbackWidget is found against widget Id : '\(widgetID)', always call 'getAvailableFeedbackWidgets' to get an updated list of feedback widgets."
                Self.log(message)
                reject("reportFeedbackWidgetManually_failure", message, nil)
                return
            }

            widget.recordResult(widgetResult)
            resolve("reportFeedbackWidgetManually success")
        }
    }

    @objc(presentFeedbackWidget:)
    func presentFeedbackWidget(_ arguments: [Any]) {
        Self.onMain {
            let widgetID = Self.asString(arguments.first) ?? ""
            let widgetType = arguments.count > 1 ? Self.asString(arguments[1]) : nil
            let widgetName = arguments.count > 2 ? Self.asString(arguments[2]) : nil
            let widgetVersion = arguments.count > 4 ? Self.asString(arguments[4]) : nil

            var widget = Self.feedbackWidget(widgetID)
            // The JavaScript layer holds its own widget list, so a widget it asks for
            // is not necessarily one this side fetched. Rebuilding it from what
            // JavaScript sent is what lets the widget be presented at all, and the
            // version matters because it decides how the widget renders.
            if widget == nil || (widgetVersion?.isEmpty == false && widget?.widgetVersion == nil) {
                var description: [String: Any] = ["_id": widgetID]
                if let widgetType { description["type"] = widgetType }
                if let widgetName { description["name"] = widgetName }
                if let widgetVersion, !widgetVersion.isEmpty { description["wv"] = widgetVersion }
                widget = Countly.shared.feedback.widget(from: description)
            }

            guard let widget else {
                Self.log("presentFeedbackWidget, no widget could be built for widget Id : '\(widgetID)'")
                return
            }

            widget.present(appearBlock: {
                Self.emit(Self.widgetShownCallbackName, body: nil)
            }, dismissBlock: {
                Self.emit(Self.widgetClosedCallbackName, body: nil)
            })
        }
    }

    @objc(presentNPS:)
    func presentNPS(_ arguments: [Any]) {
        Self.onMain {
            Countly.shared.feedback.presentNPS(Self.asString(arguments.first), callback: Self.widgetStateCallback)
        }
    }

    @objc(presentSurvey:)
    func presentSurvey(_ arguments: [Any]) {
        Self.onMain {
            Countly.shared.feedback.presentSurvey(Self.asString(arguments.first), callback: Self.widgetStateCallback)
        }
    }

    @objc(presentRating:)
    func presentRating(_ arguments: [Any]) {
        Self.onMain {
            Countly.shared.feedback.presentRating(Self.asString(arguments.first), callback: Self.widgetStateCallback)
        }
    }

    @objc(presentRatingWidgetWithID:)
    func presentRatingWidgetWithID(_ arguments: [Any]) {
        Self.onMain {
            guard let widgetID = Self.asString(arguments.first) else { return }
            Countly.shared.feedback.presentRating(widgetID) { state in
                Self.widgetStateCallback(state)
                if state == .closed {
                    // The Objective-C SDK reported a presentation failure through this
                    // event; the Swift SDK reports the widget's state instead, so the
                    // error slot stays empty.
                    Self.emit(Self.ratingWidgetCallbackName, body: nil)
                }
            }
        }
    }

    @objc(showStarRating:callback:)
    func showStarRating(_ arguments: [Any], callback: @escaping RCTResponseSenderBlock) {
        // The Swift SDK has no star rating dialog, so there is no rating to report
        // and the callback is left uncalled rather than invented. Android is
        // unaffected.
        Self.log("showStarRating, the star rating dialog is not available on iOS, this call does nothing")
    }

    private static func feedbackWidget(_ widgetID: String) -> CountlyFeedbackWidget? {
        feedbackWidgetList.first { $0.id == widgetID }
    }

    private static let widgetStateCallback: WidgetCallback = { state in
        switch state {
        case .appeared: emit(widgetShownCallbackName, body: nil)
        case .closed: emit(widgetClosedCallbackName, body: nil)
        default: break
        }
    }

    // MARK: - Content

    @objc(enterContentZone)
    func enterContentZone() {
        Self.onMain { Countly.shared.content.enterContentZone() }
    }

    @objc(refreshContentZone)
    func refreshContentZone() {
        Self.onMain { Countly.shared.content.refreshContentZone() }
    }

    @objc(exitContentZone)
    func exitContentZone() {
        Self.onMain { Countly.shared.content.exitContentZone() }
    }

    @objc(previewContent:)
    func previewContent(_ arguments: [Any]) {
        Self.onMain {
            guard let contentID = Self.asString(arguments.first) else { return }
            Countly.shared.content.previewContent(contentID)
        }
    }

    // MARK: - Performance monitoring

    @objc(startTrace:)
    func startTrace(_ arguments: [Any]) {
        Self.onMain {
            guard let traceKey = Self.asString(arguments.first) else { return }
            Countly.shared.performance.startCustomTrace(traceKey)
        }
    }

    @objc(cancelTrace:)
    func cancelTrace(_ arguments: [Any]) {
        Self.onMain {
            guard let traceKey = Self.asString(arguments.first) else { return }
            Countly.shared.performance.cancelCustomTrace(traceKey)
        }
    }

    @objc(clearAllTraces:)
    func clearAllTraces(_ arguments: [Any]) {
        Self.onMain { Countly.shared.performance.clearAllCustomTraces() }
    }

    @objc(endTrace:)
    func endTrace(_ arguments: [Any]) {
        Self.onMain {
            guard let traceKey = Self.asString(arguments.first) else { return }
            Countly.shared.performance.endCustomTrace(traceKey, metrics: Self.keyValuePairs(from: arguments, startIndex: 1))
        }
    }

    @objc(recordNetworkTrace:)
    func recordNetworkTrace(_ arguments: [Any]) {
        Self.onMain {
            guard let traceKey = Self.asString(arguments.first), arguments.count > 5 else { return }

            func integer(_ index: Int) -> Int {
                if let number = arguments[index] as? NSNumber { return number.intValue }
                if let text = arguments[index] as? String { return Int(text) ?? 0 }
                return 0
            }

            func timestamp(_ index: Int) -> Int64 {
                if let number = arguments[index] as? NSNumber { return number.int64Value }
                if let text = arguments[index] as? String { return Int64(text) ?? 0 }
                return 0
            }

            Countly.shared.performance.recordNetworkTrace(traceKey,
                                                          requestPayloadSize: integer(2),
                                                          responsePayloadSize: integer(3),
                                                          responseStatusCode: integer(1),
                                                          startTime: timestamp(4),
                                                          endTime: timestamp(5))
        }
    }

    @objc(appLoadingFinished)
    func appLoadingFinished() {
        Self.onMain { Countly.shared.performance.appLoadingFinished() }
    }

    // MARK: - Push notifications

    @objc(disablePushNotifications)
    func disablePushNotifications() {
        #if !COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
        CountlyRNPushNotifications.shared.disablePushNotifications()
        #endif
    }

    @objc(sendPushToken:)
    func sendPushToken(_ arguments: [Any]) {
        // The SDK reports the token itself once the application hands it to
        // `Countly.didRegisterForRemoteNotifications`. The Objective-C bridge built
        // a token request here and never sent it, so nothing is lost by saying so.
        Self.log("sendPushToken, the SDK reports the push token itself, this call does nothing")
    }

    @objc(askForNotificationPermission:)
    func askForNotificationPermission(_ arguments: [Any]) {
        #if !COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
        CountlyRNPushNotifications.shared.askForNotificationPermission()
        #endif
    }

    @objc(registerForNotification:)
    func registerForNotification(_ arguments: [Any]) {
        #if !COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
        CountlyRNPushNotifications.shared.registerForNotification { json in
            Self.emit(Self.pushNotificationCallbackName, body: json)
        }
        #endif
    }

    #if !COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
    /// Called from the host application's delegate, before the SDK starts.
    @objc public static func startObservingNotifications() {
        CountlyRNPushNotifications.shared.startObservingNotifications()
    }

    @objc public static func onNotification(_ notification: [AnyHashable: Any]?) {
        CountlyRNPushNotifications.shared.onNotification(notification)
    }

    @objc public static func onNotificationResponse(_ response: UNNotificationResponse) {
        CountlyRNPushNotifications.shared.onNotificationResponse(response)
    }
    #endif

    // MARK: - Test helpers

    @objc(enableRequestCapture:rejecter:)
    func enableRequestCapture(_ resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            CountlyRNRequestCapture.isEnabled = true
            CountlyRNRequestCapture.reset()
            resolve(nil)
        }
    }

    @objc(getCapturedRequests:rejecter:)
    func getCapturedRequests(_ resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain { resolve(CountlyRNRequestCapture.captured) }
    }

    @objc(getRequestQueue:rejecter:)
    func getRequestQueue(_ resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain { resolve(Countly.shared.requestQueue.queuedRequests()) }
    }

    @objc(getEventQueue:rejecter:)
    func getEventQueue(_ resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain { resolve(Countly.shared.events.recordedEvents()) }
    }

    @objc(halt:rejecter:)
    func halt(_ resolve: @escaping RCTPromiseResolveBlock,
              rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            Countly.shared.halt(clearStorage: true)
            Self.config = nil
            Self.feedbackWidgetList = []
            Self.loggingEnabled = false
            #if !COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
            CountlyRNPushNotifications.shared.enablePushNotifications = true
            #endif
            CountlyRNRequestCapture.isEnabled = false
            CountlyRNRequestCapture.reset()
            CountlyRNRequestCapture.capturedHost = nil
            resolve(nil)
        }
    }
}
