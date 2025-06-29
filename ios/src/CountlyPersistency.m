// CountlyPersistency.m
//
// This code is provided under the MIT License.
//
// Please visit www.count.ly for more information.

#import "CountlyCommon.h"

@interface CountlyPersistency ()
@property (nonatomic) NSMutableArray* queuedRequests;
@property (nonatomic) NSMutableArray* recordedEvents;
@property (nonatomic) NSMutableDictionary* startedEvents;
@property (nonatomic) BOOL isQueueBeingModified;
@end

@implementation CountlyPersistency
NSString* const kCountlyQueuedRequestsPersistencyKey = @"kCountlyQueuedRequestsPersistencyKey";
NSString* const kCountlyStartedEventsPersistencyKey = @"kCountlyStartedEventsPersistencyKey";
NSString* const kCountlyHealthCheckStatePersistencyKey = @"kCountlyHealthCheckStatePersistencyKey";
NSString* const kCountlyStoredDeviceIDKey = @"kCountlyStoredDeviceIDKey";
NSString* const kCountlyStoredNSUUIDKey = @"kCountlyStoredNSUUIDKey";
NSString* const kCountlyWatchParentDeviceIDKey = @"kCountlyWatchParentDeviceIDKey";
NSString* const kCountlyStarRatingStatusKey = @"kCountlyStarRatingStatusKey";
NSString* const kCountlyNotificationPermissionKey = @"kCountlyNotificationPermissionKey";
NSString* const kCountlyIsCustomDeviceIDKey = @"kCountlyIsCustomDeviceIDKey";
NSString* const kCountlyRemoteConfigKey = @"kCountlyRemoteConfigKey";
NSString* const kCountlyServerConfigPersistencyKey = @"kCountlyServerConfigPersistencyKey";


NSString* const kCountlyCustomCrashLogFileName = @"CountlyCustomCrash.log";

NSUInteger const kCountlyRequestRemovalLoopLimit = 100;

static CountlyPersistency* s_sharedInstance = nil;
static dispatch_once_t onceToken;

+ (instancetype)sharedInstance
{
    if (!CountlyCommon.sharedInstance.hasStarted)
        return nil;

    dispatch_once(&onceToken, ^{s_sharedInstance = self.new;});
    return s_sharedInstance;
}

- (instancetype)init
{
    if (self = [super init])
    {
        NSData* readData = [NSData dataWithContentsOfURL:[self storageFileURL]];

        if (readData)
        {
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
            NSDictionary* readDict = [NSKeyedUnarchiver unarchiveObjectWithData:readData];
#pragma GCC diagnostic pop

            self.queuedRequests = [readDict[kCountlyQueuedRequestsPersistencyKey] mutableCopy];
        }

        if (!self.queuedRequests)
            self.queuedRequests = NSMutableArray.new;

        if (!self.startedEvents)
            self.startedEvents = NSMutableDictionary.new;

        self.recordedEvents = NSMutableArray.new;
    }

    return self;
}

#pragma mark ---

- (void)addToQueue:(NSString *)queryString
{
    if (!CountlyServerConfig.sharedInstance.trackingEnabled)
    {
        CLY_LOG_D(@"'addToQueue' is aborted: SDK Tracking is disabled from server config!");
        return;
    }
    
    if (!queryString.length || [queryString isEqual:NSNull.null])
        return;
    
    queryString = [queryString stringByAppendingFormat:@"&%@=%@",
                   kCountlyAppVersionKey, CountlyDeviceInfo.appVersion];

    @synchronized (self)
    {
        if (self.queuedRequests.count >= self.storedRequestsLimit)
        {
            [self removeOldAgeRequestsFromQueue];
            if (self.queuedRequests.count >= self.storedRequestsLimit)
            {
                NSUInteger exceededSize = self.queuedRequests.count - self.storedRequestsLimit;
                // we should remove amount of limit at max
                // for example if exceeded count is 136 and our limit is 100 we should remove 100 items
                // in other case if exceeded count is 36 and out limit is 100 we can only remove 36 items because we have that amount
                NSUInteger gonnaRemoveSize = MIN(exceededSize, kCountlyRequestRemovalLoopLimit) + 1;
                CLY_LOG_W(@"[CountlyPersistency] addToQueue, request queue size:[ %lu ] exceeded limit:[ %lu ], will remove first:[ %lu ] request(s)", self.queuedRequests.count, self.storedRequestsLimit, gonnaRemoveSize);
                NSRange itemsToRemove = NSMakeRange(0, gonnaRemoveSize);
                [self.queuedRequests removeObjectsInRange:itemsToRemove];
            }
        }
        [self.queuedRequests addObject:queryString];
    }
}

- (void)removeFromQueue:(NSString *)queryString
{
    @synchronized (self)
    {
        if (self.queuedRequests.count)
            [self.queuedRequests removeObject:queryString inRange:(NSRange){0, 1}];
    }
}

- (NSString *)firstItemInQueue
{
    @synchronized (self)
    {
        return self.queuedRequests.firstObject;
    }
}

- (void)flushQueue
{
    @synchronized (self)
    {
        [self.queuedRequests removeAllObjects];
    }
}

- (NSUInteger)remainingRequestCount
{
    @synchronized (self)
    {
        return [self.queuedRequests count];
    }
}

- (void)replaceAllTemporaryDeviceIDsInQueueWithDeviceID:(NSString *)deviceID
{
    NSString* temporaryDeviceIDQueryString = [NSString stringWithFormat:@"&%@=%@", kCountlyQSKeyDeviceID, CLYTemporaryDeviceID];
    NSString* realDeviceIDQueryString = [NSString stringWithFormat:@"&%@=%@", kCountlyQSKeyDeviceID, deviceID.cly_URLEscaped];

    NSString* temporaryDeviceIDTypeQueryString = [NSString stringWithFormat:@"&%@=%d", kCountlyQSKeyDeviceIDType, (int)CLYDeviceIDTypeValueTemporary];
    NSString* realDeviceIDTypeQueryString = [NSString stringWithFormat:@"&%@=%d", kCountlyQSKeyDeviceIDType, (int)CountlyDeviceInfo.sharedInstance.deviceIDTypeValue];

    @synchronized (self)
    {
        self.isQueueBeingModified = YES;

        [self.queuedRequests.copy enumerateObjectsUsingBlock:^(NSString* queryString, NSUInteger idx, BOOL* stop)
        {
            if ([queryString containsString:temporaryDeviceIDQueryString])
            {
                CLY_LOG_D(@"Detected a request with temporary device ID in queue and replaced it with real device ID.");
                NSString * replacedQueryString = [queryString stringByReplacingOccurrencesOfString:temporaryDeviceIDQueryString withString:realDeviceIDQueryString];
                replacedQueryString = [replacedQueryString stringByReplacingOccurrencesOfString:temporaryDeviceIDTypeQueryString withString:realDeviceIDTypeQueryString];
                self.queuedRequests[idx] = replacedQueryString;
            }
        }];

        self.isQueueBeingModified = NO;
    }
}

- (void)replaceAllAppKeysInQueueWithCurrentAppKey
{
    @synchronized (self)
    {
        self.isQueueBeingModified = YES;

        [self.queuedRequests.copy enumerateObjectsUsingBlock:^(NSString* queryString, NSUInteger idx, BOOL* stop)
        {
            NSString* appKeyInQueryString = [queryString cly_valueForQueryStringKey:kCountlyQSKeyAppKey];

            if (![appKeyInQueryString isEqualToString:CountlyConnectionManager.sharedInstance.appKey.cly_URLEscaped])
            {
                CLY_LOG_D(@"Detected a request with a different app key (%@) in queue and replaced it with current app key.", appKeyInQueryString);

                NSString* currentAppKeyQueryString = [NSString stringWithFormat:@"%@=%@", kCountlyQSKeyAppKey, CountlyConnectionManager.sharedInstance.appKey.cly_URLEscaped];
                NSString* differentAppKeyQueryString = [NSString stringWithFormat:@"%@=%@", kCountlyQSKeyAppKey, appKeyInQueryString];
                NSString * replacedQueryString = [queryString stringByReplacingOccurrencesOfString:differentAppKeyQueryString withString:currentAppKeyQueryString];
                self.queuedRequests[idx] = replacedQueryString;
            }
        }];

        self.isQueueBeingModified = NO;
    }
}

- (void)removeDifferentAppKeysFromQueue
{
    @synchronized (self)
    {
        self.isQueueBeingModified = YES;

        NSPredicate* predicate = [NSPredicate predicateWithBlock:^BOOL(NSString* queryString, NSDictionary<NSString *, id> * bindings)
        {
            NSString* appKeyInQueryString = [queryString cly_valueForQueryStringKey:kCountlyQSKeyAppKey];

            BOOL isSameAppKey = [appKeyInQueryString isEqualToString:CountlyConnectionManager.sharedInstance.appKey.cly_URLEscaped];
            if (!isSameAppKey)
            {
                CLY_LOG_D(@"Detected a request with a different app key (%@) in queue and removed it.", appKeyInQueryString);
            }

            return isSameAppKey;
        }];

        [self.queuedRequests filterUsingPredicate:predicate];

        self.isQueueBeingModified = NO;
    }
}

- (void)removeOldAgeRequestsFromQueue
{
    @synchronized (self)
    {
        if(self.requestDropAgeHours && self.requestDropAgeHours > 0) {
            self.isQueueBeingModified = YES;
            
            NSPredicate* predicate = [NSPredicate predicateWithBlock:^BOOL(NSString* queryString, NSDictionary<NSString *, id> * bindings)
                                      {
                BOOL isOldAgeRequest = [self isOldRequestInternal:queryString];
                return !isOldAgeRequest;
            }];
            
            [self.queuedRequests filterUsingPredicate:predicate];
            
            self.isQueueBeingModified = NO;
        }
    }
}

-(BOOL)isOldRequest:(NSString*) queryString
{
    if(self.requestDropAgeHours && self.requestDropAgeHours > 0) {
        return [self isOldRequestInternal:queryString];
    }
    return false;
    
}

-(BOOL)isOldRequestInternal:(NSString *)queryString
{
    double requestTimeStamp = [[queryString cly_valueForQueryStringKey:kCountlyQSKeyTimestamp] longLongValue]/1000.0;
    double durationInSecods = NSDate.date.timeIntervalSince1970 - requestTimeStamp;
    double durationInHours = (durationInSecods/3600.0);
    BOOL isOldAgeRequest = durationInHours >= self.requestDropAgeHours;
    if (isOldAgeRequest)
    {
        CLY_LOG_D(@"Detected a request with an old age (age in hours: %f) in queue and removed it.", durationInHours);
    }
    
    return isOldAgeRequest;
}

#pragma mark ---

- (void)recordEvent:(CountlyEvent *)event
{
    @synchronized (self.recordedEvents)
    {
        if([Countly.user hasUnsyncedChanges])
        {
            [Countly.user save];
        }
        
        [self.recordedEvents addObject:event];
        
        if (self.recordedEvents.count >= self.eventSendThreshold)
        {
            [CountlyConnectionManager.sharedInstance sendEvents];
        }
    }
}

- (NSString *)serializedRecordedEvents
{
    @synchronized (self.recordedEvents)
    {
        if (self.recordedEvents.count == 0)
            return nil;

        NSArray *eventDictionaries = [self.recordedEvents valueForKey:@"dictionaryRepresentation"];

        [self.recordedEvents removeAllObjects];

        return [eventDictionaries cly_JSONify];
    }
}


- (void)flushEvents
{
    @synchronized (self.recordedEvents)
    {
        [self.recordedEvents removeAllObjects];
    }
}

- (void)resetInstance:(BOOL) clearStorage 
{
    CLY_LOG_I(@"%s Clear Storage: %d", __FUNCTION__, clearStorage);
    [CountlyConnectionManager.sharedInstance sendEventsWithSaveIfNeeded];
    [self flushEvents];
    [self clearAllTimedEvents];
    [self flushQueue];
    if(clearStorage)
    {
        [self saveToFile];
    }
    onceToken = 0;
    s_sharedInstance = nil;
}

#pragma mark ---

- (void)recordTimedEvent:(CountlyEvent *)event
{
    @synchronized (self.startedEvents)
    {
        if (self.startedEvents[event.key])
        {
            CLY_LOG_W(@"Event with key '%@' already started!", event.key);
            return;
        }

        self.startedEvents[event.key] = event;
    }
}

- (CountlyEvent *)timedEventForKey:(NSString *)key
{
    @synchronized (self.startedEvents)
    {
        CountlyEvent *event = self.startedEvents[key];
        [self.startedEvents removeObjectForKey:key];

        return event;
    }
}

- (void)clearAllTimedEvents
{
    @synchronized (self.startedEvents)
    {
        [self.startedEvents removeAllObjects];
    }
}

#pragma mark ---

- (void)writeCustomCrashLogToFile:(NSString *)log
{
    static NSURL* crashLogFileURL = nil;

    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^
    {
        crashLogFileURL = [[self storageDirectoryURL] URLByAppendingPathComponent:kCountlyCustomCrashLogFileName];
    });

    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^
    {
        NSString* line = [NSString stringWithFormat:@"%@\n", log];
        NSFileHandle* fileHandle = [NSFileHandle fileHandleForWritingAtPath:crashLogFileURL.path];
        if (fileHandle)
        {
            [fileHandle seekToEndOfFile];
            [fileHandle writeData:[line dataUsingEncoding:NSUTF8StringEncoding]];
            [fileHandle closeFile];
        }
        else
        {
            NSError* error = nil;
            [line writeToFile:crashLogFileURL.path atomically:YES encoding:NSUTF8StringEncoding error:&error];
            if (error)
            {
                CLY_LOG_W(@"%s, Crash Log File can not be created, got error %@", __FUNCTION__, error);
            }
        }
    });
}

- (NSString *)customCrashLogsFromFile
{
    NSURL* crashLogFileURL = [[self storageDirectoryURL] URLByAppendingPathComponent:kCountlyCustomCrashLogFileName];
    NSData* readData = [NSData dataWithContentsOfURL:crashLogFileURL];

    NSString* storedCustomCrashLogs = nil;
    if (readData)
    {
        storedCustomCrashLogs = [NSString.alloc initWithData:readData encoding:NSUTF8StringEncoding];
    }

    return storedCustomCrashLogs;
}

- (void)deleteCustomCrashLogFile
{
    NSURL* crashLogFileURL = [[self storageDirectoryURL] URLByAppendingPathComponent:kCountlyCustomCrashLogFileName];
    NSError* error = nil;
    if ([NSFileManager.defaultManager fileExistsAtPath:crashLogFileURL.path])
    {
        CLY_LOG_D(@"Detected Crash Log File and deleting it.");
        [NSFileManager.defaultManager removeItemAtURL:crashLogFileURL error:&error];
        if (error)
        {
            CLY_LOG_W(@"%s, Crash Log File can not be deleted, got error %@", __FUNCTION__, error);
        }
    }
}

#pragma mark ---

- (NSURL *)storageDirectoryURL
{
    static NSURL* URL = nil;

    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^
    {
#if (TARGET_OS_TV)
        NSSearchPathDirectory directory = NSCachesDirectory;
#else
        NSSearchPathDirectory directory = NSApplicationSupportDirectory;
#endif
        URL = [[NSFileManager.defaultManager URLsForDirectory:directory inDomains:NSUserDomainMask] lastObject];

#if (TARGET_OS_OSX)
        URL = [URL URLByAppendingPathComponent:NSBundle.mainBundle.bundleIdentifier];
#endif
        NSError *error = nil;

        if (![NSFileManager.defaultManager fileExistsAtPath:URL.path])
        {
            [NSFileManager.defaultManager createDirectoryAtURL:URL withIntermediateDirectories:YES attributes:nil error:&error];
            if (error)
            {
                CLY_LOG_W(@"%s, Application Support directory can not be created, got error %@", __FUNCTION__, error);
            }
        }
    });

    return URL;
}

- (NSURL *)storageFileURL
{
    NSString* const kCountlyPersistencyFileName = @"Countly.dat";

    static NSURL* URL = nil;

    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^
    {
        URL = [[self storageDirectoryURL] URLByAppendingPathComponent:kCountlyPersistencyFileName];
    });

    return URL;
}

- (void)saveToFile
{
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^
    {
        [self saveToFileSync];
    });
}

- (void)saveToFileSync
{
    NSData* saveData;

    @synchronized (self)
    {
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
        saveData = [NSKeyedArchiver archivedDataWithRootObject:@{kCountlyQueuedRequestsPersistencyKey: self.queuedRequests}];
#pragma GCC diagnostic pop
    }

    BOOL writeResult = [saveData writeToFile:[self storageFileURL].path atomically:YES];
    CLY_LOG_D(@"Result of writing data to file: %d", writeResult);

    [CountlyCommon.sharedInstance finishBackgroundTask];
}

#pragma mark ---

- (NSString* )retrieveDeviceID
{
    NSString* retrievedDeviceID = [NSUserDefaults.standardUserDefaults objectForKey:kCountlyStoredDeviceIDKey];

    if (retrievedDeviceID)
    {
        CLY_LOG_D(@"Device ID successfully retrieved from UserDefaults: %@", retrievedDeviceID);
        return retrievedDeviceID;
    }

    CLY_LOG_D(@"There is no stored Device ID in UserDefaults!");

    return nil;
}

- (void)storeDeviceID:(NSString *)deviceID
{
    [NSUserDefaults.standardUserDefaults setObject:deviceID forKey:kCountlyStoredDeviceIDKey];
    [NSUserDefaults.standardUserDefaults synchronize];

    CLY_LOG_D(@"Device ID successfully stored in UserDefaults: %@", deviceID);
}

- (NSString *)retrieveNSUUID
{
    return [NSUserDefaults.standardUserDefaults objectForKey:kCountlyStoredNSUUIDKey];
}

- (void)storeNSUUID:(NSString *)UUID
{
    [NSUserDefaults.standardUserDefaults setObject:UUID forKey:kCountlyStoredNSUUIDKey];
    [NSUserDefaults.standardUserDefaults synchronize];
}

- (NSString *)retrieveWatchParentDeviceID
{
    return [NSUserDefaults.standardUserDefaults objectForKey:kCountlyWatchParentDeviceIDKey];
}

- (void)storeWatchParentDeviceID:(NSString *)deviceID
{
    [NSUserDefaults.standardUserDefaults setObject:deviceID forKey:kCountlyWatchParentDeviceIDKey];
    [NSUserDefaults.standardUserDefaults synchronize];
}

- (NSDictionary *)retrieveStarRatingStatus
{
    NSDictionary* status = [NSUserDefaults.standardUserDefaults objectForKey:kCountlyStarRatingStatusKey];
    if (!status)
        status = NSDictionary.new;

    return status;
}

- (void)storeStarRatingStatus:(NSDictionary *)status
{
    [NSUserDefaults.standardUserDefaults setObject:status forKey:kCountlyStarRatingStatusKey];
    [NSUserDefaults.standardUserDefaults synchronize];
}

- (BOOL)retrieveNotificationPermission
{
    return [NSUserDefaults.standardUserDefaults boolForKey:kCountlyNotificationPermissionKey];
}

- (void)storeNotificationPermission:(BOOL)allowed
{
    [NSUserDefaults.standardUserDefaults setBool:allowed forKey:kCountlyNotificationPermissionKey];
    [NSUserDefaults.standardUserDefaults synchronize];
}

- (BOOL)retrieveIsCustomDeviceID
{
    return [NSUserDefaults.standardUserDefaults boolForKey:kCountlyIsCustomDeviceIDKey];
}

- (void)storeIsCustomDeviceID:(BOOL)isCustomDeviceID
{
    [NSUserDefaults.standardUserDefaults setBool:isCustomDeviceID forKey:kCountlyIsCustomDeviceIDKey];
    [NSUserDefaults.standardUserDefaults synchronize];
}

- (NSDictionary *)retrieveRemoteConfig
{
    NSData* data = [NSUserDefaults.standardUserDefaults objectForKey:kCountlyRemoteConfigKey];
    NSDictionary* remoteConfig = [NSKeyedUnarchiver unarchiveObjectWithData:data];
    if (!remoteConfig)
        remoteConfig = NSDictionary.new;
    
    return remoteConfig;
}

- (void)storeRemoteConfig:(NSDictionary *)remoteConfig
{
    [NSUserDefaults.standardUserDefaults setObject:[NSKeyedArchiver archivedDataWithRootObject:remoteConfig] forKey:kCountlyRemoteConfigKey];
    [NSUserDefaults.standardUserDefaults synchronize];
}

- (NSMutableDictionary *)retrieveServerConfig
{
    NSDictionary* serverConfig = [NSUserDefaults.standardUserDefaults objectForKey:kCountlyServerConfigPersistencyKey];
    if ([serverConfig isKindOfClass:[NSDictionary class]]) {
         return [serverConfig mutableCopy];
     }

     return [NSMutableDictionary new];
}

- (void)storeServerConfig:(NSMutableDictionary *)serverConfig
{
    [NSUserDefaults.standardUserDefaults setObject:serverConfig forKey:kCountlyServerConfigPersistencyKey];
    [NSUserDefaults.standardUserDefaults synchronize];
}

- (NSDictionary *)retrieveHealthCheckTrackerState
{
    NSDictionary* healthCheckTrackerState = [NSUserDefaults.standardUserDefaults objectForKey:kCountlyHealthCheckStatePersistencyKey];
    if (!healthCheckTrackerState)
        healthCheckTrackerState = NSDictionary.new;
    
    return healthCheckTrackerState;
}

- (void)storeHealthCheckTrackerState:(NSDictionary *)healthCheckTrackerState
{
    [NSUserDefaults.standardUserDefaults setObject:healthCheckTrackerState forKey:kCountlyHealthCheckStatePersistencyKey];
    [NSUserDefaults.standardUserDefaults synchronize];
}

@end
