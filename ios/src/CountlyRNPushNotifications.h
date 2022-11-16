// CountlyRNPushNotifications.h
//
// This code is provided under the MIT License.
//
// Please visit www.count.ly for more information.

#import <Foundation/Foundation.h>
#import "CountlyReactNative.h"


@interface CountlyRNPushNotifications : NSObject

+ (instancetype _Nonnull )sharedInstance;

- (void)startObservingNotifications;
- (void)stopObservingNotifications;
- (void)recordPushActions;
- (void)askForNotificationPermission;
- (void)registerForNotification;
- (void)setCountlyReactNative:(CountlyReactNative *_Nullable)countlyReactNative;
- (void)onNotification:(NSDictionary *_Nullable)notification;
- (void)onNotificationResponse:(UNNotificationResponse* _Nullable)response;
@end