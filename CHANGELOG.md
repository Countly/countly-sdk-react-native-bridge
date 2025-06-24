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
