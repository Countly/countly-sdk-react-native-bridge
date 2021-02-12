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
* !! Due to cocoapods issue with Xcode 12, we have added the iOS SDK as source code instead of Pod. Due to that change if you have already add the reference of files "CountlyNotificationService.h/m" then you need to update these files references by adding the files from "Pods/Development Pods/CountlyReactNative" and remove the old reference files.

## 20.11.1
* Added "getFeedbackWidgets" method to get a list of available feedback widgets as array of object to handle multiple widgets of same type.
* Added "presentFeedbackWidgetObject" to show/present a feedback widget with the combined widget object.
* Deprecated "getAvailableFeedbackWidgets" method. Usinag this function it is not possible to see all the available feedback widgets. In case there are multiple ones for the same type, only the last one will be returned due to their id being overwritten in the type field.
* Deprecated "presentFeedbackWidget" method.
* Updated underlying android SDK to 20.11.2
* Updated underlying ios SDK to 20.11.1

## 20.11.0
* !! Due to cocoapods issue with Xcode 12, we have created a new temporary Pod with a fix for Countly iOS SDK and named it "CounltyPod". Due to that change if you have already add the reference of files "CountlyNotificationService.h/m" then you need to update these files references by adding the files from "CountlyPod" and remove the old reference files.
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
