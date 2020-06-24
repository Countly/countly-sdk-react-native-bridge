#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface CountlyReactNative : RCTEventEmitter <RCTBridgeModule>
typedef void (^Result)(id _Nullable result);
- (void)init:(NSArray*_Nullable)arguments;
- (void)event:(NSArray*_Nullable)arguments;
- (void)setLoggingEnabled:(NSArray*_Nullable)arguments;
- (void)setUserData:(NSArray*_Nullable)arguments;
- (void)start;
- (void)stop;
- (void)recordView:(NSArray*_Nullable)arguments;

- (void)setHttpPostForced:(NSArray*_Nullable)arguments;
- (void)setLocation:(NSArray*_Nullable)arguments;
- (void)enableCrashReporting;
- (void)addCrashLog:(NSArray*_Nullable)arguments;

- (void)changeDeviceId:(NSArray*_Nullable)arguments;
- (void)enableParameterTamperingProtection:(NSArray*_Nullable)arguments;
- (void)pinnedCertificates:(NSArray*_Nullable)arguments;
- (void)startEvent:(NSArray*_Nullable)arguments;
- (void)endEvent:(NSArray*_Nullable)arguments;

- (void)userData_setProperty:(NSArray*_Nullable)arguments;
- (void)userData_increment:(NSArray*_Nullable)arguments;
- (void)userData_incrementBy:(NSArray*_Nullable)arguments;
- (void)userData_multiply:(NSArray*_Nullable)arguments;
- (void)userData_saveMax:(NSArray*_Nullable)arguments;
- (void)userData_saveMin:(NSArray*_Nullable)arguments;
- (void)demo:(NSArray*_Nullable)arguments;
- (void)setRequiresConsent:(NSArray*_Nullable)arguments;
- (void)giveConsent:(NSArray*_Nullable)arguments;
- (void)removeConsent:(NSArray*_Nullable)arguments;
- (void)giveAllConsent;
- (void)removeAllConsent;
- (void)remoteConfigUpdate:(NSArray*_Nullable)arguments callback:(RCTResponseSenderBlock _Nullable)callback;
- (void)updateRemoteConfigForKeysOnly:(NSArray*_Nullable)arguments callback:(RCTResponseSenderBlock _Nullable)callback;
- (void)updateRemoteConfigExceptKeys:(NSArray*_Nullable)arguments callback:(RCTResponseSenderBlock _Nullable)callback;
- (void)getRemoteConfigValueForKey:(NSArray*_Nullable)arguments callback:(RCTResponseSenderBlock _Nullable)callback;
- (void)showStarRating:(NSArray*_Nullable)arguments callback:(RCTResponseSenderBlock _Nullable)callback;
- (void)showFeedbackPopup:(NSArray*_Nullable)arguments;
- (void)setEventSendThreshold:(NSArray*_Nullable)arguments;
- (void)pushTokenType:(NSArray*_Nullable)arguments;
- (void)sendPushToken:(NSArray*_Nullable)arguments;
- (void)askForNotificationPermission:(NSArray*_Nullable)arguments;
- (void)registerForNotification:(NSArray*_Nullable)arguments;
+ (void)onNotification:(NSDictionary *_Nullable)notification;
- (void)handleRemoteNotificationReceived:(NSDictionary *_Nullable)notification;
- (void)remoteConfigClearValues:(RCTPromiseResolveBlock _Nullable )resolve rejecter:(RCTPromiseRejectBlock _Nullable )reject;
+ (NSString *_Nullable) toJSON: (NSDictionary  * _Nullable) json;
- (void) saveListener:(Result _Nullable ) result;
@end
