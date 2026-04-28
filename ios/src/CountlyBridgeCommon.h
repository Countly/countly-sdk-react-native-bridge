#import <Foundation/Foundation.h>

@interface CountlyCommon : NSObject

@property (nonatomic, copy) NSString *SDKVersion;
@property (nonatomic, copy) NSString *SDKName;
@property (nonatomic) BOOL hasStarted;

+ (instancetype)sharedInstance;

@end