// CountlyReactNative.m
//
// This code is provided under the MIT License.
//
// Please visit www.count.ly for more information.
//
// The module itself is written in Swift, in CountlyReactNative.swift. This file
// only tells React Native which methods that class exports and under what names,
// which is the one part of a Swift module React Native still needs in
// Objective-C. Every declaration here must match an @objc selector on the Swift
// class; a mismatch is a call that silently never arrives.

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(CountlyReactNative, RCTEventEmitter)

// MARK: - Init

// "init" is the JavaScript name; the selector cannot be called that, because
// Swift reserves the init family. React Native exposes no public remap macro for
// an extern module, so this is the same underlying macro RCT_REMAP_METHOD uses.
_RCT_EXTERN_REMAP_METHOD(init, initialize : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject, NO)

// MARK: - Device ID

RCT_EXTERN_METHOD(setID : (NSString *)newDeviceID)
RCT_EXTERN_METHOD(changeDeviceId : (NSArray *)arguments)
RCT_EXTERN_METHOD(getCurrentDeviceId : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getDeviceIDType : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)

// MARK: - Events

RCT_EXTERN_METHOD(recordEvent : (NSDictionary *)arguments)
RCT_EXTERN_METHOD(startEvent : (NSArray *)arguments)
RCT_EXTERN_METHOD(cancelEvent : (NSArray *)arguments)
RCT_EXTERN_METHOD(endEvent : (NSDictionary *)arguments)
RCT_EXTERN_METHOD(setEventSendThreshold : (NSArray *)arguments)

// MARK: - Views

RCT_EXTERN_METHOD(recordView : (NSArray *)arguments)
RCT_EXTERN_METHOD(startAutoStoppedView : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(startView : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(stopViewWithName : (NSArray *)arguments)
RCT_EXTERN_METHOD(stopViewWithID : (NSArray *)arguments)
RCT_EXTERN_METHOD(stopAllViews : (NSArray *)arguments)
RCT_EXTERN_METHOD(pauseViewWithID : (NSArray *)arguments)
RCT_EXTERN_METHOD(resumeViewWithID : (NSArray *)arguments)
RCT_EXTERN_METHOD(addSegmentationToViewWithID : (NSArray *)arguments)
RCT_EXTERN_METHOD(addSegmentationToViewWithName : (NSArray *)arguments)
RCT_EXTERN_METHOD(setGlobalViewSegmentation : (NSArray *)arguments)
RCT_EXTERN_METHOD(updateGlobalViewSegmentation : (NSArray *)arguments)

// MARK: - Sessions

RCT_EXTERN_METHOD(startSession)
RCT_EXTERN_METHOD(updateSession)
RCT_EXTERN_METHOD(endSession)

// MARK: - Configuration

RCT_EXTERN_METHOD(setLoggingEnabled : (NSArray *)arguments)
RCT_EXTERN_METHOD(isLoggingEnabled : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(isInitialized : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setHttpPostForced : (NSArray *)arguments)
RCT_EXTERN_METHOD(pinnedCertificates : (NSArray *)arguments)
RCT_EXTERN_METHOD(setCustomMetrics : (NSArray *)arguments)
RCT_EXTERN_METHOD(recordMetrics : (NSArray *)arguments)
RCT_EXTERN_METHOD(addCustomNetworkRequestHeaders : (NSArray *)arguments)
RCT_EXTERN_METHOD(replaceAllAppKeysInQueueWithCurrentAppKey)
RCT_EXTERN_METHOD(removeDifferentAppKeysFromQueue)

// MARK: - Location

RCT_EXTERN_METHOD(setLocation : (NSArray *)arguments)
RCT_EXTERN_METHOD(disableLocation)

// MARK: - Crashes

RCT_EXTERN_METHOD(addCrashLog : (NSArray *)arguments)
RCT_EXTERN_METHOD(setCustomCrashSegments : (NSArray *)arguments)
RCT_EXTERN_METHOD(logException : (NSArray *)arguments)
RCT_EXTERN_METHOD(logJSException : (NSString *)errTitle withMessage : (NSString *)message withStack : (NSString *)stackTrace)

// MARK: - User profile

RCT_EXTERN_METHOD(setUserData : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_setProperty : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_increment : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_incrementBy : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_multiply : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_saveMax : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_saveMin : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_setOnce : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_pushUniqueValue : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_pushValue : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userData_pullValue : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_setUserProperties : (NSDictionary *)userProperties resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_save : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_setProperty : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_increment : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_incrementBy : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_multiply : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_saveMax : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_saveMin : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_setOnce : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_pushUniqueValue : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_pushValue : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(userDataBulk_pullValue : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)

// MARK: - Consent

RCT_EXTERN_METHOD(giveConsent : (NSArray *)arguments)
RCT_EXTERN_METHOD(removeConsent : (NSArray *)arguments)
RCT_EXTERN_METHOD(giveAllConsent)
RCT_EXTERN_METHOD(removeAllConsent)

// MARK: - Attribution

RCT_EXTERN_METHOD(recordDirectAttribution : (NSArray *)arguments)
RCT_EXTERN_METHOD(recordIndirectAttribution : (NSArray *)arguments)

// MARK: - Remote config

RCT_EXTERN_METHOD(remoteConfigUpdate : (NSArray *)arguments callback : (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(updateRemoteConfigForKeysOnly : (NSArray *)arguments callback : (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(updateRemoteConfigExceptKeys : (NSArray *)arguments callback : (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getRemoteConfigValueForKey : (NSArray *)arguments callback : (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(remoteConfigClearValues : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)

// MARK: - Feedback widgets

RCT_EXTERN_METHOD(getFeedbackWidgets : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getAvailableFeedbackWidgets : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getFeedbackWidgetData : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(reportFeedbackWidgetManually : (NSArray *)arguments resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(presentFeedbackWidget : (NSArray *)arguments)
RCT_EXTERN_METHOD(presentNPS : (NSArray *)arguments)
RCT_EXTERN_METHOD(presentSurvey : (NSArray *)arguments)
RCT_EXTERN_METHOD(presentRating : (NSArray *)arguments)
RCT_EXTERN_METHOD(presentRatingWidgetWithID : (NSArray *)arguments)
RCT_EXTERN_METHOD(showStarRating : (NSArray *)arguments callback : (RCTResponseSenderBlock)callback)

// MARK: - Content

RCT_EXTERN_METHOD(enterContentZone)
RCT_EXTERN_METHOD(refreshContentZone)
RCT_EXTERN_METHOD(exitContentZone)
RCT_EXTERN_METHOD(previewContent : (NSArray *)arguments)

// MARK: - Performance monitoring

RCT_EXTERN_METHOD(startTrace : (NSArray *)arguments)
RCT_EXTERN_METHOD(cancelTrace : (NSArray *)arguments)
RCT_EXTERN_METHOD(clearAllTraces : (NSArray *)arguments)
RCT_EXTERN_METHOD(endTrace : (NSArray *)arguments)
RCT_EXTERN_METHOD(recordNetworkTrace : (NSArray *)arguments)
RCT_EXTERN_METHOD(appLoadingFinished)

// MARK: - Push notifications

RCT_EXTERN_METHOD(disablePushNotifications)
RCT_EXTERN_METHOD(sendPushToken : (NSArray *)arguments)
RCT_EXTERN_METHOD(askForNotificationPermission : (NSArray *)arguments)
RCT_EXTERN_METHOD(registerForNotification : (NSArray *)arguments)

// MARK: - Test helpers

RCT_EXTERN_METHOD(enableRequestCapture : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getCapturedRequests : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getRequestQueue : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getEventQueue : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(halt : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)

@end
