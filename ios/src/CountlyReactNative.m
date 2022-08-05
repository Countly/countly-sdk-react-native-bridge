#import <React/RCTBridge.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <React/RCTEventDispatcher.h>

#import "Countly.h"
#import "CountlyReactNative.h"
#import "CountlyConfig.h"
#import "CountlyPushNotifications.h"
#import "CountlyConnectionManager.h"
#import "CountlyRemoteConfig.h"
#import "CountlyCommon.h"

#if DEBUG
#define COUNTLY_RN_LOG(fmt, ...) CountlyRNInternalLog(fmt, ##__VA_ARGS__)
#else
#define COUNTLY_RN_LOG(...)
#endif

@interface CountlyFeedbackWidget ()
+ (CountlyFeedbackWidget *)createWithDictionary:(NSDictionary *)dictionary;
@end

NSString* const kCountlyReactNativeSDKVersion = @"22.02.0";
NSString* const kCountlyReactNativeSDKName = @"js-rnb-ios";

CountlyConfig* config = nil;
NSDictionary *lastStoredNotification = nil;
Result notificationListener = nil;
NSMutableArray *notificationIDs = nil;        // alloc here
NSMutableArray<CLYFeature>* countlyFeatures = nil;
BOOL enablePushNotifications = true;

typedef NSString* CLYUserDefaultKey NS_EXTENSIBLE_STRING_ENUM;
CLYUserDefaultKey const CLYPushDictionaryKey  = @"notificationDictionaryKey";
CLYUserDefaultKey const CLYPushButtonIndexKey = @"notificationBtnIndexKey";

@implementation CountlyReactNative
NSString* const kCountlyNotificationPersistencyKey = @"kCountlyNotificationPersistencyKey";

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onCountlyPushNotification", @"ratingWidgetCallback"];
}

RCT_EXPORT_MODULE();

RCT_REMAP_METHOD(init,
                 params: (NSArray*)arguments
                 initWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
    NSString* serverurl = [arguments objectAtIndex:0];
    NSString* appkey = [arguments objectAtIndex:1];
    NSString* deviceID = [arguments objectAtIndex:2];

    if (config == nil){
      config = CountlyConfig.new;
    }
    
    if(deviceID != nil && deviceID != (NSString *)[NSNull null] && ![deviceID  isEqual: @""]){
      config.deviceID = deviceID;
    }
    config.appKey = appkey;
    config.host = serverurl;

    CountlyCommon.sharedInstance.SDKName = kCountlyReactNativeSDKName;
    CountlyCommon.sharedInstance.SDKVersion = kCountlyReactNativeSDKVersion;
    if(enablePushNotifications) {
      [self addCountlyFeature:CLYPushNotifications];
    }

    if (serverurl != nil && [serverurl length] > 0) {
        dispatch_async(dispatch_get_main_queue(), ^
        {
            [[Countly sharedInstance] startWithConfig:config];
            [self recordPushAction];
            resolve(@"Success");
            
        });
    }
  });
}

RCT_EXPORT_METHOD(event:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* eventType = [arguments objectAtIndex:0];
  if (eventType != nil && [eventType length] > 0) {
    if ([eventType  isEqual: @"event"]) {
      NSString* eventName = [arguments objectAtIndex:1];
      NSString* countString = [arguments objectAtIndex:2];
      int countInt = [countString intValue];
      [[Countly sharedInstance] recordEvent:eventName count:countInt];

    }
    else if ([eventType  isEqual: @"eventWithSum"]){
      NSString* eventName = [arguments objectAtIndex:1];
      NSString* countString = [arguments objectAtIndex:2];
      int countInt = [countString intValue];
      NSString* sumString = [arguments objectAtIndex:3];
      float sumFloat = [sumString floatValue];
      [[Countly sharedInstance] recordEvent:eventName count:countInt  sum:sumFloat];
    }
    else if ([eventType  isEqual: @"eventWithSegment"]){
      NSString* eventName = [arguments objectAtIndex:1];
      NSString* countString = [arguments objectAtIndex:2];
      int countInt = [countString intValue];
      NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];

      for(int i=3,il=(int)arguments.count;i<il;i+=2){
        dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i+1];
      }
      [[Countly sharedInstance] recordEvent:eventName segmentation:dict count:countInt];
    }
    else if ([eventType  isEqual: @"eventWithSumSegment"]){
      NSString* eventName = [arguments objectAtIndex:1];
      NSString* countString = [arguments objectAtIndex:2];
      int countInt = [countString intValue];
      NSString* sumString = [arguments objectAtIndex:3];
      float sumFloat = [sumString floatValue];
      NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];

      for(int i=4,il=(int)arguments.count;i<il;i+=2){
        dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i+1];
      }
      [[Countly sharedInstance] recordEvent:eventName segmentation:dict count:countInt  sum:sumFloat];
    }
  }
  });
}
RCT_EXPORT_METHOD(recordView:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* recordView = [arguments objectAtIndex:0];
  NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
  for(int i=1,il=(int)arguments.count;i<il;i+=2){
    dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i+1];
  }
  [Countly.sharedInstance recordView:recordView segmentation: dict];
  });
}

RCT_EXPORT_METHOD(setLoggingEnabled:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  BOOL boolean = [[arguments objectAtIndex:0] boolValue];
  if (config == nil){
    config = CountlyConfig.new;
  }
  if(boolean){
    config.enableDebug = YES;
  }else{
    config.enableDebug = NO;
  }
  });
}

RCT_EXPORT_METHOD(setUserData:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
      
  NSDictionary* userData = [arguments objectAtIndex:0];
  NSString* name = [userData objectForKey:@"name"];
  NSString* username = [userData objectForKey:@"username"];
  NSString* email = [userData objectForKey:@"email"];
  NSString* organization = [userData objectForKey:@"organization"];
  NSString* phone = [userData objectForKey:@"phone"];
  NSString* picture = [userData objectForKey:@"picture"];
  NSString* pictureLocalPath = [userData objectForKey:@"pictureLocalPath"];
  NSString* gender = [userData objectForKey:@"gender"];
  NSString* byear = [userData objectForKey:@"byear"];
      
  if(name) {
      Countly.user.name = name;
  }
  if(username) {
      Countly.user.username = username;
  }
  if(email) {
      Countly.user.email = email;
  }
  if(organization) {
      Countly.user.organization = organization;
  }
  if(phone) {
      Countly.user.phone = phone;
  }
  if(picture) {
      Countly.user.pictureURL = picture;
  }
  if(pictureLocalPath) {
      Countly.user.pictureLocalPath = pictureLocalPath;
  }
  if(gender) {
      Countly.user.gender = gender;
  }
  if(byear) {
      Countly.user.birthYear = @([byear integerValue]);
  }
  [Countly.user save];
  });
}

RCT_EXPORT_METHOD(disablePushNotifications)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
    enablePushNotifications = false;
  });
}

RCT_EXPORT_METHOD(sendPushToken:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {

    NSString* token = [arguments objectAtIndex:0];
    NSString* messagingMode = @"1";
    if(config.pushTestMode == nil || [config.pushTestMode  isEqual: @""] || [config.pushTestMode isEqualToString:CLYPushTestModeTestFlightOrAdHoc]) {
        messagingMode = @"0";
    }
    NSString *urlString = [ @"" stringByAppendingFormat:@"%@?device_id=%@&app_key=%@&token_session=1&test_mode=%@&ios_token=%@", config.host, [Countly.sharedInstance deviceID], config.appKey, messagingMode, token];
    NSMutableURLRequest *request = [[NSMutableURLRequest alloc] init];
    [request setHTTPMethod:@"GET"];
    [request setURL:[NSURL URLWithString:urlString]];
  });
}
RCT_EXPORT_METHOD(pushTokenType:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  if (config == nil){
    config = CountlyConfig.new;
  }
  config.sendPushTokenAlways = YES;
  NSString* tokenType = [arguments objectAtIndex:0];
  if([tokenType isEqualToString: @"1"]){
      config.pushTestMode = CLYPushTestModeDevelopment;
  }
  else if([tokenType isEqualToString: @"2"] || [tokenType isEqualToString: @"0"]){
      config.pushTestMode = CLYPushTestModeTestFlightOrAdHoc;
  }else{
  }
  });
}

RCT_EXPORT_METHOD(askForNotificationPermission:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  [Countly.sharedInstance askForNotificationPermission];
  });
}
- (void) saveListener:(Result) result{
    notificationListener = result;
}
RCT_EXPORT_METHOD(registerForNotification:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
    [self saveListener: ^(id  _Nullable result) {
         [self sendEventWithName:@"onCountlyPushNotification" body: [CountlyReactNative toJSON:lastStoredNotification]];
         lastStoredNotification = nil;
    }];
    if(lastStoredNotification != nil){
        [self sendEventWithName:@"onCountlyPushNotification" body: [CountlyReactNative toJSON:lastStoredNotification]];
        lastStoredNotification = nil;
    }
  });
    
};

+ (NSString *) toJSON: (NSDictionary  *) json{
    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:json options:NSJSONWritingPrettyPrinted error:&error];

    if (! jsonData) {
        COUNTLY_RN_LOG(@"Got an error: %@", error);
        return [NSString stringWithFormat:@"{'error': '%@'}", error];
    } else {
        NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        return jsonString;
    }
}
+ (void) log: (NSString *) theMessage{
    if(config.enableDebug == YES){
        COUNTLY_RN_LOG(theMessage);
    }
}
RCT_EXPORT_METHOD(start)
{
  // [Countly.sharedInstance resume];
}

RCT_EXPORT_METHOD(stop)
{
  // [Countly.sharedInstance suspend];
}

RCT_REMAP_METHOD(getCurrentDeviceId,
                 getCurrentDeviceIdWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  id value = [Countly.sharedInstance deviceID];
  if(value){
    resolve(value);
  }
  else{
    NSString *value = @"deviceIdNotFound";
    resolve(value);
  }
  });
}

RCT_EXPORT_METHOD(getDeviceIdAuthor:(NSArray*)arguments callback:(RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
      id value = [Countly.sharedInstance deviceIDType];
      if(value){
        callback(@[value]);
      }
      else{
        NSString *value = @"deviceIDAuthorNotFound";
        callback(@[value]);
      }
  });
}

RCT_EXPORT_METHOD(changeDeviceId:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* newDeviceID = [arguments objectAtIndex:0];
  NSString* onServerString = [arguments objectAtIndex:1];
  if ([onServerString  isEqual: @"1"]) {
    [Countly.sharedInstance setNewDeviceID:newDeviceID onServer: YES];
  }else{
    [Countly.sharedInstance setNewDeviceID:newDeviceID onServer: NO];
  }
  });
}

RCT_EXPORT_METHOD(setHttpPostForced:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* isPost = [arguments objectAtIndex:0];
  if (config == nil){
    config = CountlyConfig.new;
  }

  if ([isPost  isEqual: @"1"]) {
    config.alwaysUsePOST = YES;
  }else{
    config.alwaysUsePOST = NO;
  }
  });
}

RCT_EXPORT_METHOD(enableParameterTamperingProtection:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* salt = [arguments objectAtIndex:0];
  if (config == nil){
    config = CountlyConfig.new;
  }
  config.secretSalt = salt;
  });
}

RCT_EXPORT_METHOD(pinnedCertificates:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* certificateName = [arguments objectAtIndex:0];
  if (config == nil){
    config = CountlyConfig.new;
  }
  config.pinnedCertificates = @[certificateName];
  });
}

RCT_EXPORT_METHOD(startEvent:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* startEvent = [arguments objectAtIndex:0];
  [Countly.sharedInstance startEvent:startEvent];
  });
}

RCT_EXPORT_METHOD(cancelEvent:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* cancelEvent = [arguments objectAtIndex:0];
  [Countly.sharedInstance cancelEvent:cancelEvent];
  });
}


RCT_EXPORT_METHOD(endEvent:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* eventType = [arguments objectAtIndex:0];

  if ([eventType  isEqual: @"event"]) {
    NSString* eventName = [arguments objectAtIndex:1];
    [Countly.sharedInstance endEvent:eventName];
  }
  else if ([eventType  isEqual: @"eventWithSum"]){
    NSString* eventName = [arguments objectAtIndex:1];

    NSString* countString = [arguments objectAtIndex:2];
    int countInt = [countString intValue];

    NSString* sumString = [arguments objectAtIndex:3];
    float sumInt = [sumString floatValue];

    NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
    [Countly.sharedInstance endEvent:eventName segmentation:dict count:countInt sum:sumInt];
  }
  else if ([eventType  isEqual: @"eventWithSegment"]){
    NSString* eventName = [arguments objectAtIndex:1];

    NSString* countString = [arguments objectAtIndex:2];
    int countInt = [countString intValue];

    NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
    for(int i=4,il=(int)arguments.count;i<il;i+=2){
      dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i+1];
    }

    [Countly.sharedInstance endEvent:eventName segmentation:dict count:countInt sum:0];
  }
  else if ([eventType  isEqual: @"eventWithSumSegment"]){
    NSString* eventName = [arguments objectAtIndex:1];

    NSString* countString = [arguments objectAtIndex:2];
    int countInt = [countString intValue];

    NSString* sumString = [arguments objectAtIndex:3];
    float sumInt = [sumString floatValue];

    NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
    for(int i=4,il=(int)arguments.count;i<il;i+=2){
      dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i+1];
    }

    [Countly.sharedInstance endEvent:eventName segmentation:dict count:countInt sum:sumInt];
  }
  else{
  }
  });
}

RCT_EXPORT_METHOD(setLocationInit:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
      if (config == nil){
        config = CountlyConfig.new;
      }
      NSString* countryCode = [arguments objectAtIndex:0];
      NSString* city = [arguments objectAtIndex:1];
      NSString* locationString = [arguments objectAtIndex:2];
      NSString* ipAddress = [arguments objectAtIndex:3];

      if(locationString != nil && ![locationString isEqualToString:@"null"] && [locationString containsString:@","]){
          @try{
              NSArray *locationArray = [locationString componentsSeparatedByString:@","];
              NSString* latitudeString = [locationArray objectAtIndex:0];
              NSString* longitudeString = [locationArray objectAtIndex:1];

              double latitudeDouble = [latitudeString doubleValue];
              double longitudeDouble = [longitudeString doubleValue];
              config.location = (CLLocationCoordinate2D){latitudeDouble,longitudeDouble};
          }
          @catch(NSException *exception){
              COUNTLY_RN_LOG(@"Invalid location: %@", locationString);
          }
      }
      if(city != nil && ![city isEqualToString:@"null"]) {
          config.city = city;
      }
      if(countryCode != nil && ![countryCode isEqualToString:@"null"]) {
          config.ISOCountryCode = countryCode;
      }
      if(ipAddress != nil && ![ipAddress isEqualToString:@"null"]) {
          config.IP = ipAddress;
      }
  });
}

RCT_EXPORT_METHOD(setLocation:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* countryCode = [arguments objectAtIndex:0];
  NSString* city = [arguments objectAtIndex:1];
  NSString* gpsCoordinate = [arguments objectAtIndex:2];
  NSString* ipAddress = [arguments objectAtIndex:3];

  if([@"null" isEqualToString:city]){
      city = nil;
  }
  if([@"null" isEqualToString:countryCode]){
      countryCode = nil;
  }
  if([@"null" isEqualToString:gpsCoordinate]){
      gpsCoordinate = nil;
  }
  if([@"null" isEqualToString:ipAddress]){
      ipAddress = nil;
  }
      
  CLLocationCoordinate2D locationCoordinate = [self getCoordinate:gpsCoordinate];
  [Countly.sharedInstance recordLocation:locationCoordinate city:city ISOCountryCode:countryCode IP:ipAddress];
  });
}

RCT_EXPORT_METHOD(disableLocation)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  [Countly.sharedInstance disableLocationInfo];
  });
}

- (CLLocationCoordinate2D) getCoordinate:(NSString*) gpsCoordinate
{
    CLLocationCoordinate2D locationCoordinate = kCLLocationCoordinate2DInvalid;
    if(gpsCoordinate){
        if([gpsCoordinate containsString:@","]) {
            @try{
                NSArray *locationArray = [gpsCoordinate componentsSeparatedByString:@","];
                if(locationArray.count > 2) {
                    COUNTLY_RN_LOG(@"Invalid location Coordinates:[%@], it should contains only two comma seperated values", gpsCoordinate);
                }
                NSString* latitudeString = [locationArray objectAtIndex:0];
                NSString* longitudeString = [locationArray objectAtIndex:1];
                
                double latitudeDouble = [latitudeString doubleValue];
                double longitudeDouble = [longitudeString doubleValue];
                if(latitudeDouble == 0 || longitudeDouble == 0) {
                    COUNTLY_RN_LOG(@"Invalid location Coordinates, One of the values parsed to a 0, double check that given coordinates are correct:[%@]", gpsCoordinate);
                }
                locationCoordinate = (CLLocationCoordinate2D){latitudeDouble,longitudeDouble};
            }
            @catch(NSException *exception) {
                COUNTLY_RN_LOG(@"Invalid location Coordinates:[%@], Exception occurred while parsing Coordinates:[%@]", gpsCoordinate, exception);
            }
        }
        else {
            COUNTLY_RN_LOG(@"Invalid location Coordinates:[%@], lat and long values should be comma separated", gpsCoordinate);
        }
        
    }
    return locationCoordinate;
}


RCT_EXPORT_METHOD(enableCrashReporting)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  if (config == nil){
    config = CountlyConfig.new;
  }
  [self addCountlyFeature:CLYCrashReporting];
  });
}

RCT_EXPORT_METHOD(addCrashLog:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* logs = [arguments objectAtIndex:0];
  [Countly.sharedInstance recordCrashLog:logs];
  });
}

RCT_EXPORT_METHOD(setCustomCrashSegments:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
  for(int i=0,il=(int)arguments.count;i<il;i+=2){
      dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i+1];
  }
  if (config == nil){
    config = CountlyConfig.new;
  }
  config.crashSegmentation = dict;
  });
}

RCT_EXPORT_METHOD(logException:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* execption = [arguments objectAtIndex:0];
  NSString* nonfatal = [arguments objectAtIndex:1];
  NSArray *nsException = [execption componentsSeparatedByString:@"\n"];

  NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];

  for(int i=2,il=(int)arguments.count;i<il;i+=2){
      dict[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i+1];
  }
  [dict setObject:nonfatal forKey:@"nonfatal"];

  NSException* myException = [NSException exceptionWithName:@"Exception" reason:execption userInfo:dict];

  [Countly.sharedInstance recordHandledException:myException withStackTrace: nsException];
  });
}

RCT_EXPORT_METHOD(logJSException:(NSString *)errTitle withMessage:(NSString *)message withStack:(NSString *)stackTrace) {
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSException* myException = [NSException exceptionWithName:errTitle reason:message
                              userInfo:@{@"nonfatal":@"1"}];
  NSArray *stack = [stackTrace componentsSeparatedByString:@"\n"];
  [Countly.sharedInstance recordHandledException:myException withStackTrace:stack];
  });
}

RCT_EXPORT_METHOD(userData_setProperty:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* keyName = [arguments objectAtIndex:0];
  NSString* keyValue = [arguments objectAtIndex:1];

  [Countly.user set:keyName value:keyValue];
  [Countly.user save];
  });
}

RCT_EXPORT_METHOD(userData_increment:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* keyName = [arguments objectAtIndex:0];

  [Countly.user increment:keyName];
  [Countly.user save];
  });
}

RCT_EXPORT_METHOD(userData_incrementBy:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* keyName = [arguments objectAtIndex:0];
  NSString* keyValue = [arguments objectAtIndex:1];
  int keyValueInteger = [keyValue intValue];

  [Countly.user incrementBy:keyName value:[NSNumber numberWithInt:keyValueInteger]];
  [Countly.user save];
  });
}

RCT_EXPORT_METHOD(userData_multiply:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* keyName = [arguments objectAtIndex:0];
  NSString* keyValue = [arguments objectAtIndex:1];
  int keyValueInteger = [keyValue intValue];

  [Countly.user multiply:keyName value:[NSNumber numberWithInt:keyValueInteger]];
  [Countly.user save];
  });
}

RCT_EXPORT_METHOD(userData_saveMax:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* keyName = [arguments objectAtIndex:0];
  NSString* keyValue = [arguments objectAtIndex:1];
  int keyValueInteger = [keyValue intValue];

  [Countly.user max:keyName value:[NSNumber numberWithInt:keyValueInteger]];
  [Countly.user save];
  });
}

RCT_EXPORT_METHOD(userData_saveMin:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* keyName = [arguments objectAtIndex:0];
  NSString* keyValue = [arguments objectAtIndex:1];
  int keyValueInteger = [keyValue intValue];

  [Countly.user min:keyName value:[NSNumber numberWithInt:keyValueInteger]];
  [Countly.user save];
  });
}

RCT_EXPORT_METHOD(userData_setOnce:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* keyName = [arguments objectAtIndex:0];
  NSString* keyValue = [arguments objectAtIndex:1];

  [Countly.user setOnce:keyName value:keyValue];
  [Countly.user save];
  });
}
RCT_EXPORT_METHOD(userData_pushUniqueValue:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* keyName = [arguments objectAtIndex:0];
  NSString* keyValue = [arguments objectAtIndex:1];

  [Countly.user pushUnique:keyName value:keyValue];
  [Countly.user save];
  });
}
RCT_EXPORT_METHOD(userData_pushValue:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* keyName = [arguments objectAtIndex:0];
  NSString* keyValue = [arguments objectAtIndex:1];

  [Countly.user push:keyName value:keyValue];
  [Countly.user save];
  });
}
RCT_EXPORT_METHOD(userData_pullValue:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* keyName = [arguments objectAtIndex:0];
  NSString* keyValue = [arguments objectAtIndex:1];

  [Countly.user pull:keyName value:keyValue];
  [Countly.user save];
  });
}



RCT_EXPORT_METHOD(demo:(NSArray*)arguments)
{

}

RCT_EXPORT_METHOD(setRequiresConsent:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  if (config == nil){
    config = CountlyConfig.new;
  }
  BOOL consentFlag = [[arguments objectAtIndex:0] boolValue];
  config.requiresConsent = consentFlag;
  });
}

RCT_EXPORT_METHOD(giveConsentInit:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  if (config == nil){
    config = CountlyConfig.new;
  }
  config.consents = arguments;
  });
}

RCT_EXPORT_METHOD(giveConsent:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  [Countly.sharedInstance giveConsentForFeatures:arguments];
  });
}

RCT_EXPORT_METHOD(removeConsent:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  [Countly.sharedInstance cancelConsentForFeatures:arguments];
  });
}

RCT_EXPORT_METHOD(giveAllConsent)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  [Countly.sharedInstance giveConsentForFeature:CLYConsentLocation];
  [Countly.sharedInstance giveConsentForAllFeatures];
  });
}

RCT_EXPORT_METHOD(removeAllConsent)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  [Countly.sharedInstance cancelConsentForAllFeatures];
  });
}

RCT_EXPORT_METHOD(remoteConfigUpdate:(NSArray*)arguments callback:(RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  [Countly.sharedInstance updateRemoteConfigWithCompletionHandler:^(NSError * error)
  {
      if (!error)
      {
          NSArray *result = @[@"Remote Config is updated and ready to use!"];
          callback(@[result]);
      }
      else
      {
          NSString* returnString = [NSString stringWithFormat:@"There was an error while updating Remote Config: %@", error];
          NSArray *result = @[returnString];
          callback(@[result]);
      }
  }];
  });
}

RCT_EXPORT_METHOD(updateRemoteConfigForKeysOnly:(NSArray*)arguments callback:(RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSMutableArray *randomSelection = [[NSMutableArray alloc] init];
  for (int i = 0; i < (int)arguments.count; i++){
      [randomSelection addObject:[arguments objectAtIndex:i]];
  }
  NSArray *keyNames = [randomSelection copy];
  [Countly.sharedInstance updateRemoteConfigOnlyForKeys:keyNames completionHandler:^(NSError * error)
  {
      if (!error)
      {
          NSArray *result = @[@"Remote Config is updated only for given keys and ready to use!"];
          callback(@[result]);
      }
      else
      {
          NSString* returnString = [NSString stringWithFormat:@"There was an error while updating Remote Config: %@", error];
          NSArray *result = @[returnString];
          callback(@[result]);
      }
  }];
  });
}

RCT_EXPORT_METHOD(updateRemoteConfigExceptKeys:(NSArray*)arguments callback:(RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSMutableArray *randomSelection = [[NSMutableArray alloc] init];
  for (int i = 0; i < (int)arguments.count; i++){
      [randomSelection addObject:[arguments objectAtIndex:i]];
  }
  NSArray *keyNames = [randomSelection copy];
  [Countly.sharedInstance updateRemoteConfigExceptForKeys:keyNames completionHandler:^(NSError * error)
  {
      if (!error)
      {
          NSArray *result = @[@"Remote Config is updated except for given keys and ready to use !"];
          callback(@[result]);
      }
      else
      {
          NSString* returnString = [NSString stringWithFormat:@"There was an error while updating Remote Config: %@", error];
          NSArray *result = @[returnString];
          callback(@[result]);
      }
  }];
  });
}

RCT_EXPORT_METHOD(getRemoteConfigValueForKey:(NSArray*)arguments callback:(RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  id value = [Countly.sharedInstance remoteConfigValueForKey:[arguments objectAtIndex:0]];
  if(value){
    callback(@[value]);
  }
  else{
    NSString *value = @"ConfigKeyNotFound";
    callback(@[value]);
  }
  });
}

RCT_EXPORT_METHOD(setStarRatingDialogTexts:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
            NSString* starRatingTextMessage = [arguments objectAtIndex:1];
            config.starRatingMessage = starRatingTextMessage;
      });
}

RCT_EXPORT_METHOD(showStarRating:(NSArray*)arguments callback:(RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
    [Countly.sharedInstance askForStarRating:^(NSInteger rating){
      callback(@[[@(rating) stringValue]]);
    }];
  });
}

RCT_EXPORT_METHOD(presentRatingWidgetWithID:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* FEEDBACK_WIDGET_ID = [arguments objectAtIndex:0];
  [Countly.sharedInstance presentRatingWidgetWithID:FEEDBACK_WIDGET_ID completionHandler:^(NSError* error)
  {
    NSString* errorStr = nil;
    if (error){
        errorStr = error.localizedDescription;
    }
    [self sendEventWithName:@"ratingWidgetCallback" body: errorStr];
  }];
  });
}

RCT_REMAP_METHOD(getFeedbackWidgets,
                 getFeedbackWidgetsWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
    [Countly.sharedInstance getFeedbackWidgets:^(NSArray<CountlyFeedbackWidget *> * _Nonnull feedbackWidgets, NSError * _Nonnull error) {
      NSMutableArray* feedbackWidgetsArray = [NSMutableArray arrayWithCapacity:feedbackWidgets.count];
      for (CountlyFeedbackWidget* retrievedWidget in feedbackWidgets) {
          NSMutableDictionary* feedbackWidget = [NSMutableDictionary dictionaryWithCapacity:3];
          feedbackWidget[@"id"] = retrievedWidget.ID;
          feedbackWidget[@"type"] = retrievedWidget.type;
          feedbackWidget[@"name"] = retrievedWidget.name;
          [feedbackWidgetsArray addObject:feedbackWidget];
      }
      resolve(feedbackWidgetsArray);
    }];
  });
}

RCT_REMAP_METHOD(getAvailableFeedbackWidgets,
                 getAvailableFeedbackWidgetsWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
    [Countly.sharedInstance getFeedbackWidgets:^(NSArray<CountlyFeedbackWidget *> * _Nonnull feedbackWidgets, NSError * _Nonnull error) {
      NSMutableDictionary* feedbackWidgetsDict = [NSMutableDictionary dictionaryWithCapacity:feedbackWidgets.count];
      for (CountlyFeedbackWidget* feedbackWidget in feedbackWidgets) {
        feedbackWidgetsDict[feedbackWidget.type] = feedbackWidget.ID;
      }
      resolve(feedbackWidgetsDict);
    }];
  });
}

RCT_EXPORT_METHOD(presentFeedbackWidget:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
        NSString* widgetId = [arguments objectAtIndex:0];
        NSString* widgetType = [arguments objectAtIndex:1];
        NSString* widgetName = [arguments objectAtIndex:2];
            NSMutableDictionary* feedbackWidgetsDict = [NSMutableDictionary dictionaryWithCapacity:3];
            
            feedbackWidgetsDict[@"_id"] = widgetId;
            feedbackWidgetsDict[@"type"] = widgetType;
            feedbackWidgetsDict[@"name"] = widgetName;
            CountlyFeedbackWidget *feedback = [CountlyFeedbackWidget createWithDictionary:feedbackWidgetsDict];
            [feedback present];
        });
}

RCT_EXPORT_METHOD(replaceAllAppKeysInQueueWithCurrentAppKey)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
            [Countly.sharedInstance replaceAllAppKeysInQueueWithCurrentAppKey];
        });
}

RCT_EXPORT_METHOD(removeDifferentAppKeysFromQueue)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
            [Countly.sharedInstance removeDifferentAppKeysFromQueue];
        });
}

RCT_EXPORT_METHOD(setEventSendThreshold:(NSArray*)arguments)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
  NSString* size = [arguments objectAtIndex:0];
  int sizeInt = [size intValue];
  if (config == nil){
    config = CountlyConfig.new;
  }
  config.eventSendThreshold = sizeInt;
  });
}

RCT_REMAP_METHOD(isLoggingEnabled,
                 isLoggingEnabledWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
    id result = [NSNumber numberWithBool:config.enableDebug] ;
    resolve(result);
  });
}

RCT_REMAP_METHOD(isInitialized,
                 isInitializedWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
    id result = [NSNumber numberWithBool:CountlyCommon.sharedInstance.hasStarted] ;
    resolve(result);
  });
}


RCT_REMAP_METHOD(hasBeenCalledOnStart,
                 hasBeenCalledOnStartWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
    id result = [NSNumber numberWithBool:CountlyCommon.sharedInstance.hasStarted] ;
    resolve(result);
  });
}

RCT_EXPORT_METHOD(remoteConfigClearValues:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
    [CountlyRemoteConfig.sharedInstance clearCachedRemoteConfig];
    resolve(@"Remote Config Cleared.");
  });
}

RCT_EXPORT_METHOD(startTrace:(NSArray*)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^ {
        NSString* traceKey = [arguments objectAtIndex:0];
        [Countly.sharedInstance startCustomTrace: traceKey];
    });
}
RCT_EXPORT_METHOD(cancelTrace:(NSArray*)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^ {
        NSString* traceKey = [arguments objectAtIndex:0];
        [Countly.sharedInstance cancelCustomTrace: traceKey];
    });
}
RCT_EXPORT_METHOD(clearAllTraces:(NSArray*)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^ {
        [Countly.sharedInstance clearAllCustomTraces];
    });
}
RCT_EXPORT_METHOD(endTrace:(NSArray*)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^ {
        NSString* traceKey = [arguments objectAtIndex:0];
        NSMutableDictionary *metrics = [[NSMutableDictionary alloc] init];
        for(int i=1,il=(int)arguments.count;i<il;i+=2){
            metrics[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i+1];
        }
        [Countly.sharedInstance endCustomTrace: traceKey metrics: metrics];
    });
}
RCT_EXPORT_METHOD(recordNetworkTrace:(NSArray*)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^ {
        NSString* networkTraceKey = [arguments objectAtIndex:0];
        int responseCode = [[arguments objectAtIndex:1] intValue];
        int requestPayloadSize = [[arguments objectAtIndex:2] intValue];
        int responsePayloadSize = [[arguments objectAtIndex:3] intValue];
        long long  startTime = [[arguments objectAtIndex:4] longLongValue];
        long long  endTime = [[arguments objectAtIndex:5] longLongValue];
        [Countly.sharedInstance recordNetworkTrace: networkTraceKey requestPayloadSize: requestPayloadSize responsePayloadSize: responsePayloadSize responseStatusCode: responseCode startTime: startTime endTime: endTime];

    });
}
RCT_EXPORT_METHOD(enableApm:(NSArray*)arguments) {
  dispatch_async(dispatch_get_main_queue(), ^ {
    config.enablePerformanceMonitoring = YES;
  });
}

RCT_EXPORT_METHOD(recordAttributionID:(NSArray*)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^ {
        NSString* attributionID = [arguments objectAtIndex:0];
        if(CountlyCommon.sharedInstance.hasStarted) {
          [Countly.sharedInstance recordAttributionID: attributionID];
        }
        else {
          if (config == nil){
            config = CountlyConfig.new;
          }
          config.attributionID = attributionID;
        }
    });
}

RCT_EXPORT_METHOD(appLoadingFinished)
{
  dispatch_async(dispatch_get_main_queue(), ^ {
    [Countly.sharedInstance appLoadingFinished];
  });
}

RCT_EXPORT_METHOD(setCustomMetrics:(NSArray*)arguments) {
    dispatch_async(dispatch_get_main_queue(), ^ {
        NSMutableDictionary *metrics = [[NSMutableDictionary alloc] init];
        for(int i=0,il=(int)arguments.count;i<il;i+=2){
          if(i+1 < il){
            metrics[[arguments objectAtIndex:i]] = [arguments objectAtIndex:i+1];
          }
        }
        config.customMetrics = metrics;
    });
}

- (void)addCountlyFeature:(CLYFeature)feature
{
    if(countlyFeatures == nil) {
        countlyFeatures = [[NSMutableArray alloc] init];
    }
    if(![countlyFeatures containsObject:feature]) {
        [countlyFeatures addObject:feature];
        config.features = countlyFeatures;
    }
}

- (void)removeCountlyFeature:(CLYFeature)feature
{
    if(countlyFeatures == nil) {
        return;
    }
    if(![countlyFeatures containsObject:feature]) {
        [countlyFeatures removeObject:feature];
        config.features = countlyFeatures;
    }
}

void CountlyRNInternalLog(NSString *format, ...)
{
    if (!config.enableDebug)
        return;

    va_list args;
    va_start(args, format);

    NSString* logString = [NSString.alloc initWithFormat:format arguments:args];
    NSLog(@"[CountlyReactNativePlugin] %@", logString);

    va_end(args);
}

+ (void)onNotification:(NSDictionary *)notificationMessage
{
    [CountlyReactNative onNotification:notificationMessage buttonIndex:0];
}

+ (void)onNotification:(NSDictionary *)notificationMessage buttonIndex:(NSInteger)btnIndex
{
    COUNTLY_RN_LOG(@"Notification received");
    COUNTLY_RN_LOG(@"The notification %@", [CountlyReactNative toJSON:notificationMessage]);
    if(notificationMessage && notificationListener != nil){
      lastStoredNotification = notificationMessage;
      notificationListener(@[[CountlyReactNative toJSON:notificationMessage]]);
    }else{
      lastStoredNotification = notificationMessage;
    }
    if(!CountlyCommon.sharedInstance.hasStarted) {
        [[NSUserDefaults standardUserDefaults] setObject:notificationMessage forKey:CLYPushDictionaryKey];
        [[NSUserDefaults standardUserDefaults] setInteger:btnIndex forKey:CLYPushButtonIndexKey];
        [[NSUserDefaults standardUserDefaults] synchronize];
    }
    if(notificationMessage){
      if(notificationIDs == nil){
        notificationIDs = [[NSMutableArray alloc] init];
      }
      if ([[notificationMessage allKeys] containsObject:@"c"]) {
        NSDictionary* countlyPayload = notificationMessage[@"c"];
        if ([[countlyPayload allKeys] containsObject:@"c"]) {
          NSString *notificationID = countlyPayload[@"i"];
          [notificationIDs insertObject:notificationID atIndex:[notificationIDs count]];
        }
      }
    }
}

+(void)onNotificationResponse:(UNNotificationResponse *)response
API_AVAILABLE(ios(10.0)){
    NSDictionary* notificationDictionary = response.notification.request.content.userInfo;
    NSInteger buttonIndex = 0;
    if ([response.actionIdentifier hasPrefix:kCountlyActionIdentifier])
    {
        buttonIndex = [[response.actionIdentifier stringByReplacingOccurrencesOfString:kCountlyActionIdentifier withString:@""] integerValue];
    }
    [CountlyReactNative onNotification:notificationDictionary buttonIndex:buttonIndex];
    
}

- (void) recordPushAction {
    @try{
        NSDictionary* responseDictionary = [[NSUserDefaults standardUserDefaults] dictionaryForKey:CLYPushDictionaryKey];
        NSInteger responseBtnIndex = [[NSUserDefaults standardUserDefaults] integerForKey:CLYPushButtonIndexKey];
        if (responseDictionary != nil)
        {
            if([responseDictionary count] > 0) {
                
                NSDictionary* countlyPayload = responseDictionary[kCountlyPNKeyCountlyPayload];
                NSString* URL = @"";
                if (responseBtnIndex == 0)
                {
                    URL = countlyPayload[kCountlyPNKeyDefaultURL];
                }
                else
                {
                    URL = countlyPayload[kCountlyPNKeyButtons][responseBtnIndex - 1][kCountlyPNKeyActionButtonURL];
                }
                
                [Countly.sharedInstance recordActionForNotification:responseDictionary clickedButtonIndex:responseBtnIndex];
                [[NSUserDefaults standardUserDefaults] removeObjectForKey:CLYPushDictionaryKey];
                [[NSUserDefaults standardUserDefaults] removeObjectForKey:CLYPushButtonIndexKey];
                [[NSUserDefaults standardUserDefaults] synchronize];
                
                [self openURL:URL];
            }
            
        }
    }
    @catch(NSException *exception){
        COUNTLY_RN_LOG(@"Exception Occurred while recording push action: %@", exception);
    }
}

- (void)openURL:(NSString *)URLString
{
    if (!URLString)
        return;

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.01 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^
    {
#if (TARGET_OS_IOS)
        [UIApplication.sharedApplication openURL:[NSURL URLWithString:URLString] options:@{} completionHandler:nil];
// Removing this line because currently we are not supporting OSX
//#elif (TARGET_OS_OSX)
//        [NSWorkspace.sharedWorkspace openURL:[NSURL URLWithString:URLString]];
#endif
    });
}
@end