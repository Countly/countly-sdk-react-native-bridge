#import <XCTest/XCTest.h>
#import <objc/runtime.h>

#import <React/RCTLog.h>
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import <React-RCTAppDelegate/RCTReactNativeFactory.h>
#import <React-RCTAppDelegate/RCTRootViewFactory.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

#ifndef COUNTLY_DEVICE_TESTS_NEW_ARCH
#define COUNTLY_DEVICE_TESTS_NEW_ARCH 1
#endif

static NSString *const kLinePrefix = @"CLY_E2E ";
static NSString *const kModuleName = @"HelloWorld";
static const NSTimeInterval kRunTimeout = 25 * 60;

static NSMutableDictionary<NSString *, NSDictionary *> *gResults;
static NSDictionary *gDone;
static NSDictionary *gStart;
static BOOL gRunStarted;

/**
 * Loads the JavaScript bundle that is stored in the test bundle, so the tests need no Metro server.
 */
@interface CountlyDeviceTestDelegate : RCTDefaultReactNativeFactoryDelegate
@end

@implementation CountlyDeviceTestDelegate

/**
 * The development bundle of the test app, built with the Countly.test helpers.
 */
- (NSURL *)bundleURL
{
    return [[NSBundle bundleForClass:[self class]] URLForResource:@"main" withExtension:@"jsbundle"];
}

/**
 * The same bundle for apps that still start through the bridge.
 */
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
    return [self bundleURL];
}

/**
 * The architecture the pods were installed for. React Native reads it from the app's RCTNewArchEnabled entry
 * otherwise, which the test runner app does not have.
 */
- (BOOL)newArchEnabled
{
    return COUNTLY_DEVICE_TESTS_NEW_ARCH == 1;
}

@end

/**
 * Runs the integration scenarios of the React Native example app inside this test runner, on the phone or simulator,
 * and reports each scenario as its own test case.
 */
@interface CountlyDeviceTests : XCTestCase
@end

@implementation CountlyDeviceTests

static RCTReactNativeFactory *gFactory;
static CountlyDeviceTestDelegate *gDelegate;
static UIWindow *gWindow;

/**
 * The scenario ids the build found in the scenario file; each becomes one test case.
 */
+ (NSArray<NSString *> *)scenarioIds
{
    NSURL *url = [[NSBundle bundleForClass:self] URLForResource:@"scenarios" withExtension:@"json"];
    NSData *data = url ? [NSData dataWithContentsOfURL:url] : nil;
    NSArray *ids = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:nil] : nil;
    return [ids isKindOfClass:[NSArray class]] ? ids : @[];
}

/**
 * Builds the suite: one test that checks the whole run finished, then one test per scenario.
 */
+ (XCTestSuite *)defaultTestSuite
{
    XCTestSuite *suite = [XCTestSuite testSuiteWithName:NSStringFromClass(self)];
    [suite addTest:[self testCaseWithSelector:@selector(test_allScenariosFinished)]];
    for (NSString *scenarioId in [self scenarioIds]) {
        NSString *name = [@"test_" stringByAppendingString:[scenarioId stringByReplacingOccurrencesOfString:@"-" withString:@"_"]];
        SEL selector = NSSelectorFromString(name);
        if (![self instancesRespondToSelector:selector]) {
            IMP imp = imp_implementationWithBlock(^(CountlyDeviceTests *test) {
                [test checkScenario:scenarioId];
            });
            class_addMethod(self, selector, imp, "v@:");
        }
        [suite addTest:[self testCaseWithSelector:selector]];
    }
    return suite;
}

/**
 * Reads the CLY_E2E lines that the test app writes with console.log.
 */
+ (void)handleLogMessage:(NSString *)message
{
    NSRange prefix = [message rangeOfString:kLinePrefix];
    if (prefix.location == NSNotFound) {
        return;
    }
    NSString *line = [message substringFromIndex:NSMaxRange(prefix)];
    NSRange space = [line rangeOfString:@" "];
    if (space.location == NSNotFound) {
        return;
    }
    NSString *kind = [line substringToIndex:space.location];
    NSData *json = [[line substringFromIndex:NSMaxRange(space)] dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary *payload = [NSJSONSerialization JSONObjectWithData:json options:0 error:nil];
    if (![payload isKindOfClass:[NSDictionary class]]) {
        return;
    }
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([kind isEqualToString:@"START"]) {
            gStart = payload;
        } else if ([kind isEqualToString:@"RESULT"] && [payload[@"id"] isKindOfClass:[NSString class]]) {
            gResults[payload[@"id"]] = payload;
            NSLog(@"Countly device tests: %@ %@ in %@ ms", payload[@"id"], [payload[@"passed"] boolValue] ? @"passed" : @"failed", payload[@"durationMs"]);
        } else if ([kind isEqualToString:@"DONE"]) {
            gDone = payload;
        }
    });
}

/**
 * Starts React Native with the test app once, from the first test, and waits until it reports DONE or kRunTimeout
 * passes. The suite is a plain XCTestSuite, which does not call the class setUp.
 */
+ (void)runScenariosOnce
{
    if (gRunStarted) {
        return;
    }
    gRunStarted = YES;
    gResults = [NSMutableDictionary dictionary];

    // The runner app starts in the background, where the iOS SDK does not begin sessions; bring it to the foreground
    // as a user would see an app.
    XCUIApplication *runner = [[XCUIApplication alloc] initWithBundleIdentifier:NSBundle.mainBundle.bundleIdentifier];
    [runner activate];
    NSLog(@"Countly device tests: runner application state %ld", (long)UIApplication.sharedApplication.applicationState);

    RCTSetLogThreshold(RCTLogLevelInfo);
    RCTAddLogFunction(^(RCTLogLevel level, RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
        [CountlyDeviceTests handleLogMessage:message];
    });

    gDelegate = [CountlyDeviceTestDelegate new];
    gDelegate.dependencyProvider = [RCTAppDependencyProvider new];
    gFactory = [[RCTReactNativeFactory alloc] initWithDelegate:gDelegate];
    UIView *rootView = [gFactory.rootViewFactory viewWithModuleName:kModuleName initialProperties:nil launchOptions:nil];

    UIWindowScene *windowScene = nil;
    for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
        if ([scene isKindOfClass:[UIWindowScene class]]) {
            windowScene = (UIWindowScene *)scene;
            break;
        }
    }
    gWindow = windowScene ? [[UIWindow alloc] initWithWindowScene:windowScene] : [[UIWindow alloc] initWithFrame:UIScreen.mainScreen.bounds];
    UIViewController *controller = [UIViewController new];
    controller.view = rootView;
    gWindow.rootViewController = controller;
    [gWindow makeKeyAndVisible];

    NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:kRunTimeout];
    while (gDone == nil && deadline.timeIntervalSinceNow > 0) {
        [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.5]];
    }
}

/**
 * Fails when the test app did not start, did not finish in time, or ran other scenarios than the build found.
 */
- (void)test_allScenariosFinished
{
    [[self class] runScenariosOnce];
    XCTAssertNotNil(gStart, @"The test app never reported START: React Native did not load the bundle or the app crashed.");
    XCTAssertNotNil(gDone, @"The test app did not report DONE within %.0f minutes. Scenarios with a result: %@", kRunTimeout / 60, [gResults.allKeys componentsJoinedByString:@", "]);
    NSSet *expected = [NSSet setWithArray:[[self class] scenarioIds]];
    NSSet *reported = [NSSet setWithArray:gResults.allKeys];
    XCTAssertEqualObjects(reported, expected, @"The reported scenarios differ from the scenario file.");
}

/**
 * Passes when the scenario reported a passed result.
 */
- (void)checkScenario:(NSString *)scenarioId
{
    [[self class] runScenariosOnce];
    NSDictionary *result = gResults[scenarioId];
    if (result == nil) {
        [self recordIssue:[[XCTIssue alloc] initWithType:XCTIssueTypeAssertionFailure compactDescription:[NSString stringWithFormat:@"%@ reported no result.", scenarioId]]];
        return;
    }
    if (![result[@"passed"] boolValue]) {
        NSString *description = [NSString stringWithFormat:@"%@: %@", result[@"title"], result[@"message"]];
        XCTIssue *issue = [[XCTIssue alloc] initWithType:XCTIssueTypeAssertionFailure compactDescription:description detailedDescription:result[@"stack"] sourceCodeContext:[XCTSourceCodeContext new] associatedError:nil attachments:@[]];
        [self recordIssue:issue];
    }
}

@end
