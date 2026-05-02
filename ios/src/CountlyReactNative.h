#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"
#import <UserNotifications/UserNotifications.h>

@interface CountlyReactNative : RCTEventEmitter <RCTBridgeModule>
typedef void (^Result)(id _Nullable result);
- (void)event:(NSArray *_Nullable)arguments;
- (void)setLoggingEnabled:(NSArray *_Nullable)arguments;

- (void)recordView:(NSArray *_Nullable)arguments;

- (void)setHttpPostForced:(NSArray *_Nullable)arguments;
- (void)setLocation:(NSArray *_Nullable)arguments;
- (void)addCrashLog:(NSArray *_Nullable)arguments;

- (void)changeDeviceId:(NSArray *_Nullable)arguments;
- (void)pinnedCertificates:(NSArray *_Nullable)arguments;
- (void)startSession;
- (void)updateSession;
- (void)endSession;
- (void)addCustomNetworkRequestHeaders:(NSArray *_Nullable)arguments;
- (void)startEvent:(NSArray *_Nullable)arguments;
- (void)endEvent:(NSArray *_Nullable)arguments;

- (void)giveConsent:(NSArray *_Nullable)arguments;
- (void)removeConsent:(NSArray *_Nullable)arguments;
- (void)giveAllConsent;
- (void)removeAllConsent;
- (void)remoteConfigUpdate:(NSArray *_Nullable)arguments callback:(RCTResponseSenderBlock _Nullable)callback;
- (void)updateRemoteConfigForKeysOnly:(NSArray *_Nullable)arguments callback:(RCTResponseSenderBlock _Nullable)callback;
- (void)updateRemoteConfigExceptKeys:(NSArray *_Nullable)arguments callback:(RCTResponseSenderBlock _Nullable)callback;
- (void)getRemoteConfigValueForKey:(NSArray *_Nullable)arguments callback:(RCTResponseSenderBlock _Nullable)callback;
- (void)showStarRating:(NSArray *_Nullable)arguments callback:(RCTResponseSenderBlock _Nullable)callback;
- (void)presentFeedbackWidget:(NSArray *_Nullable)arguments;
- (void)presentNPS:(NSArray *_Nullable)arguments;
- (void)presentSurvey:(NSArray *_Nullable)arguments;
- (void)presentRating:(NSArray *_Nullable)arguments;
- (void)replaceAllAppKeysInQueueWithCurrentAppKey;
- (void)removeDifferentAppKeysFromQueue;
- (void)setEventSendThreshold:(NSArray *_Nullable)arguments;
- (void)sendPushToken:(NSArray *_Nullable)arguments;
- (void)askForNotificationPermission:(NSArray *_Nullable)arguments;
- (void)registerForNotification:(NSArray *_Nullable)arguments;
- (void)remoteConfigClearValues:(RCTPromiseResolveBlock _Nullable)resolve rejecter:(RCTPromiseRejectBlock _Nullable)reject;

- (void)startTrace:(NSArray *_Nullable)arguments;
- (void)cancelTrace:(NSArray *_Nullable)arguments;
- (void)clearAllTraces:(NSArray *_Nullable)arguments;
- (void)endTrace:(NSArray *_Nullable)arguments;
- (void)recordNetworkTrace:(NSArray *_Nullable)arguments;
- (void)setCustomMetrics:(NSArray *_Nullable)arguments;

- (void)appLoadingFinished;
- (void)disablePushNotifications;
- (void)enableRequestCapture:(RCTPromiseResolveBlock _Nullable)resolve rejecter:(RCTPromiseRejectBlock _Nullable)reject;
- (void)getCapturedRequests:(RCTPromiseResolveBlock _Nullable)resolve rejecter:(RCTPromiseRejectBlock _Nullable)reject;
- (void)getRequestQueue:(RCTPromiseResolveBlock _Nullable)resolve rejecter:(RCTPromiseRejectBlock _Nullable)reject;
- (void)getEventQueue:(RCTPromiseResolveBlock _Nullable)resolve rejecter:(RCTPromiseRejectBlock _Nullable)reject;
- (void)halt:(RCTPromiseResolveBlock _Nullable)resolve rejecter:(RCTPromiseRejectBlock _Nullable)reject;

- (void)enterContentZone;
- (void)refreshContentZone;
- (void)previewContent:(NSArray *_Nullable)arguments;
- (void)exitContentZone;

- (void)setID:(NSString *_Nonnull)newDeviceID;

#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
- (void)notificationCallback:(NSString *_Nullable)notificationJson;
+ (void)startObservingNotifications;
+ (void)onNotification:(NSDictionary *_Nullable)notification;
+ (void)onNotificationResponse:(UNNotificationResponse *_Nullable)response;
#endif
@end
