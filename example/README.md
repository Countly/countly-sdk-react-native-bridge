# Creating the Sample Countly RN App

To run a React Native application you have to set up your environment correctly.
Please refer to the React Native [documentation](https://reactnative.dev/docs/set-up-your-environment)* to check the latest information on this topic.

(Incase  there is a change in documentation links you should check the React Native [offical site](https://reactnative.dev/))

## Automatic App Creation

If you have setted up your environment correctly then you should be able to run the example app by running the create_app.py provided

```bash
python create_app.py
```

Then you can start the app by:

```bash
npx react-native run-android 
# or npx react-native run-ios
```

## Manual App Creation
For more information you can check [here](https://reactnative.dev/docs/getting-started-without-a-framework).

If you want to set up the app manually instead, then you should run:

```bash
npx @react-native-community/cli@latest init AwesomeProject
```

Then copy the contents of CountlyRNExample into the AwesomeProject and let it replace the App.tsx there.

Then add "countly-sdk-react-native-bridge" into dependencies in package.json:

```bash
npm install --save countly-sdk-react-native-bridge@latest
# if you are on iOS then you should also:
# cd ios
# pod install
```

Finally you can run:

```bash
npx react-native run-android 
# or npx react-native run-ios
```
## Debugging  
For possible java issues you can try some of the following options:
- changing the IDE settings.
- changing the JAVA_HOME environment variable.
- changing `org.gradle.java.home` in `gradle.properties`.

Currently Java 17 and bigger is needed.

For a ninja issue about path length you might want to download and point to a specific ninja version:
```java
// under app level build.gradle's defaultConfig
  externalNativeBuild {
      cmake {
          arguments "-DCMAKE_MAKE_PROGRAM=your_path\ninja.exe", "-DCMAKE_OBJECT_PATH_MAX=1024"
      }
  }
```

For an issue with the recent version of React Native (0.76) about safe area context you can check this [thread](https://github.com/th3rdwave/react-native-safe-area-context/issues/539#issuecomment-2436529368).

## iOS Push Notification Documentation

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

// Required for the notification event. You must call the completion handler after handling the remote notification.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary*)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [CountlyReactNative onNotification: userInfo];
  completionHandler(0);
}

// When app is killed.
- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse*)response withCompletionHandler:(void (^)(void))completionHandler{
  [CountlyReactNative onNotificationResponse: response];
  completionHandler();
}

// When app is running.
- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification*)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler{
  [CountlyReactNative onNotification: notification.request.content.userInfo];
  completionHandler(0);
}

### Rich Push Notification

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

