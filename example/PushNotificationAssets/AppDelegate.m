#import "CountlyReactNative.h"
#import <UserNotifications/UserNotifications.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // For push notification received and action callbacks. Add this line before the method's existing return statement.
  [CountlyReactNative startObservingNotifications];
}

// Required for the notification event. You must call the completion handler after handling the remote notification.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [CountlyReactNative onNotification: userInfo];
  completionHandler(0);
}

// Countly passes notification taps here. Passing them on to the bridge delivers them to the JS listeners; a tap is still counted once.
- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler{
  [CountlyReactNative onNotificationResponse: response];
  completionHandler();
}

// Countly passes notifications that arrive while the app is open here. Passing them on to the bridge delivers them to the JS listener.
- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler{
  [CountlyReactNative onNotification: notification.request.content.userInfo];
  completionHandler(0);
}
