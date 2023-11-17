#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

#import "Countly.h"
#import "CountlyCommon.h"
#import "CountlyConfig.h"
#import "CountlyConnectionManager.h"
#import "CountlyReactNative.h"
#import "CountlyRemoteConfig.h"

#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
#import "CountlyRNPushNotifications.h"
#endif

#if DEBUG
#define COUNTLY_RN_LOG(fmt, ...) CountlyRNInternalLog(fmt, ##__VA_ARGS__)
#else
#define COUNTLY_RN_LOG(...)
#endif

@interface CountlyFeedbackWidget ()
+ (CountlyFeedbackWidget *)createWithDictionary:(NSDictionary *)dictionary;
@end

NSString *const kCountlyReactNativeSDKVersion = @"23.10.0";
NSString *const kCountlyReactNativeSDKName = @"js-rnb-ios";

CLYPushTestMode const CLYPushTestModeProduction = @"CLYPushTestModeProduction";

CountlyConfig *config = nil; // alloc here
NSMutableArray<CLYFeature> *countlyFeatures = nil;
NSArray<CountlyFeedbackWidget *> *feedbackWidgetList = nil;
BOOL enablePushNotifications = true;

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
    return @[ pushNotificationCallbackName, ratingWidgetCallbackName, widgetShownCallbackName, widgetClosedCallbackName ];
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

    if (json[@"enableApm"]) {
        config.enablePerformanceMonitoring = YES;
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
}

RCT_EXPORT_METHOD(event : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *eventType = [arguments objectAtIndex:0];
      if (eventType != nil && [eventType length] > 0) {
          if ([eventType isEqual:@"event"]) {
              NSString *eventName = [arguments objectAtIndex:1];
              NSString *countString = [arguments objectAtIndex:2];
              int countInt = [countString intValue];
              [[Countly sharedInstance] recordEvent:eventName count:countInt];

          } else if ([eventType isEqual:@"eventWithSum"]) {
              NSString *eventName = [arguments objectAtIndex:1];
              NSString *countString = [arguments objectAtIndex:2];
              int countInt = [countString intValue];
              NSString *sumString = [arguments objectAtIndex:3];
              float sumFloat = [sumString floatValue];
              [[Countly sharedInstance] recordEvent:eventName count:countInt sum:sumFloat];
          } else if ([eventType isEqual:@"eventWithSegment"]) {
              NSString *eventName = [arguments objectAtIndex:1];
              NSString *countString = [arguments objectAtIndex:2];
              int countInt = [countString intValue];
              NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];

              for (int i = 3, il = (int)arguments.count; i < il; i += 2) {
                  dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i + 1];
              }
              [[Countly sharedInstance] recordEvent:eventName segmentation:dict count:countInt];
          } else if ([eventType isEqual:@"eventWithSumSegment"]) {
              NSString *eventName = [arguments objectAtIndex:1];
              NSString *countString = [arguments objectAtIndex:2];
              int countInt = [countString intValue];
              NSString *sumString = [arguments objectAtIndex:3];
              float sumFloat = [sumString floatValue];
              NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];

              for (int i = 4, il = (int)arguments.count; i < il; i += 2) {
                  dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i + 1];
              }
              [[Countly sharedInstance] recordEvent:eventName segmentation:dict count:countInt sum:sumFloat];
          }
      }
    });
}
RCT_EXPORT_METHOD(recordView : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *recordView = [arguments objectAtIndex:0];
      NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
      for (int i = 1, il = (int)arguments.count; i < il; i += 2) {
          dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i + 1];
      }
      [Countly.sharedInstance recordView:recordView segmentation:dict];
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
      [Countly.user save];
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
RCT_EXPORT_METHOD(pushTokenType : (NSArray *)arguments) {
#ifndef COUNTLY_EXCLUDE_PUSHNOTIFICATIONS
    dispatch_async(dispatch_get_main_queue(), ^{
      if (config == nil) {
          config = CountlyConfig.new;
      }
      config.sendPushTokenAlways = YES;
      config.pushTestMode = CLYPushTestModeProduction;
      NSString *tokenType = [arguments objectAtIndex:0];
      if ([tokenType isEqualToString:@"1"]) {
          config.pushTestMode = CLYPushTestModeDevelopment;
      } else if ([tokenType isEqualToString:@"2"]) {
          config.pushTestMode = CLYPushTestModeTestFlightOrAdHoc;
      }

      CountlyPushNotifications.sharedInstance.pushTestMode = config.pushTestMode;
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
        NSString *deviceIDTypeString = NULL;
        if ([deviceIDType isEqualToString:CLYDeviceIDTypeCustom]) {
            deviceIDTypeString = @"DS";
        } else if ([deviceIDType isEqualToString:CLYDeviceIDTypeIDFV]) {
            deviceIDTypeString = @"SG";
        } else if ([deviceIDType isEqualToString:CLYDeviceIDTypeTemporary]) {
            deviceIDTypeString = @"TID";
        } else {
            deviceIDTypeString = @"";
        }
        resolve(deviceIDTypeString);
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

RCT_EXPORT_METHOD(enableParameterTamperingProtection : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *salt = [arguments objectAtIndex:0];
      if (config == nil) {
          config = CountlyConfig.new;
      }
      config.secretSalt = salt;
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

RCT_EXPORT_METHOD(endEvent : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *eventType = [arguments objectAtIndex:0];

      if ([eventType isEqual:@"event"]) {
          NSString *eventName = [arguments objectAtIndex:1];
          [Countly.sharedInstance endEvent:eventName];
      } else if ([eventType isEqual:@"eventWithSum"]) {
          NSString *eventName = [arguments objectAtIndex:1];

          NSString *countString = [arguments objectAtIndex:2];
          int countInt = [countString intValue];

          NSString *sumString = [arguments objectAtIndex:3];
          float sumInt = [sumString floatValue];

          NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
          [Countly.sharedInstance endEvent:eventName segmentation:dict count:countInt sum:sumInt];
      } else if ([eventType isEqual:@"eventWithSegment"]) {
          NSString *eventName = [arguments objectAtIndex:1];

          NSString *countString = [arguments objectAtIndex:2];
          int countInt = [countString intValue];

          NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
          for (int i = 4, il = (int)arguments.count; i < il; i += 2) {
              dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i + 1];
          }

          [Countly.sharedInstance endEvent:eventName segmentation:dict count:countInt sum:0];
      } else if ([eventType isEqual:@"eventWithSumSegment"]) {
          NSString *eventName = [arguments objectAtIndex:1];

          NSString *countString = [arguments objectAtIndex:2];
          int countInt = [countString intValue];

          NSString *sumString = [arguments objectAtIndex:3];
          float sumInt = [sumString floatValue];

          NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
          for (int i = 4, il = (int)arguments.count; i < il; i += 2) {
              dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i + 1];
          }

          [Countly.sharedInstance endEvent:eventName segmentation:dict count:countInt sum:sumInt];
      } else {
      }
    });
}

RCT_EXPORT_METHOD(setLocationInit : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (config == nil) {
          config = CountlyConfig.new;
      }
      NSString *countryCode = [arguments objectAtIndex:0];
      NSString *city = [arguments objectAtIndex:1];
      NSString *locationString = [arguments objectAtIndex:2];
      NSString *ipAddress = [arguments objectAtIndex:3];

      if (locationString != nil && ![locationString isEqualToString:@"null"] && [locationString containsString:@","]) {
          @try {
              NSArray *locationArray = [locationString componentsSeparatedByString:@","];
              NSString *latitudeString = [locationArray objectAtIndex:0];
              NSString *longitudeString = [locationArray objectAtIndex:1];

              double latitudeDouble = [latitudeString doubleValue];
              double longitudeDouble = [longitudeString doubleValue];
              config.location = (CLLocationCoordinate2D){latitudeDouble, longitudeDouble};
          } @catch (NSException *exception) {
              COUNTLY_RN_LOG(@"Invalid location: %@", locationString);
          }
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

RCT_EXPORT_METHOD(enableCrashReporting) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (config == nil) {
          config = CountlyConfig.new;
      }
      [self addCountlyFeature:CLYCrashReporting];
    });
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
      NSString *keyValue = [arguments objectAtIndex:1];

      [Countly.user set:keyName value:keyValue];
      [Countly.user save];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_increment, params : (NSArray *)arguments userDataIncrementWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];

      [Countly.user increment:keyName];
      [Countly.user save];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_incrementBy, params : (NSArray *)arguments userDataIncrementByWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];
      int keyValueInteger = [keyValue intValue];

      [Countly.user incrementBy:keyName value:[NSNumber numberWithInt:keyValueInteger]];
      [Countly.user save];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_multiply, params : (NSArray *)arguments userDataMultiplyWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];
      int keyValueInteger = [keyValue intValue];

      [Countly.user multiply:keyName value:[NSNumber numberWithInt:keyValueInteger]];
      [Countly.user save];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_saveMax, params : (NSArray *)arguments userDataSaveMaxWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];
      int keyValueInteger = [keyValue intValue];

      [Countly.user max:keyName value:[NSNumber numberWithInt:keyValueInteger]];
      [Countly.user save];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_saveMin, params : (NSArray *)arguments userDataSaveMinWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];
      int keyValueInteger = [keyValue intValue];

      [Countly.user min:keyName value:[NSNumber numberWithInt:keyValueInteger]];
      [Countly.user save];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_setOnce, params : (NSArray *)arguments userDataSetOnce : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];

      [Countly.user setOnce:keyName value:keyValue];
      [Countly.user save];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_pushUniqueValue, params : (NSArray *)arguments userDataPushUniqueValueWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];

      [Countly.user pushUnique:keyName value:keyValue];
      [Countly.user save];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_pushValue, params : (NSArray *)arguments userDataPushValueWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];

      [Countly.user push:keyName value:keyValue];
      [Countly.user save];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userData_pullValue, params : (NSArray *)arguments userDataPullValueWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *keyName = [arguments objectAtIndex:0];
      NSString *keyValue = [arguments objectAtIndex:1];

      [Countly.user pull:keyName value:keyValue];
      [Countly.user save];
      resolve(@"Success");
    });
}

RCT_REMAP_METHOD(userDataBulk_setUserProperties, params : (NSDictionary *)userProperties userDataBulkSetUserPropertiesWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self setUserDataIntenral:userProperties];
      NSDictionary *customeProperties = [self removePredefinedUserProperties:userProperties];
      Countly.user.custom = customeProperties;
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
      NSString *keyValue = [arguments objectAtIndex:1];

      [Countly.user set:keyName value:keyValue];
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

RCT_EXPORT_METHOD(setRequiresConsent : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (config == nil) {
          config = CountlyConfig.new;
      }
      BOOL consentFlag = [[arguments objectAtIndex:0] boolValue];
      config.requiresConsent = consentFlag;
    });
}

RCT_EXPORT_METHOD(giveConsentInit : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (config == nil) {
          config = CountlyConfig.new;
      }
      config.consents = arguments;
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

RCT_EXPORT_METHOD(setStarRatingDialogTexts : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *starRatingTextMessage = [arguments objectAtIndex:1];
      config.starRatingMessage = starRatingTextMessage;
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

RCT_REMAP_METHOD(getFeedbackWidgets, getFeedbackWidgetsWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance getFeedbackWidgets:^(NSArray<CountlyFeedbackWidget *> *_Nonnull feedbackWidgets, NSError *_Nonnull error) {
        if (error) {
            NSString *errorStr = error.localizedDescription;
            reject(@"getFeedbackWidgets_failure", errorStr, nil);
        } else {
            feedbackWidgetList = [NSArray arrayWithArray:feedbackWidgets];
            NSMutableArray *feedbackWidgetsArray = [NSMutableArray arrayWithCapacity:feedbackWidgets.count];
            for (CountlyFeedbackWidget *retrievedWidget in feedbackWidgets) {
                NSMutableDictionary *feedbackWidget = [NSMutableDictionary dictionaryWithCapacity:3];
                feedbackWidget[@"id"] = retrievedWidget.ID;
                feedbackWidget[@"type"] = retrievedWidget.type;
                feedbackWidget[@"name"] = retrievedWidget.name;
                feedbackWidget[@"tags"] = retrievedWidget.tags;
                [feedbackWidgetsArray addObject:feedbackWidget];
            }
            resolve(feedbackWidgetsArray);
        }
      }];
    });
}

RCT_REMAP_METHOD(getAvailableFeedbackWidgets, getAvailableFeedbackWidgetsWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance getFeedbackWidgets:^(NSArray<CountlyFeedbackWidget *> *_Nonnull feedbackWidgets, NSError *_Nonnull error) {
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
            NSString *errorMessage = [NSString stringWithFormat:@"No feedbackWidget is found against widget Id : '%@', always call 'getFeedbackWidgets' to get updated list of feedback widgets.", widgetId];
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
            NSString *errorMessage = [NSString stringWithFormat:@"No feedbackWidget is found against widget Id : '%@', always call 'getFeedbackWidgets' to get updated list of feedback widgets.", widgetId];
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
      NSMutableDictionary *feedbackWidgetsDict = [NSMutableDictionary dictionaryWithCapacity:3];

      feedbackWidgetsDict[@"_id"] = widgetId;
      feedbackWidgetsDict[@"type"] = widgetType;
      feedbackWidgetsDict[@"name"] = widgetName;
      CountlyFeedbackWidget *feedback = [CountlyFeedbackWidget createWithDictionary:feedbackWidgetsDict];
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

RCT_REMAP_METHOD(hasBeenCalledOnStart, hasBeenCalledOnStartWithResolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
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
RCT_EXPORT_METHOD(enableApm : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      config.enablePerformanceMonitoring = YES;
    });
}

RCT_EXPORT_METHOD(recordAttributionID : (NSArray *)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^{
      NSString *attributionID = [arguments objectAtIndex:0];
      if (CountlyCommon.sharedInstance.hasStarted) {
          [Countly.sharedInstance recordAttributionID:attributionID];
      } else {
          if (config == nil) {
              config = CountlyConfig.new;
          }
          config.attributionID = attributionID;
      }
    });
}

RCT_EXPORT_METHOD(appLoadingFinished) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [Countly.sharedInstance appLoadingFinished];
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

- (void)setUserDataIntenral:(NSDictionary *__nullable)userData {
    NSString *name = userData[NAME_KEY];
    NSString *username = userData[USERNAME_KEY];
    NSString *email = userData[EMAIL_KEY];
    NSString *organization = userData[ORG_KEY];
    NSString *phone = userData[PHONE_KEY];
    NSString *picture = userData[PICTURE_KEY];
    NSString *gender = userData[GENDER_KEY];
    NSString *byear = userData[BYEAR_KEY];

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
    if (gender) {
        Countly.user.gender = gender;
    }
    if (byear) {
        Countly.user.birthYear = @([byear integerValue]);
    }
}

@end
