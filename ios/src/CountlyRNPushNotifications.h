// CountlyRNPushNotifications.h
//
// This code is provided under the MIT License.
//
// Please visit www.count.ly for more information.

#import "CountlyReactNative.h"
#import <Foundation/Foundation.h>

@interface CountlyRNPushNotifications : NSObject
#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
+ (instancetype _Nonnull)sharedInstance;

- (void)startObservingNotifications;
- (void)stopObservingNotifications;
- (void)recordPushActions;
- (void)askForNotificationPermission;
- (void)registerForNotification;
- (void)setCountlyReactNative:(CountlyReactNative *_Nullable)countlyReactNative;
- (void)onNotification:(NSDictionary *_Nullable)notification;
- (void)onNotificationResponse:(UNNotificationResponse *_Nullable)response;
#endif
@end
