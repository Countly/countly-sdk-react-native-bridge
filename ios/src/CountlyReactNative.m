// CountlyReactNative.m
//
// This code is provided under the MIT License.
//
// Please visit www.count.ly for more information.
//
// The module itself is written in Swift, in CountlyReactNative.swift. This file only tells React
// Native which methods that class exports and under what names. Every declaration here must match an
// @objc selector on the Swift class; a mismatch is a call that silently never arrives.

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(CountlyReactNative, RCTEventEmitter)

// MARK: - Init

// "init" is the JavaScript name; the selector cannot be called that, because Swift reserves
// the init family, and React Native exposes no public remap macro for an extern module.
_RCT_EXTERN_REMAP_METHOD(init, initialize : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject, NO)

// MARK: - Device ID

RCT_EXTERN_METHOD(setID : (NSString *)newDeviceID instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(changeDeviceId : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(getCurrentDeviceId : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getDeviceIDType : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)

// MARK: - Events

RCT_EXTERN_METHOD(recordEvent : (NSDictionary *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(startEvent : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(cancelEvent : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(endEvent : (NSDictionary *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(setEventSendThreshold : (NSArray *)arguments instanceName : (NSString *)instanceName)

// MARK: - Views

RCT_EXTERN_METHOD(recordView : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(startAutoStoppedView : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(startView : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(stopViewWithName : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(stopViewWithID : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(stopAllViews : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(pauseViewWithID : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(resumeViewWithID : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(addSegmentationToViewWithID : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(addSegmentationToViewWithName : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(setGlobalViewSegmentation : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(updateGlobalViewSegmentation : (NSArray *)arguments instanceName : (NSString *)instanceName)

// MARK: - Sessions

RCT_EXTERN_METHOD(startSession : (NSString *)instanceName)
RCT_EXTERN_METHOD(updateSession : (NSString *)instanceName)
RCT_EXTERN_METHOD(endSession : (NSString *)instanceName)

// MARK: - Configuration touched after construction

RCT_EXTERN_METHOD(setLoggingEnabled : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(isLoggingEnabled : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(isInitialized : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setHttpPostForced : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(pinnedCertificates : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(setCustomMetrics : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(recordMetrics : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(addCustomNetworkRequestHeaders : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(replaceAllAppKeysInQueueWithCurrentAppKey : (NSString *)instanceName)
RCT_EXTERN_METHOD(removeDifferentAppKeysFromQueue : (NSString *)instanceName)

// MARK: - Location

RCT_EXTERN_METHOD(setLocation : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(disableLocation : (NSString *)instanceName)

// MARK: - Crashes

RCT_EXTERN_METHOD(addCrashLog : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(setCustomCrashSegments : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(logException : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(logJSException : (NSString *)errTitle withMessage : (NSString *)message withStack : (NSString *)stackTrace instanceName : (NSString *)instanceName)

// MARK: - User profile

RCT_EXTERN_METHOD(setUserData : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_setUserProperties : (NSDictionary *)userProperties instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_setProperty : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_increment : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_incrementBy : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_multiply : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_saveMax : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_saveMin : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_setOnce : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_pushUniqueValue : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_pushValue : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_pullValue : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_save : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_setProperty : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_increment : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_incrementBy : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_multiply : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_saveMax : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_saveMin : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_setOnce : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_pushUniqueValue : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_pushValue : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_pullValue : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)

// MARK: - Consent

RCT_EXTERN_METHOD(giveConsent : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(removeConsent : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(giveAllConsent : (NSString *)instanceName)
RCT_EXTERN_METHOD(removeAllConsent : (NSString *)instanceName)

// MARK: - Attribution

RCT_EXTERN_METHOD(recordDirectAttribution : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(recordIndirectAttribution : (NSArray *)arguments instanceName : (NSString *)instanceName)

// MARK: - Remote config

RCT_EXTERN_METHOD(remoteConfigUpdate : (NSArray *)arguments instanceName : (NSString *)instanceName callback : (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(updateRemoteConfigForKeysOnly : (NSArray *)arguments instanceName : (NSString *)instanceName callback : (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(updateRemoteConfigExceptKeys : (NSArray *)arguments instanceName : (NSString *)instanceName callback : (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getRemoteConfigValueForKey : (NSArray *)arguments instanceName : (NSString *)instanceName callback : (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(remoteConfigClearValues : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)

// MARK: - Feedback widgets

RCT_EXTERN_METHOD(getFeedbackWidgets : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getAvailableFeedbackWidgets : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getFeedbackWidgetData : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(reportFeedbackWidgetManually : (NSArray *)arguments instanceName : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(presentFeedbackWidget : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(presentNPS : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(presentSurvey : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(presentRating : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(presentRatingWidgetWithID : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(showStarRating : (NSArray *)arguments instanceName : (NSString *)instanceName callback : (RCTResponseSenderBlock)callback)

// MARK: - Content

RCT_EXTERN_METHOD(enterContentZone : (NSString *)instanceName)
RCT_EXTERN_METHOD(refreshContentZone : (NSString *)instanceName)
RCT_EXTERN_METHOD(exitContentZone : (NSString *)instanceName)
RCT_EXTERN_METHOD(previewContent : (NSArray *)arguments instanceName : (NSString *)instanceName)

// MARK: - Performance monitoring

RCT_EXTERN_METHOD(startTrace : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(cancelTrace : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(clearAllTraces : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(endTrace : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(recordNetworkTrace : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(appLoadingFinished : (NSString *)instanceName)

// MARK: - Push notifications

RCT_EXTERN_METHOD(disablePushNotifications : (NSString *)instanceName)
RCT_EXTERN_METHOD(sendPushToken : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(askForNotificationPermission : (NSArray *)arguments instanceName : (NSString *)instanceName)
RCT_EXTERN_METHOD(registerForNotification : (NSArray *)arguments instanceName : (NSString *)instanceName)

// MARK: - Test helpers

RCT_EXTERN_METHOD(enableRequestCapture : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getCapturedRequests : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getRequestQueue : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getEventQueue : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(removeInstance : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(haltAllInstances : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(halt : (NSString *)instanceName resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)

@end
