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

    static let sdkVersion = "26.8.0"
    static let sdkName = "js-rnb-ios"

    // MARK: - Event names

    static let widgetShownCallbackName = "widgetShownCallback"
    static let widgetClosedCallbackName = "widgetClosedCallback"
    static let ratingWidgetCallbackName = "ratingWidgetCallback"
    static let pushNotificationCallbackName = "pushNotificationCallback"
    static let contentCallbackName = "globalContentCallback"
    static let contentUrlHandlerName = "contentUrlHandler"

    // MARK: - State

    /// The configuration being assembled until `init` runs, per instance. The JavaScript layer is
    /// allowed to touch a few settings before init, so this outlives a single call.
    static var configs: [String: CountlyConfig] = [:]

    /// The widgets each instance last listed, so a widget ID is presented on the instance that fetched it.
    static var feedbackWidgetLists: [String: [CountlyFeedbackWidget]] = [:]

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
            Self.contentUrlHandlerName,
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

    /// The instance a call is meant for.
    ///
    /// - Parameter instanceName: the instance name the JavaScript layer sent, empty for the default one.
    /// - Returns: the instance the call applies to, created when it does not exist yet.
    static func countly(_ instanceName: String) -> CountlyInstance {
        isDefaultInstance(instanceName) ? Countly.shared : Countly.instance(named: instanceName)
    }

    /// Whether a call is meant for the default instance.
    ///
    /// - Parameter instanceName: the instance name the JavaScript layer sent.
    /// - Returns: true when the call carries no name or the default one.
    static func isDefaultInstance(_ instanceName: String) -> Bool {
        instanceName.isEmpty || instanceName == Countly.defaultInstanceName
    }

    /// The key an instance's state is stored under.
    ///
    /// - Parameter instanceName: the instance name the JavaScript layer sent.
    /// - Returns: the name, or the empty string for the default instance.
    static func instanceKey(_ instanceName: String) -> String {
        isDefaultInstance(instanceName) ? "" : instanceName
    }

    /// The instance a call is meant for, without creating one.
    ///
    /// - Parameter instanceName: the instance name the JavaScript layer sent, empty for the default one.
    /// - Returns: the instance, or `nil` when no instance carries that name.
    static func existingCountly(_ instanceName: String) -> CountlyInstance? {
        isDefaultInstance(instanceName) ? Countly.shared : Countly.getInstance(named: instanceName)
    }

    /// The configuration under assembly for an instance, created on first use.
    ///
    /// - Parameter instanceName: the instance name the JavaScript layer sent, empty for the default one.
    /// - Returns: the configuration the next init of that instance will start with.
    static func ensureConfig(_ instanceName: String) -> CountlyConfig {
        if let existing = configs[instanceKey(instanceName)] { return existing }
        let created = CountlyConfig()
        configs[instanceKey(instanceName)] = created
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
    ///
    /// - Parameter name: the event name the JavaScript layer subscribed to.
    /// - Parameter body: the payload, already serialized when it is not a plain string.
    static func emit(_ name: String, body: Any?) {
        Self.shared?.sendEvent(withName: name, body: body)
    }

    /// Forwards an event that belongs to one instance, tagged so JavaScript can route it.
    ///
    /// - Parameter name: the event name the JavaScript layer subscribed to.
    /// - Parameter instanceName: the instance the event came from, empty for the default one.
    /// - Parameter payload: the fields of the event, which the instance name is added to.
    static func emit(_ name: String, instanceName: String, payload: [String: Any] = [:]) {
        var tagged = payload
        tagged["instanceName"] = instanceKey(instanceName)
        // Sent as a dictionary rather than a string, so the JavaScript side does not parse what was just built.
        emit(name, body: tagged)
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

    @objc(initialize:instanceName:resolver:rejecter:)
    func initialize(_ arguments: [Any],
                    instanceName: String,
                    resolver resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            guard let argsString = arguments.first as? String,
                  let data = argsString.data(using: .utf8),
                  let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
                reject("init_failure", "init was called with arguments that are not a JSON object", nil)
                return
            }

            let config = self.populateConfig(json, instanceName: instanceName)
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

            Self.countly(instanceName).start(with: config)

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
    /// - Parameter json: the configuration the JavaScript layer serialized.
    /// - Parameter instanceName: the instance the configuration belongs to, empty for the default one.
    /// - Returns: the configuration to start that instance with.
    private func populateConfig(_ json: [String: Any], instanceName: String) -> CountlyConfig {
        let config = Self.ensureConfig(instanceName)

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
        if let maxValueSizePicture = json["maxValueSizePicture"] as? Int {
            config.sdkInternalLimits.maxValueSizePicture = maxValueSizePicture
        }
        // Limits End -------------------------------------------

        if let zoneTimerInterval = json["setZoneTimerInterval"] as? Int {
            config.content.zoneTimerInterval = zoneTimerInterval
        }

        if json["setGlobalContentCallback"] != nil {
            config.content.globalContentCallback = { status, data in
                let payload: [String: Any] = ["status": status.rawValue, "data": data]
                Self.emit(Self.contentCallbackName, instanceName: instanceName, payload: payload)
            }
        }

        if let displayOption = json["webViewDisplayOption"] as? String {
            config.content.webViewDisplayOption = displayOption == "SAFE_AREA" ? .safeArea : .immersive
        }

        if let hasContentUrlHandler = json["contentUrlHandler"] as? Bool, hasContentUrlHandler {
            // Decided here rather than in JavaScript, which can not answer a synchronous handler.
            let urlPrefixes = (json["contentUrlPrefixes"] as? [String] ?? []).map { $0.lowercased() }
            config.content.contentURLHandler = { url in
                let link = url.absoluteString
                if !urlPrefixes.isEmpty, !urlPrefixes.contains(where: { link.lowercased().hasPrefix($0) }) {
                    return false
                }
                Self.emit(Self.contentUrlHandlerName, instanceName: instanceName, payload: ["url": link])
                return true
            }
        }
        if let overlayCornerRadius = json["overlayCornerRadius"] as? Double {
            config.content.overlayCornerRadius = CGFloat(overlayCornerRadius)
        }
        if let showWidgetsWithinApp = json["showWidgetsWithinApp"] as? Bool, showWidgetsWithinApp {
            config.content.showWidgetsWithinApp = true
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
            // Production is the unset test mode, so only the two test modes are mapped.
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

        if let clearStoredDeviceId = json["clearStoredDeviceId"] as? Bool, clearStoredDeviceId {
            config.resetStoredDeviceID = true
        }
        if let trackOrientationChanges = json["trackOrientationChanges"] as? Bool {
            config.enableOrientationTracking = trackOrientationChanges
        }
        if let metricOverride = json["metricOverride"] as? [String: Any] {
            // Dropped per key, so one unusable value does not take the whole override down.
            config.customMetrics = metricOverride.compactMapValues { $0 as? String }
        }

        // Installed here because it has to sit on the session the SDK will use.
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

    @objc(setID:instanceName:)
    func setID(_ newDeviceID: String, instanceName: String) {
        Self.onMain {
            if newDeviceID == "TemporaryDeviceID" {
                Self.countly(instanceName).deviceID.enableTemporaryIDMode()
            } else {
                Self.countly(instanceName).deviceID.setID(newDeviceID)
            }
        }
    }

    @objc(changeDeviceId:instanceName:)
    func changeDeviceId(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let newDeviceID = Self.asString(arguments.first) else { return }
            if newDeviceID == "TemporaryDeviceID" {
                Self.countly(instanceName).deviceID.enableTemporaryIDMode()
                return
            }

            let onServer = arguments.count > 1 && Self.asBool(arguments[1])
            if onServer {
                Self.countly(instanceName).deviceID.changeWithMerge(newDeviceID)
            } else {
                Self.countly(instanceName).deviceID.changeWithoutMerge(newDeviceID)
            }
        }
    }

    @objc(getCurrentDeviceId:resolver:rejecter:)
    func getCurrentDeviceId(_ instanceName: String,
                            resolver resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            resolve(Self.countly(instanceName).deviceID.current ?? "deviceIdNotFound")
        }
    }

    @objc(getDeviceIDType:resolver:rejecter:)
    func getDeviceIDType(_ instanceName: String,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            // The JavaScript layer maps these numbers back to its own enum.
            switch Self.countly(instanceName).deviceID.type {
            case .developerSupplied: resolve(20202)
            case .temporary: resolve(30303)
            default: resolve(10101)
            }
        }
    }

    // MARK: - Events

    @objc(recordEvent:instanceName:)
    func recordEvent(_ arguments: [String: Any], instanceName: String) {
        Self.onMain {
            guard let key = arguments["n"] as? String else { return }
            let count = (arguments["c"] as? NSNumber)?.intValue ?? 1
            let sum = (arguments["s"] as? NSNumber)?.doubleValue ?? 0
            let segmentation = Self.keyValuePairs(from: arguments["g"] as? [Any] ?? [], startIndex: 0)

            Self.countly(instanceName).events.recordEvent(key, segmentation: segmentation, count: count, sum: sum)
        }
    }

    @objc(startEvent:instanceName:)
    func startEvent(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let key = Self.asString(arguments.first) else { return }
            Self.countly(instanceName).events.startEvent(key)
        }
    }

    @objc(cancelEvent:instanceName:)
    func cancelEvent(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let key = Self.asString(arguments.first) else { return }
            Self.countly(instanceName).events.cancelEvent(key)
        }
    }

    @objc(endEvent:instanceName:)
    func endEvent(_ arguments: [String: Any], instanceName: String) {
        Self.onMain {
            guard let key = arguments["n"] as? String else { return }
            let count = (arguments["c"] as? NSNumber)?.intValue ?? 1
            let sum = (arguments["s"] as? NSNumber)?.doubleValue ?? 0
            let segmentation = Self.keyValuePairs(from: arguments["g"] as? [Any] ?? [], startIndex: 0)

            Self.countly(instanceName).events.endEvent(key, segmentation: segmentation, count: count, sum: sum)
        }
    }

    @objc(setEventSendThreshold:instanceName:)
    func setEventSendThreshold(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let size = arguments.first else { return }
            let threshold = (size as? NSNumber)?.intValue ?? Int(Self.asString(size) ?? "") ?? 0
            Self.ensureConfig(instanceName).eventSendThreshold = threshold
        }
    }

    // MARK: - Views

    @objc(recordView:instanceName:)
    func recordView(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let viewName = Self.asString(arguments.first) else { return }
            let segmentation = Self.keyValuePairs(from: arguments, startIndex: 1)
            _ = Self.countly(instanceName).views.startAutoStoppedView(viewName, segmentation: segmentation)
        }
    }

    @objc(startAutoStoppedView:instanceName:resolver:rejecter:)
    func startAutoStoppedView(_ arguments: [Any],
                              instanceName: String,
                              resolver resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            guard let viewName = Self.asString(arguments.first) else {
                resolve(NSNull())
                return
            }
            let segmentation = Self.keyValuePairs(from: arguments, startIndex: 1)
            resolve(Self.countly(instanceName).views.startAutoStoppedView(viewName, segmentation: segmentation) ?? NSNull())
        }
    }

    @objc(startView:instanceName:resolver:rejecter:)
    func startView(_ arguments: [Any],
                   instanceName: String,
                   resolver resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            guard let viewName = Self.asString(arguments.first) else {
                resolve(NSNull())
                return
            }
            let segmentation = Self.keyValuePairs(from: arguments, startIndex: 1)
            resolve(Self.countly(instanceName).views.startView(viewName, segmentation: segmentation) ?? NSNull())
        }
    }

    @objc(stopViewWithName:instanceName:)
    func stopViewWithName(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let viewName = Self.asString(arguments.first) else { return }
            Self.countly(instanceName).views.stopView(name: viewName, segmentation: Self.keyValuePairs(from: arguments, startIndex: 1))
        }
    }

    @objc(stopViewWithID:instanceName:)
    func stopViewWithID(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let viewID = Self.asString(arguments.first) else { return }
            Self.countly(instanceName).views.stopView(id: viewID, segmentation: Self.keyValuePairs(from: arguments, startIndex: 1))
        }
    }

    @objc(stopAllViews:instanceName:)
    func stopAllViews(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            Self.countly(instanceName).views.stopAllViews(segmentation: Self.keyValuePairs(from: arguments, startIndex: 0))
        }
    }

    @objc(pauseViewWithID:instanceName:)
    func pauseViewWithID(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let viewID = Self.asString(arguments.first) else { return }
            Self.countly(instanceName).views.pauseView(id: viewID)
        }
    }

    @objc(resumeViewWithID:instanceName:)
    func resumeViewWithID(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let viewID = Self.asString(arguments.first) else { return }
            Self.countly(instanceName).views.resumeView(id: viewID)
        }
    }

    @objc(addSegmentationToViewWithID:instanceName:)
    func addSegmentationToViewWithID(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let viewID = Self.asString(arguments.first),
                  let segmentation = Self.keyValuePairs(from: arguments, startIndex: 1) else { return }
            Self.countly(instanceName).views.addSegmentation(toViewWithID: viewID, segmentation: segmentation)
        }
    }

    @objc(addSegmentationToViewWithName:instanceName:)
    func addSegmentationToViewWithName(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let viewName = Self.asString(arguments.first),
                  let segmentation = Self.keyValuePairs(from: arguments, startIndex: 1) else { return }
            Self.countly(instanceName).views.addSegmentation(toViewWithName: viewName, segmentation: segmentation)
        }
    }

    @objc(setGlobalViewSegmentation:instanceName:)
    func setGlobalViewSegmentation(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            Self.countly(instanceName).views.setGlobalViewSegmentation(Self.keyValuePairs(from: arguments, startIndex: 0) ?? [:])
        }
    }

    @objc(updateGlobalViewSegmentation:instanceName:)
    func updateGlobalViewSegmentation(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            Self.countly(instanceName).views.updateGlobalViewSegmentation(Self.keyValuePairs(from: arguments, startIndex: 0) ?? [:])
        }
    }

    // MARK: - Sessions

    @objc(startSession:)
    func startSession(_ instanceName: String) {
        Self.onMain { Self.countly(instanceName).sessions.beginSession() }
    }

    @objc(updateSession:)
    func updateSession(_ instanceName: String) {
        Self.onMain { Self.countly(instanceName).sessions.updateSession() }
    }

    @objc(endSession:)
    func endSession(_ instanceName: String) {
        Self.onMain { Self.countly(instanceName).sessions.endSession() }
    }

    // MARK: - Configuration touched after construction

    @objc(setLoggingEnabled:instanceName:)
    func setLoggingEnabled(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            let enabled = Self.asBool(arguments.first)
            let config = Self.ensureConfig(instanceName)
            config.enableDebug = enabled
            if enabled {
                config.internalLogLevel = .verbose
            }
            Self.loggingEnabled = enabled
        }
    }

    @objc(isLoggingEnabled:resolver:rejecter:)
    func isLoggingEnabled(_ instanceName: String,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain { resolve(Self.loggingEnabled) }
    }

    @objc(isInitialized:resolver:rejecter:)
    func isInitialized(_ instanceName: String,
                       resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain { resolve(Self.existingCountly(instanceName)?.isStarted ?? false) }
    }

    @objc(setHttpPostForced:instanceName:)
    func setHttpPostForced(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            Self.ensureConfig(instanceName).alwaysUsePOST = Self.asBool(arguments.first)
        }
    }

    @objc(pinnedCertificates:instanceName:)
    func pinnedCertificates(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let certificateName = Self.asString(arguments.first) else { return }
            Self.ensureConfig(instanceName).pinnedCertificates = [certificateName]
        }
    }

    @objc(setCustomMetrics:instanceName:)
    func setCustomMetrics(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            let metrics = Self.keyValuePairs(from: arguments, startIndex: 0) ?? [:]
            Self.ensureConfig(instanceName).customMetrics = metrics.compactMapValues { $0 as? String }
        }
    }

    @objc(recordMetrics:instanceName:)
    func recordMetrics(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            let metrics = Self.keyValuePairs(from: arguments, startIndex: 0) ?? [:]
            Self.countly(instanceName).recordMetrics(metrics.compactMapValues { $0 as? String })
        }
    }

    @objc(addCustomNetworkRequestHeaders:instanceName:)
    func addCustomNetworkRequestHeaders(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            let headers = Self.keyValuePairs(from: arguments, startIndex: 0) ?? [:]
            Self.countly(instanceName).addCustomNetworkRequestHeaders(headers.compactMapValues { $0 as? String })
        }
    }

    @objc(replaceAllAppKeysInQueueWithCurrentAppKey:)
    func replaceAllAppKeysInQueueWithCurrentAppKey(_ instanceName: String) {
        Self.onMain { Self.countly(instanceName).requestQueue.replaceAllAppKeysInQueueWithCurrentAppKey() }
    }

    @objc(removeDifferentAppKeysFromQueue:)
    func removeDifferentAppKeysFromQueue(_ instanceName: String) {
        Self.onMain { Self.countly(instanceName).requestQueue.removeDifferentAppKeysFromQueue() }
    }

    // MARK: - Location

    @objc(setLocation:instanceName:)
    func setLocation(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            func value(_ index: Int) -> String? {
                guard arguments.count > index, let text = Self.asString(arguments[index]), text != "null" else { return nil }
                return text
            }

            Self.countly(instanceName).location.recordLocation(Self.coordinate(from: value(2)),
                                                   city: value(1),
                                                   isoCountryCode: value(0),
                                                   ipAddress: value(3))
        }
    }

    @objc(disableLocation:)
    func disableLocation(_ instanceName: String) {
        Self.onMain { Self.countly(instanceName).location.disableLocationInfo() }
    }

    // MARK: - Crashes

    @objc(addCrashLog:instanceName:)
    func addCrashLog(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let log = Self.asString(arguments.first) else { return }
            Self.countly(instanceName).crashes.addCrashBreadcrumb(log)
        }
    }

    @objc(setCustomCrashSegments:instanceName:)
    func setCustomCrashSegments(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            let segmentation = Self.keyValuePairs(from: arguments, startIndex: 0) ?? [:]
            if Self.countly(instanceName).isStarted {
                Self.countly(instanceName).crashes.setCrashSegmentation(segmentation)
            } else {
                Self.ensureConfig(instanceName).crashSegmentation = segmentation
            }
        }
    }

    @objc(logException:instanceName:)
    func logException(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let exceptionString = Self.asString(arguments.first) else { return }

            var segmentation = Self.keyValuePairs(from: arguments, startIndex: 2) ?? [:]
            // The flag rides along as segmentation, which is what the dashboard already shows.
            segmentation["nonfatal"] = arguments.count > 1 ? arguments[1] : true

            let exception = NSException(name: NSExceptionName("Exception"),
                                        reason: exceptionString,
                                        userInfo: nil)
            // Always handled: the fatality argument has never chosen the crash type here.
            Self.countly(instanceName).crashes.recordException(exception,
                                                   isFatal: false,
                                                   stackTrace: exceptionString.components(separatedBy: "\n"),
                                                   segmentation: segmentation)
        }
    }

    @objc(logJSException:withMessage:withStack:instanceName:)
    func logJSException(_ errTitle: String, withMessage message: String, withStack stackTrace: String, instanceName: String) {
        Self.onMain {
            let exception = NSException(name: NSExceptionName(errTitle), reason: message, userInfo: nil)
            Self.countly(instanceName).crashes.recordException(exception,
                                                   isFatal: false,
                                                   stackTrace: stackTrace.components(separatedBy: "\n"),
                                                   segmentation: ["nonfatal": "1"])
        }
    }

    // MARK: - User profile

    @objc(setUserData:instanceName:resolver:rejecter:)
    func setUserData(_ arguments: [Any],
                     instanceName: String,
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            self.setUserDataInternal(arguments.first as? [String: Any], instanceName: instanceName)
            resolve("Success")
        }
    }

    @objc(userDataBulk_setUserProperties:instanceName:resolver:rejecter:)
    func userDataBulkSetUserProperties(_ userProperties: [String: Any],
                                       instanceName: String,
                                       resolver resolve: @escaping RCTPromiseResolveBlock,
                                       rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            self.setUserDataInternal(userProperties, instanceName: instanceName)
            resolve("Success")
        }
    }

    /// Applies a user data payload: predefined fields land on their own fields and
    /// everything else, including the contents of an explicit `custom` object,
    /// becomes a custom property.
    /// - Parameter userData: the payload the JavaScript layer sent.
    /// - Parameter instanceName: the instance the properties belong to, empty for the default one.
    private func setUserDataInternal(_ userData: [String: Any]?, instanceName: String) {
        guard var data = userData else { return }

        if let explicitCustom = data.removeValue(forKey: "custom") as? [String: Any] {
            for (key, value) in explicitCustom {
                data[key] = value
            }
        }

        guard !data.isEmpty else { return }
        Self.countly(instanceName).userProfile.setProperties(data)
    }

    @objc(userData_setProperty:instanceName:resolver:rejecter:)
    func userDataSetProperty(_ arguments: [Any],
                             instanceName: String,
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first) {
                Self.countly(instanceName).userProfile.setCustomProperty(key, value: arguments.count > 1 ? arguments[1] : nil)
            }
            resolve("Success")
        }
    }

    @objc(userData_increment:instanceName:resolver:rejecter:)
    func userDataIncrement(_ arguments: [Any],
                           instanceName: String,
                           resolver resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first) {
                Self.countly(instanceName).userProfile.increment(key)
            }
            resolve("Success")
        }
    }

    @objc(userData_incrementBy:instanceName:resolver:rejecter:)
    func userDataIncrementBy(_ arguments: [Any],
                             instanceName: String,
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first) {
                Self.countly(instanceName).userProfile.incrementBy(key, value: Self.number(arguments, at: 1))
            }
            resolve("Success")
        }
    }

    @objc(userData_multiply:instanceName:resolver:rejecter:)
    func userDataMultiply(_ arguments: [Any],
                          instanceName: String,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first) {
                Self.countly(instanceName).userProfile.multiply(key, value: Self.number(arguments, at: 1))
            }
            resolve("Success")
        }
    }

    @objc(userData_saveMax:instanceName:resolver:rejecter:)
    func userDataSaveMax(_ arguments: [Any],
                         instanceName: String,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first) {
                Self.countly(instanceName).userProfile.max(key, value: Self.number(arguments, at: 1))
            }
            resolve("Success")
        }
    }

    @objc(userData_saveMin:instanceName:resolver:rejecter:)
    func userDataSaveMin(_ arguments: [Any],
                         instanceName: String,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first) {
                Self.countly(instanceName).userProfile.min(key, value: Self.number(arguments, at: 1))
            }
            resolve("Success")
        }
    }

    @objc(userData_setOnce:instanceName:resolver:rejecter:)
    func userDataSetOnce(_ arguments: [Any],
                         instanceName: String,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first), arguments.count > 1 {
                Self.countly(instanceName).userProfile.setOnce(key, value: arguments[1])
            }
            resolve("Success")
        }
    }

    @objc(userData_pushUniqueValue:instanceName:resolver:rejecter:)
    func userDataPushUniqueValue(_ arguments: [Any],
                                 instanceName: String,
                                 resolver resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first), arguments.count > 1 {
                Self.countly(instanceName).userProfile.pushUnique(key, value: arguments[1])
            }
            resolve("Success")
        }
    }

    @objc(userData_pushValue:instanceName:resolver:rejecter:)
    func userDataPushValue(_ arguments: [Any],
                           instanceName: String,
                           resolver resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first), arguments.count > 1 {
                Self.countly(instanceName).userProfile.push(key, value: arguments[1])
            }
            resolve("Success")
        }
    }

    @objc(userData_pullValue:instanceName:resolver:rejecter:)
    func userDataPullValue(_ arguments: [Any],
                           instanceName: String,
                           resolver resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            if let key = Self.asString(arguments.first), arguments.count > 1 {
                Self.countly(instanceName).userProfile.pull(key, value: arguments[1])
            }
            resolve("Success")
        }
    }

    @objc(userDataBulk_save:instanceName:resolver:rejecter:)
    func userDataBulkSave(_ arguments: [Any],
                          instanceName: String,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            Self.countly(instanceName).userProfile.save()
            resolve("Success")
        }
    }

    // The bulk variants stage the same operations and are sent on a flush or an explicit save.
    @objc(userDataBulk_setProperty:instanceName:resolver:rejecter:)
    func userDataBulkSetProperty(_ arguments: [Any],
                                 instanceName: String,
                                 resolver resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataSetProperty(arguments, instanceName: instanceName, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_increment:instanceName:resolver:rejecter:)
    func userDataBulkIncrement(_ arguments: [Any],
                               instanceName: String,
                               resolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataIncrement(arguments, instanceName: instanceName, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_incrementBy:instanceName:resolver:rejecter:)
    func userDataBulkIncrementBy(_ arguments: [Any],
                                 instanceName: String,
                                 resolver resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataIncrementBy(arguments, instanceName: instanceName, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_multiply:instanceName:resolver:rejecter:)
    func userDataBulkMultiply(_ arguments: [Any],
                              instanceName: String,
                              resolver resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataMultiply(arguments, instanceName: instanceName, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_saveMax:instanceName:resolver:rejecter:)
    func userDataBulkSaveMax(_ arguments: [Any],
                             instanceName: String,
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataSaveMax(arguments, instanceName: instanceName, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_saveMin:instanceName:resolver:rejecter:)
    func userDataBulkSaveMin(_ arguments: [Any],
                             instanceName: String,
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataSaveMin(arguments, instanceName: instanceName, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_setOnce:instanceName:resolver:rejecter:)
    func userDataBulkSetOnce(_ arguments: [Any],
                             instanceName: String,
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataSetOnce(arguments, instanceName: instanceName, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_pushUniqueValue:instanceName:resolver:rejecter:)
    func userDataBulkPushUniqueValue(_ arguments: [Any],
                                     instanceName: String,
                                     resolver resolve: @escaping RCTPromiseResolveBlock,
                                     rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataPushUniqueValue(arguments, instanceName: instanceName, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_pushValue:instanceName:resolver:rejecter:)
    func userDataBulkPushValue(_ arguments: [Any],
                               instanceName: String,
                               resolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataPushValue(arguments, instanceName: instanceName, resolver: resolve, rejecter: reject)
    }

    @objc(userDataBulk_pullValue:instanceName:resolver:rejecter:)
    func userDataBulkPullValue(_ arguments: [Any],
                               instanceName: String,
                               resolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
        userDataPullValue(arguments, instanceName: instanceName, resolver: resolve, rejecter: reject)
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

    @objc(giveConsent:instanceName:)
    func giveConsent(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            Self.countly(instanceName).consent.giveConsent(for: Self.features(from: arguments))
        }
    }

    @objc(removeConsent:instanceName:)
    func removeConsent(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            Self.countly(instanceName).consent.cancelConsent(for: Self.features(from: arguments))
        }
    }

    @objc(giveAllConsent:)
    func giveAllConsent(_ instanceName: String) {
        Self.onMain { Self.countly(instanceName).consent.giveAllConsents() }
    }

    @objc(removeAllConsent:)
    func removeAllConsent(_ instanceName: String) {
        Self.onMain { Self.countly(instanceName).consent.cancelAllConsents() }
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

    @objc(recordDirectAttribution:instanceName:)
    func recordDirectAttribution(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let campaignType = Self.asString(arguments.first),
                  arguments.count > 1, let campaignData = Self.asString(arguments[1]) else { return }

            if Self.countly(instanceName).isStarted {
                Self.countly(instanceName).attribution.recordDirectAttribution(campaignType: campaignType, campaignData: campaignData)
            } else {
                let config = Self.ensureConfig(instanceName)
                config.campaignType = campaignType
                config.campaignData = campaignData
            }
        }
    }

    @objc(recordIndirectAttribution:instanceName:)
    func recordIndirectAttribution(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let attribution = arguments.first as? [String: String] else { return }
            if Self.countly(instanceName).isStarted {
                Self.countly(instanceName).attribution.recordIndirectAttribution(attribution)
            } else {
                Self.ensureConfig(instanceName).indirectAttribution = attribution
            }
        }
    }

    // MARK: - Remote config

    @objc(remoteConfigUpdate:instanceName:callback:)
    func remoteConfigUpdate(_ arguments: [Any], instanceName: String,
                                                callback: @escaping RCTResponseSenderBlock) {
        Self.onMain {
            Self.countly(instanceName).remoteConfig.downloadKeys { result, error, _, _ in
                callback([[Self.remoteConfigMessage(result, error, success: "Remote Config is updated and ready to use!")]])
            }
        }
    }

    @objc(updateRemoteConfigForKeysOnly:instanceName:callback:)
    func updateRemoteConfigForKeysOnly(_ arguments: [Any], instanceName: String,
                                                           callback: @escaping RCTResponseSenderBlock) {
        Self.onMain {
            let keys = arguments.compactMap { $0 as? String }
            Self.countly(instanceName).remoteConfig.downloadSpecificKeys(keys) { result, error, _, _ in
                callback([[Self.remoteConfigMessage(result, error, success: "Remote Config is updated only for given keys and ready to use!")]])
            }
        }
    }

    @objc(updateRemoteConfigExceptKeys:instanceName:callback:)
    func updateRemoteConfigExceptKeys(_ arguments: [Any], instanceName: String,
                                                          callback: @escaping RCTResponseSenderBlock) {
        Self.onMain {
            let keys = arguments.compactMap { $0 as? String }
            Self.countly(instanceName).remoteConfig.downloadOmittingKeys(keys) { result, error, _, _ in
                callback([[Self.remoteConfigMessage(result, error, success: "Remote Config is updated except for given keys and ready to use !")]])
            }
        }
    }

    @objc(getRemoteConfigValueForKey:instanceName:callback:)
    func getRemoteConfigValueForKey(_ arguments: [Any], instanceName: String,
                                                        callback: @escaping RCTResponseSenderBlock) {
        Self.onMain {
            guard let key = Self.asString(arguments.first) else {
                callback(["ConfigKeyNotFound"])
                return
            }
            callback([Self.countly(instanceName).remoteConfig.getValue(key).value ?? "ConfigKeyNotFound"])
        }
    }

    @objc(remoteConfigClearValues:resolver:rejecter:)
    func remoteConfigClearValues(_ instanceName: String,
                                 resolver resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            Self.countly(instanceName).remoteConfig.clearAll()
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

    @objc(getFeedbackWidgets:resolver:rejecter:)
    func getFeedbackWidgets(_ instanceName: String,
                            resolver resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            Self.countly(instanceName).feedback.getAvailableFeedbackWidgets { widgets, error in
                if let error {
                    reject("getFeedbackWidgets_failure", error.localizedDescription, nil)
                    return
                }

                let widgets = widgets ?? []
                Self.feedbackWidgetLists[Self.instanceKey(instanceName)] = widgets
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

    @objc(getAvailableFeedbackWidgets:resolver:rejecter:)
    func getAvailableFeedbackWidgets(_ instanceName: String,
                                     resolver resolve: @escaping RCTPromiseResolveBlock,
                                     rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            Self.countly(instanceName).feedback.getAvailableFeedbackWidgets { widgets, error in
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

    @objc(getFeedbackWidgetData:instanceName:resolver:rejecter:)
    func getFeedbackWidgetData(_ arguments: [Any],
                               instanceName: String,
                               resolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            let widgetID = Self.asString(arguments.first) ?? ""
            guard let widget = Self.feedbackWidget(widgetID, instanceName: instanceName) else {
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

    @objc(reportFeedbackWidgetManually:instanceName:resolver:rejecter:)
    func reportFeedbackWidgetManually(_ arguments: [Any],
                                      instanceName: String,
                                      resolver resolve: @escaping RCTPromiseResolveBlock,
                                      rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            let widgetInfo = arguments.first as? [Any] ?? []
            let widgetID = Self.asString(widgetInfo.first) ?? ""
            let widgetResult = arguments.count > 2 ? arguments[2] as? [String: Any] : nil

            guard let widget = Self.feedbackWidget(widgetID, instanceName: instanceName) else {
                let message = "No feedbackWidget is found against widget Id : '\(widgetID)', always call 'getAvailableFeedbackWidgets' to get an updated list of feedback widgets."
                Self.log(message)
                reject("reportFeedbackWidgetManually_failure", message, nil)
                return
            }

            widget.recordResult(widgetResult)
            resolve("reportFeedbackWidgetManually success")
        }
    }

    @objc(presentFeedbackWidget:instanceName:)
    func presentFeedbackWidget(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            let widgetID = Self.asString(arguments.first) ?? ""
            let widgetType = arguments.count > 1 ? Self.asString(arguments[1]) : nil
            let widgetName = arguments.count > 2 ? Self.asString(arguments[2]) : nil
            let widgetVersion = arguments.count > 4 ? Self.asString(arguments[4]) : nil

            var widget = Self.feedbackWidget(widgetID, instanceName: instanceName)
            // Rebuilt from what JavaScript sent, which holds a widget list this side may never have fetched.
            if widget == nil || (widgetVersion?.isEmpty == false && widget?.widgetVersion == nil) {
                var description: [String: Any] = ["_id": widgetID]
                if let widgetType { description["type"] = widgetType }
                if let widgetName { description["name"] = widgetName }
                if let widgetVersion, !widgetVersion.isEmpty { description["wv"] = widgetVersion }
                widget = Self.countly(instanceName).feedback.widget(from: description)
            }

            guard let widget else {
                Self.log("presentFeedbackWidget, no widget could be built for widget Id : '\(widgetID)'")
                return
            }

            widget.present(appearBlock: {
                Self.emit(Self.widgetShownCallbackName, instanceName: instanceName)
            }, dismissBlock: {
                Self.emit(Self.widgetClosedCallbackName, instanceName: instanceName)
            })
        }
    }

    @objc(presentNPS:instanceName:)
    func presentNPS(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            Self.countly(instanceName).feedback.presentNPS(Self.asString(arguments.first), callback: Self.widgetStateCallback(instanceName))
        }
    }

    @objc(presentSurvey:instanceName:)
    func presentSurvey(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            Self.countly(instanceName).feedback.presentSurvey(Self.asString(arguments.first), callback: Self.widgetStateCallback(instanceName))
        }
    }

    @objc(presentRating:instanceName:)
    func presentRating(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            Self.countly(instanceName).feedback.presentRating(Self.asString(arguments.first), callback: Self.widgetStateCallback(instanceName))
        }
    }

    @objc(presentRatingWidgetWithID:instanceName:)
    func presentRatingWidgetWithID(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            // Resolved by ID, because presentRating would fall back to the first rating widget.
            guard let widgetID = Self.asString(arguments.first), !widgetID.isEmpty else {
                Self.emit(Self.ratingWidgetCallbackName, instanceName: instanceName, payload: ["error": "presentRatingWidgetWithID failed: no widget id given"])
                return
            }

            Self.countly(instanceName).feedback.getAvailableFeedbackWidgets { widgets, error in
                guard error == nil,
                      let widget = widgets?.first(where: { $0.id == widgetID && $0.type == .rating }) else {
                    let reason = error.map { String(describing: $0) } ?? "no rating widget with the id [\(widgetID)]"
                    Self.emit(Self.ratingWidgetCallbackName, instanceName: instanceName, payload: ["error": "presentRatingWidgetWithID failed: " + reason])
                    return
                }

                widget.present(callback: { state in
                    Self.widgetStateCallback(instanceName)(state)
                    if state == .appeared {
                        // The error slot of the callback stays empty on a successful presentation.
                        Self.emit(Self.ratingWidgetCallbackName, instanceName: instanceName)
                    }
                })
            }
        }
    }

    @objc(showStarRating:instanceName:callback:)
    func showStarRating(_ arguments: [Any], instanceName: String,
                                            callback: @escaping RCTResponseSenderBlock) {
        // No star rating dialog exists here, so the callback is left uncalled rather than invented.
        Self.log("showStarRating, the star rating dialog is not available on iOS, this call does nothing")
    }

    /// - Parameter widgetID: the widget the JavaScript layer asked for.
    /// - Parameter instanceName: the instance that listed it, empty for the default one.
    /// - Returns: the widget from that instance's last listing, or `nil` when it listed no such widget.
    private static func feedbackWidget(_ widgetID: String, instanceName: String) -> CountlyFeedbackWidget? {
        feedbackWidgetLists[instanceKey(instanceName)]?.first { $0.id == widgetID }
    }

    /// - Parameter instanceName: the instance presenting the widget, empty for the default one.
    /// - Returns: a callback that reports the widget's state to JavaScript for that instance.
    private static func widgetStateCallback(_ instanceName: String) -> WidgetCallback {
        { state in
            switch state {
            case .appeared: emit(widgetShownCallbackName, instanceName: instanceName)
            case .closed: emit(widgetClosedCallbackName, instanceName: instanceName)
            default: break
            }
        }
    }

    // MARK: - Content

    @objc(enterContentZone:)
    func enterContentZone(_ instanceName: String) {
        Self.onMain { Self.countly(instanceName).content.enterContentZone() }
    }

    @objc(refreshContentZone:)
    func refreshContentZone(_ instanceName: String) {
        Self.onMain { Self.countly(instanceName).content.refreshContentZone() }
    }

    @objc(exitContentZone:)
    func exitContentZone(_ instanceName: String) {
        Self.onMain { Self.countly(instanceName).content.exitContentZone() }
    }

    @objc(previewContent:instanceName:)
    func previewContent(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let contentID = Self.asString(arguments.first) else { return }
            Self.countly(instanceName).content.previewContent(contentID)
        }
    }

    // MARK: - Performance monitoring

    @objc(startTrace:instanceName:)
    func startTrace(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let traceKey = Self.asString(arguments.first) else { return }
            Self.countly(instanceName).performance.startCustomTrace(traceKey)
        }
    }

    @objc(cancelTrace:instanceName:)
    func cancelTrace(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let traceKey = Self.asString(arguments.first) else { return }
            Self.countly(instanceName).performance.cancelCustomTrace(traceKey)
        }
    }

    @objc(clearAllTraces:instanceName:)
    func clearAllTraces(_ arguments: [Any], instanceName: String) {
        Self.onMain { Self.countly(instanceName).performance.clearAllCustomTraces() }
    }

    @objc(endTrace:instanceName:)
    func endTrace(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let traceKey = Self.asString(arguments.first) else { return }
            Self.countly(instanceName).performance.endCustomTrace(traceKey, metrics: Self.keyValuePairs(from: arguments, startIndex: 1))
        }
    }

    @objc(recordNetworkTrace:instanceName:)
    func recordNetworkTrace(_ arguments: [Any], instanceName: String) {
        Self.onMain {
            guard let traceKey = Self.asString(arguments.first), arguments.count > 5 else { return }

            Self.countly(instanceName).performance.recordNetworkTrace(traceKey,
                                                                      requestPayloadSize: Int(Self.number(arguments, at: 2)),
                                                                      responsePayloadSize: Int(Self.number(arguments, at: 3)),
                                                                      responseStatusCode: Int(Self.number(arguments, at: 1)),
                                                                      startTime: Int64(Self.number(arguments, at: 4)),
                                                                      endTime: Int64(Self.number(arguments, at: 5)))
        }
    }

    @objc(appLoadingFinished:)
    func appLoadingFinished(_ instanceName: String) {
        Self.onMain { Self.countly(instanceName).performance.appLoadingFinished() }
    }

    // MARK: - Push notifications

    @objc(disablePushNotifications:)
    func disablePushNotifications(_ instanceName: String) {
        #if !COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
        CountlyRNPushNotifications.shared.disablePushNotifications()
        #endif
    }

    @objc(sendPushToken:instanceName:)
    func sendPushToken(_ arguments: [Any], instanceName: String) {
        // The SDK reports the token itself from `Countly.didRegisterForRemoteNotifications`.
        Self.log("sendPushToken, the SDK reports the push token itself, this call does nothing")
    }

    @objc(askForNotificationPermission:instanceName:)
    func askForNotificationPermission(_ arguments: [Any], instanceName: String) {
        #if !COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
        CountlyRNPushNotifications.shared.askForNotificationPermission()
        #endif
    }

    @objc(registerForNotification:instanceName:)
    func registerForNotification(_ arguments: [Any], instanceName: String) {
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

    @objc(enableRequestCapture:resolver:rejecter:)
    func enableRequestCapture(_ instanceName: String,
                              resolver resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            CountlyRNRequestCapture.isEnabled = true
            CountlyRNRequestCapture.reset()
            resolve(nil)
        }
    }

    /// The requests capture has collected, across every instance. Testing purposes only.
    ///
    /// - Parameter instanceName: unused, the buffer is process wide.
    @objc(getCapturedRequests:resolver:rejecter:)
    func getCapturedRequests(_ instanceName: String,
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain { resolve(CountlyRNRequestCapture.captured) }
    }

    @objc(getRequestQueue:resolver:rejecter:)
    func getRequestQueue(_ instanceName: String,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain { resolve(Self.countly(instanceName).requestQueue.queuedRequests()) }
    }

    @objc(getEventQueue:resolver:rejecter:)
    func getEventQueue(_ instanceName: String,
                       resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain { resolve(Self.countly(instanceName).events.recordedEvents()) }
    }

    @objc(removeInstance:resolver:rejecter:)
    func removeInstance(_ instanceName: String,
                        resolver resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            guard !Self.isDefaultInstance(instanceName) else {
                resolve("removeInstance: the default instance can not be removed")
                return
            }

            Self.configs[Self.instanceKey(instanceName)] = nil
            Self.feedbackWidgetLists[Self.instanceKey(instanceName)] = nil
            Countly.removeInstance(named: instanceName)
            resolve("removeInstance: success")
        }
    }

    @objc(haltAllInstances:rejecter:)
    func haltAllInstances(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            Self.configs.removeAll()
            Self.feedbackWidgetLists.removeAll()
            Countly.haltAllInstances(clearStorage: true)
            resolve("haltAllInstances: success")
        }
    }

    @objc(halt:resolver:rejecter:)
    func halt(_ instanceName: String,
              resolver resolve: @escaping RCTPromiseResolveBlock,
              rejecter reject: @escaping RCTPromiseRejectBlock) {
        Self.onMain {
            Self.countly(instanceName).halt(clearStorage: true)
            Self.configs[Self.instanceKey(instanceName)] = nil
            Self.feedbackWidgetLists[Self.instanceKey(instanceName)] = nil
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
