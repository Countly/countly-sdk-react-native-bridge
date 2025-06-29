// CountlyCommon.m
//
// This code is provided under the MIT License.
//
// Please visit www.count.ly for more information.

#import "CountlyCommon.h"
#include <CommonCrypto/CommonDigest.h>

NSString* const kCountlyReservedEventOrientation = @"[CLY]_orientation";
NSString* const kCountlyOrientationKeyMode = @"mode";

NSString* const kCountlyVisibility = @"cly_v";


@interface CountlyCommon ()
{
    NSCalendar* gregorianCalendar;
    NSTimeInterval startTime;
}
@property long long lastTimestamp;

#if (TARGET_OS_IOS || TARGET_OS_VISION )
@property (nonatomic) NSString* lastInterfaceOrientation;
#endif

#if (TARGET_OS_IOS || TARGET_OS_VISION || TARGET_OS_TV )
@property (nonatomic) UIBackgroundTaskIdentifier bgTask;
#endif
@end

NSString* const kCountlySDKVersion = @"25.4.3";
NSString* const kCountlySDKName = @"objc-native-ios";

NSString* const kCountlyErrorDomain = @"ly.count.ErrorDomain";

NSString* const kCountlyInternalLogPrefix = @"[Countly] ";


@implementation CountlyCommon

@synthesize lastTimestamp;

static CountlyCommon *s_sharedInstance = nil;
static dispatch_once_t onceToken;
+ (instancetype)sharedInstance
{
    dispatch_once(&onceToken, ^{s_sharedInstance = self.new;});
    return s_sharedInstance;
}

- (instancetype)init
{
    if (self = [super init])
    {
        gregorianCalendar = [NSCalendar.alloc initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
        startTime = NSDate.date.timeIntervalSince1970;
        
        self.lastTimestamp = 0;
        self.SDKVersion = kCountlySDKVersion;
        self.SDKName = kCountlySDKName;
    }

    return self;
}

- (void)resetInstance {
    CLY_LOG_I(@"%s", __FUNCTION__);
    onceToken = 0;
    s_sharedInstance = nil;
    _hasStarted = false;
}


- (BOOL)hasStarted
{
    if (!_hasStarted)
        CountlyPrint(@"SDK should be started first!");

    return _hasStarted;
}

//NOTE: This is an equivalent of hasStarted, but without internal logging.
- (BOOL)hasStarted_
{
    return _hasStarted;
}

void CountlyInternalLog(CLYInternalLogLevel level, NSString *format, ...)
{
    if (level == CLYInternalLogLevelError) {
        [CountlyHealthTracker.sharedInstance logError];
    } else if(level == CLYInternalLogLevelWarning) {
        [CountlyHealthTracker.sharedInstance logWarning];
    }
    
    if (!CountlyCommon.sharedInstance.enableDebug && !CountlyCommon.sharedInstance.loggerDelegate)
        return;

    if (level > CountlyCommon.sharedInstance.internalLogLevel)
        return;

    va_list args;
    va_start(args, format);

    NSString* logString = [NSString.alloc initWithFormat:format arguments:args];

    NSArray<NSString *> *logLevelPrefixes =
    @[
        @"None",
        @"Error",
        @"Warning",
        @"Info",
        @"Debug",
        @"Verbose",
    ];

    logString = [NSString stringWithFormat:@"[%@] %@", logLevelPrefixes[level], logString];

#if DEBUG
    if (CountlyCommon.sharedInstance.enableDebug)
        CountlyPrint(logString);
#endif

    if ([CountlyCommon.sharedInstance.loggerDelegate respondsToSelector:@selector(internalLog:withLevel:)])
    {
        NSString* logStringWithPrefix = [NSString stringWithFormat:@"%@%@", kCountlyInternalLogPrefix, logString];
        [CountlyCommon.sharedInstance.loggerDelegate internalLog:logStringWithPrefix withLevel:level];
    }

    va_end(args);
}

void CountlyPrint(NSString *stringToPrint)
{
    NSLog(@"%@%@", kCountlyInternalLogPrefix, stringToPrint);
}

#pragma mark - Time/Date related methods
- (NSInteger)hourOfDay
{
    NSDateComponents* components = [gregorianCalendar components:NSCalendarUnitHour fromDate:NSDate.date];
    return components.hour;
}

- (NSInteger)dayOfWeek
{
    NSDateComponents* components = [gregorianCalendar components:NSCalendarUnitWeekday fromDate:NSDate.date];
    return components.weekday - 1;
}

- (NSInteger)timeZone
{
    return NSTimeZone.systemTimeZone.secondsFromGMT / 60;
}

- (NSInteger)timeSinceLaunch
{
    return (int)NSDate.date.timeIntervalSince1970 - startTime;
}

- (NSTimeInterval)uniqueTimestamp
{
    long long now = floor(NSDate.date.timeIntervalSince1970 * 1000);

    if (now <= self.lastTimestamp)
        self.lastTimestamp++;
    else
        self.lastTimestamp = now;

    return (NSTimeInterval)(self.lastTimestamp / 1000.0);
}

- (NSString *)randomEventID
{
    const int size = 6;
    void *randomBuffer = malloc(size);
    arc4random_buf(randomBuffer, size);
    NSData* randomData = [NSData dataWithBytesNoCopy:randomBuffer length:size freeWhenDone:YES];
    NSString* randomBase64 = [randomData base64EncodedStringWithOptions:0];
    NSTimeInterval timestamp = self.uniqueTimestamp;
    NSString* randomEventID = [NSString stringWithFormat:@"%@%lld", randomBase64, (long long)(timestamp * 1000)];
    return randomEventID;
}

#pragma mark - Orientation

- (void)observeDeviceOrientationChanges
{
#if (TARGET_OS_IOS)
    [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(deviceOrientationDidChange:) name:UIDeviceOrientationDidChangeNotification object:nil];
#endif
}

- (void)deviceOrientationDidChange:(NSNotification *)notification
{
    if (!self.enableOrientationTracking)
        return;

    //NOTE: Delay is needed for interface orientation change animation to complete. Otherwise old interface orientation value is returned.
    [NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(recordOrientation) object:nil];
    [self performSelector:@selector(recordOrientation) withObject:nil afterDelay:0.5];
}

- (void)recordOrientation
{
#if (TARGET_OS_IOS)
    if (!self.enableOrientationTracking)
        return;
    
    if ([UIApplication sharedApplication].applicationState == UIApplicationStateBackground) {
        CLY_LOG_W(@"%s App is in the background, 'Record Orientation' will be ignored", __FUNCTION__);
        return;
    }
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
    UIInterfaceOrientation interfaceOrientation = UIApplication.sharedApplication.statusBarOrientation;
#pragma GCC diagnostic pop

    NSString* mode = nil;
    if (UIInterfaceOrientationIsPortrait(interfaceOrientation))
        mode = @"portrait";
    else if (UIInterfaceOrientationIsLandscape(interfaceOrientation))
        mode = @"landscape";

    if (!mode)
    {
        CLY_LOG_D(@"Interface orientation is not landscape or portrait.");
        return;
    }

    if ([mode isEqualToString:self.lastInterfaceOrientation])
    {
        CLY_LOG_V(@"Interface orientation is still same: %@", self.lastInterfaceOrientation);
        return;
    }

    CLY_LOG_D(@"Interface orientation is now: %@", mode);

    if (!CountlyConsentManager.sharedInstance.consentForUserDetails)
        return;
    
    self.lastInterfaceOrientation = mode;

    [Countly.sharedInstance recordReservedEvent:kCountlyReservedEventOrientation segmentation:@{kCountlyOrientationKeyMode: mode}];
#endif
}

#pragma mark - Others

- (void)startBackgroundTask
{
#if (TARGET_OS_IOS || TARGET_OS_VISION || TARGET_OS_TV)
    if (self.bgTask != UIBackgroundTaskInvalid)
        return;

    self.bgTask = [UIApplication.sharedApplication beginBackgroundTaskWithExpirationHandler:^
    {
        [UIApplication.sharedApplication endBackgroundTask:self.bgTask];
        self.bgTask = UIBackgroundTaskInvalid;
    }];
#endif
}

- (void)finishBackgroundTask
{
#if (TARGET_OS_IOS || TARGET_OS_VISION || TARGET_OS_TV)
    if (self.bgTask != UIBackgroundTaskInvalid && !CountlyConnectionManager.sharedInstance.connection)
    {
        [UIApplication.sharedApplication endBackgroundTask:self.bgTask];
        self.bgTask = UIBackgroundTaskInvalid;
    }
#endif
}

#if (TARGET_OS_IOS || TARGET_OS_TV)
- (UIViewController *)topViewController
{
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
    UIViewController* topVC = UIApplication.sharedApplication.keyWindow.rootViewController;
#pragma GCC diagnostic pop

    while (YES)
    {
        if (topVC.presentedViewController)
            topVC = topVC.presentedViewController;
        else if ([topVC isKindOfClass:UINavigationController.class])
            topVC = ((UINavigationController *)topVC).topViewController;
        else if ([topVC isKindOfClass:UITabBarController.class])
            topVC = ((UITabBarController *)topVC).selectedViewController;
        else
            break;
    }

    return topVC;
}

- (void)tryPresentingViewController:(UIViewController *)viewController
{
    [self tryPresentingViewController:viewController withCompletion:nil];
}

- (void)tryPresentingViewController:(UIViewController *)viewController withCompletion:(void (^ __nullable) (void))completion
{
    UIViewController* topVC = self.topViewController;

    if (topVC)
    {
        [topVC presentViewController:viewController animated:YES completion:^
        {
            if (completion)
                completion();
        }];

        return;
    }

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^
    {
        [self tryPresentingViewController:viewController];
    });
}
#endif

- (NSURLSession *)URLSession
{
    if (CountlyConnectionManager.sharedInstance.URLSessionConfiguration)
    {
        return [NSURLSession sessionWithConfiguration:CountlyConnectionManager.sharedInstance.URLSessionConfiguration];
    }
    else
    {
        return NSURLSession.sharedSession;
    }
}

- (CGSize)getWindowSize {
#if (TARGET_OS_IOS)
    UIWindow *window = nil;

    if (@available(iOS 13.0, *)) {
        for (UIScene *scene in [UIApplication sharedApplication].connectedScenes) {
            if ([scene isKindOfClass:[UIWindowScene class]]) {
                window = ((UIWindowScene *)scene).windows.firstObject;
                break;
            }
        }
    } else {
        window = [[UIApplication sharedApplication].delegate window];
    }

    if (!window) return CGSizeZero;
    
    UIEdgeInsets safeArea = UIEdgeInsetsZero;
    CGFloat screenScale = [UIScreen mainScreen].scale;
    if (@available(iOS 11.0, *)) {
        safeArea = window.safeAreaInsets;
        safeArea.left /= screenScale;
        safeArea.bottom /= screenScale;
        safeArea.right /= screenScale;
    }
    
    UIInterfaceOrientation orientation = [UIApplication sharedApplication].statusBarOrientation;
    BOOL isLandscape = UIInterfaceOrientationIsLandscape(orientation);
    
    CGSize size = CGSizeMake(window.bounds.size.width, window.bounds.size.height);
    
    if(!isLandscape){
        size.width -= safeArea.left + safeArea.right;
        size.height -= safeArea.top + safeArea.bottom;
    }

    return size;
#endif
    return CGSizeZero;
}

@end


#pragma mark - Internal ViewController
#if (TARGET_OS_IOS)
@implementation CLYInternalViewController : UIViewController

- (void)viewWillLayoutSubviews
{
    [super viewWillLayoutSubviews];

    if (self.webView)
    {
        CGRect frame = CGRectInset(self.view.bounds, 20.0, 20.0);

        UIEdgeInsets insets = UIEdgeInsetsZero;
        if (@available(iOS 11.0, *))
        {
            #pragma GCC diagnostic push
            #pragma GCC diagnostic ignored "-Wdeprecated-declarations"
            insets = UIApplication.sharedApplication.keyWindow.safeAreaInsets;
            #pragma GCC diagnostic pop
        }

        self.webView.navigationDelegate = self;
        frame = UIEdgeInsetsInsetRect(frame, insets);
        self.webView.frame = frame;
    }
}

- (void)webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler {
    NSString *url = navigationAction.request.URL.absoluteString;
    if ([url containsString:@"cly_x_int=1"]) {
        CLY_LOG_I(@"%s Opening url [%@] in external browser", __FUNCTION__, url);
        [[UIApplication sharedApplication] openURL:navigationAction.request.URL options:@{} completionHandler:^(BOOL success) {
            if (success) {
                CLY_LOG_I(@"%s url [%@] opened in external browser", __FUNCTION__, url);
            }
            else {
                CLY_LOG_I(@"%s unable to open url [%@] in external browser", __FUNCTION__, url);
            }
        }];
        decisionHandler(WKNavigationActionPolicyCancel);
        return;
    }
    decisionHandler(WKNavigationActionPolicyAllow);
}

- (void)webView:(WKWebView *)webView didStartProvisionalNavigation:(null_unspecified WKNavigation *)navigation
{
    CLY_LOG_I(@"%s Web view has start loading", __FUNCTION__);
    
}

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
    CLY_LOG_I(@"%s Web view has finished loading", __FUNCTION__);
}


@end


@implementation CLYButton : UIButton

const CGFloat kCountlyDismissButtonSize = 30.0;
const CGFloat kCountlyDismissButtonMargin = 10.0;
const CGFloat kCountlyDismissButtonStandardStatusBarHeight = 20.0;

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame])
    {
        [self addTarget:self action:@selector(touchUpInside:) forControlEvents:UIControlEventTouchUpInside];
    }

    return self;
}

- (void)touchUpInside:(id)sender
{
    if (self.onClick)
        self.onClick(self);
}

+ (CLYButton *)dismissAlertButton:(NSString * _Nullable)closeButtonText
{
    if (!closeButtonText) {
        closeButtonText = @"x";
    }
    CLYButton* dismissButton = [CLYButton buttonWithType:UIButtonTypeCustom];
    dismissButton.frame = (CGRect){CGPointZero, kCountlyDismissButtonSize, kCountlyDismissButtonSize};
    [dismissButton setTitle:closeButtonText forState:UIControlStateNormal];
    [dismissButton setTitleColor:UIColor.whiteColor forState:UIControlStateNormal];
    dismissButton.backgroundColor = [UIColor.blackColor colorWithAlphaComponent:0.5];
    dismissButton.layer.cornerRadius = dismissButton.bounds.size.width * 0.5;
    dismissButton.layer.borderColor = [UIColor.blackColor colorWithAlphaComponent:0.7].CGColor;
    dismissButton.layer.borderWidth = 1.0;
    dismissButton.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleBottomMargin;
    
    return dismissButton;
}

+ (CLYButton *)dismissAlertButton
{
    return [CLYButton dismissAlertButton:nil];
}

- (void)positionToTopRight
{
    [self positionToTopRight:NO];
}

- (void)positionToTopRightConsideringStatusBar
{
    [self positionToTopRight:YES];
}

- (void)positionToTopRight:(BOOL)shouldConsiderStatusBar
{
    CGRect rect = self.frame;
    rect.origin.x = self.superview.bounds.size.width - self.bounds.size.width - kCountlyDismissButtonMargin;
    rect.origin.y = kCountlyDismissButtonMargin;

    if (shouldConsiderStatusBar)
    {
        if (@available(iOS 11.0, *))
        {
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
            CGFloat top = UIApplication.sharedApplication.keyWindow.safeAreaInsets.top;
#pragma GCC diagnostic pop

            if (top)
            {
                rect.origin.y += top;
            }
            else
            {
                rect.origin.y += kCountlyDismissButtonStandardStatusBarHeight;
            }
        }
        else
        {
            rect.origin.y += kCountlyDismissButtonStandardStatusBarHeight;
        }
    }

    self.frame = rect;
}

@end
#endif


#pragma mark - Proxy Object
@implementation CLYDelegateInterceptor

- (NSMethodSignature *)methodSignatureForSelector:(SEL)sel
{
    return [self.originalDelegate methodSignatureForSelector:sel];
}

- (void)forwardInvocation:(NSInvocation *)invocation
{
    if ([self.originalDelegate respondsToSelector:invocation.selector])
        [invocation invokeWithTarget:self.originalDelegate];
    else
        [super forwardInvocation:invocation];
}
@end



#pragma mark - Categories
NSString* CountlyJSONFromObject(id object)
{
    if (!object)
        return nil;

    if (![NSJSONSerialization isValidJSONObject:object])
    {
        CLY_LOG_W(@"Object is not valid for converting to JSON!");
        return nil;
    }

    NSError *error = nil;
    NSData *data = [NSJSONSerialization dataWithJSONObject:object options:0 error:&error];
    if (error)
    {
        CLY_LOG_W(@"%s, JSON can not be created error:[ %@ ]", __FUNCTION__, error);
    }

    return [data cly_stringUTF8];
}

@implementation NSString (Countly)
- (NSString *)cly_URLEscaped
{
    NSCharacterSet* charset = [NSCharacterSet characterSetWithCharactersInString:@"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~"];
    return [self stringByAddingPercentEncodingWithAllowedCharacters:charset];
}

- (NSString *)cly_SHA256
{
    const char* s = [self UTF8String];
    unsigned char digest[CC_SHA256_DIGEST_LENGTH];
    CC_SHA256(s, (CC_LONG)strlen(s), digest);

    NSMutableString* hash = NSMutableString.new;
    for (int i = 0; i < CC_SHA256_DIGEST_LENGTH; i++)
        [hash appendFormat:@"%02x", digest[i]];

    return hash;
}

- (NSData *)cly_dataUTF8
{
    return [self dataUsingEncoding:NSUTF8StringEncoding];
}

- (NSString *)cly_valueForQueryStringKey:(NSString *)key
{
    NSString* tempURLString = [@"http://example.com/path?" stringByAppendingString:self];
    NSURLComponents* URLComponents = [NSURLComponents componentsWithString:tempURLString];
    for (NSURLQueryItem* queryItem in URLComponents.queryItems)
    {
        if ([queryItem.name isEqualToString:key])
        {
            return queryItem.value;
        }
    }

    return nil;
}

- (NSString *)cly_truncatedKey:(NSString *)explanation
{
    if (self.length > CountlyCommon.sharedInstance.maxKeyLength)
    {
        CLY_LOG_W(@"%@ length is more than the limit (%ld)! So, it will be truncated: %@.", explanation, (long)CountlyCommon.sharedInstance.maxKeyLength, self);
        return [self substringToIndex:CountlyCommon.sharedInstance.maxKeyLength];
    }

    return self;
}

- (NSString *)cly_truncatedValue:(NSString *)explanation
{
    if (self.length > CountlyCommon.sharedInstance.maxValueLength)
    {
        CLY_LOG_W(@"%@ length is more than the limit (%ld)! So, it will be truncated: %@.", explanation, (long)CountlyCommon.sharedInstance.maxValueLength, self);
        return [self substringToIndex:CountlyCommon.sharedInstance.maxValueLength];
    }

    return self;
}

@end

@implementation NSArray (Countly)
- (NSString *)cly_JSONify
{
    return [CountlyJSONFromObject(self) cly_URLEscaped];
}

- (NSArray *) cly_filterSupportedDataTypes {
    NSMutableArray *filteredArray = [NSMutableArray array];
    for (id obj in self) {
        if ([obj isKindOfClass:[NSNumber class]] || [obj isKindOfClass:[NSString class]]) {
            [filteredArray addObject:obj];
        } else {
            CLY_LOG_W(@"%s, Removed invalid type from array: %@", __FUNCTION__, [obj class]);
        }
    }
    return filteredArray.copy;
}
@end

@implementation NSDictionary (Countly)
- (NSString *)cly_JSONify
{
    return [CountlyJSONFromObject(self) cly_URLEscaped];
}

- (NSDictionary *)cly_truncated:(NSString *)explanation
{
    NSMutableDictionary* truncatedDict = self.mutableCopy;
    [self enumerateKeysAndObjectsUsingBlock:^(NSString * key, id obj, BOOL * stop)
    {
        NSString* truncatedKey = [key cly_truncatedKey:[explanation stringByAppendingString:@" key"]];
        if (![truncatedKey isEqualToString:key])
        {
            truncatedDict[truncatedKey] = obj;
            [truncatedDict removeObjectForKey:key];
        }

        if ([obj isKindOfClass:NSString.class])
        {
            NSString* truncatedValue = [obj cly_truncatedValue:[explanation stringByAppendingString:@" value"]];
            if (![truncatedValue isEqualToString:obj])
            {
                truncatedDict[truncatedKey] = truncatedValue;
            }
        }
    }];

    return truncatedDict.copy;
}

- (NSDictionary *)cly_limited:(NSString *)explanation
{
    NSArray* allKeys = self.allKeys;

    if (allKeys.count <= CountlyCommon.sharedInstance.maxSegmentationValues)
        return self;

    NSMutableArray* excessKeys = allKeys.mutableCopy;
    [excessKeys removeObjectsInRange:(NSRange){0, CountlyCommon.sharedInstance.maxSegmentationValues}];

    CLY_LOG_W(@"%s, Number of key-value pairs in %@ is more than the limit (%ld)! So, some of them will be removed %@", __FUNCTION__, explanation, (long)CountlyCommon.sharedInstance.maxSegmentationValues, [excessKeys description]);

    NSMutableDictionary* limitedDict = self.mutableCopy;
    [limitedDict removeObjectsForKeys:excessKeys];

    return limitedDict.copy;
}

- (NSMutableDictionary *) cly_filterSupportedDataTypes
{
    NSMutableDictionary<NSString *, id> *filteredDictionary = [NSMutableDictionary dictionary];
    
    for (NSString *key in self) {
        id value = [self objectForKey:key];
        
        if ([value isKindOfClass:[NSNumber class]] ||
            [value isKindOfClass:[NSString class]] ||
            ([value isKindOfClass:[NSArray class]] && (value = [value cly_filterSupportedDataTypes]))) {
            [filteredDictionary setObject:value forKey:key];
        } else {
            CLY_LOG_W(@"%s, Removed invalid type for key %@: %@", __FUNCTION__, key, [value class]);
        }
    }
    
    return filteredDictionary.mutableCopy;
}

@end

@implementation NSData (Countly)
- (NSString *)cly_stringUTF8
{
    return [NSString.alloc initWithData:self encoding:NSUTF8StringEncoding];
}
@end
