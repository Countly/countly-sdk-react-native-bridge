#define COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

#import "Countly.h"

#import "CountlyCommon.h"
#import "CountlyPersistency.h"
#import "CountlyPushNotifications.h"
#import "CountlyReactNative.h"

#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
#import "CountlyRNPushNotifications.h"
#endif

@interface CountlyPersistency ()
@property (nonatomic, strong) NSMutableArray *queuedRequests;
@property (nonatomic, strong) NSMutableArray *recordedEvents;
@end

static NSString *const kCountlyRNHandledRequestKey = @"CountlyRNHandledRequestKey";

@interface CountlyRNRequestCaptureProtocol : NSURLProtocol
@end

@interface CountlyRNRequestCaptureProtocol () <NSURLSessionDataDelegate>
@property (nonatomic, strong) NSURLSession *session;
@property (nonatomic, strong) NSURLSessionDataTask *task;
@property (nonatomic, strong) NSMutableData *responseData;
@end

#if DEBUG
#define COUNTLY_RN_LOG(fmt, ...) CountlyRNInternalLog(fmt, ##__VA_ARGS__)
#else
#define COUNTLY_RN_LOG(...)
#endif

@interface CountlyFeedbackWidget ()
+ (CountlyFeedbackWidget *)createWithDictionary:(NSDictionary *)dictionary;
@property (nonatomic, readonly) NSString *widgetVersion;
@end

BOOL BUILDING_WITH_PUSH_DISABLED = true;

NSString *const kCountlyReactNativeSDKVersion = @"26.1.0";
NSString *const kCountlyReactNativeSDKName = @"js-rnb-ios";
NSString *const kCountlyReactNativeSDKNameNoPush = @"js-rnbnp-ios";

CLYPushTestMode const CLYPushTestModeProduction = @"CLYPushTestModeProduction";

CountlyConfig *config = nil; // alloc here
NSMutableArray<CLYFeature> *countlyFeatures = nil;
NSArray<CountlyFeedbackWidget *> *feedbackWidgetList = nil;
BOOL enablePushNotifications = true;
BOOL countlyRNRequestCaptureEnabled = false;
NSMutableArray<NSString *> *countlyRNCapturedRequests = nil;
NSURLSessionConfiguration *countlyRNForwardSessionConfiguration = nil;
NSString *countlyRNCapturedHost = nil;

NSString *const NAME_KEY = @"name";
NSString *const USERNAME_KEY = @"username";
NSString *const EMAIL_KEY = @"email";
NSString *const ORG_KEY = @"organization";
NSString *const PHONE_KEY = @"phone";
NSString *const PICTURE_KEY = @"picture";
NSString *const PICTURE_PATH_KEY = @"picturePath";
NSString *const GENDER_KEY = @"gender";
NSString *const BYEAR_KEY = @"byear";
NSString *const CUSTOM_KEY = @"custom";

NSString *const widgetShownCallbackName = @"widgetShownCallback";
NSString *const widgetClosedCallbackName = @"widgetClosedCallback";
NSString *const ratingWidgetCallbackName = @"ratingWidgetCallback";
NSString *const pushNotificationCallbackName = @"pushNotificationCallback";
NSString *const contentCallbackName = @"globalContentCallback";

static void CountlyRNEnsureCapturedRequests(void) {
    if (countlyRNCapturedRequests == nil) {
        countlyRNCapturedRequests = NSMutableArray.new;
    }
}

static void CountlyRNResetCapturedRequests(void) {
    CountlyRNEnsureCapturedRequests();
    [countlyRNCapturedRequests removeAllObjects];
}

static NSData *CountlyRNBodyDataFromRequest(NSURLRequest *request) {
    if (request.HTTPBody != nil) {
        return request.HTTPBody;
    }

    if (request.HTTPBodyStream == nil) {
        return nil;
    }

    NSInputStream *bodyStream = request.HTTPBodyStream;
    [bodyStream open];

    NSMutableData *bodyData = NSMutableData.data;
    uint8_t buffer[1024];
    NSInteger bytesRead = 0;
    while ((bytesRead = [bodyStream read:buffer maxLength:sizeof(buffer)]) > 0) {
        [bodyData appendBytes:buffer length:(NSUInteger)bytesRead];
    }

    [bodyStream close];
    return bodyData.length > 0 ? bodyData.copy : nil;
}

static NSString *CountlyRNQueryLikePayloadFromRequest(NSURLRequest *request) {
    NSData *bodyData = CountlyRNBodyDataFromRequest(request);
    if (bodyData.length > 0) {
        NSString *bodyString = [[NSString alloc] initWithData:bodyData encoding:NSUTF8StringEncoding];
        if (bodyString.length > 0) {
            return bodyString;
        }
    }

    return request.URL.query ?: @"";
}

static void CountlyRNRecordCapturedRequest(NSURLRequest *request, NSString *kind) {
    CountlyRNEnsureCapturedRequests();

    NSString *payload = CountlyRNQueryLikePayloadFromRequest(request) ?: @"";
    NSMutableDictionary *capturedRequest = [[NSMutableDictionary alloc] init];
    capturedRequest[@"kind"] = kind ?: @"network";
    capturedRequest[@"url"] = request.URL.absoluteString ?: @"";
    capturedRequest[@"path"] = request.URL.path ?: @"";
    capturedRequest[@"httpMethod"] = request.HTTPMethod ?: @"GET";
    capturedRequest[@"requestData"] = payload;

    NSError *error = nil;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:capturedRequest options:0 error:&error];
    if (error == nil && jsonData != nil) {
        NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        if (jsonString.length > 0) {
            [countlyRNCapturedRequests addObject:jsonString];
        }
    }
}

static BOOL CountlyRNShouldCaptureRequest(NSURLRequest *request) {
    if (!countlyRNRequestCaptureEnabled || request.URL == nil) {
        return NO;
    }

    if ([NSURLProtocol propertyForKey:kCountlyRNHandledRequestKey inRequest:request]) {
        return NO;
    }

    if (countlyRNCapturedHost.length == 0) {
        return NO;
    }

    return [request.URL.host isEqualToString:countlyRNCapturedHost];
}

static NSURLSessionConfiguration *CountlyRNRequestCaptureConfiguration(NSURLSessionConfiguration *sourceConfiguration) {
    NSURLSessionConfiguration *sessionConfiguration = [sourceConfiguration copy] ?: NSURLSessionConfiguration.defaultSessionConfiguration;
    NSMutableArray<Class> *protocolClasses = [NSMutableArray arrayWithArray:sessionConfiguration.protocolClasses ?: @[]];
    if (![protocolClasses containsObject:CountlyRNRequestCaptureProtocol.class]) {
        [protocolClasses insertObject:CountlyRNRequestCaptureProtocol.class atIndex:0];
    }
    sessionConfiguration.protocolClasses = protocolClasses;

    countlyRNForwardSessionConfiguration = [sourceConfiguration copy] ?: NSURLSessionConfiguration.defaultSessionConfiguration;
    NSMutableArray<Class> *forwardProtocolClasses = [NSMutableArray arrayWithArray:countlyRNForwardSessionConfiguration.protocolClasses ?: @[]];
    [forwardProtocolClasses removeObject:CountlyRNRequestCaptureProtocol.class];
    countlyRNForwardSessionConfiguration.protocolClasses = forwardProtocolClasses;

    return sessionConfiguration;
}

static NSData *CountlyRNCapturedResponseDataForRequest(NSURLRequest *request) {
    NSString *path = request.URL.path ?: @"";

    if ([path isEqualToString:@"/i"]) {
        return [@"{\"result\":\"Success\"}" dataUsingEncoding:NSUTF8StringEncoding];
    }

    return [@"{}" dataUsingEncoding:NSUTF8StringEncoding];
}

@implementation CountlyRNRequestCaptureProtocol

+ (BOOL)canInitWithRequest:(NSURLRequest *)request {
    return CountlyRNShouldCaptureRequest(request);
}

+ (NSURLRequest *)canonicalRequestForRequest:(NSURLRequest *)request {
    return request;
}

- (void)startLoading {
    NSMutableURLRequest *mutableRequest = [self.request mutableCopy];
    [NSURLProtocol setProperty:@YES forKey:kCountlyRNHandledRequestKey inRequest:mutableRequest];
    CountlyRNRecordCapturedRequest(mutableRequest, @"direct");

    NSData *responseData = CountlyRNCapturedResponseDataForRequest(mutableRequest);
    NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:mutableRequest.URL statusCode:200 HTTPVersion:nil headerFields:@{ @"Content-Type": @"application/json" }];
    [self.client URLProtocol:self didReceiveResponse:response cacheStoragePolicy:NSURLCacheStorageNotAllowed];
    [self.client URLProtocol:self didLoadData:responseData];
    [self.client URLProtocolDidFinishLoading:self];
}

- (void)stopLoading {
    [self.task cancel];
    [self.session invalidateAndCancel];
    self.task = nil;
    self.session = nil;
    self.responseData = nil;
}

@end

@implementation CountlyReactNative
NSString *const kCountlyNotificationPersistencyKey = @"kCountlyNotificationPersistencyKey";

- (instancetype)init {
    if (self = [super init]) {
    }

#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
    [CountlyRNPushNotifications.sharedInstance setCountlyReactNative:self];
#endif

    return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[ pushNotificationCallbackName, ratingWidgetCallbackName, widgetShownCallbackName, widgetClosedCallbackName, contentCallbackName ];
}

- (NSString *)toJSONString:(id)object {
    if (!object || ![NSJSONSerialization isValidJSONObject:object]) {
        return nil;
    }

    NSError *error = nil;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:object options:0 error:&error];
    if (error || !jsonData) {
        return nil;
    }

    return [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
}

- (NSDictionary *)segmentationDictionaryFromArguments:(NSArray *)arguments startIndex:(NSInteger)startIndex {
    if (arguments == nil || arguments.count <= startIndex) {
        return nil;
    }

    NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
    for (NSInteger index = startIndex; index + 1 < arguments.count; index += 2) {
        id key = [arguments objectAtIndex:index];
        if (![key isKindOfClass:[NSString class]]) {
            continue;
        }

        id value = [arguments objectAtIndex:index + 1];
        if (value != nil && value != (id)kCFNull) {
            dict[(NSString *)key] = value;
        }
    }

    return dict.count > 0 ? dict : nil;
}

RCT_EXPORT_MODULE();

RCT_REMAP_METHOD(init, params : (NSArray *)arguments initWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        COUNTLY_RN_LOG(@"Initializing...");

        NSString *args = [arguments objectAtIndex:0];
        NSData *data = [args dataUsingEncoding:NSUTF8StringEncoding];
        id jsonOutput = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
        
        [self populateConfig:jsonOutput];

      CountlyCommon.sharedInstance.SDKName = kCountlyReactNativeSDKName;
      CountlyCommon.sharedInstance.SDKName = BUILDING_WITH_PUSH_DISABLED ? kCountlyReactNativeSDKNameNoPush : kCountlyReactNativeSDKName;
      CountlyCommon.sharedInstance.SDKVersion = kCountlyReactNativeSDKVersion;

#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
      if (enablePushNotifications) {
          [self addCountlyFeature:CLYPushNotifications];
      }
#endif
      if (config.host != nil && [config.host length] > 0) {
          dispatch_async(dispatch_get_main_queue(), ^{
            [[Countly sharedInstance] startWithConfig:config];
#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
            [CountlyRNPushNotifications.sharedInstance recordPushActions];
#endif
            resolve(@"Success");
          });
      }
    });
}

- (void) populateConfig:(id) json {
    if (config == nil) {
      config = CountlyConfig.new;
    }

    NSString *serverurl = json[@"serverURL"];
    NSString *appkey = json[@"appKey"];
    NSString *deviceID = json[@"deviceID"];
    config.appKey = appkey;
    config.host = serverurl;
    config.enrollABOnRCDownload = true;

    if (deviceID != nil && deviceID != (NSString *)[NSNull null] && ![deviceID isEqual:@""]) {
        if ([deviceID isEqual:@"TemporaryDeviceID"]) {
            config.deviceID = CLYTemporaryDeviceID;
        } else {
            config.deviceID = deviceID;
        }
    }

    if (json[@"loggingEnabled"]) {
        config.enableDebug = YES;
        config.internalLogLevel = CLYInternalLogLevelVerbose;
    } else {
        config.enableDebug = NO;
    }

    if (json[@"shouldRequireConsent"]) {
        config.requiresConsent = YES;
    }

    if (json[@"tamperingProtectionSalt"]) {
        config.secretSalt = json[@"tamperingProtectionSalt"];
    }

    if (json[@"consents"]) {
        config.consents = json[@"consents"];
    }

    if (json[@"starRatingTextMessage"]) {
        config.starRatingMessage = json[@"starRatingTextMessage"];
    }
    // Limits -----------------------------------------------
    // maxKeyLength
    NSNumber *maxKeyLength = json[@"maxKeyLength"];
    if (maxKeyLength) {
        [config.sdkInternalLimits setMaxKeyLength:[maxKeyLength intValue]];
    }
    NSNumber *maxValueSize = json[@"maxValueSize"];
    if (maxValueSize) {
        [config.sdkInternalLimits setMaxValueSize:[maxValueSize intValue]];
    }
    NSNumber *maxSegmentationValues = json[@"maxSegmentationValues"];
    if (maxSegmentationValues) {
        [config.sdkInternalLimits setMaxSegmentationValues:[maxSegmentationValues intValue]];
    }
    NSNumber *maxBreadcrumbCount = json[@"maxBreadcrumbCount"];
    if (maxBreadcrumbCount) {
        [config.sdkInternalLimits setMaxBreadcrumbCount:[maxBreadcrumbCount intValue]];
    }
    NSNumber *maxStackTraceLineLength = json[@"maxStackTraceLineLength"];
    if (maxStackTraceLineLength) {
        [config.sdkInternalLimits setMaxStackTraceLineLength:[maxStackTraceLineLength intValue]];
    }
    NSNumber *maxStackTraceLinesPerThread = json[@"maxStackTraceLinesPerThread"];
    if (maxStackTraceLinesPerThread) {
        [config.sdkInternalLimits setMaxStackTraceLinesPerThread:[maxStackTraceLinesPerThread intValue]];
    }
    // Limits End -------------------------------------------
    NSNumber *timerInt = json[@"setZoneTimerInterval"];
    if (timerInt) {
        [config.content setZoneTimerInterval:[timerInt intValue]];
    }
    if(json[@"setGlobalContentCallback"]) {
        [config.content setGlobalContentCallback:^(ContentStatus contentStatus, NSDictionary<NSString *,id> * _Nonnull contentData) {
            NSMutableDictionary *contentDataDict = [[NSMutableDictionary alloc] init];
            [contentDataDict setObject:[NSNumber numberWithInt:contentStatus] forKey:@"status"];
            [contentDataDict setObject:contentData forKey:@"data"];
            NSError *error;
            NSData *contentDataJson = [NSJSONSerialization dataWithJSONObject:contentDataDict options:0 error:&error];
            NSString *contentDataString = [[NSString alloc] initWithData:contentDataJson encoding:NSUTF8StringEncoding];

            [self sendEventWithName:contentCallbackName body:contentDataString];
        }];
    }
    NSString *webViewDisplayOption = json[@"webViewDisplayOption"];
    if ([webViewDisplayOption isKindOfClass:[NSString class]]) {
        if ([webViewDisplayOption isEqualToString:@"SAFE_AREA"]) {
            [config.content setWebviewDisplayOption:SAFE_AREA];
        } else {
            [config.content setWebviewDisplayOption:IMMERSIVE];
        }
    }
    // APM ------------------------------------------------
    NSNumber *enableForegroundBackground = json[@"enableForegroundBackground"];
    if (enableForegroundBackground) {
        config.apm.enableForegroundBackgroundTracking = [enableForegroundBackground boolValue];
    }
    NSNumber *enableManualAppLoaded = json[@"enableManualAppLoaded"];
    if (enableManualAppLoaded) {
        config.apm.enableManualAppLoadedTrigger = [enableManualAppLoaded boolValue];
    }
    NSNumber *trackAppStartTime = json[@"trackAppStartTime"];
    if (trackAppStartTime) {
        config.apm.enableAppStartTimeTracking = [trackAppStartTime boolValue];
    }
    NSNumber *startTSOverride = json[@"startTSOverride"];
    if (startTSOverride) {
        [config.apm setAppStartTimestampOverride:[startTSOverride longLongValue]];
    }
    // Legacy APM
    if (json[@"enableApm"]) {
        config.enablePerformanceMonitoring = YES;
    }
    // APM END --------------------------------------------
    if (json[@"enablePreviousNameRecording"]) {
        config.experimental.enablePreviousNameRecording = YES;
    }
    if (json[@"enableVisibilityTracking"]) {
        config.experimental.enableVisibiltyTracking = YES;
    }
    NSNumber *enableAutomaticViewTracking = json[@"enableAutomaticViewTracking"];
    if (enableAutomaticViewTracking) {
        config.enableAutomaticViewTracking = [enableAutomaticViewTracking boolValue];
    }
    NSArray *automaticViewTrackingExclusionList = json[@"automaticViewTrackingExclusionList"];
    if ([automaticViewTrackingExclusionList isKindOfClass:[NSArray class]]) {
        config.automaticViewTrackingExclusionList = automaticViewTrackingExclusionList;
    }
    NSDictionary *globalViewSegmentation = json[@"globalViewSegmentation"];
    if ([globalViewSegmentation isKindOfClass:[NSDictionary class]]) {
        config.globalViewSegmentation = globalViewSegmentation;
    }

    if (json[@"crashReporting"]) {
        [self addCountlyFeature:CLYCrashReporting];
    }

#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
    NSDictionary *pushJson = json[@"pushNotification"];
    if (pushJson) {
        config.sendPushTokenAlways = YES;
        config.pushTestMode = CLYPushTestModeProduction;
        NSString *tokenType = pushJson[@"tokenType"];
        if ([tokenType isEqualToString:@"1"]) {
            config.pushTestMode = CLYPushTestModeDevelopment;
        } else if ([tokenType isEqualToString:@"2"]) {
            config.pushTestMode = CLYPushTestModeTestFlightOrAdHoc;
        }

        CountlyPushNotifications.sharedInstance.pushTestMode = config.pushTestMode;
    }
#endif

    if (json[@"attributionID"]) {
          NSString *attributionID = json[@"attributionID"];
          if (CountlyCommon.sharedInstance.hasStarted) {
              [Countly.sharedInstance recordAttributionID:attributionID];
          } else {
              config.attributionID = attributionID;
          }
    }

    if (json[@"locationCountryCode"]) {
        NSString *countryCode = json[@"locationCountryCode"];
        NSString *city = json[@"locationCity"];
        NSString *locationString = json[@"locationGpsCoordinates"];
        NSString *ipAddress = json[@"locationIpAddress"];

        if (locationString != nil && ![locationString isEqualToString:@"null"]) {
            CLLocationCoordinate2D locationCoordinate = [self getCoordinate:locationString];
            config.location = locationCoordinate;
        }
        if (city != nil && ![city isEqualToString:@"null"]) {
            config.city = city;
        }
        if (countryCode != nil && ![countryCode isEqualToString:@"null"]) {
            config.ISOCountryCode = countryCode;
        }
        if (ipAddress != nil && ![ipAddress isEqualToString:@"null"]) {
            config.IP = ipAddress;
        }
    }

    if (json[@"campaignType"]) {
        config.campaignType = json[@"campaignType"];
        config.campaignData = json[@"campaignData"];
    }

    if (json[@"attributionValues"]) {
        config.indirectAttribution = json[@"attributionValues"];
    }

    if (json[@"requestTimeoutDuration"]) {
        NSNumber *timeout = json[@"requestTimeoutDuration"];
        if ([timeout intValue] > 0) {
            config.requestTimeoutDuration = [timeout intValue];
        } else {
            COUNTLY_RN_LOG(@"setRequestTimeoutDuration: failure, timeout value must be greater than 0");
        }
    }

    if (json[@"manualSessionHandling"]) {
        config.manualSessionHandling = [json[@"manualSessionHandling"] boolValue];
    }
    if (json[@"enableManualSessionControlHybridMode"]) {
        config.enableManualSessionControlHybridMode = [json[@"enableManualSessionControlHybridMode"] boolValue];
    }

    NSDictionary *customNetworkRequestHeaders = json[@"customNetworkRequestHeaders"];
    if ([customNetworkRequestHeaders isKindOfClass:[NSDictionary class]] && customNetworkRequestHeaders.count > 0) {
        NSURLSessionConfiguration *sessionConfiguration = config.URLSessionConfiguration ?: NSURLSessionConfiguration.defaultSessionConfiguration;
        NSMutableDictionary *headerValues = [[NSMutableDictionary alloc] init];
        if ([sessionConfiguration.HTTPAdditionalHeaders isKindOfClass:[NSDictionary class]]) {
            [headerValues addEntriesFromDictionary:(NSDictionary *)sessionConfiguration.HTTPAdditionalHeaders];
        }

        [customNetworkRequestHeaders enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
            if ([key isKindOfClass:[NSString class]] && [obj isKindOfClass:[NSString class]] && [(NSString *)key length] > 0) {
                headerValues[key] = obj;
            }
        }];

        sessionConfiguration.HTTPAdditionalHeaders = [headerValues copy];
        config.URLSessionConfiguration = sessionConfiguration;
    }

    if (json[@"disableViewRestartForManualRecording"]) {
        config.disableViewRestartForManualRecording = [json[@"disableViewRestartForManualRecording"] boolValue];
    }

    NSURLSessionConfiguration *sessionConfiguration = config.URLSessionConfiguration ?: NSURLSessionConfiguration.defaultSessionConfiguration;
    config.URLSessionConfiguration = CountlyRNRequestCaptureConfiguration(sessionConfiguration);

    NSURLComponents *serverURLComponents = [NSURLComponents componentsWithString:serverurl ?: @""];
    countlyRNCapturedHost = serverURLComponents.host;

    if (json[@"disableSDKBehaviorSettingsUpdates"]) {
        config.disableSDKBehaviorSettingsUpdates = [json[@"disableSDKBehaviorSettingsUpdates"] boolValue];
    }
    if (json[@"disableBackoffMechanism"]) {
        config.disableBackoffMechanism = [json[@"disableBackoffMechanism"] boolValue];
    }
    if (json[@"sdkBehaviorSettings"]) {
        if (![json[@"sdkBehaviorSettings"] isKindOfClass:[NSString class]]) {
            NSError *error;
            NSData *jsonData = [NSJSONSerialization dataWithJSONObject:json[@"sdkBehaviorSettings"] options:0 error:&error];
            if (error) {
                COUNTLY_RN_LOG(@"Error serializing sdkBehaviorSettings: %@", error.localizedDescription);
            } else {
                config.sdkBehaviorSettings = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
            }
        } else {
            config.sdkBehaviorSettings = json[@"sdkBehaviorSettings"];
        }
    }
}

RCT_EXPORT_METHOD(setID : (NSString *)newDeviceID) { 
    dispatch_async(dispatch_get_main_queue(), ^{ 
        if ([newDeviceID isEqualToString:@"TemporaryDeviceID"]) {
            [Countly.sharedInstance enableTemporaryDeviceIDMode];
        } else {
            [Countly.sharedInstance setID:newDeviceID];
        }
    });
}

RCT_EXPORT_METHOD(recordEvent : (NSDictionary *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *eventName = [arguments objectForKey:@"n"];

        NSNumber *countNumber = [arguments objectForKey:@"c"];
        int countInt = [countNumber intValue];

        NSNumber *sumNumber = [arguments objectForKey:@"s"];
        float sumFloat = [sumNumber floatValue];

        NSMutableDictionary *dict = nil;
        NSArray *segments = [arguments objectForKey:@"g"];
        if (segments != nil) {
            dict = [[NSMutableDictionary alloc] init];
            for (int i = 0, il = (int)segments.count; i < il; i += 2) {
                dict[[segments objectAtIndex:i]] = [segments objectAtIndex:i + 1];
            }
        }
        [[Countly sharedInstance] recordEvent:eventName segmentation:dict count:countInt sum:sumFloat];
    });
}

RCT_EXPORT_METHOD(recordView : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
            NSString *recordView = arguments.count > 0 ? [arguments objectAtIndex:0] : nil;
            NSDictionary *dict = [self segmentationDictionaryFromArguments:arguments startIndex:1];
            [[Countly.sharedInstance views] startAutoStoppedView:recordView segmentation:dict];
    });
}

RCT_REMAP_METHOD(startAutoStoppedView, params : (NSArray *)arguments startAutoStoppedViewWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSString *viewName = arguments.count > 0 ? [arguments objectAtIndex:0] : nil;
            NSDictionary *dict = [self segmentationDictionaryFromArguments:arguments startIndex:1];
            NSString *viewID = [[Countly.sharedInstance views] startAutoStoppedView:viewName segmentation:dict];
            resolve(viewID ?: [NSNull null]);
        });
}

RCT_REMAP_METHOD(startView, params : (NSArray *)arguments startViewWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSString *viewName = arguments.count > 0 ? [arguments objectAtIndex:0] : nil;
            NSDictionary *dict = [self segmentationDictionaryFromArguments:arguments startIndex:1];
            NSString *viewID = [[Countly.sharedInstance views] startView:viewName segmentation:dict];
            resolve(viewID ?: [NSNull null]);
        });
}

RCT_EXPORT_METHOD(stopViewWithName : (NSArray *)arguments) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSString *viewName = arguments.count > 0 ? [arguments objectAtIndex:0] : nil;
            NSDictionary *dict = [self segmentationDictionaryFromArguments:arguments startIndex:1];
            [[Countly.sharedInstance views] stopViewWithName:viewName segmentation:dict];
        });
}

RCT_EXPORT_METHOD(stopViewWithID : (NSArray *)arguments) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSString *viewID = arguments.count > 0 ? [arguments objectAtIndex:0] : nil;
            NSDictionary *dict = [self segmentationDictionaryFromArguments:arguments startIndex:1];
            [[Countly.sharedInstance views] stopViewWithID:viewID segmentation:dict];
        });
}

RCT_EXPORT_METHOD(stopAllViews : (NSArray *)arguments) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSDictionary *dict = [self segmentationDictionaryFromArguments:arguments startIndex:0];
            [[Countly.sharedInstance views] stopAllViews:dict];
        });
}

RCT_EXPORT_METHOD(pauseViewWithID : (NSArray *)arguments) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSString *viewID = arguments.count > 0 ? [arguments objectAtIndex:0] : nil;
            [[Countly.sharedInstance views] pauseViewWithID:viewID];
        });
}

RCT_EXPORT_METHOD(resumeViewWithID : (NSArray *)arguments) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSString *viewID = arguments.count > 0 ? [arguments objectAtIndex:0] : nil;
            [[Countly.sharedInstance views] resumeViewWithID:viewID];
        });
}

RCT_EXPORT_METHOD(addSegmentationToViewWithID : (NSArray *)arguments) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSString *viewID = arguments.count > 0 ? [arguments objectAtIndex:0] : nil;
            NSDictionary *dict = [self segmentationDictionaryFromArguments:arguments startIndex:1];
            [[Countly.sharedInstance views] addSegmentationToViewWithID:viewID segmentation:dict];
        });
}

RCT_EXPORT_METHOD(addSegmentationToViewWithName : (NSArray *)arguments) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSString *viewName = arguments.count > 0 ? [arguments objectAtIndex:0] : nil;
            NSDictionary *dict = [self segmentationDictionaryFromArguments:arguments startIndex:1];
            [[Countly.sharedInstance views] addSegmentationToViewWithName:viewName segmentation:dict];
        });
}

RCT_EXPORT_METHOD(setGlobalViewSegmentation : (NSArray *)arguments) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSDictionary *dict = [self segmentationDictionaryFromArguments:arguments startIndex:0];
            [[Countly.sharedInstance views] setGlobalViewSegmentation:dict];
        });
}

RCT_EXPORT_METHOD(updateGlobalViewSegmentation : (NSArray *)arguments) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSDictionary *dict = [self segmentationDictionaryFromArguments:arguments startIndex:0];
            [[Countly.sharedInstance views] updateGlobalViewSegmentation:dict];
        });
}

RCT_EXPORT_METHOD(setLoggingEnabled : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      BOOL boolean = [[arguments objectAtIndex:0] boolValue];
      if (config == nil) {
          config = CountlyConfig.new;
      }
      if (boolean) {
          config.enableDebug = YES;
          config.internalLogLevel = CLYInternalLogLevelVerbose;
      } else {
          config.enableDebug = NO;
      }
    });
}

RCT_REMAP_METHOD(setUserData, params : (NSArray *)arguments setUserDataWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSDictionary *userData = [arguments objectAtIndex:0];
      [self setUserDataIntenral:userData];
      resolve(@"Success");
    });
}

RCT_EXPORT_METHOD(disablePushNotifications) {
#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
    dispatch_async(dispatch_get_main_queue(), ^{
      enablePushNotifications = false;
    });
#endif
}

RCT_EXPORT_METHOD(sendPushToken : (NSArray *)arguments) {
#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *token = [arguments objectAtIndex:0];
      NSString *messagingMode = @"1";
      if (config.pushTestMode == nil || [config.pushTestMode isEqual:@""] || [config.pushTestMode isEqualToString:CLYPushTestModeTestFlightOrAdHoc]) {
          messagingMode = @"0";
      }
      NSString *urlString = [@"" stringByAppendingFormat:@"%@?device_id=%@&app_key=%@&token_session=1&test_mode=%@&ios_token=%@", config.host, [Countly.sharedInstance deviceID], config.appKey, messagingMode, token];
      NSMutableURLRequest *request = [[NSMutableURLRequest alloc] init];
      [request setHTTPMethod:@"GET"];
      [request setURL:[NSURL URLWithString:urlString]];
    });
#endif
}

RCT_EXPORT_METHOD(askForNotificationPermission : (NSArray *)arguments) {
#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
    [CountlyRNPushNotifications.sharedInstance askForNotificationPermission];
#endif
}
RCT_EXPORT_METHOD(registerForNotification : (NSArray *)arguments) {
#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
    [CountlyRNPushNotifications.sharedInstance registerForNotification];
#endif
};

#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
- (void)notificationCallback:(NSString *_Nullable)notificationJson {
    [self sendEventWithName:pushNotificationCallbackName body:notificationJson];
}

+ (void)startObservingNotifications {
    [CountlyRNPushNotifications.sharedInstance startObservingNotifications];
}

+ (void)onNotification:(NSDictionary *_Nullable)notification {
    [CountlyRNPushNotifications.sharedInstance onNotification:notification];
}
+ (void)onNotificationResponse:(UNNotificationResponse *_Nullable)response {
    [CountlyRNPushNotifications.sharedInstance onNotificationResponse:response];
}
#endif

+ (void)log:(NSString *)theMessage {
    if (config.enableDebug == YES) {
        COUNTLY_RN_LOG(theMessage);
    }
}

RCT_REMAP_METHOD(getCurrentDeviceId, getCurrentDeviceIdWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      id value = [Countly.sharedInstance deviceID];
      if (value) {
          resolve(value);
      } else {
          NSString *value = @"deviceIdNotFound";
          resolve(value);
      }
    });
}

RCT_REMAP_METHOD(getDeviceIDType, getDeviceIDTypeWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        CLYDeviceIDType deviceIDType = [Countly.sharedInstance deviceIDType];
        NSNumber *deviceIDTypeInt = NULL;
        if ([deviceIDType isEqualToString:CLYDeviceIDTypeCustom]) {
            deviceIDTypeInt = @20202;
        } else if ([deviceIDType isEqualToString:CLYDeviceIDTypeTemporary]) {
            deviceIDTypeInt = @30303;
        } else {
            deviceIDTypeInt = @10101;
        }
        resolve(deviceIDTypeInt);
    });
}

RCT_EXPORT_METHOD(changeDeviceId : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *newDeviceID = [arguments objectAtIndex:0];
        if ([newDeviceID isEqual:@"TemporaryDeviceID"]) {
            newDeviceID = CLYTemporaryDeviceID;
        }

        NSString *onServerString = [arguments objectAtIndex:1];
        if ([onServerString isEqual:@"1"]) {
            [Countly.sharedInstance setNewDeviceID:newDeviceID onServer:YES];
        } else {
            [Countly.sharedInstance setNewDeviceID:newDeviceID onServer:NO];
        }
    });
}

RCT_EXPORT_METHOD(setHttpPostForced : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *isPost = [arguments objectAtIndex:0];
      if (config == nil) {
          config = CountlyConfig.new;
      }

      if ([isPost isEqual:@"1"]) {
          config.alwaysUsePOST = YES;
      } else {
          config.alwaysUsePOST = NO;
      }
    });
}

RCT_EXPORT_METHOD(pinnedCertificates : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *certificateName = [arguments objectAtIndex:0];
      if (config == nil) {
          config = CountlyConfig.new;
      }
      config.pinnedCertificates = @[ certificateName ];
    });
}

RCT_EXPORT_METHOD(startEvent : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *startEvent = [arguments objectAtIndex:0];
      [Countly.sharedInstance startEvent:startEvent];
    });
}

RCT_EXPORT_METHOD(cancelEvent : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *cancelEvent = [arguments objectAtIndex:0];
      [Countly.sharedInstance cancelEvent:cancelEvent];
    });
}

RCT_EXPORT_METHOD(endEvent : (NSDictionary *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *eventName = [arguments objectForKey:@"n"];

        NSNumber *countNumber = [arguments objectForKey:@"c"];
        int countInt = [countNumber intValue];

        NSNumber *sumNumber = [arguments objectForKey:@"s"];
        float sumFloat = [sumNumber floatValue];

        NSMutableDictionary *dict = nil;
        NSArray *segments = [arguments objectForKey:@"g"];
        if (segments != nil) {
            dict = [[NSMutableDictionary alloc] init];
            for (int i = 0, il = (int)segments.count; i < il; i += 2) {
                dict[[segments objectAtIndex:i]] = [segments objectAtIndex:i + 1];
            }
        }
        [[Countly sharedInstance] endEvent:eventName segmentation:dict count:countInt sum:sumFloat];
    });
}

RCT_EXPORT_METHOD(setLocation : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *countryCode = [arguments objectAtIndex:0];
      NSString *city = [arguments objectAtIndex:1];
      NSString *gpsCoordinate = [arguments objectAtIndex:2];
      NSString *ipAddress = [arguments objectAtIndex:3];

      if ([@"null" isEqualToString:city]) {
          city = nil;
      }
      if ([@"null" isEqualToString:countryCode]) {
          countryCode = nil;
      }
      if ([@"null" isEqualToString:gpsCoordinate]) {
          gpsCoordinate = nil;
      }
      if ([@"null" isEqualToString:ipAddress]) {
          ipAddress = nil;
      }

      CLLocationCoordinate2D locationCoordinate = [self getCoordinate:gpsCoordinate];
      [Countly.sharedInstance recordLocation:locationCoordinate city:city ISOCountryCode:countryCode IP:ipAddress];
    });
}

RCT_EXPORT_METHOD(disableLocation) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance disableLocationInfo];
    });
}

- (CLLocationCoordinate2D)getCoordinate:(NSString *)gpsCoordinate {
    CLLocationCoordinate2D locationCoordinate = kCLLocationCoordinate2DInvalid;
    if (gpsCoordinate) {
        if ([gpsCoordinate containsString:@","]) {
            @try {
                NSArray *locationArray = [gpsCoordinate componentsSeparatedByString:@","];
                if (locationArray.count > 2) {
                    COUNTLY_RN_LOG(@"Invalid location Coordinates:[%@], it should contains only two comma seperated values", gpsCoordinate);
                }
                NSString *latitudeString = [locationArray objectAtIndex:0];
                NSString *longitudeString = [locationArray objectAtIndex:1];

                double latitudeDouble = [latitudeString doubleValue];
                double longitudeDouble = [longitudeString doubleValue];
                if (latitudeDouble == 0 || longitudeDouble == 0) {
                    COUNTLY_RN_LOG(@"Invalid location Coordinates, One of the values parsed to a 0, double check that given coordinates are correct:[%@]", gpsCoordinate);
                }
                locationCoordinate = (CLLocationCoordinate2D){latitudeDouble, longitudeDouble};
            } @catch (NSException *exception) {
                COUNTLY_RN_LOG(@"Invalid location Coordinates:[%@], Exception occurred while parsing Coordinates:[%@]", gpsCoordinate, exception);
            }
        } else {
            COUNTLY_RN_LOG(@"Invalid location Coordinates:[%@], lat and long values should be comma separated", gpsCoordinate);
        }
    }
    return locationCoordinate;
}

RCT_EXPORT_METHOD(addCrashLog : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *logs = [arguments objectAtIndex:0];
      [Countly.sharedInstance recordCrashLog:logs];
    });
}

RCT_EXPORT_METHOD(setCustomCrashSegments : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
      for (int i = 0, il = (int)arguments.count; i < il; i += 2) {
          dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i + 1];
      }
      if (config == nil) {
          config = CountlyConfig.new;
      }
      config.crashSegmentation = dict;
    });
}

RCT_EXPORT_METHOD(logException : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *execption = [arguments objectAtIndex:0];
      NSString *nonfatal = [arguments objectAtIndex:1];
      NSArray *nsException = [execption componentsSeparatedByString:@"\n"];

      NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];

      for (int i = 2, il = (int)arguments.count; i < il; i += 2) {
          dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i + 1];
      }
      [dict setObject:nonfatal forKey:@"nonfatal"];

      NSException *myException = [NSException exceptionWithName:@"Exception" reason:execption userInfo:dict];

      [Countly.sharedInstance recordHandledException:myException withStackTrace:nsException];
    });
}

RCT_EXPORT_METHOD(recordMetrics : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];

        for (int i = 0, il = (int)arguments.count; i < il; i += 2) {
            dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i + 1];
        }

        [Countly.sharedInstance recordMetrics:dict];
    });
}

RCT_EXPORT_METHOD(startSession) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [Countly.sharedInstance beginSession];
        });
}

RCT_EXPORT_METHOD(updateSession) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [Countly.sharedInstance updateSession];
        });
}

RCT_EXPORT_METHOD(endSession) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [Countly.sharedInstance endSession];
        });
}

RCT_EXPORT_METHOD(addCustomNetworkRequestHeaders : (NSArray *)arguments) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSMutableDictionary<NSString *, NSString *> *customHeaderValues = [[NSMutableDictionary alloc] init];
            for (int i = 0, il = (int)arguments.count; i < il; i += 2) {
                    if (i + 1 < il) {
                            NSString *key = [arguments objectAtIndex:i];
                            NSString *value = [arguments objectAtIndex:i + 1];
                            if (key.length > 0 && value != nil) {
                                    customHeaderValues[key] = value;
                            }
                    }
            }
            [Countly.sharedInstance addCustomNetworkRequestHeaders:customHeaderValues];
        });
}

RCT_EXPORT_METHOD(logJSException : (NSString *)errTitle withMessage : (NSString *)message withStack : (NSString *)stackTrace) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSException *myException = [NSException exceptionWithName:errTitle reason:message userInfo:@{@"nonfatal" : @"1"}];
      NSArray *stack = [stackTrace componentsSeparatedByString:@"\n"];
      [Countly.sharedInstance recordHandledException:myException withStackTrace:stack];
    });
}

RCT_REMAP_METHOD(userData_setProperty, params : (NSArray *)arguments userDataSetPropertyWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
            id keyValue = [arguments objectAtIndex:1];

            [self setCustomUserProperty:keyName value:keyValue];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_increment, params : (NSArray *)arguments userDataIncrementWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];

      [Countly.user increment:keyName];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_incrementBy, params : (NSArray *)arguments userDataIncrementByWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];
      int keyValueInteger = [keyValue intValue];

      [Countly.user incrementBy:keyName value:[NSNumber numberWithInt:keyValueInteger]];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_multiply, params : (NSArray *)arguments userDataMultiplyWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];
      int keyValueInteger = [keyValue intValue];

      [Countly.user multiply:keyName value:[NSNumber numberWithInt:keyValueInteger]];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_saveMax, params : (NSArray *)arguments userDataSaveMaxWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];
      int keyValueInteger = [keyValue intValue];

      [Countly.user max:keyName value:[NSNumber numberWithInt:keyValueInteger]];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_saveMin, params : (NSArray *)arguments userDataSaveMinWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];
      int keyValueInteger = [keyValue intValue];

      [Countly.user min:keyName value:[NSNumber numberWithInt:keyValueInteger]];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_setOnce, params : (NSArray *)arguments userDataSetOnce : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];

      [Countly.user setOnce:keyName value:keyValue];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_pushUniqueValue, params : (NSArray *)arguments userDataPushUniqueValueWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];

      [Countly.user pushUnique:keyName value:keyValue];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_pushValue, params : (NSArray *)arguments userDataPushValueWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];

      [Countly.user push:keyName value:keyValue];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_pullValue, params : (NSArray *)arguments userDataPullValueWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];

      [Countly.user pull:keyName value:keyValue];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userDataBulk_setUserProperties, params : (NSDictionary *)userProperties userDataBulkSetUserPropertiesWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self setUserDataIntenral:userProperties];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userDataBulk_save, params : (NSArray *)arguments userDataBulkSaveWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.user save];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userDataBulk_setProperty, params : (NSArray *)arguments userDataBulkSetPropertyWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
            id keyValue = [arguments objectAtIndex:1];

            [self setCustomUserProperty:keyName value:keyValue];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userDataBulk_increment, params : (NSArray *)arguments userDataBulkIncrementWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];

      [Countly.user increment:keyName];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userDataBulk_incrementBy, params : (NSArray *)arguments userDataBulkIncrementByWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];
      int keyValueInteger = [keyValue intValue];

      [Countly.user incrementBy:keyName value:[NSNumber numberWithInt:keyValueInteger]];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userDataBulk_multiply, params : (NSArray *)arguments userDataBulkMultiplyWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];
      int keyValueInteger = [keyValue intValue];

      [Countly.user multiply:keyName value:[NSNumber numberWithInt:keyValueInteger]];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userDataBulk_saveMax, params : (NSArray *)arguments userDataBulkSaveMaxWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];
      int keyValueInteger = [keyValue intValue];

      [Countly.user max:keyName value:[NSNumber numberWithInt:keyValueInteger]];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userDataBulk_saveMin, params : (NSArray *)arguments userDataBulkSaveMinWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];
      int keyValueInteger = [keyValue intValue];

      [Countly.user min:keyName value:[NSNumber numberWithInt:keyValueInteger]];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userDataBulk_setOnce, params : (NSArray *)arguments userDataBulkSetOnceWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];

      [Countly.user setOnce:keyName value:keyValue];
      resolve(@"Success");
    });
}
RCT_REMAP_METHOD(userDataBulk_pushUniqueValue, params : (NSArray *)arguments userDataBulkPushUniqueValueWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];

      [Countly.user pushUnique:keyName value:keyValue];
      resolve(@"Success");
    });
}
RCT_REMAP_METHOD(userDataBulk_pushValue, params : (NSArray *)arguments userDataBulkPushValueWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];

      [Countly.user push:keyName value:keyValue];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userDataBulk_pullValue, params : (NSArray *)arguments userDataBulkPullValueWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];

      [Countly.user pull:keyName value:keyValue];
      resolve(@"Success");
    });
}

RCT_EXPORT_METHOD(recordDirectAttribution : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *campaignType = [arguments objectAtIndex:0];
        NSString *campaignData = [arguments objectAtIndex:1];
        if (CountlyCommon.sharedInstance.hasStarted) {
            [Countly.sharedInstance recordDirectAttributionWithCampaignType:campaignType andCampaignData:campaignData];
        } else {
            config.campaignType = campaignType;
            config.campaignData = campaignData;
        }
    });
}

RCT_EXPORT_METHOD(recordIndirectAttribution : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSDictionary *attributionValues = [arguments objectAtIndex:0];
        if (CountlyCommon.sharedInstance.hasStarted) {
            [Countly.sharedInstance recordIndirectAttribution:attributionValues];
        } else {
            config.indirectAttribution = attributionValues;
        }
    });
}

RCT_EXPORT_METHOD(giveConsent : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance giveConsentForFeatures:arguments];
    });
}

RCT_EXPORT_METHOD(removeConsent : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance cancelConsentForFeatures:arguments];
    });
}

RCT_EXPORT_METHOD(giveAllConsent) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance giveConsentForFeature:CLYConsentLocation];
      [Countly.sharedInstance giveConsentForAllFeatures];
    });
}

RCT_EXPORT_METHOD(removeAllConsent) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance cancelConsentForAllFeatures];
    });
}

RCT_EXPORT_METHOD(remoteConfigUpdate : (NSArray *)arguments callback : (RCTResponseSenderBlock)callback) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance updateRemoteConfigWithCompletionHandler:^(NSError *error) {
        if (!error) {
            NSArray *result = @[ @"Remote Config is updated and ready to use!" ];
            callback(@[ result ]);
        } else {
            NSString *returnString = [NSString stringWithFormat:@"There was an error while updating Remote Config: %@", error];
            NSArray *result = @[ returnString ];
            callback(@[ result ]);
        }
      }];
    });
}

RCT_EXPORT_METHOD(updateRemoteConfigForKeysOnly : (NSArray *)arguments callback : (RCTResponseSenderBlock)callback) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSMutableArray *randomSelection = [[NSMutableArray alloc] init];
      for (int i = 0; i < (int)arguments.count; i++) {
          [randomSelection addObject:[arguments objectAtIndex:i]];
      }
      NSArray *keyNames = [randomSelection copy];
      [Countly.sharedInstance updateRemoteConfigOnlyForKeys:keyNames
                                          completionHandler:^(NSError *error) {
                                            if (!error) {
                                                NSArray *result = @[ @"Remote Config is updated only for given keys and ready to use!" ];
                                                callback(@[ result ]);
                                            } else {
                                                NSString *returnString = [NSString stringWithFormat:@"There was an error while updating Remote Config: %@", error];
                                                NSArray *result = @[ returnString ];
                                                callback(@[ result ]);
                                            }
                                          }];
    });
}

RCT_EXPORT_METHOD(updateRemoteConfigExceptKeys : (NSArray *)arguments callback : (RCTResponseSenderBlock)callback) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSMutableArray *randomSelection = [[NSMutableArray alloc] init];
      for (int i = 0; i < (int)arguments.count; i++) {
          [randomSelection addObject:[arguments objectAtIndex:i]];
      }
      NSArray *keyNames = [randomSelection copy];
      [Countly.sharedInstance updateRemoteConfigExceptForKeys:keyNames
                                            completionHandler:^(NSError *error) {
                                              if (!error) {
                                                  NSArray *result = @[ @"Remote Config is updated except for given keys and ready to use !" ];
                                                  callback(@[ result ]);
                                              } else {
                                                  NSString *returnString = [NSString stringWithFormat:@"There was an error while updating Remote Config: %@", error];
                                                  NSArray *result = @[ returnString ];
                                                  callback(@[ result ]);
                                              }
                                            }];
    });
}

RCT_EXPORT_METHOD(getRemoteConfigValueForKey : (NSArray *)arguments callback : (RCTResponseSenderBlock)callback) {
    dispatch_async(dispatch_get_main_queue(), ^{
      id value = [Countly.sharedInstance remoteConfigValueForKey:[arguments objectAtIndex:0]];
      if (value) {
          callback(@[ value ]);
      } else {
          NSString *value = @"ConfigKeyNotFound";
          callback(@[ value ]);
      }
    });
}

RCT_EXPORT_METHOD(showStarRating : (NSArray *)arguments callback : (RCTResponseSenderBlock)callback) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance askForStarRating:^(NSInteger rating) {
        callback(@[ [@(rating) stringValue] ]);
      }];
    });
}

RCT_EXPORT_METHOD(presentRatingWidgetWithID : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *FEEDBACK_WIDGET_ID = [arguments objectAtIndex:0];
      [Countly.sharedInstance presentRatingWidgetWithID:FEEDBACK_WIDGET_ID
                                      completionHandler:^(NSError *error) {
                                        NSString *errorStr = nil;
                                        if (error) {
                                            errorStr = error.localizedDescription;
                                        }
                                        [self sendEventWithName:ratingWidgetCallbackName body:errorStr];
                                      }];
    });
}

RCT_EXPORT_METHOD(presentNPS : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *nameIDorTag = nil;
      if (arguments.count > 0 && ![[arguments objectAtIndex:0] isKindOfClass:[NSNull class]]) {
          nameIDorTag = [arguments objectAtIndex:0];
      }

      [[Countly.sharedInstance feedback] presentNPS:nameIDorTag
                                      widgetCallback:^(WidgetState widgetState) {
                                        if (widgetState == WIDGET_APPEARED) {
                                            [self sendEventWithName:widgetShownCallbackName body:nil];
                                        } else if (widgetState == WIDGET_CLOSED) {
                                            [self sendEventWithName:widgetClosedCallbackName body:nil];
                                        }
                                      }];
    });
}

RCT_EXPORT_METHOD(presentSurvey : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *nameIDorTag = nil;
      if (arguments.count > 0 && ![[arguments objectAtIndex:0] isKindOfClass:[NSNull class]]) {
          nameIDorTag = [arguments objectAtIndex:0];
      }

      [[Countly.sharedInstance feedback] presentSurvey:nameIDorTag
                                         widgetCallback:^(WidgetState widgetState) {
                                           if (widgetState == WIDGET_APPEARED) {
                                               [self sendEventWithName:widgetShownCallbackName body:nil];
                                           } else if (widgetState == WIDGET_CLOSED) {
                                               [self sendEventWithName:widgetClosedCallbackName body:nil];
                                           }
                                         }];
    });
}

RCT_EXPORT_METHOD(presentRating : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *nameIDorTag = nil;
      if (arguments.count > 0 && ![[arguments objectAtIndex:0] isKindOfClass:[NSNull class]]) {
          nameIDorTag = [arguments objectAtIndex:0];
      }

      [[Countly.sharedInstance feedback] presentRating:nameIDorTag
                                         widgetCallback:^(WidgetState widgetState) {
                                           if (widgetState == WIDGET_APPEARED) {
                                               [self sendEventWithName:widgetShownCallbackName body:nil];
                                           } else if (widgetState == WIDGET_CLOSED) {
                                               [self sendEventWithName:widgetClosedCallbackName body:nil];
                                           }
                                         }];
    });
}

RCT_REMAP_METHOD(getFeedbackWidgets, getFeedbackWidgetsWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [[Countly.sharedInstance feedback] getAvailableFeedbackWidgets:^(NSArray<CountlyFeedbackWidget *> *_Nonnull feedbackWidgets, NSError *_Nonnull error) {
        if (error) {
            NSString *errorStr = error.localizedDescription;
            reject(@"getFeedbackWidgets_failure", errorStr, nil);
        } else {
            feedbackWidgetList = [NSArray arrayWithArray:feedbackWidgets];
            NSMutableArray *feedbackWidgetsArray = [NSMutableArray arrayWithCapacity:feedbackWidgets.count];
            for (CountlyFeedbackWidget *retrievedWidget in feedbackWidgets) {
                NSMutableDictionary *feedbackWidget = [NSMutableDictionary dictionaryWithCapacity:5];
                feedbackWidget[@"id"] = retrievedWidget.ID;
                feedbackWidget[@"type"] = retrievedWidget.type;
                feedbackWidget[@"name"] = retrievedWidget.name;
                feedbackWidget[@"tags"] = retrievedWidget.tags;
                feedbackWidget[@"widgetVersion"] = retrievedWidget.widgetVersion ?: [NSNull null];
                [feedbackWidgetsArray addObject:feedbackWidget];
            }
            resolve(feedbackWidgetsArray);
        }
      }];
    });
}

RCT_REMAP_METHOD(getAvailableFeedbackWidgets, getAvailableFeedbackWidgetsWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
            [[Countly.sharedInstance feedback] getAvailableFeedbackWidgets:^(NSArray<CountlyFeedbackWidget *> *_Nonnull feedbackWidgets, NSError *_Nonnull error) {
                if (error) {
                        NSString *errorStr = error.localizedDescription;
                        reject(@"getAvailableFeedbackWidgets_failure", errorStr, nil);
                        return;
                }

        NSMutableDictionary *feedbackWidgetsDict = [NSMutableDictionary dictionaryWithCapacity:feedbackWidgets.count];
        for (CountlyFeedbackWidget *feedbackWidget in feedbackWidgets) {
            feedbackWidgetsDict[feedbackWidget.type] = feedbackWidget.ID;
        }
        resolve(feedbackWidgetsDict);
      }];
    });
}

- (CountlyFeedbackWidget *)getFeedbackWidget:(NSString *)widgetId {
    if (feedbackWidgetList == nil) {
        return nil;
    }
    for (CountlyFeedbackWidget *feedbackWidget in feedbackWidgetList) {
        if ([feedbackWidget.ID isEqual:widgetId]) {
            return feedbackWidget;
        }
    }
    return nil;
}

RCT_REMAP_METHOD(getFeedbackWidgetData, params : (NSArray *)arguments getFeedbackWidgetDataWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *widgetId = [arguments objectAtIndex:0];
        CountlyFeedbackWidget *feedbackWidget = [self getFeedbackWidget:widgetId];
        if (feedbackWidget == nil) {
            NSString *errorMessage = [NSString stringWithFormat:@"No feedbackWidget is found against widget Id : '%@', always call 'getAvailableFeedbackWidgets' to get an updated list of feedback widgets.", widgetId];
            CountlyRNInternalLog(errorMessage);
            reject(@"getFeedbackWidgetData_failure", errorMessage, nil);
        } else {
            [feedbackWidget getWidgetData:^(NSDictionary *_Nullable widgetData, NSError *_Nullable error) {
                if (error) {
                    NSString *theError = [@"getFeedbackWidgetData failed: " stringByAppendingString:error.localizedDescription];
                    reject(@"getFeedbackWidgetData_failure", theError, nil);
                } else {
                    resolve(widgetData);
                }
            }];
        }
    });
}

RCT_REMAP_METHOD(reportFeedbackWidgetManually, params : (NSArray *)arguments reportFeedbackWidgetManuallyWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSArray *widgetInfo = [arguments objectAtIndex:0];
        NSDictionary *widgetResult = [arguments objectAtIndex:2];
        NSString *widgetId = [widgetInfo objectAtIndex:0];

        CountlyFeedbackWidget *feedbackWidget = [self getFeedbackWidget:widgetId];
        if (feedbackWidget == nil) {
            NSString *errorMessage = [NSString stringWithFormat:@"No feedbackWidget is found against widget Id : '%@', always call 'getAvailableFeedbackWidgets' to get an updated list of feedback widgets.", widgetId];
            CountlyRNInternalLog(errorMessage);
            reject(@"reportFeedbackWidgetManually_failure", errorMessage, nil);
        } else {
            [feedbackWidget recordResult:widgetResult];
            resolve(@"reportFeedbackWidgetManually success");
        }
    });
}

RCT_EXPORT_METHOD(presentFeedbackWidget : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *widgetId = [arguments objectAtIndex:0];
      NSString *widgetType = [arguments objectAtIndex:1];
      NSString *widgetName = [arguments objectAtIndex:2];
      NSString *widgetVersion = nil;
      if (arguments.count > 4 && ![[arguments objectAtIndex:4] isKindOfClass:[NSNull class]]) {
          widgetVersion = [arguments objectAtIndex:4];
      }

      CountlyFeedbackWidget *feedback = [self getFeedbackWidget:widgetId];
      if (feedback == nil || (widgetVersion.length > 0 && feedback.widgetVersion.length == 0)) {
          NSMutableDictionary *feedbackWidget = [NSMutableDictionary dictionaryWithCapacity:4];
          feedbackWidget[@"_id"] = widgetId;
          feedbackWidget[@"type"] = widgetType;
          feedbackWidget[@"name"] = widgetName;
          if (widgetVersion.length > 0) {
              feedbackWidget[@"wv"] = widgetVersion;
          }
          feedback = [CountlyFeedbackWidget createWithDictionary:feedbackWidget];
      }

      if (feedback == nil) {
          return;
      }

      [feedback
          presentWithAppearBlock:^{
            [self sendEventWithName:widgetShownCallbackName body:nil];
          }
          andDismissBlock:^{
            [self sendEventWithName:widgetClosedCallbackName body:nil];
          }];
    });
}

RCT_EXPORT_METHOD(replaceAllAppKeysInQueueWithCurrentAppKey) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance replaceAllAppKeysInQueueWithCurrentAppKey];
    });
}

RCT_EXPORT_METHOD(removeDifferentAppKeysFromQueue) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance removeDifferentAppKeysFromQueue];
    });
}

RCT_EXPORT_METHOD(setEventSendThreshold : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *size = [arguments objectAtIndex:0];
      int sizeInt = [size intValue];
      if (config == nil) {
          config = CountlyConfig.new;
      }
      config.eventSendThreshold = sizeInt;
    });
}

RCT_REMAP_METHOD(isLoggingEnabled, isLoggingEnabledWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      id result = [NSNumber numberWithBool:config.enableDebug];
      resolve(result);
    });
}

RCT_REMAP_METHOD(isInitialized, isInitializedWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      id result = [NSNumber numberWithBool:CountlyCommon.sharedInstance.hasStarted];
      resolve(result);
    });
}

RCT_EXPORT_METHOD(remoteConfigClearValues : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance.remoteConfig clearAll];
      resolve(@"Remote Config Cleared.");
    });
}

RCT_EXPORT_METHOD(startTrace : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *traceKey = [arguments objectAtIndex:0];
      [Countly.sharedInstance startCustomTrace:traceKey];
    });
}
RCT_EXPORT_METHOD(cancelTrace : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *traceKey = [arguments objectAtIndex:0];
      [Countly.sharedInstance cancelCustomTrace:traceKey];
    });
}
RCT_EXPORT_METHOD(clearAllTraces : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance clearAllCustomTraces];
    });
}
RCT_EXPORT_METHOD(endTrace : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *traceKey = [arguments objectAtIndex:0];
      NSMutableDictionary *metrics = [[NSMutableDictionary alloc] init];
      for (int i = 1, il = (int)arguments.count; i < il; i += 2) {
          metrics[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i + 1];
      }
      [Countly.sharedInstance endCustomTrace:traceKey metrics:metrics];
    });
}
RCT_EXPORT_METHOD(recordNetworkTrace : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *networkTraceKey = [arguments objectAtIndex:0];
      int responseCode = [[arguments objectAtIndex:1] intValue];
      int requestPayloadSize = [[arguments objectAtIndex:2] intValue];
      int responsePayloadSize = [[arguments objectAtIndex:3] intValue];
      long long startTime = [[arguments objectAtIndex:4] longLongValue];
      long long endTime = [[arguments objectAtIndex:5] longLongValue];
      [Countly.sharedInstance recordNetworkTrace:networkTraceKey requestPayloadSize:requestPayloadSize responsePayloadSize:responsePayloadSize responseStatusCode:responseCode startTime:startTime endTime:endTime];
    });
}

RCT_EXPORT_METHOD(appLoadingFinished) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance appLoadingFinished];
    });
}

RCT_REMAP_METHOD(enableRequestCapture, enableRequestCaptureWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
        dispatch_async(dispatch_get_main_queue(), ^{
            countlyRNRequestCaptureEnabled = YES;
            CountlyRNResetCapturedRequests();
            resolve(nil);
        });
}

RCT_REMAP_METHOD(getCapturedRequests, getCapturedRequestsWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
        dispatch_async(dispatch_get_main_queue(), ^{
            CountlyRNEnsureCapturedRequests();
            resolve([countlyRNCapturedRequests copy]);
        });
}

RCT_REMAP_METHOD(getRequestQueue, getRequestQueueWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSArray *queuedRequests = [[CountlyPersistency.sharedInstance queuedRequests] copy] ?: @[];
            resolve(queuedRequests);
        });
}

RCT_REMAP_METHOD(getEventQueue, getEventQueueWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSArray *recordedEvents = [[CountlyPersistency.sharedInstance recordedEvents] copy] ?: @[];
            NSMutableArray *recordedEventsJSON = NSMutableArray.new;

            for (id event in recordedEvents) {
                if (![event isKindOfClass:[CountlyEvent class]]) {
                    COUNTLY_RN_LOG(@"Skipping unexpected recorded event object of class %@", NSStringFromClass([event class]));
                    continue;
                }

                NSDictionary *eventDictionary = [(CountlyEvent *)event dictionaryRepresentation];
                NSString *eventJson = [self toJSONString:eventDictionary];
                if (eventJson) {
                    [recordedEventsJSON addObject:eventJson];
                }
            }

            resolve(recordedEventsJSON);
        });
}

RCT_REMAP_METHOD(halt, haltWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [Countly.sharedInstance halt:YES];
            config = nil;
            countlyFeatures = nil;
            feedbackWidgetList = nil;
            enablePushNotifications = true;
            countlyRNRequestCaptureEnabled = NO;
            CountlyRNResetCapturedRequests();
            countlyRNForwardSessionConfiguration = nil;
            countlyRNCapturedHost = nil;
            resolve(nil);
        });
}

RCT_EXPORT_METHOD(setCustomMetrics : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSMutableDictionary *metrics = [[NSMutableDictionary alloc] init];
      for (int i = 0, il = (int)arguments.count; i < il; i += 2) {
          if (i + 1 < il) {
              metrics[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i + 1];
          }
      }
      config.customMetrics = metrics;
    });
}

RCT_EXPORT_METHOD(enterContentZone) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance.content enterContentZone];
    });
}

RCT_EXPORT_METHOD(refreshContentZone) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance.content refreshContentZone];
    });
}

RCT_EXPORT_METHOD(previewContent : (NSArray *)arguments) {
        dispatch_async(dispatch_get_main_queue(), ^{
            NSString *contentId = [arguments objectAtIndex:0];
            [Countly.sharedInstance.content previewContent:contentId];
        });
}

RCT_EXPORT_METHOD(exitContentZone) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance.content exitContentZone];
    });
}

- (void)addCountlyFeature:(CLYFeature)feature {
    if (countlyFeatures == nil) {
        countlyFeatures = [[NSMutableArray alloc] init];
    }
    if (![countlyFeatures containsObject:feature]) {
        [countlyFeatures addObject:feature];
        config.features = countlyFeatures;
    }
}

- (void)removeCountlyFeature:(CLYFeature)feature {
    if (countlyFeatures == nil) {
        return;
    }
    if (![countlyFeatures containsObject:feature]) {
        [countlyFeatures removeObject:feature];
        config.features = countlyFeatures;
    }
}

void CountlyRNInternalLog(NSString *format, ...) {
    if (!config.enableDebug)
        return;

    va_list args;
    va_start(args, format);

    NSString *logString = [NSString.alloc initWithFormat:format arguments:args];
    NSLog(@"[CountlyReactNativePlugin] %@", logString);

    va_end(args);
}

- (NSDictionary *)removePredefinedUserProperties:(NSDictionary *__nullable)userData {
    NSMutableDictionary *userProperties = [userData mutableCopy];
    NSArray *nameFields = [[NSArray alloc] initWithObjects:NAME_KEY, USERNAME_KEY, EMAIL_KEY, ORG_KEY, PHONE_KEY, PICTURE_KEY, PICTURE_PATH_KEY, GENDER_KEY, BYEAR_KEY, nil];

    for (NSString *nameField in nameFields) {
        [userProperties removeObjectForKey:nameField];
    }
    return userProperties;
}

- (BOOL)isBooleanNumber:(NSNumber *)numberValue {
    return CFGetTypeID((__bridge CFTypeRef)numberValue) == CFBooleanGetTypeID();
}

- (NSMutableDictionary *)currentCustomUserProperties {
    if ([Countly.user.custom isKindOfClass:[NSDictionary class]]) {
        return [(NSDictionary *)Countly.user.custom mutableCopy];
    }

    return [NSMutableDictionary dictionary];
}

- (void)setCustomUserPropertyDictionaryValue:(id)value forKey:(NSString *)keyName {
    if (keyName == nil || keyName.length == 0) {
        return;
    }

    if (value == nil || [value isKindOfClass:[NSNull class]]) {
        [Countly.user unSet:keyName];
        return;
    }

    NSMutableDictionary *customUserProperties = [self currentCustomUserProperties];
    customUserProperties[keyName] = value;
    Countly.user.custom = [customUserProperties copy];
}

- (void)setCustomUserProperty:(NSString *)keyName value:(id)value {
    if ([value isKindOfClass:[NSString class]]) {
        [Countly.user set:keyName value:(NSString *)value];
        return;
    }

    if ([value isKindOfClass:[NSNumber class]]) {
        NSNumber *numberValue = (NSNumber *)value;
        if ([self isBooleanNumber:numberValue]) {
            [Countly.user set:keyName boolValue:numberValue.boolValue];
        } else {
            [Countly.user set:keyName numberValue:numberValue];
        }
        return;
    }

    [self setCustomUserPropertyDictionaryValue:value forKey:keyName];
}

- (NSDictionary *)customUserPropertiesFromUserData:(NSDictionary *__nullable)userData {
    if (userData == nil) {
        return nil;
    }

    NSMutableDictionary *customUserProperties = [[self removePredefinedUserProperties:userData] mutableCopy];
    id explicitCustomProperties = customUserProperties[CUSTOM_KEY];
    [customUserProperties removeObjectForKey:CUSTOM_KEY];

    if ([explicitCustomProperties isKindOfClass:[NSDictionary class]]) {
        [customUserProperties addEntriesFromDictionary:(NSDictionary *)explicitCustomProperties];
    }

    if (customUserProperties.count == 0) {
        return nil;
    }

    return [customUserProperties copy];
}

- (void)setUserDataIntenral:(NSDictionary *__nullable)userData {
    id name = userData[NAME_KEY];
    id username = userData[USERNAME_KEY];
    id email = userData[EMAIL_KEY];
    id organization = userData[ORG_KEY];
    id phone = userData[PHONE_KEY];
    id picture = userData[PICTURE_KEY];
    id picturePath = userData[PICTURE_PATH_KEY];
    id gender = userData[GENDER_KEY];
    id byear = userData[BYEAR_KEY];

    if (name) {
        Countly.user.name = name;
    }
    if (username) {
        Countly.user.username = username;
    }
    if (email) {
        Countly.user.email = email;
    }
    if (organization) {
        Countly.user.organization = organization;
    }
    if (phone) {
        Countly.user.phone = phone;
    }
    if (picture) {
        Countly.user.pictureURL = picture;
    }
    if (picturePath) {
        Countly.user.pictureLocalPath = picturePath;
    }
    if (gender) {
        Countly.user.gender = gender;
    }
    if (byear) {
        if ([byear isKindOfClass:[NSNull class]]) {
            Countly.user.birthYear = byear;
        } else {
            Countly.user.birthYear = @([byear integerValue]);
        }
    }

    NSDictionary *customUserProperties = [self customUserPropertiesFromUserData:userData];
    if (customUserProperties != nil) {
        Countly.user.custom = customUserProperties;
    }
}

@end
