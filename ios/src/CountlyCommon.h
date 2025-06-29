// CountlyCommon.h
//
// This code is provided under the MIT License.
//
// Please visit www.count.ly for more information.

#import <Foundation/Foundation.h>
#import "Countly.h"
#import "CountlyServerConfig.h"
#import "CountlyPersistency.h"
#import "CountlyConnectionManager.h"
#import "CountlyEvent.h"
#import "CountlyUserDetails.h"
#import "CountlyDeviceInfo.h"
#import "CountlyCrashReporter.h"
#import "CountlyConfig.h"
#import "CountlyViewTrackingInternal.h"
#import "CountlyFeedbacksInternal.h"
#import "CountlyFeedbackWidget.h"
#import "CountlyPushNotifications.h"
#import "CountlyNotificationService.h"
#import "CountlyConsentManager.h"
#import "CountlyLocationManager.h"
#import "CountlyRemoteConfigInternal.h"
#import "CountlyPerformanceMonitoring.h"
#import "CountlyRCData.h"
#import "CountlyViewData.h"
#import "CountlyRemoteConfig.h"
#import "CountlyViewTracking.h"
#import "Resettable.h"
#import "CountlyCrashData.h"
#import "CountlyContentBuilderInternal.h"
#import "CountlyExperimentalConfig.h"
#import "CountlyHealthTracker.h"

#define CLY_LOG_E(fmt, ...) CountlyInternalLog(CLYInternalLogLevelError, fmt, ##__VA_ARGS__)
#define CLY_LOG_W(fmt, ...) CountlyInternalLog(CLYInternalLogLevelWarning, fmt, ##__VA_ARGS__)
#define CLY_LOG_I(fmt, ...) CountlyInternalLog(CLYInternalLogLevelInfo, fmt, ##__VA_ARGS__)
#define CLY_LOG_D(fmt, ...) CountlyInternalLog(CLYInternalLogLevelDebug, fmt, ##__VA_ARGS__)
#define CLY_LOG_V(fmt, ...) CountlyInternalLog(CLYInternalLogLevelVerbose, fmt, ##__VA_ARGS__)

#if (TARGET_OS_IOS)
#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#endif

#if (TARGET_OS_WATCH)
#import <WatchKit/WatchKit.h>
#import "WatchConnectivity/WatchConnectivity.h"
#endif

#if (TARGET_OS_TV)
#import <UIKit/UIKit.h>
#endif

#import <objc/runtime.h>

NS_ASSUME_NONNULL_BEGIN

extern NSString* const kCountlyErrorDomain;

extern NSString* const kCountlyReservedEventOrientation;
extern NSString* const kCountlyVisibility;

NS_ERROR_ENUM(kCountlyErrorDomain)
{
    CLYErrorFeedbackWidgetNotAvailable = 10001,
    CLYErrorFeedbackWidgetNotTargetedForDevice = 10002,
    CLYErrorRemoteConfigGeneralAPIError = 10011,
    CLYErrorFeedbacksGeneralAPIError = 10012,
    CLYErrorServerConfigGeneralAPIError = 10013,
};

extern NSString* const kCountlySDKVersion;
extern NSString* const kCountlySDKName;

@interface CountlyCommon : NSObject <Resettable>

@property (nonatomic, copy) NSString* SDKVersion;
@property (nonatomic, copy) NSString* SDKName;

@property (nonatomic) BOOL hasStarted;
@property (nonatomic) BOOL enableDebug;

@property (nonatomic) BOOL shouldIgnoreTrustCheck;
@property (nonatomic, weak) id <CountlyLoggerDelegate> loggerDelegate;
@property (nonatomic) CLYInternalLogLevel internalLogLevel;
@property (nonatomic, copy) NSString* attributionID;
@property (nonatomic) BOOL manualSessionHandling;
@property (nonatomic) BOOL enableManualSessionControlHybridMode;
@property (nonatomic) BOOL enableOrientationTracking;

@property (nonatomic) BOOL enableVisibiltyTracking;


@property (nonatomic) NSUInteger maxKeyLength;
@property (nonatomic) NSUInteger maxValueLength;
@property (nonatomic) NSUInteger maxSegmentationValues;

void CountlyInternalLog(CLYInternalLogLevel level, NSString *format, ...) NS_FORMAT_FUNCTION(2, 3);
void CountlyPrint(NSString *stringToPrint);

+ (instancetype)sharedInstance;
- (NSInteger)hourOfDay;
- (NSInteger)dayOfWeek;
- (NSInteger)timeZone;
- (NSInteger)timeSinceLaunch;
- (NSTimeInterval)uniqueTimestamp;
- (NSString *)randomEventID;

- (void)startBackgroundTask;
- (void)finishBackgroundTask;

#if (TARGET_OS_IOS || TARGET_OS_VISION || TARGET_OS_TV )
- (UIViewController *)topViewController;
- (void)tryPresentingViewController:(UIViewController *)viewController;
- (void)tryPresentingViewController:(UIViewController *)viewController withCompletion:(void (^ __nullable) (void))completion;
#endif

- (void)observeDeviceOrientationChanges;

- (void)recordOrientation;

- (BOOL)hasStarted_;

- (NSURLSession *)URLSession;

- (CGSize)getWindowSize;
@end


#if (TARGET_OS_IOS)
@interface CLYInternalViewController : UIViewController <WKNavigationDelegate>
@property (nonatomic, weak) WKWebView* webView;
@end

@interface CLYButton : UIButton
@property (nonatomic, copy) void (^onClick)(id sender);
+ (CLYButton *)dismissAlertButton;
+ (CLYButton *)dismissAlertButton:(NSString * _Nullable)closeButtonText;
- (void)positionToTopRight;
- (void)positionToTopRightConsideringStatusBar;
@end
#endif

@interface CLYDelegateInterceptor : NSObject
@property (nonatomic, weak) id originalDelegate;
@end

@interface NSString (Countly)
- (NSString *)cly_URLEscaped;
- (NSString *)cly_SHA256;
- (NSData *)cly_dataUTF8;
- (NSString *)cly_valueForQueryStringKey:(NSString *)key;
- (NSString *)cly_truncatedKey:(NSString *)explanation;
- (NSString *)cly_truncatedValue:(NSString *)explanation;
@end

@interface NSArray (Countly)
- (NSString *)cly_JSONify;
- (NSArray *)cly_filterSupportedDataTypes;
@end

@interface NSDictionary (Countly)
- (NSString *)cly_JSONify;
- (NSDictionary *)cly_truncated:(NSString *)explanation;
- (NSDictionary *)cly_limited:(NSString *)explanation;
- (NSMutableDictionary *)cly_filterSupportedDataTypes;
@end

@interface NSData (Countly)
- (NSString *)cly_stringUTF8;
@end

@interface Countly (RecordReservedEvent)
- (void)recordReservedEvent:(NSString *)key segmentation:(NSDictionary *)segmentation;
- (void)recordReservedEvent:(NSString *)key segmentation:(NSDictionary *)segmentation ID:(NSString *)ID;
- (void)recordReservedEvent:(NSString *)key segmentation:(NSDictionary *)segmentation count:(NSUInteger)count sum:(double)sum duration:(NSTimeInterval)duration ID:(NSString *)ID timestamp:(NSTimeInterval)timestamp;
@end

@interface CountlyUserDetails (ClearUserDetails)
- (void)clearUserDetails;
@end

NS_ASSUME_NONNULL_END
