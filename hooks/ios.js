const config = require('./config.js');
const fs = require('fs');
const H = require('./helper.js');

function addListener(){
  let source = config.ios.app_dir +"/" +config.app_name +"/AppDelegate.m";
  if(fs.existsSync(source)){
    if(H.getLineNumber(source, "React/RCTRootView") != -1){
      if(H.getLineNumber(source, "CountlyReactNative.h") == -1){
        let lineNumber = H.getLineNumber(source, "React/RCTRootView");
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
        let endLineNumber = H.getLineNumber(source, "@end");
        H.setLine(source, endLineNumber, listenerLine);
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

const xcode = require('xcode');
function addServiceCountlyNSE(){
    const projPath = config.ios.app_dir +"/"+ config.app_name +'.xcodeproj/project.pbxproj';
    const extName = 'CountlyNSE';
    const extFiles = [
        'NotificationService.h',
        'NotificationService.m',
        `${extName}-Info.plist`,
    ];
    // The directory where the source extension files are stored
    const sourceDir = __dirname +`/${extName}/`;
    if(fs.existsSync(config.ios.app_dir +"/" +extName)){
      return H.log("iOS: Service already exists.");
    }
    let proj = xcode.project(projPath);
    proj.parse(function (err) {
        if (err) {
          return H.log(`iOS: Error parsing iOS project: ${err}`);
        }
        fs.mkdirSync(config.ios.app_dir +"/" +extName);
        extFiles.forEach(function (extFile) {
            let targetFile = config.ios.app_dir +"/" +extName +"/" +extFile;//  `${iosPath}${extName}/${extFile}`;
            fs.createReadStream(`${sourceDir}${extFile}`)
                .pipe(fs.createWriteStream(targetFile));
        });

        var countlyFiles = [
            config.ios.app_dir +'/Pods/Countly/' +'CountlyNotificationService.h',
            config.ios.app_dir +'/Pods/Countly/' +'CountlyNotificationService.m'
        ];
        extFiles.push(countlyFiles[0]);
        extFiles.push(countlyFiles[1]);
        // Create new PBXGroup for the extension
        let extGroup = proj.addPbxGroup(extFiles, extName, extName);
        // Add the new PBXGroup to the CustomTemplate group. This makes the
        // files appear in the file explorer in Xcode.
        let groups = proj.hash.project.objects['PBXGroup'];
        Object.keys(groups).forEach(function (key) {
            if (groups[key].name === 'CustomTemplate') {
                proj.addToPbxGroup(extGroup.uuid, key);
            }
        });
        // Add a target for the extension
        let target = proj.addTarget(extName, 'app_extension');


        proj.addBuildPhase([ 'NotificationService.m', countlyFiles[0], countlyFiles[1]], 'PBXSourcesBuildPhase', 'Sources', target.uuid); // 'CountlyNotificationService.h', 'CountlyNotificationService.m'
        proj.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
        proj.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);
        fs.writeFileSync(projPath, proj.writeSync());
        H.log(`iOS: Added ${extName} notification extension to project`);
    });
}
// Run all files here
addListener();
addServiceCountlyNSE();