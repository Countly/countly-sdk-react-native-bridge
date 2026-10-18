## XX.XX.XX-np
* ! Minor breaking change ! `Countly.remoteConfig.updateForKeysOnly` and `updateExceptKeys` now enroll the user only in the A/B tests of the downloaded keys in iOS, not in all running A/B tests.
* ! Minor breaking change ! `Countly.remoteConfig.getValue` now returns string values as strings in Android. Before, "2.10" came back as 2.1.
* ! Minor breaking change ! `Countly.logException(exception, false)` now records a fatal crash.
* ! Minor breaking change ! An uncaught JS error that crashes a release build is now recorded once, as a fatal crash with its JS stack, instead of twice.
* ! Minor breaking change ! The Firebase BoM is updated from 28.4.2 to 32.8.1 (firebase-messaging 23.4.1) in Android. Apps that use an older Firebase BoM get the versions of 32.8.1 for their Firebase libraries, and the Kotlin standard library 1.7.10 joins the build. The minimum Android version stays API 21.
* ! Minor breaking change ! `Countly.test` helpers now work only in debug builds.
* ! Minor breaking change ! The package now ships only the files the SDK needs at runtime; the example app, the tests and the Xcode project for manual linking are no longer part of it. It declares `react-native` as a peer dependency and needs React Native 0.62 or newer.
* ! Minor breaking change ! The pod now makes only the bridge header and the iOS SDK's public headers public; other headers can no longer be imported from it. The `NotificationService` subspec no longer depends on React, and `pod 'CountlyReactNative'` installs only the `Core` subspec. With React Native 0.71 and newer, the pod's iOS deployment target now follows React Native's minimum iOS version.

* Added a `{ success, error }` result to `Countly.remoteConfig.update`, `updateForKeysOnly` and `updateExceptKeys`.
* Added `Countly.registerForNotificationOpened(listener)`. It is called when the user taps a push, in Android and iOS, with the push data and the tapped action index: 0 for the notification, 1 and up for its buttons. A tap that started the app is delivered once a listener is registered. In Android, call `setIntent(intent)` in your MainActivity's `onNewIntent` so a tap that brings back a stopped app is delivered too.
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

## 26.1.0-np
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

## 25.4.1-np
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

## 25.4.0-np
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

## 25.1.2-np
* Mitigated an issue where the visibility tracking could have been enabled by default

* Underlying Android SDK version is 25.1.1
* Underlying iOS SDK version is 25.1.1

## 25.1.1-np
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

## 25.1.0-np
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

## 24.4.1-np
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

## 24.4.0-np
* This flavor is a "no Push Notification" variant of the Countly React Native SDK branched from the same version.
* All FCM related code is removed.
* All Push Notification related methods would be ignored.

* The underlying Android SDK version is 24.4.0
* The underlying iOS SDK version is 24.4.0
