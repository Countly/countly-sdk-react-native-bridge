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
