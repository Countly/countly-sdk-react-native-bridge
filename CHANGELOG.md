## XX.XX.XX
* ! Minor breaking change ! `Countly.remoteConfig.updateForKeysOnly` and `updateExceptKeys` now enroll the user only in the A/B tests of the downloaded keys in iOS, not in all running A/B tests.
* ! Minor breaking change ! `Countly.remoteConfig.getValue` now returns string values as strings in Android. Before, "2.10" came back as 2.1.
* ! Minor breaking change ! `Countly.logException(exception, false)` now records a fatal crash.
* ! Minor breaking change ! An uncaught JS error that crashes a release build is now recorded once, as a fatal crash with its JS stack, instead of twice.
* ! Minor breaking change ! Android now uses Firebase BoM 32.8.1 (firebase-messaging 23.4.1) instead of 28.4.2. Apps on an older Firebase BoM get its versions for their Firebase libraries, and the Kotlin standard library 1.7.10 joins the build. The minimum Android version stays API 21.
* ! Minor breaking change ! `Countly.test` helpers now work only in debug builds.
* ! Minor breaking change ! The package now ships only the files the SDK needs at runtime; the example app, the tests and the Xcode project for manual linking are no longer part of it. It declares `react-native` as a peer dependency and needs React Native 0.62 or newer.
* ! Minor breaking change ! The pod now makes only the bridge header and the iOS SDK's public headers public; other headers can no longer be imported from it.
* ! Minor breaking change ! The `NotificationService` subspec no longer depends on React, and `pod 'CountlyReactNative'` installs only the `Core` subspec.
* ! Minor breaking change ! The pod now needs iOS 15 (tvOS 15, macOS 12, watchOS 9), the minimum of the bundled iOS SDK 26.8.0, instead of iOS 10. With React Native 0.71 and newer it uses React Native's minimum iOS version when that is higher. An app whose Podfile platform is below iOS 15, for example with React Native 0.75 or older, has to raise it; an app that has to support older iOS versions can stay on 26.1.0.

* Added a `{ success, error }` result to `Countly.remoteConfig.update`, `updateForKeysOnly` and `updateExceptKeys`.
* Added `Countly.registerForNotificationOpened(listener)`, called when the user taps a push in Android and iOS:
  * The listener gets the push data and the tapped action index: 0 for the notification, 1 and up for its buttons.
  * A tap that started the app is delivered once a listener is registered.
  * In Android, call `setIntent(intent)` in your MainActivity's `onNewIntent` so a tap that brings back a stopped app is delivered too.
* Added support for objects as campaign data in `recordDirectAttribution` and as values in `recordIndirectAttribution`, in `Countly` and in `CountlyConfig`.
* Added the names "DEVELOPMENT", "PRODUCTION" and "ADHOC" as accepted values of `CountlyConfig.setPushTokenType`.

* Mitigated remote config update issues:
  * Updates without remote config consent, in temporary device ID mode or with SDK networking disabled now complete with an error in iOS, instead of never completing.
  * Failed updates are now logged as errors in iOS.
  * An update without remote config consent is now reported as failed in Android.
* Mitigated crash reporting issues:
  * The JS crash handler no longer fails, or skips the app's previous error handler, when the app throws a value that is not an Error.
  * `Countly.logException` now skips `null` and `undefined` segment values instead of failing.
* Mitigated an issue where `CountlyConfig.setLocation` was ignored without a country code in iOS.
* Mitigated an issue where `Countly.giveAllConsent` sent two consent requests in iOS.
* Mitigated start-up issues:
  * An empty or `null` device ID at init no longer becomes the device ID "null" in Android; the SDK generates one instead, and installs that already have "null" get a new ID on their next start.
  * A partly set push config, a single consent name instead of a list, or attribution data of the wrong type no longer skips the rest of the init config in Android, or crashes the app.
  * `Countly.initWithConfig` now refuses a missing server URL or app key with an error log, and its promise settles when the native init fails.
  * A logging choice made with `Countly.setLoggingEnabled` before init is now kept in iOS.
* Mitigated push notification issues:
  * A token handed over with `Countly.sendPushToken` is now registered without calling `Countly.askForNotificationPermission` first in Android, and a token renewed by Firebase while the SDK runs is sent.
  * `Countly.sendPushToken` now sends the token in iOS, with the token type set by `CountlyConfig.setPushTokenType`, also when Countly push notifications are disabled.
  * A push tapped while the app starts is now counted once in iOS.
  * The push payload is now logged only when logging is enabled in iOS.
  * `Countly.askForNotificationPermission` now shows the notification permission prompt on Android 13 and newer; the bridge declares `POST_NOTIFICATIONS` for it.
  * A push tap that starts the app now gets the intent redirection check in Android, as warm taps already did.
  * The push token is no longer sent before the user allows notifications in iOS.
  * Registering `Countly.registerForNotification` again now replaces the earlier listener, so each push reaches JS once.
  * `Countly.registerForNotification` no longer throws, or removes the current listener, when it is given something that is not a function.
  * `Countly.sendPushToken` now returns an error message when it is called before init.
* Mitigated data issues:
  * Event sums keep their full precision in iOS.
  * Whole numbers in user properties are now sent without exponent notation in Android, for example 5551234567 instead of 5.551234567E9.
  * `null` values and numbers in data the bridge returns to JS now arrive as `null` and numbers in Android.
  * The "metrics" consent can now be given and removed after init in Android.
  * `incrementBy`, `multiply`, `saveMax` and `saveMin` in `Countly.userData` and `Countly.userDataBulk` no longer send a changed value for decimals or numbers outside the 32-bit integer range; they refuse them with an error message.
* Mitigated crash and input issues:
  * `Countly.logException` now accepts Error objects.
  * JS crash titles now name the function and the bundle file the error came from, by file name only, without device or build paths.
  * `Countly.recordMetrics` before init, a survey reported as closed with a `null` result, and inputs of the wrong type no longer crash the app or leave a promise unsettled.
  * `Countly.setCustomCrashSegments` after init, where it has no effect, now returns a warning. Set crash segments before `Countly.initWithConfig`.
* Mitigated an issue where `Countly.feedback.presentFeedbackWidget` ignored the close button text in Android.
* Mitigated an issue where the content callback status was a number in iOS; it is now the text "COMPLETED" or "CLOSED", the same as in Android.
* Mitigated an issue where the iOS privacy manifest was not bundled with the pod.
* Mitigated an issue where the Android build file set app-only values and its own build script when used inside an app.
* Mitigated TypeScript declaration issues: `Countly.d.ts` now compiles in strict mode, and its types match the API.

* No-push package (`countly-sdk-react-native-bridge-np`) specific changes:
  * The package is now generated from the same source as the push package, so it gets every change at the same time.
  * Android now reports the SDK name `js-rnbnp-android`, which the server recognizes, instead of `js-rnb-android-np`.
  * iOS no longer compiles push notification code.
  * Push notification calls and push config options are ignored with a warning log.

* Removed these deprecated functions. The remote config replacements return a promise, and `getValue` returns `null` for a missing key:
  * `Countly.recordView`, use `Countly.views.startAutoStoppedView`
  * `Countly.remoteConfigUpdate`, use `Countly.remoteConfig.update`
  * `Countly.updateRemoteConfigForKeysOnly`, use `Countly.remoteConfig.updateForKeysOnly`
  * `Countly.updateRemoteConfigExceptKeys`, use `Countly.remoteConfig.updateExceptKeys`
  * `Countly.getRemoteConfigValueForKey` and `Countly.getRemoteConfigValueForKeyP`, use `Countly.remoteConfig.getValue`
  * `Countly.remoteConfigClearValues`, use `Countly.remoteConfig.clearValues`

* iOS specific changes:
  * ! Minor breaking change ! A SIGPIPE the app neither ignores nor handles itself now ends the app after the crash is reported, as it would without the SDK. Before, the SDK reported it, kept the app running and turned automatic crash reporting off. An app that has to survive a broken pipe should ignore or handle SIGPIPE before `Countly.initWithConfig`.
  * Added support for server requested SDK log gathering and connection tests, and for SDK behavior settings that control automatic session tracking, automatic view tracking, automatic crash reporting and Journey Trigger Views, also for the running session.
  * Mitigated an issue where `Countly.userData.setProperty` and `Countly.userDataBulk.setProperty` with a predefined key (name, username, email, organization, phone, gender, picture, picturePath, byear) recorded a custom property of that name; they now set that field, as on Android.
  * `Countly.setUserData`, `Countly.userDataBulk.setUserProperties`, `Countly.userData.setProperty` and `Countly.userDataBulk.setProperty` now use the iOS SDK's user property API: pending events are sent before the user details, and `null` values and nested objects are skipped with a log line instead of being sent, as on Android.
  * The iOS SDK's default log level is now debug instead of verbose.

* Updated the underlying iOS SDK version to 26.8.0

## 26.1.0
* Added a new `Countly.sessions` interface for manual session control:
  * `beginSession()`
  * `updateSession()`
  * `endSession()`
* Added a new `Countly.remoteConfig` interface with:
  * `update()`
  * `updateForKeysOnly(keyNames)`
  * `updateExceptKeys(keyNames)`
  * `getValue(keyName)`
  * `clearValues()`
* Added a new `Countly.views` interface with:
  * `startAutoStoppedView(viewName, segmentation?)`
  * `startView(viewName, segmentation?)`
  * `stopViewWithName(viewName, segmentation?)`
  * `stopViewWithID(viewID, segmentation?)`
  * `stopAllViews(segmentation?)`
  * `pauseViewWithID(viewID)`
  * `resumeViewWithID(viewID)`
  * `addSegmentationToViewWithID(viewID, segmentation)`
  * `addSegmentationToViewWithName(viewName, segmentation)`
  * `setGlobalViewSegmentation(segmentation?)`
  * `updateGlobalViewSegmentation(segmentation)`
* Deprecated root-level session methods in favor of `Countly.sessions`:
  * `Countly.startSession()`
  * `Countly.updateSession()`
  * `Countly.endSession()`
* Deprecated root-level remote config methods in favor of `Countly.remoteConfig`:
  * `Countly.remoteConfigUpdate(...)`
  * `Countly.updateRemoteConfigForKeysOnly(...)`
  * `Countly.updateRemoteConfigExceptKeys(...)`
  * `Countly.getRemoteConfigValueForKey(...)`
  * `Countly.getRemoteConfigValueForKeyP(...)`
  * `Countly.remoteConfigClearValues()`
* Deprecated root-level view recording in favor of `Countly.views.startAutoStoppedView(...)`:
  * `Countly.recordView(...)`
* Deprecated legacy feedback shortcut helpers in favor of the newer direct present APIs:
  * `Countly.feedback.showNPS(...)` -> `Countly.feedback.presentNPS(...)`
  * `Countly.feedback.showSurvey(...)` -> `Countly.feedback.presentSurvey(...)`
  * `Countly.feedback.showRating(...)` -> `Countly.feedback.presentRating(...)`
* Added `Countly.remoteConfig.getValue(keyName)` as the async replacement for the older root-level remote config getters. It returns `null` when a value is missing.
* Added `Countly.addCustomNetworkRequestHeaders(...)` for runtime request header updates.
* Added `Countly.content.previewContent(contentId)` for direct content previews.
* Added `Countly.webViewDisplayOption` constants and `CountlyConfig.content.setWebViewDisplayOption(...)` for controlling content and feedback presentation.
* Added direct `Countly.feedback.presentNPS(...)`, `Countly.feedback.presentSurvey(...)`, and `Countly.feedback.presentRating(...)` helpers backed by the latest native feedback APIs.
* Added `Countly.deviceId.changeID(newDeviceID, merge)` to the device ID interface for explicit merge control after removing the old root-level `Countly.changeDeviceId(...)` API.
* Added init config options for manual session control, hybrid manual session mode, automatic view tracking, global view segmentation, custom network request headers, and disabling auto view restart.
  * `enableManualSessionControl()`
  * `enableManualSessionControlHybridMode()`
  * `enableAutomaticViewTracking()`
  * `setAutomaticViewTrackingExclusionList(automaticViewTrackingExclusionList)`
  * `setGlobalViewSegmentation(globalViewSegmentation)`
  * `addCustomNetworkRequestHeaders(customHeaderValues)`
  * `disableViewRestartForManualRecording()`
* Mitigated an issue where the new remote config interface could reject on normal runtime conditions such as missing values, invalid input, or use before SDK initialization. These calls now log and return without crashing the app.
* Mitigated an issue where `Countly.initWithConfig(...)` could preserve an empty `deviceID` under the wrong field name instead of clearing the init payload value.
* Mitigated an issue where `allowedIntentPackageNames` could be dropped from init config serialization unless `allowedIntentClassNames` was also provided.
* Mitigated an inconsistency where `Countly.deviceId.setID(Countly.TemporaryDeviceIDString)` did not route temporary-device-ID mode through the dedicated native handling on Android, and now does so explicitly on both Android and iOS.
* ! Major breaking change ! Removed these deprecated functions. Apps that still call them must move to the replacement named on each line:
  * Removed `Countly.init(...)`. Use `Countly.initWithConfig(countlyConfig)`.
  * Removed `Countly.hasBeenCalledOnStart()`. No direct replacement.
  * Removed `Countly.sendEvent(...)`. Use `Countly.events.recordEvent(...)`.
  * Removed `Countly.pushTokenType(...)`. Use `CountlyConfig.setPushTokenType(...)` and `CountlyConfig.setPushNotificationChannelInformation(...)`.
  * Removed `Countly.configureIntentRedirectionCheck(...)`. Use `CountlyConfig.configureIntentRedirectionCheck(...)`.
  * Removed `Countly.start()` and `Countly.stop()`. No direct replacement; automatic session tracking is enabled by default. For manual control use `Countly.sessions.beginSession()`, `Countly.sessions.updateSession()`, and `Countly.sessions.endSession()`.
  * Removed `Countly.enableLogging()` and `Countly.disableLogging()`. Use `Countly.setLoggingEnabled(...)`.
  * Removed `Countly.setLocationInit(...)`. Use `CountlyConfig.setLocation(...)`.
  * Removed `Countly.getCurrentDeviceId()`. Use `Countly.deviceId.getID()`.
  * Removed `Countly.getDeviceIDType()`. Use `Countly.deviceId.getType()`.
  * Removed `Countly.changeDeviceId(...)`. Use `Countly.deviceId.setID(...)` for automatic merge selection or `Countly.deviceId.changeID(..., merge)` for explicit merge control.
  * Removed `Countly.enableCrashReporting()`. Use `CountlyConfig.enableCrashReporting()` with `Countly.initWithConfig(...)`.
  * Removed `Countly.enableParameterTamperingProtection(...)`. Use `CountlyConfig.enableParameterTamperingProtection(...)`.
  * Removed `Countly.startEvent(...)`, `Countly.cancelEvent(...)`, and `Countly.endEvent(...)`. Use `Countly.events.startEvent(...)`, `Countly.events.cancelEvent(...)`, and `Countly.events.endEvent(...)`.
  * Removed `Countly.setRequiresConsent(...)`. Use `CountlyConfig.setRequiresConsent(...)`.
  * Removed `Countly.giveConsentInit(...)`. Use `CountlyConfig.giveConsent(...)`.
  * Removed `Countly.setStarRatingDialogTexts(...)`. Use `CountlyConfig.setStarRatingDialogTexts(...)`.
  * Removed `Countly.getFeedbackWidgets()`. Use `Countly.feedback.getAvailableFeedbackWidgets()`.
  * Removed `Countly.presentFeedbackWidgetObject(...)`. Use `Countly.feedback.presentFeedbackWidget(...)`.
  * Removed `Countly.enableApm()` and `CountlyConfig.enableApm()`. Use the `CountlyConfig.apm` interface, including `enableAppStartTimeTracking()`, `enableForegroundBackgroundTracking()`, and `enableManualAppLoadedTrigger()` as needed.
  * Removed `Countly.enableAttribution(...)` and `Countly.recordAttributionID(...)`. Use `Countly.recordIndirectAttribution(...)`.
  * Removed `CountlyConfig.pushTokenType(...)`. Use `CountlyConfig.setPushTokenType(...)` and `CountlyConfig.setPushNotificationChannelInformation(...)`.
* With `CountlyConfig.enableCrashReporting()`, `Countly.initWithConfig` now installs the JS crash handler. It reports uncaught JS errors, then calls the error handler the app had before.

* Android specific changes:
  * Added `disableGradualRequestCleaner()` init config support.
  * Set the initial activity during SDK initialization to improve content and feedback presentation flows.
  * Ensured Android feedback, survey, NPS, and rating presentation runs on the UI thread to avoid WebView/dialog crashes when showing widgets from the React Native bridge.
  * Aligned the Android bridge with the current native SDK APIs for APM/crash config, preserved feedback widget version metadata for presentation, and allowed typed user-property values to pass through to the native user profile API.

* iOS specific changes:
  * Added support for the latest manual session handling, custom request header, content preview, and safe-area content display APIs from the native SDK.
  * Aligned the user-profile bridge with the current `Countly.user` APIs for typed custom-property setters and forwarded custom user data during `Countly.setUserData(...)` and `Countly.userDataBulk.setUserProperties(...)`.
  * ! Minor Breaking change ! : on iOS, custom fields passed through `Countly.setUserData(...)` and `Countly.userDataBulk.setUserProperties(...)` are now forwarded to the native SDK instead of being ignored by the bridge.

* Updated the underlying Android SDK version to 26.1.2
* Updated the underlying iOS SDK version to 26.1.1

## 25.4.1
* Improved Content display mechanics.
* Added "setRequestTimeoutDuration" init config parameter to change request timeout duration in seconds.
* Added a new function "recordMetrics(metricsOverride)" to send a manual metrics requests.
* Added a new Consent option "metrics" for controlling "recordMetrics" method. (This has no effect on Session metrics.)
* Added event listener calls for new architecture (thanks @j-q-in-berlin)

* Mitigated an issue in SDK limits config class initialization  (thanks @albertlaiuste) 

* Android specific changes:
  * Improved disk size calculation in crash reports.
  * Mitigated an issue that could have happened when navigating back from a Content.
  * Mitigated a persistency issue with init configuration provided SBS and its initial state.
  * Mitigated an issue where SBS could have been fetched twice.
 
* iOS specific changes:
  * Improved CPU architecture detection capabilities.
  * Added the ability to record reserved events.
  * Changed default log level from "Debug" to "Verbose".
  * Mitigated an SBS issue while in temporary ID mode.
  * Mitigated a possible Health Check network log recording issue.

* Updated the underlying Android SDK version to 25.4.4
* Updated the underlying iOS SDK version to 25.4.6

## 25.4.0
* ! Minor breaking change ! The SDK now exclusively uses random UUIDs for device id generation instead of platform specific OpenUDID or IDFV
* ! Minor breaking change ! Server Configuration is now enabled by default. Changes made on SDK Manager > SDK Configuration on your server will affect SDK behavior directly

* Added `refreshContentZone()` method for manual refresh of content zone
* Added `disableBackoffMechanism()` init config method for disabling request backoff logic
* Added `disableSDKBehaviorSettingsUpdates()` init config method for disabling server config sync requests
* Added `setSDKBehaviorSettings(settingsObject: object)` init config method for providing server config settings
* Added New Architecture (Turbo Modules) support
* Added fullscreen support for feedback widgets
* Added support for SDK health checks in iOS
* Added a built-in backoff mechanism when server responses are slow

* Mitigated an issue that caused PN message data collision if two message with same ID was received in Android
* Mitigated an issue that could occur while serializing events to improve stability, performance and memory usage in iOS
* Mitigated an issue where the safe area resolution was not correctly calculated for the content zone on certain iOS devices

* Updated the underlying Android SDK version to 25.4.2
* Updated the underlying iOS SDK version to 25.4.3

## 25.1.2
* Mitigated an issue where the visibility tracking could have been enabled by default

* Underlying Android SDK version is 25.1.1
* Underlying iOS SDK version is 25.1.1

## 25.1.1
* Improved content size management of content blocks.
* Added init time config options:
  * `.content.setZoneTimerInterval` to set the frequency of content update calls in seconds.
  * `.content.setGlobalContentCallback` to provide a callback that is called when a content is closed.

* Android Specific Changes:
  * Improved the custom CertificateTrustManager to handle domain-specific configurations by supporting hostname-aware checkServerTrusted calls.
  * Mitigated an issue where after closing a content, they were not being fetched again.
  * Mitigated an issue where, the action bar was overlapping with the content display.

* iOS Specific Changes:
  * Added dynamic resizing functionality for the content zone
  * Fixed an issue where the build UUID and executable name were missing from crash reports

* Updated the underlying Android SDK version to 25.1.1
* Updated the underlying iOS SDK version to 25.1.1

## 25.1.0
* ! Minor breaking change ! `Countly.userDataBulk.save()` method is now optional. SDK will save the cached data with internal triggers regularly.

* Added Content feature methods:
  * `enterContentZone`, to start Content checks (Experimental!)
  * `exitContentZone`, to stop Content checks (Experimental!)
* Added feedback widget convenience methods to display the first available widget or the one meets the criteria:
  * `Countly.feedback.showNPS(nameIDorTag?: string, widgetClosedCallback?: WidgetCallback): void`
  * `Countly.feedback.showSurvey(nameIDorTag?: string, widgetClosedCallback?: WidgetCallback): void`
  * `Countly.feedback.showRating(nameIDorTag?: string, widgetClosedCallback?: WidgetCallback): void`
* Added config interface `experimental` that provides experimental config options:
  * `.experimental.enablePreviousNameRecording()` for reporting previous event/view names
  * `.experimental.enableVisibilityTracking()` for reporting app visibility with events
* Added `Countly.deviceId.setID` method for changing device ID based on the device ID type
* Added support for Arrays of primitive types in event segmentation

* Deprecated following SDK calls:
  * `Countly.getCurrentDeviceId` (replaced with: `Countly.deviceId.getID`)
  * `Countly.getDeviceIDType` (replaced with: `Countly.deviceId.getType`)
  * `Countly.changeDeviceId` (replaced with: `Countly.deviceId.setID`)

* Mitigated an issue where a session could have started while the app was in the background when the device ID was changed (non-merge).
* Mitigated an issue where intent redirection checks were disabled by default
* Mitigated an issue crash tracking was not enabled with init config
* Mitigated an issue where app start time tracking was on by default

* Android Specific Changes:
  * ! Minor breaking change ! Unsupported types for user properties will now be omitted, they won't be converted to strings.
  * Disabled caching for webviews.
  * Mitigated an issue in the upload plugin that prevented the upload of a symbol file
  * Resolved a problem where revoked consents were sent after changes without merging.
  * Mitigated an issue that caused the device ID to be incorrectly set after changes with merging.
  * Mitigated an issue where on consent revoke, remote config values were cleared, not anymore.

* iOS Specific Changes:
  * Orientation info is now also sent during initialization
  * Added visionOS build support
  * Updated the SDK to ensure compatibility with the latest server response models
  * Improved view tracking capabilities
  * Mitigated an issue with the feedback widget URL encoding on iOS 16 and earlier, which prevented the widget from displaying
  * Mitigated an issue with content fetch URL encoding on iOS 16 and earlier, which caused the request to fail
  * Mitigated an issue where the terms and conditions URL (`tc` key) was sent without double quotes
  * Mitigated an issue where consent information was not sent when no consent was given during initialization
  * Mitigated an issue where a session did not end when session consent was removed
  * Mitigated an issue where pausing a view resulted in a '0' view duration.
  * Mitigated an issue where the user provided URLSessionConfiguration was not applied to direct requests

* Updated the underlying Android SDK version to 24.7.8
* Updated the underlying iOS SDK version to 24.7.9

## 24.4.1
* Added support for Feedback Widget terms and conditions
* Added six new configuration options under the 'sdkInternalLimits' interface of 'CountlyConfig':
  * 'setMaxKeyLength' for limiting the maximum size of all user provided string keys
  * 'setMaxValueSize' for limiting the size of all values in user provided segmentation key-value pairs
  * 'setMaxSegmentationValues' for limiting the max amount of user provided segmentation key-value pair count in one event
  * 'setMaxBreadcrumbCount' for limiting the max amount of breadcrumbs that can be recorded before the oldest one is deleted
  * 'setMaxStackTraceLinesPerThread' for limiting the max amount of stack trace lines to be recorded per thread
  * 'setMaxStackTraceLineLength' for limiting the max characters allowed per stack trace lines

* Android Specific Changes:
  * ! Minor breaking change ! Introduced SDK internal limits
  * Mitigated an issue where the session duration could have been calculated wrongly after a device ID change without merge
  * Mitigated an issue where a session could have continued after a device ID change without merge

* iOS Specific Changes:
  * Mitigated an issue where internal limits were not being applied to some values
  * Mitigated an issue where SDK limits could affect internal keys
  * Mitigated an issue that enabled recording reserved events
  * Mitigated an issue where timed events could have no ID
  * Mitigated an issue where the request queue could overflow while sending a request
  * Removed timestamps from crash breadcrumbs

* Updated the underlying Android SDK version to 24.4.1
* Updated the underlying iOS SDK version to 24.4.1

## 24.4.0
* ! Minor breaking change ! Tracking of foreground and background time for APM is disabled by default

* Added `disableAdditionalIntentRedirectionChecks` config method
* Added a new metric for detecting whether or not a device has a hinge for Android
* Added four new APM configuration options under the `CountlyConfig.apm` interface:
  * `enableForegroundBackgroundTracking` for enabling automatic F/B time tracking
  * `enableAppStartTimeTracking` for enabling automatic app launch time tracking (Android only)
  * `enableManualAppLoadedTrigger` for enabling the manipulation of app load time finished timestamp
  * `setAppStartTimestampOverride` for enabling the manipulation of app load time starting timestamp
* Added a new Event interface (`Countly.events`) that groups event related calls:
  * `recordEvent` for recording an event
  * `startEvent` for starting a timed event
  * `cancelEvent` for canceling an ongoing timed event
  * `endEvent` for ending a timed event and record it

* Mitigated an issue with `getRemoteConfigValueForKeyP` and `remoteConfigClearValues` happening when they were called before initializing the SDK

* Deprecated `enableApm` config option. Use `apm.enableAppStartTimeTracking` instead (for iOS also `enableForegroundBackgroundTracking` must be used)
* Deprecated the old events methods:
  * `sendEvent` use `Countly.events.recordEvent` instead
  * `startEvent` use `Countly.events.startEvent` instead
  * `cancelEvent` use `Countly.events.cancelEvent` instead
  * `endEvent` use `Countly.events.endEvent` instead

* Updated the underlying Android SDK version to 24.4.0
* Updated the underlying iOS SDK version to 24.4.0

## 23.12.0
* Added TS type declerations to the SDK

* Updated the underlying Android SDK version to 23.12.0
* Updated the underlying iOS SDK version to 23.12.0

## 23.10.0
* Fixed a bug where segment provided to 'logException' was ignored in Android devices
* Fixed a bug where bridged SDK logs were not printing

* Removed the deprecated 'setViewTracking' method. (No replacement)
* Removed the deprecated 'showFeedbackPopup' method. (replaced with 'presentRatingWidgetWithID')
* Removed the deprecated 'getAvailableFeedbackWidgets' method. (replaced with 'feedback.getAvailableFeedbackWidgets')
* Removed the deprecated 'presentFeedbackWidget' method. (replaced with 'feedback.presentFeedbackWidget')

* Underlying Android SDK version is 23.8.2
* Underlying iOS SDK version is 23.8.2

## 23.8.1
* Fixed bug where "presentFeedbackWidget" method would fail with "Property 'eventEmitter' doesn't exist" if callbacks are provided.

* Underlying Android SDK version is 23.8.2
* Underlying iOS SDK version is 23.8.2

## 23.8.0
* Added new Feedback interface (`Countly.feedback`) on the SDK interface that exposes the calls for feedback widgets.
* Added Manual Reporting feature for the Feedback Widgets. This includes two new methods under the new Feedback interface:
  * 'getFeedbackWidgetData'
  * 'reportFeedbackWidgetManually'

* Fixed bug on Android devices for unhandled promise rejection on `getRemoteConfigValueForKeyP`.

* Underlying Android SDK version is 23.8.2
* Underlying iOS SDK version is 23.8.2

## 23.6.1
* Fixed bug for Android devices where "getRemoteConfigValueForKey" and "getRemoteConfigValueForKeyP" methods would return the RCData object.

* Underlying Android SDK version is 23.8.2
* Underlying iOS SDK version is 23.8.2

## 23.6.0
* !! Major breaking change !! 'start' and 'stop' calls have been deprecated. They will do nothing. The SDK will now automatically track sessions based on the app's time in the foreground.
* ! Minor breaking change ! Remote config will now return previously downloaded values when remote-config consent is not given
* ! Minor breaking change ! If a manual session is already started, it will not be possible to call "BeginSession" without stopping the previous one. Android only.
* ! Minor breaking change ! If a manual session has not been started, it will not be possible to call "UpdateSession". Android only.
* ! Minor breaking change ! If a manual session has not been started, it will not be possible to call "EndSession". Android only.

* The feedback widget API now can interract with Rating widgets
* When getting the feedback widget list, now the "tag" field (accessed with the "tg" key) is also returned 
* Adding remaining request queue size information to every request
* Adding SDK health check requests after init

* Deprecated `enableAttribution` in config

* Fixed bug in Android where recording views would force send all stored events

* Updated underlying Android SDK version to 23.8.2
* Updated underlying iOS SDK version to 23.8.2

## 23.2.4
* Added new method to the Countly Config Object 'setPushNotificationAccentColor' to set notification accent color.
* Added 'setPushTokenType' and 'setPushNotificationChannel' calls to replace deprecated calls to the Countly Config Object.
* Deprecated the following SDK call: 'CountlyConfig.pushTokenType'

* Underlying Android SDK version is 22.09.4
* Underlying iOS SDK version is 23.02.2

## 23.2.3
* Fixed bug where the push notification type was not correctly set during init

* Underlying Android SDK version is 22.09.4
* Underlying iOS SDK version is 23.02.2

## 23.2.2
* Fixed bug that caused an issue in the deprecated init call

* Underlying Android SDK version is 22.09.4
* Underlying iOS SDK version is 23.02.2

## 23.2.1
* Default max segmentation value count changed from 30 to 100
* Fixed a bug on Android devices that prevented device ID to be changed when there is no consent given
* Fixed a race condition bug by emptying event queue before sending user profile changes.

* Updated underlying Android SDK version to 22.09.4
* Updated underlying iOS SDK version to 23.02.2

## 23.02.0
* Added a new SDK initialization call 'initWithConfig', and a configuration object to configure it.
* Added 'recordDirectAttribution' and 'recordIndirectAttribution' calls.
* Added 'getDeviceIDType' call to fetch the device ID type.
* Fixed a bug in IOS SDK that failed to correctly process temporary device id.
* Deprecated the following SDK calls:
  * 'init'
  * 'pushTokenType'
  * 'configureIntentRedirectionCheck'
  * 'setLocationInit'
  * 'enableCrashReporting'
  * 'enableParameterTamperingProtection'
  * 'setRequiresConsent'
  * 'giveConsentInit'
  * 'setStarRatingDialogTexts'
  * 'enableApm'
  * 'enableAttribution'
  * 'recordAttributionID' 
 
* Updated underlying Android SDK to version 22.09.3
* Underlying iOS SDK version is 22.06.2

## 22.06.5
* Added COUNTLY_EXCLUDE_PUSHNOTIFICATIONS flag in iOS React Native side to disable push notifications altogether.
* Forwarding push callbacks to appDelegate if CountlyRNPushNotifications.m is acting as push notification delegate.
* Underlying android SDK version is 22.06.2
* Underlying iOS SDK version is 22.06.2

## 22.06.4
* Fixed incorrect iOS push token type when passing "Countly.messagingMode.PRODUCTION" as token type.
* Underlying android SDK version is 22.06.2
* Underlying iOS SDK version is 22.06.2

## 22.06.3
* Fixed a bug in Android SDK that would throw a null pointer exception when calling "CountlyPush.displayNotification " and CountlyPush was not initialized
* Updated Underlying android SDK version to 22.06.2
* Underlying iOS SDK version is 22.06.2

## 22.06.2
* Fixed a bug in Android SDK that would throw a null pointer exception when calling "CountlyPush.onTokenRefresh" and CountlyPush was not initialized
* Updated Underlying android SDK version to 22.06.1
* Underlying iOS SDK version is 22.06.2

## 22.06.1
* !! iOS Push notification action issue fixed. To handle the push notification action you need to add this new call "[CountlyReactNative startObservingNotifications];" in "AppDelegate.m"
For more details please check the below mentioned link of "Handling push callbacks" section in Countly SDK documentation.
https://support.count.ly/hc/en-us/articles/360037813231-React-Native-Bridge-#handling-push-callbacks
* Underlying android SDK version is 22.06.0
* Underlying iOS SDK version is 22.06.2

## 22.06.0
* Added Feedback widget callbacks (widgetShown, widgetClosed and retrievedWidgets)
* Updated underlying android SDK version to 22.06.0
* Updated underlying iOS SDK version to 22.06.2

## 22.02.3
* User profile added option to send bulk data in single request instead of individual request
* Fixed isInitialized variable reset on hot reload
* Underlying android SDK version is 22.02.3
* Underlying iOS SDK version is 22.06.1

## 22.02.2
* Added a way to add allowed package names for push notification intent security.
* Added a way to add allowed class names for push notification intent security.
* Updated underlying android SDK version to 22.02.3
* Updated underlying iOS SDK version to 22.06.1

## 22.02.1
* Fixed opening two intent for MainActivity when clicking on push notification with deep-link.
* Updated underlying android SDK version to 22.02.1
* Updated underlying iOS SDK version to 22.06.0
  
## 22.02.0
* Fixed notification trampoline restrictions in Android 12 using reverse activity trampolining implementation.
* Updated underlying android SDK version to 22.02.0
* Underlying iOS SDK version is 21.11.2

## 21.11.2
* Fixed iOS push notification open url issue when notification is cached.
* Underlying android SDK version is 21.11.2
* Underlying iOS SDK version is 21.11.2

## 21.11.1
* Fixed bug that caused crashes when migrating from older versions on Android devices.
* Updated underlying android SDK version to 21.11.2
* Underlying iOS SDK version is 21.11.2

## 21.11.0
* !! Major breaking change !! Deprecating "ADVERTISING_ID" as device ID generation strategy. SDK will fall back to 'OPEN_UDID'. All "ADVERTISING_ID" device ID's will have their type changed to "OPEN_UDID". If the device will have a "null" device ID, a random one will be generated.
* !! Major breaking change !! Changing device ID without merging will now clear all consent. It has to be given again after this operation.
* !! Major breaking change !! Entering temporary ID mode will now clear all consent. It has to be given again after this operation.
* Device ID can now be changed when no consent is given
* Push notification now display/use the sent badge number in Android. It's visualization depends on the launcher.
* When recording internal events with 'recordEvent', the respective feature consent will now be checked instead of the 'events' consent.
* Consent changes will now send the whole consent state and not just the "delta"
* Added ability to add custom sound effect for android push notifications.
* Added platform information to push actioned events
* Fixed potential deadlock issue in Android.
* Fixed possible SecTrustCopyExceptions leak in iOS
* Deprecated 'askForFeedback' method. Added 'presentRatingWidgetWithID' method that should be used as it's replacement.
* Updated minimum supported iOS versions to 10.0
* Updated underlying android SDK version to 21.11.0
* Updated underlying iOS SDK version to 21.11.2

## 20.11.16
* Fixed push notification issue where some apps were unable to display push notifications in their kill state.
* Underlying android SDK version is 20.11.12
* Underlying iOS SDK version is 20.11.3

## 20.11.15
* Adding a mitigation when app is killed and received push notifications.
* Underlying android SDK version is 20.11.12
* Underlying iOS SDK version is 20.11.3

## 20.11.14
* Fixed a bug that threw an exception when logging a warning for "setUserData".
* Underlying android SDK version is 20.11.12
* Underlying iOS SDK version is 20.11.3

## 20.11.13
* Updated the Android "compileSdkVersion" and "targetSdkVersion" to "31".
* Adding the "exported" tag for the FCM service, required by Android 12.
* Fixed an Android push bug due to "CLOSE_SYSTEM_DIALOGS" permission denial, related to Android 12.
* Updated underlying android SDK to 20.11.12
* Underlying iOS SDK version is 20.11.3

## 20.11.12
* ! Minor breaking change ! Firebase dependency updated to version '22.0.0', replaced deprecated method to retrieve push token. This change now makes AndroidX mandatory.
* Bintray respository inclusion removed.
* Underlying android SDK is 20.11.11
* Underlying iOS SDK version is 20.11.3

## 20.11.11
* User profile issue fixed, user data was deleted for key if no value, null or undefined value was provided against that key.
* Fixed an issue on Android devices where events would not be sent.
* Updated underlying android SDK to 20.11.11
* Updated underlying iOS SDK to 20.11.3

## 20.11.10
* Error/crash stack parsing issue fixed for React-Native version >= 0.64
* Underlying android SDK is 20.11.10
* Underlying iOS SDK version is 20.11.1

## 20.11.9
* Automatic crash reporting issue fixed.
* Android background session logging issue fixed.
* Updated underlying android SDK to 20.11.10
* Underlying iOS SDK version is 20.11.1

## 20.11.8
* For android devices, moving a push related broadcast receiver decleration to the manifest to comply with 'PendingIntent' checks from the Play store
* Updated underlying android SDK to 20.11.9
* Underlying iOS SDK version is 20.11.1

## 20.11.7
* Added "setCustomMetrics" method to set the metrics you want to override

## 20.11.6
* !! To handle the push notification you need to add the notifcation callback "didReceiveNotificationResponse" in your "AppDelegate.m" file and send the reponse to Countly SDK using this function "onNotificationResponse", 
for more details please check the below mentioned link of "Handling push callbacks" section in Countly SDK documentation.
https://support.count.ly/hc/en-us/articles/360037813231-React-Native-Bridge-#handling-push-callbacks
* Push notification action issue fixed when app is closed and user tap on notification.
* Updated underlying android SDK to 20.11.8
* Underlying iOS SDK version is 20.11.1

## 20.11.5
* iOS thread safety added to make all function calls on main thread.

## 20.11.4
* Android session start issue fixed.
* Updated underlying android SDK to 20.11.5

## 20.11.4-RC2
* Additional checks added in android for Google vulnerability issue.
* INSTALL_REFERRER intent removed from SDK manifest file, for attribution analytics and install campaigns we recommend adding INSTALL_REFERRER intent in your application manifest file. Check documentation for more information.
* Updated underlying android SDK to 20.11.5-RC

## 20.11.3
* Added "disablePushNotifications" method to disable push notifications for iOS.
* Updated underlying android SDK to 20.11.3

## 20.11.2
* !! Due to cocoapods issue with Xcode 12, we have added the iOS SDK as source code instead of Pod. Due to that change,
 if you have already add the reference of files "CountlyNotificationService.h/m" then you need to update these files references by adding the files from "Pods/Development Pods/CountlyReactNative" and remove the old reference files.

## 20.11.1
* Added "getFeedbackWidgets" method to get a list of available feedback widgets as array of object to handle multiple widgets of same type.
* Added "presentFeedbackWidgetObject" to show/present a feedback widget with the combined widget object.
* Deprecated "getAvailableFeedbackWidgets" method. Usinag this function it is not possible to see all the available feedback widgets. In case there are multiple ones for the same type, only the last one will be returned due to their id being overwritten in the type field.
* Deprecated "presentFeedbackWidget" method.
* Updated underlying android SDK to 20.11.2
* Updated underlying ios SDK to 20.11.1

## 20.11.0
* !! Due to cocoapods issue with Xcode 12, we have created a new temporary Pod with a fix for Countly iOS SDK and named it "CountlyPod". 
Due to that change if you have already add the reference of files "CountlyNotificationService.h/m" then you need to update these files references by adding the files from "CountlyPod" and remove the old reference files.
* !! Consent change !! To use remote config, you now need to give "remote-config" consent
* !! Push breaking changes !! Google play vulnerability issue fixed due to broadcast receiver for android push notification
* Added Surveys and NPS feedback widgets
* Added "replaceAllAppKeysInQueueWithCurrentAppKey" method to replace all app keys in queue with the current app key
* Added "removeDifferentAppKeysFromQueue" method to remove all different app keys from the queue
* Added "setStarRatingDialogTexts" method to set text's for different fields of star rating dialog
* Added "setViewTracking" deprecated method back.
* Example app updated with single plugin for both IDFA and App tracking permission for iOS.
* Device id NSNull check added for iOS to fix the length on null crash.
* Updated underlying android SDK to 20.11.0
* Updated underlying ios SDK to 20.11.0

## 20.4.9
* Hotfix for compilation issue

## 20.4.8
* Added "recordAttributionID" call to support changes in iOS 14 related to App Tracking Permission.

## 20.4.7
* Adding call to set consent during init

## 20.4.6
* Adding APM calls
* Adding functionality to enable attribution
* Added call to retrieve the currently used device ID
* Updated "init" call to async
* Added "setLoggingEnabled" call
* Added call to set location during init time
* Fixed issues related to location tracking
* Fixed issue where ios crash handling was enabled without enabling it
* Deprecated "enableLogging" and "disableLogging" calls
* Updated underlying android SDK to 20.04.5
* Updated underlying ios SDK to 20.04.3

## 20.4.5
* Fixed "onNotification" listener
* Fixed a few issues with setting location
* Fixed bug with push messaging modes
* Reworked android push notifications (!! PREVIOUS ANDROID PUSH SETUP SHOULD BE REMOVED AFTER UPDATE !!)
* Adding android star rating callback
* Tweaked android push notifications to show up only in the notification bar
* Fixed SDK version and SDK name metrics to show not the bridged SDK values but the ones from the react native SDK

* Please refer to this documentation for released work https://support.count.ly/hc/en*us/articles/360037813231*React*Native*Bridge*
