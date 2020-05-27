#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface CountlyReactNative : RCTEventEmitter <RCTBridgeModule>

- (void)init:(NSArray*)arguments;
- (void)event:(NSArray*)arguments;
- (void)setLoggingEnabled:(NSArray*)arguments;
- (void)setUserData:(NSArray*)arguments;
- (void)start;
- (void)stop;
- (void)recordView:(NSArray*)arguments;

- (void)setHttpPostForced:(NSArray*)arguments;
- (void)setLocation:(NSArray*)arguments;
- (void)enableCrashReporting;
- (void)addCrashLog:(NSArray*)arguments;

- (void)changeDeviceId:(NSArray*)arguments;
- (void)enableParameterTamperingProtection:(NSArray*)arguments;
- (void)pinnedCertificates:(NSArray*)arguments;
// - (void)startEvent:(NSString*)arguments;
// - (void)endEvent:(NSDictionary*)arguments;
- (void)startEvent:(NSArray*)arguments;
- (void)endEvent:(NSArray*)arguments;

- (void)userData_setProperty:(NSArray*)arguments;
- (void)userData_increment:(NSArray*)arguments;
- (void)userData_incrementBy:(NSArray*)arguments;
- (void)userData_multiply:(NSArray*)arguments;
- (void)userData_saveMax:(NSArray*)arguments;
- (void)userData_saveMin:(NSArray*)arguments;
- (void)demo:(NSArray*)arguments;
- (void)setRequiresConsent:(NSArray*)arguments;
- (void)giveConsent:(NSArray*)arguments;
- (void)removeConsent:(NSArray*)arguments;
- (void)giveAllConsent;
- (void)removeAllConsent;
- (void)remoteConfigUpdate:(NSArray*)arguments callback:(RCTResponseSenderBlock)callback;
- (void)updateRemoteConfigForKeysOnly:(NSArray*)arguments callback:(RCTResponseSenderBlock)callback;
- (void)updateRemoteConfigExceptKeys:(NSArray*)arguments callback:(RCTResponseSenderBlock)callback;
- (void)getRemoteConfigValueForKey:(NSArray*)arguments callback:(RCTResponseSenderBlock)callback;
//- (void)setStarRatingDialogTexts:(NSArray*)arguments;
- (void)showStarRating:(NSArray*)arguments callback:(RCTResponseSenderBlock)callback;
- (void)showFeedbackPopup:(NSArray*)arguments;
- (void)setEventSendThreshold:(NSArray*)arguments;
- (void)pushTokenType:(NSArray*)arguments;
- (void)sendPushToken:(NSArray*)arguments;
- (void)askForNotificationPermission:(NSArray*)arguments;
- (void)registerForNotification:(NSArray*)arguments;
+ (void)onNotification:(NSDictionary *)notification;
- (void)handleRemoteNotificationReceived:(NSDictionary *)notification;
- (void)remoteConfigClearValues:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject;

@end
