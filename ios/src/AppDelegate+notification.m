#import <objc/runtime.h>
#import "AppDelegate.h"
#import "CountlyReactNative.h"
#import <UserNotifications/UserNotifications.h>

static char launchNotificationKey;
static char coldstartKey;

NSString *const pushPluginApplicationDidBecomeActiveNotification = @"pushPluginApplicationDidBecomeActiveNotification";
@implementation AppDelegate (notification)
- (NSDictionary *)launchNotification
{
    return objc_getAssociatedObject(self, &launchNotificationKey);
}

- (void)setLaunchNotification:(NSDictionary *)aDictionary
{
    objc_setAssociatedObject(self, &launchNotificationKey, aDictionary, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSNumber *)coldstart
{
    return objc_getAssociatedObject(self, &coldstartKey);
}

- (void)setColdstart:(NSNumber *)aNumber
{
    objc_setAssociatedObject(self, &coldstartKey, aNumber, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)dealloc
{
    self.launchNotification = nil; // clear the association and release the object
    self.coldstart = nil;
}

//- (id) getCommandInstance:(NSString*)className
//{
//    return [self.viewController getCommandInstance:className];
//}

// its dangerous to override a method from within a category.
// Instead we will use method swizzling. we set this up in the load call.
+ (void)load
{
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class class = [self class];

        SEL originalSelector = @selector(init);
        SEL swizzledSelector = @selector(pushPluginSwizzledInit);

        Method original = class_getInstanceMethod(class, originalSelector);
        Method swizzled = class_getInstanceMethod(class, swizzledSelector);

        BOOL didAddMethod =
        class_addMethod(class,
                        originalSelector,
                        method_getImplementation(swizzled),
                        method_getTypeEncoding(swizzled));

        if (didAddMethod) {
            class_replaceMethod(class,
                                swizzledSelector,
                                method_getImplementation(original),
                                method_getTypeEncoding(original));
        } else {
            method_exchangeImplementations(original, swizzled);
        }
    });
}

- (AppDelegate *)pushPluginSwizzledInit
{
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    center.delegate = self;

    [[NSNotificationCenter defaultCenter]addObserver:self
                                            selector:@selector(pushPluginOnApplicationDidBecomeActive:)
                                                name:UIApplicationDidBecomeActiveNotification
                                              object:nil];

    // This actually calls the original init method over in AppDelegate. Equivilent to calling super
    // on an overrided method, this is not recursive, although it appears that way. neat huh?
    return [self pushPluginSwizzledInit];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
    NSLog(@"didReceiveNotification with fetchCompletionHandler");

    // app is in the background or inactive, so only call notification callback if this is a silent push
    if (application.applicationState != UIApplicationStateActive) {

        NSLog(@"app in-active");

        // do some convoluted logic to find out if this should be a silent push.
        long silent = 0;
        id aps = [userInfo objectForKey:@"aps"];
        id contentAvailable = [aps objectForKey:@"content-available"];
        if ([contentAvailable isKindOfClass:[NSString class]] && [contentAvailable isEqualToString:@"1"]) {
            silent = 1;
        } else if ([contentAvailable isKindOfClass:[NSNumber class]]) {
            silent = [contentAvailable integerValue];
        }

        if (silent == 1) {
            NSLog(@"this should be a silent push");
            [CountlyReactNative onNotification:userInfo];
            completionHandler(UIBackgroundFetchResultNewData);
        } else {
            NSLog(@"just put it in the shade");
            //save it for later
            self.launchNotification = userInfo;
            completionHandler(UIBackgroundFetchResultNewData);
        }

    } else {
        completionHandler(UIBackgroundFetchResultNoData);
    }
}
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
    NSLog( @"NotificationCenter Handle push from foreground" );
    // custom code to handle push while app is in the foreground
    [CountlyReactNative onNotification: notification.request.content.userInfo];

    completionHandler(UNNotificationPresentationOptionNone);
}
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void(^)(void))completionHandler
{
    NSLog(@"Push Plugin didReceiveNotificationResponse: actionIdentifier %@, notification: %@", response.actionIdentifier,
          response.notification.request.content.userInfo);
    NSMutableDictionary *userInfo = [response.notification.request.content.userInfo mutableCopy];
    [userInfo setObject:response.actionIdentifier forKey:@"actionCallback"];
    NSLog(@"Push Plugin userInfo %@", userInfo);
    switch ([UIApplication sharedApplication].applicationState) {
        case UIApplicationStateActive:
        {
            NSLog(@"UIApplicationStateActive");
            [CountlyReactNative onNotification: response.notification.request.content.userInfo];
            RCTResponseSenderBlock notificationListener = [CountlyReactNative getCallback];
            if(notificationListener != nil){
                completionHandler();
            }
            break;
        }
        case UIApplicationStateInactive:
        {
            NSLog(@"UIApplicationStateInactive");
            self.launchNotification = response.notification.request.content.userInfo;
            self.coldstart = [NSNumber numberWithBool:YES];
            break;
        }
        case UIApplicationStateBackground:
        {
            NSLog(@"UIApplicationStateBackground");
            [CountlyReactNative onNotification: response.notification.request.content.userInfo];
            RCTResponseSenderBlock notificationListener = [CountlyReactNative getCallback];
            if(notificationListener != nil){
                completionHandler();
            }
        }
    }
}
- (void)pushPluginOnApplicationDidBecomeActive:(NSNotification *)notification {

    NSLog(@"active");
    
    NSString *firstLaunchKey = @"firstLaunchKey";
    NSUserDefaults *defaults = [[NSUserDefaults alloc] initWithSuiteName:@"phonegap-plugin-push"];
    if (![defaults boolForKey:firstLaunchKey]) {
        NSLog(@"application first launch: remove badge icon number");
        [defaults setBool:YES forKey:firstLaunchKey];
        [[UIApplication sharedApplication] setApplicationIconBadgeNumber:0];
    }
    NSLog(@"pushPluginOnApplicationDidBecomeActive: %@", self.launchNotification);
    [CountlyReactNative onNotification: self.launchNotification];
    [[NSNotificationCenter defaultCenter] postNotificationName:pushPluginApplicationDidBecomeActiveNotification object:nil];
}
@end
