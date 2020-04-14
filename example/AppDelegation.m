- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
{
  [CountlyReactNative onNotification:userInfo];
}