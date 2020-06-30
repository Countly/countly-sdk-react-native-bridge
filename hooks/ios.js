const config = require('./config.js');
const fs = require('fs');
const H = require('./helper.js');

function addListener(){
  let source = config.ios.app_dir +"/" +config.app_name +"/AppDelegate.m";
  if(fs.existsSync(source)){
    if(H.getLineNumber(source, "React/RCTRootView") != -1){
      if(H.getLineNumber(source, "CountlyReactNative.h") == -1){
        let lineNumber = H.getLineNumber(source, "React/RCTRootView");
        let endLineNumber = H.getLineNumber(source, "@end");
        let importLine =
`#import "CountlyReactNative.h"
#import <UserNotifications/UserNotifications.h>`;
        let listenerLine =
`// Required for the notification event. You must call the completion handler after handling the remote notification.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [CountlyReactNative onNotification: userInfo];
  completionHandler(0);
}
// When app is killed.
- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler{
  [CountlyReactNative onNotification: response.notification.request.content.userInfo];
  completionHandler();
}
// When app is running.
- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler{
  [CountlyReactNative onNotification: notification.request.content.userInfo];
  completionHandler(0);
}`;
        H.setLine(source, lineNumber + 1, importLine);
        H.setLine(source, endLineNumber + 1, listenerLine);
        H.log("iOS: Listener added.");
      }else{
        H.log("iOS: Listener already added.");
      }
    }else{
      H.log("iOS: Unable to find line to append listener");
    }
  }else{
    H.log("iOS: AppDelegate.m file not found.");
  }
}


function addServiceCountlyNSE(){

}
// Run all files here
addListener();
addServiceCountlyNSE();