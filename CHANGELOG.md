## 21.10.0
* Added a way to retrieve feedback widget data and manually report them
* Appear and dismiss callback implemented for nps/survey widgets
* Underlying android SDK is 20.11.10
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
* !! To handle the push notification you need to add the notifcation callback "didReceiveNotificationResponse" in your "AppDelegate.m" file and send the reponse to Countly SDK using this function "onNotificationResponse", for more detials please check the below mentioned link of "Handling push callbacks" section in Countly SDK documentation.
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
