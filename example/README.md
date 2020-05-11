# iOS Push Notification Documentation

Note: This documentation assumes, that you have created necessary certficate, have proper app bundle id.

STEP 1: Make sure you have proper app bundle id and team selected.

STEP 2: Add Capabilities
       1. Push Notification
       2. Background Mode - Remote Notifications
        Go into your AwesomeProject/ios dir and open AwesomeProject.xcworkspace workspace. Select the top project "AwesomeProject" ans select the "Signing & Capabilities" tab. Add a 2 new Capabilities using "+" button:
        Background Mode capability and tick Remote Notifications.
        Push Notifications capability

STEP 3: Place below code in there respective files.

### AppDelegate.m

Add header file 
`#import "CountlyReactNative.h"`
`#import <UserNotifications/UserNotifications.h>`


Before `@end` add these method

-(void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler{
  NSLog(@"didReceiveNotificationResponse");
  NSDictionary *notification = response.notification.request.content.userInfo;
  [CountlyReactNative onNotification: notification];
  completionHandler();
}

//Called when a notification is delivered to a foreground app.
-(void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  NSLog(@"didReceiveNotificationResponse");
  NSDictionary *userInfo = notification.request.content.userInfo;
  [CountlyReactNative onNotification: userInfo];
  completionHandler(UNAuthorizationOptionSound | UNAuthorizationOptionAlert | UNAuthorizationOptionBadge);
}


# Rich Push Notification

STEP 1: Creating Notification Service Extension
        Editor -> Add Target -> 
        Make sure `ios` is selected 
        Make sure `Notification Service Extension` is selected
        Click `Next`
        Enter Product Name e.g. `CountlyNSE`
        Language `Objective-C`
        Click `Finish`
        It will ask for a modal / popup `Activate “CountlyNSE” scheme?`
        Choose `Cancel`

STEP 2: Adding Compile Source
        Under `TARGETS` select `CountlyNSE`
        Select `Build Phases` 
        Expand `Compile Sources`
        Drag and Drop `CountlyNotificationService.h` and `CountlyNotificationService.m` file
        Note: You may also find this file in `Xcode` under `Pods(Project) -> Pods(Folder) -> Countly`
        Note: You may also find this file in `Finder` under `AwesomeProject/ios/Pods/Countly`
        Note: You may also find this file in `Xcode` under `AwesomeProject(Project) -> Libraries(Folder) -> countly-sdk-react-native-bridge(Project)->src(Folder)`
        Note: You may also find this file in `Finder` under `node_modules/countly-sdk-react-native-bridge/ios/Pods/Countly`

STEP 3: Updating NotificationService file
        Under `AwesomeProject(Project) -> CountlyNSE(Folder) -> NotificationService.m`
        Add import header `#import "CountlyNotificationService.h"`
        Add the following line at the end of `didReceiveNotificationRequest:withContentHandler:`
        
        - (void)didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent * _Nonnull))contentHandler
        {
            self.contentHandler = contentHandler;
            self.bestAttemptContent = [request.content mutableCopy];    
            //delete existing template code, and add this line
            [CountlyNotificationService didReceiveNotificationRequest:request withContentHandler:contentHandler];
        }
        

        Note: Please make sure you configure App Transport Security setting in extension's Info.plist file also, just like the main application. Otherwise media attachments from non-https sources can not be loaded.
        
        Note: Please make sure you check Deployment Target version of extension target is 10, not 10.3 (or whatever minor version Xcode set automatically). Otherwise users running iOS versions lower than Deployment Target value can not get rich push notifications.

        Note: To send push messages to applications that are Debug build use Countly.messagingMode.DEVELOPMENT, for App Store built ones use Countly.messagingMode.PRODUCTION, and for TestFlight/Ad Hoc builds use Countly.messagingMode.ADHOC.    