// CountlyRNPushNotifications.swift
//
// This code is provided under the MIT License.
//
// Please visit www.count.ly for more information.

#if !COUNTLY_EXCLUDE_PUSHNOTIFICATIONS

import Countly
import Foundation
import UIKit
import UserNotifications

/// Bridges push notifications to the JavaScript side.
///
/// The SDK installs itself as the notification centre delegate and chains to
/// whatever delegate was already there, so this object registers first and is
/// reached as that chained delegate. Once the SDK is in front it records the
/// action and opens the notification's URL itself, and this object only forwards
/// the payload to JavaScript.
///
/// The one thing it owns is the cold launch case. A tap that opens the
/// application is delivered before JavaScript has had a chance to call init, so
/// the SDK is not the delegate yet and never sees the response. Those responses
/// are held here and handed to the SDK once init has run.
@objc(CountlyRNPushNotifications)
public class CountlyRNPushNotifications: NSObject {

    @objc public static let shared = CountlyRNPushNotifications()

    /// Whether the bridge should turn the SDK's push feature on at init.
    public var enablePushNotifications = true

    /// Called with the notification payload as JSON once JavaScript has asked for
    /// notifications.
    private var notificationListener: ((String) -> Void)?

    /// The last payload that arrived with no listener registered.
    private var lastStoredNotification: [AnyHashable: Any]?

    /// Responses that arrived before the SDK was started, awaiting replay.
    private var pendingResponses: [UNNotificationResponse] = []

    private override init() {
        super.init()
    }

    /// Stops the SDK's push feature being enabled at init.
    public func disablePushNotifications() {
        DispatchQueue.main.async { self.enablePushNotifications = false }
    }

    /// Registers as the notification centre delegate.
    ///
    /// Must run before the SDK starts, so that the SDK chains to this object
    /// rather than replacing it.
    @objc public func startObservingNotifications() {
        UNUserNotificationCenter.current().delegate = self
    }

    /// Gives the delegate back to whoever had it.
    @objc public func stopObservingNotifications() {
        if UNUserNotificationCenter.current().delegate === self {
            UNUserNotificationCenter.current().delegate = nil
        }
    }

    /// Asks the user for notification permission.
    public func askForNotificationPermission() {
        DispatchQueue.main.async {
            Countly.shared.push.askForNotificationPermission()
        }
    }

    /// Registers the JavaScript listener that receives notification payloads, and
    /// hands it anything that arrived before it was registered.
    public func registerForNotification(_ listener: @escaping (String) -> Void) {
        DispatchQueue.main.async {
            self.notificationListener = listener
            if let notification = self.lastStoredNotification {
                listener(Self.toJSON(notification))
                self.lastStoredNotification = nil
            }
        }
    }

    /// Replays taps that arrived before the SDK was started.
    ///
    /// The SDK's own handling never saw them, because it was not the notification
    /// centre delegate yet. Handing each response over now runs the same path a
    /// live tap takes, including ignoring a dismissal, resolving the tapped
    /// button's URL, and gating that URL on push consent.
    public func recordPushActions() {
        let responses = pendingResponses
        pendingResponses.removeAll()
        for response in responses {
            Countly.handleNotificationResponse(response)
        }
    }

    /// Hands a notification payload to the JavaScript listener, or holds it until
    /// one registers.
    @objc public func onNotification(_ notification: [AnyHashable: Any]?) {
        guard let notification else { return }
        if let listener = notificationListener {
            listener(Self.toJSON(notification))
            lastStoredNotification = nil
        } else {
            lastStoredNotification = notification
        }
    }

    /// Forwards the tap to JavaScript, holding it for replay if the SDK cannot see
    /// it yet.
    @objc public func onNotificationResponse(_ response: UNNotificationResponse) {
        // Still holding the delegate proves the SDK did not handle this tap, so it is safe to replay.
        let isStillFrontDelegate = UNUserNotificationCenter.current().delegate === self
        if isStillFrontDelegate, !Countly.shared.isStarted {
            pendingResponses.append(response)
        }

        onNotification(response.notification.request.content.userInfo)
    }

    static func toJSON(_ object: Any) -> String {
        guard JSONSerialization.isValidJSONObject(object),
              let data = try? JSONSerialization.data(withJSONObject: object, options: []),
              let string = String(data: data, encoding: .utf8) else { return "{}" }
        return string
    }
}

extension CountlyRNPushNotifications: UNUserNotificationCenterDelegate {

    /// Reached as the SDK's chained delegate once it has started, and directly
    /// before that.
    public func userNotificationCenter(_ center: UNUserNotificationCenter,
                                       didReceive response: UNNotificationResponse,
                                       withCompletionHandler completionHandler: @escaping () -> Void) {
        onNotificationResponse(response)
        completionHandler()
    }

    public func userNotificationCenter(_ center: UNUserNotificationCenter,
                                       willPresent notification: UNNotification,
                                       withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let userInfo = notification.request.content.userInfo
        onNotification(userInfo)

        let payload = userInfo[CountlyPushKey.countlyPayload] as? [String: Any]
        let notificationID = payload?[CountlyPushKey.notificationID] as? String

        if notificationID != nil {
            completionHandler([.list, .banner])
        } else {
            completionHandler([])
        }
    }
}

#endif
