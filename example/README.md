
### Using Example App
Please visit [Countly React Native documentation page](https://resources.count.ly/docs/react-native-bridge) for further details.
```
react-native init DemoProject       # Create a new project

cd DemoProject                      # Go to that directory
cp <PATH_TO>/App.js .               # Copy App.js here into your new react project

# Include SDK
npm install --save https://github.com/Countly/countly-sdk-react-native-bridge.git
react-native link countly-sdk-react-native-bridge

# In a new terminal
adb reverse tcp:8081 tcp:8081       # Link Android port for development server
npm start                           # Start development server

# In root of DemoProject
react-native run-android # OR       # Run the android project
react-native run-ios                # Run the iOS project


```

iOS Push Notification Documentation

#AppDelegate.h

Add header file 
`#import <UserNotifications/UNUserNotificationCenter.h>`
Replace the following line with
`@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>`
With 
`@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate, UNUserNotificationCenterDelegate>`

#AppDelegate.m

Add header file 
`
#import "CountlyReactNative.h"
#import <UserNotifications/UserNotifications.h>
`

Inside this function
`- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
`
Add this code before `return YES;`
`
UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
center.delegate = self;
`

Before `@end` add these method
`
- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler{
  NSLog(@"didReceiveNotificationResponse");
  NSDictionary *notification = response.notification.request.content.userInfo;
  NSLog(@"didReceiveNotificationResponse: %@", [notification description]);
  [CountlyReactNative onNotification: notification];
  completionHandler();
}



////Called when a notification is delivered to a foreground app.
-(void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  NSLog(@"didReceiveNotificationResponse");
  NSDictionary *userInfo = notification.request.content.userInfo;
  [CountlyReactNative onNotification: userInfo];
  completionHandler(UNAuthorizationOptionSound | UNAuthorizationOptionAlert | UNAuthorizationOptionBadge);
}
`