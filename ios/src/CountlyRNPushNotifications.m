// CountlyRNPushNotifications.m
//
// This code is provided under the MIT License.
//
// Please visit www.count.ly for more information.

#import "CountlyRNPushNotifications.h"
#import "CountlyCommon.h"
#import "UserNotifications/UserNotifications.h"

#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
NSDictionary *lastStoredNotification = nil;
Result notificationListener = nil;
NSMutableArray *notifications = nil;
static BOOL isForwardingToAppDelegate = NO;
static BOOL notificationOpenedListenerRegistered = NO;
static NSMutableArray<NSString *> *pendingOpenedNotifications = nil;
static const NSUInteger kMaxPendingOpenedNotifications = 10;

CountlyReactNative *_countlyReactNative = nil;

typedef NSString *CLYUserDefaultKey NS_EXTENSIBLE_STRING_ENUM;
CLYUserDefaultKey const CLYPushNotificationsKey = @"notificationsKey";
CLYUserDefaultKey const CLYPushButtonIndexKey = @"notificationBtnIndexKey";
#endif
@interface CountlyRNPushNotifications () <UNUserNotificationCenterDelegate>
@end

@implementation CountlyRNPushNotifications
#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
+ (instancetype)sharedInstance {
    static CountlyRNPushNotifications *s_sharedInstance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      s_sharedInstance = self.new;
    });
    return s_sharedInstance;
}

- (instancetype)init {
    if (self = [super init]) {
    }

    notifications = [[NSUserDefaults standardUserDefaults] mutableArrayValueForKey:CLYPushNotificationsKey];
    return self;
}

- (void)setCountlyReactNative:(CountlyReactNative *_Nullable)countlyReactNative {
    _countlyReactNative = countlyReactNative;
    dispatch_async(dispatch_get_main_queue(), ^{
      notificationOpenedListenerRegistered = NO;
    });
}

- (void)stopObservingNotifications {
    if (UNUserNotificationCenter.currentNotificationCenter.delegate == self)
        UNUserNotificationCenter.currentNotificationCenter.delegate = nil;
}

- (void)startObservingNotifications {
    UNUserNotificationCenter.currentNotificationCenter.delegate = self;
}

- (void)askForNotificationPermission {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance askForNotificationPermission];
    });
}

- (void)saveListener:(Result)result {
    notificationListener = result;
}

- (void)registerForNotification {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self saveListener:^(id _Nullable result) {
        [_countlyReactNative notificationCallback:[CountlyRNPushNotifications toJSON:lastStoredNotification]];
        lastStoredNotification = nil;
      }];
      if (lastStoredNotification != nil) {
          [_countlyReactNative notificationCallback:[CountlyRNPushNotifications toJSON:lastStoredNotification]];
          lastStoredNotification = nil;
      }
    });
}

/**
 * Starts delivering push notification taps to JS, including taps that came in before JS registered.
 */
- (void)registerForNotificationOpened {
    dispatch_async(dispatch_get_main_queue(), ^{
      notificationOpenedListenerRegistered = YES;
      NSArray<NSString *> *pending = [pendingOpenedNotifications copy];
      [pendingOpenedNotifications removeAllObjects];
      for (NSString *openedNotification in pending) {
          [_countlyReactNative notificationOpenedCallback:openedNotification];
      }
    });
}

/**
 * Delivers a push notification tap to JS, or keeps it until JS registers a listener, for example while the app is still starting.
 *
 * @param notification the tapped notification's payload
 * @param actionIndex 0 for the notification itself, 1 and up for its buttons
 */
- (void)deliverNotificationOpened:(NSDictionary *)notification actionIndex:(NSInteger)actionIndex {
    if (!NSThread.isMainThread) {
        dispatch_async(dispatch_get_main_queue(), ^{
          [self deliverNotificationOpened:notification actionIndex:actionIndex];
        });
        return;
    }
    NSDictionary *opened = @{ @"notification" : notification ?: @{}, @"actionIndex" : @(actionIndex) };
    if (![NSJSONSerialization isValidJSONObject:opened]) {
        return;
    }
    NSData *openedData = [NSJSONSerialization dataWithJSONObject:opened options:0 error:nil];
    NSString *openedJson = openedData ? [[NSString alloc] initWithData:openedData encoding:NSUTF8StringEncoding] : nil;
    if (!openedJson) {
        return;
    }
    if (notificationOpenedListenerRegistered && _countlyReactNative) {
        [_countlyReactNative notificationOpenedCallback:openedJson];
        return;
    }
    if (pendingOpenedNotifications == nil) {
        pendingOpenedNotifications = NSMutableArray.new;
    }
    if (pendingOpenedNotifications.count >= kMaxPendingOpenedNotifications) {
        [pendingOpenedNotifications removeObjectAtIndex:0];
    }
    [pendingOpenedNotifications addObject:openedJson];
}

- (void)recordPushActions {
    NSMutableArray *_notifications = [[NSUserDefaults standardUserDefaults] mutableArrayValueForKey:CLYPushNotificationsKey];
    if (_notifications != nil) {
        for (NSMutableDictionary *notificationMessage in _notifications) {
            [self recordPushAction:notificationMessage];
        }
    }

    [[NSUserDefaults standardUserDefaults] removeObjectForKey:CLYPushNotificationsKey];
    [[NSUserDefaults standardUserDefaults] synchronize];
}

- (void)recordPushAction:(NSMutableDictionary *)notificationMessage {
    if (notificationMessage != nil) {
        NSNumber *buttonIndex = notificationMessage[CLYPushButtonIndexKey];
        NSInteger responseBtnIndex = buttonIndex.intValue;
        NSMutableDictionary *responseDictionary = [notificationMessage mutableCopy];
        [responseDictionary removeObjectForKey:CLYPushButtonIndexKey];

        if ([responseDictionary count] > 0) {

            NSDictionary *countlyPayload = responseDictionary[kCountlyPNKeyCountlyPayload];
            NSString *URL = @"";
            if (responseBtnIndex == 0) {
                URL = countlyPayload[kCountlyPNKeyDefaultURL];
            } else {
                URL = countlyPayload[kCountlyPNKeyButtons][responseBtnIndex - 1][kCountlyPNKeyActionButtonURL];
            }

            [Countly.sharedInstance recordActionForNotification:responseDictionary clickedButtonIndex:responseBtnIndex];

            [self openURL:URL];
        }
    }
}

- (void)openURL:(NSString *)URLString {
    if (!URLString)
        return;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.01 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      [UIApplication.sharedApplication openURL:[NSURL URLWithString:URLString] options:@{} completionHandler:nil];
    });
}

// when user open the app by tapping notification in any state.
- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler {
    [self handleNotificationResponse:response];

    id<UNUserNotificationCenterDelegate> appDelegate = (id<UNUserNotificationCenterDelegate>)UIApplication.sharedApplication.delegate;
    if ([appDelegate respondsToSelector:@selector(userNotificationCenter:didReceiveNotificationResponse:withCompletionHandler:)]) {
        isForwardingToAppDelegate = YES;
        [appDelegate userNotificationCenter:center didReceiveNotificationResponse:response withCompletionHandler:completionHandler];
        isForwardingToAppDelegate = NO;
    } else {
        completionHandler();
    }
}

// When app is running and notification received
- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler {
    [self handleNotification:notification.request.content.userInfo];
    __block BOOL completionCalled = NO;
    void (^completeOnce)(UNNotificationPresentationOptions) = ^(UNNotificationPresentationOptions options) {
        if (completionCalled) {
            return;
        }
        completionCalled = YES;
        completionHandler(options);
    };
    NSDictionary *countlyPayload = notification.request.content.userInfo[kCountlyPNKeyCountlyPayload];
    NSString *notificationID = countlyPayload[kCountlyPNKeyNotificationID];

    if (notificationID) {
        UNNotificationPresentationOptions presentationOption = UNNotificationPresentationOptionNone;
        if (@available(iOS 14.0, tvOS 14.0, macOS 11.0, watchOS 7.0, *)) {
            presentationOption = UNNotificationPresentationOptionList | UNNotificationPresentationOptionBanner;
        } else {
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
            presentationOption = UNNotificationPresentationOptionAlert;
#pragma GCC diagnostic pop
        }
        completeOnce(presentationOption);
    }

    id<UNUserNotificationCenterDelegate> appDelegate = (id<UNUserNotificationCenterDelegate>)UIApplication.sharedApplication.delegate;

    if ([appDelegate respondsToSelector:@selector(userNotificationCenter:willPresentNotification:withCompletionHandler:)]) {
        isForwardingToAppDelegate = YES;
        [appDelegate userNotificationCenter:center willPresentNotification:notification withCompletionHandler:completeOnce];
        isForwardingToAppDelegate = NO;
    } else {
        completeOnce(UNNotificationPresentationOptionNone);
    }
}

/**
 * Entry point for apps that pass incoming notifications on themselves.
 * Calls made while this class forwards a notification to the app delegate are skipped, because the notification was handled already.
 *
 * @param notificationMessage the notification's payload
 */
- (void)onNotification:(NSDictionary *)notificationMessage {
    if (isForwardingToAppDelegate) {
        return;
    }
    [self handleNotification:notificationMessage];
}

/**
 * Passes an incoming notification to the JS listener registered with registerForNotification, or keeps it until JS registers one.
 *
 * @param notificationMessage the notification's payload
 */
- (void)handleNotification:(NSDictionary *)notificationMessage {
    if (CountlyCommon.sharedInstance.enableDebug) {
        NSLog(@"[CountlyReactNative] The notification %@", [CountlyRNPushNotifications toJSON:notificationMessage]);
    }
    if (notificationMessage && notificationListener != nil) {
        lastStoredNotification = notificationMessage;
        notificationListener(@[ [CountlyRNPushNotifications toJSON:notificationMessage] ]);
    } else {
        lastStoredNotification = notificationMessage;
    }
}

/**
 * Entry point for apps that pass notification taps on themselves.
 * Calls made while this class forwards a tap to the app delegate are skipped, so a tap is counted and opened once.
 *
 * @param response the tapped notification's response
 */
- (void)onNotificationResponse:(UNNotificationResponse *)response API_AVAILABLE(ios(10.0)) {
    if (isForwardingToAppDelegate) {
        return;
    }
    [self handleNotificationResponse:response];
}

/**
 * Handles a notification tap: before the SDK has started, keeps the tap so that recordPushActions can record it later,
 * then passes the notification to the JS listeners for received and opened notifications.
 *
 * @param response the tapped notification's response
 */
- (void)handleNotificationResponse:(UNNotificationResponse *)response API_AVAILABLE(ios(10.0)) {
    NSDictionary *notificationDictionary = response.notification.request.content.userInfo;
    NSInteger buttonIndex = 0;
    if ([response.actionIdentifier hasPrefix:kCountlyActionIdentifier]) {
        buttonIndex = [[response.actionIdentifier stringByReplacingOccurrencesOfString:kCountlyActionIdentifier withString:@""] integerValue];
    }
    if (!CountlyCommon.sharedInstance.hasStarted) {
        if (notifications == nil) {
            notifications = [[NSMutableArray alloc] init];
        }
        NSMutableDictionary *mutableNotification = [notificationDictionary mutableCopy];
        mutableNotification[CLYPushButtonIndexKey] = [NSNumber numberWithInteger:buttonIndex];
        [notifications insertObject:mutableNotification atIndex:[notifications count]];
        [[NSUserDefaults standardUserDefaults] setObject:notifications forKey:CLYPushNotificationsKey];
        [[NSUserDefaults standardUserDefaults] synchronize];
    }
    [self handleNotification:notificationDictionary];
    [self deliverNotificationOpened:notificationDictionary actionIndex:buttonIndex];
}

+ (NSString *)toJSON:(NSDictionary *)json {
    NSError *error;
    NSData *jsonData = json ? [NSJSONSerialization dataWithJSONObject:json options:NSJSONWritingPrettyPrinted error:&error] : nil;

    if (!jsonData) {
        if (CountlyCommon.sharedInstance.enableDebug) {
            NSLog(@"[CountlyReactNative] Got an error: %@", error);
        }
        NSData *errorData = [NSJSONSerialization dataWithJSONObject:@{ @"error" : error.localizedDescription ?: @"the notification could not be converted to JSON" } options:0 error:nil];
        return [[NSString alloc] initWithData:errorData encoding:NSUTF8StringEncoding];
    } else {
        NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        return jsonString;
    }
}
#endif

@end
