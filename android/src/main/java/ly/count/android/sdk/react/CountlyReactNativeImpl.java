package ly.count.android.sdk.react;

import android.app.Activity;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.net.Uri;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.JavaScriptModule;

import android.content.Context;

import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import ly.count.android.sdk.Countly;
import ly.count.android.sdk.CountlyConfig;
import ly.count.android.sdk.CountlyStore;
import ly.count.android.sdk.DeviceIdType;
import ly.count.android.sdk.ModuleLog;
import ly.count.android.sdk.RCData;
import ly.count.android.sdk.RCDownloadCallback;
import ly.count.android.sdk.RemoteConfigCallback;
import ly.count.android.sdk.FeedbackRatingCallback;
import ly.count.android.sdk.ContentCallback;
import ly.count.android.sdk.ContentStatus;
import ly.count.android.sdk.WebViewDisplayOption;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.Arrays;
import java.util.Map;
import java.util.HashMap;
import java.util.Iterator;

//Push Plugin
import android.os.Build;
import android.app.NotificationManager;
import android.app.NotificationChannel;

import androidx.annotation.NonNull;

import ly.count.android.sdk.RequestResult;
import ly.count.android.sdk.StarRatingCallback;
import ly.count.android.sdk.messaging.CountlyConfigPush;
import ly.count.android.sdk.messaging.CountlyPush;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;

import ly.count.android.sdk.ModuleFeedback.*;

import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

class CountlyReactException extends Exception {
    private final String jsError;
    private final String jsStack;
    private final String jsMessage;

    CountlyReactException(String err, String message, String stack) {
        jsError = err;
        jsStack = stack;
        jsMessage = message;
    }

    @NonNull
    public String toString() {
        return "[React] " + jsError + ": " + jsMessage + "\n" + jsStack + "\n\nJava Stack:";
    }
}

public class CountlyReactNativeImpl extends ReactContextBaseJavaModule implements LifecycleEventListener {

    public static final String NAME = "CountlyReactNative";
    public static final String TAG = "CountlyRNPlugin";
    private String COUNTLY_RN_SDK_VERSION_STRING = "26.1.0";
    private String COUNTLY_RN_SDK_NAME = "js-rnb-android-np";

    private static CountlyConfig config = new CountlyConfig();
    private static String channelName = "General Notifications";
    private static String channelDescription = "Receive notifications about important updates and events.";
    private static CCallback notificationListener = null;
    private static String lastStoredNotification = null;
    protected static boolean loggingEnabled = false;

    private List<String> allowedIntentClassNames = new ArrayList<>();
    private List<String> allowedIntentPackageNames = new ArrayList<>();
    private boolean useAdditionalIntentRedirectionChecks = true;

    private final ReactApplicationContext _reactContext;

    private static String widgetShownCallbackName = "widgetShownCallback";
    private static String widgetClosedCallbackName = "widgetClosedCallback";
    private static String ratingWidgetCallbackName = "ratingWidgetCallback";
    private static String pushNotificationCallbackName = "pushNotificationCallback";
    private static boolean requestCaptureEnabled = false;
    private static boolean requestCaptureGeneratorInstalled = false;
    private static boolean applicationCallbacksConfigured = false;
    private static final List<String> capturedRequests = new ArrayList<>();
    private List<CountlyFeedbackWidget> retrievedWidgetList = null;

    private final Set<String> validConsentFeatureNames = new HashSet<>(Arrays.asList(
        Countly.CountlyFeatureNames.sessions,
        Countly.CountlyFeatureNames.events,
        Countly.CountlyFeatureNames.views,
        Countly.CountlyFeatureNames.location,
        Countly.CountlyFeatureNames.crashes,
        Countly.CountlyFeatureNames.attribution,
        Countly.CountlyFeatureNames.users,
        Countly.CountlyFeatureNames.push,
        Countly.CountlyFeatureNames.starRating,
        Countly.CountlyFeatureNames.apm,
        Countly.CountlyFeatureNames.feedback,
        Countly.CountlyFeatureNames.remoteConfig,
        Countly.CountlyFeatureNames.content
    ));

    public CountlyReactNativeImpl(ReactApplicationContext reactContext) {
        super(reactContext);
        _reactContext = reactContext;
        reactContext.addLifecycleEventListener(this);
    }

    private void resetTestingState() {
        config = new CountlyConfig();
        channelName = "General Notifications";
        channelDescription = "Receive notifications about important updates and events.";
        notificationListener = null;
        loggingEnabled = false;
        allowedIntentClassNames.clear();
        allowedIntentPackageNames.clear();
        useAdditionalIntentRedirectionChecks = true;
        retrievedWidgetList = null;
        requestCaptureEnabled = false;
        requestCaptureGeneratorInstalled = false;
        synchronized (capturedRequests) {
            capturedRequests.clear();
        }
    }

    private void recordCapturedRequest(String kind, String requestData, String customEndpoint, Object connectionProcessor, boolean requestShouldBeDelayed, boolean networkingIsEnabled) {
        try {
            JSONObject capturedRequest = new JSONObject();
            capturedRequest.put("kind", kind);
            capturedRequest.put("requestData", requestData == null ? "" : requestData);
            capturedRequest.put("customEndpoint", customEndpoint == null ? "" : customEndpoint);
            capturedRequest.put("requestShouldBeDelayed", requestShouldBeDelayed);
            capturedRequest.put("networkingEnabled", networkingIsEnabled);

            String serverURL = "";
            if (connectionProcessor != null) {
                try {
                    Method getServerURL = connectionProcessor.getClass().getDeclaredMethod("getServerURL");
                    getServerURL.setAccessible(true);
                    Object serverURLValue = getServerURL.invoke(connectionProcessor);
                    if (serverURLValue instanceof String) {
                        serverURL = (String) serverURLValue;
                    }
                } catch (Exception ignored) {
                }
            }

            capturedRequest.put("serverURL", serverURL);
            synchronized (capturedRequests) {
                capturedRequests.add(capturedRequest.toString());
            }
        } catch (JSONException ignored) {
        }
    }

    private void invokeImmediateCallback(Object callback) {
        if (callback == null) {
            return;
        }

        try {
            Method callbackMethod = callback.getClass().getDeclaredMethod("callback", JSONObject.class);
            callbackMethod.setAccessible(true);
            callbackMethod.invoke(callback, new JSONObject());
        } catch (Exception ignored) {
        }
    }

    private Object invokeProxyDelegate(Object delegate, Method method, Object[] args, String context) throws Throwable {
        try {
            return method.invoke(delegate, args);
        } catch (InvocationTargetException exception) {
            Throwable cause = exception.getCause() == null ? exception : exception.getCause();
            log("requestCaptureProxy, Delegate invocation failed in " + context, cause, LogLevel.ERROR);
            if (cause instanceof RuntimeException) {
                throw (RuntimeException) cause;
            }
            if (cause instanceof Error) {
                throw (Error) cause;
            }
            throw new RuntimeException("Countly delegate invocation failed in " + context, cause);
        } catch (IllegalAccessException | IllegalArgumentException exception) {
            log("requestCaptureProxy, Reflection failed in " + context, exception, LogLevel.ERROR);
            throw new RuntimeException("Countly delegate reflection failed in " + context, exception);
        }
    }

    private Object instantiateRequestMaker(Class<?> makerClass, String context) {
        try {
            java.lang.reflect.Constructor<?> constructor = makerClass.getDeclaredConstructor();
            constructor.setAccessible(true);
            return constructor.newInstance();
        } catch (InvocationTargetException exception) {
            Throwable cause = exception.getCause() == null ? exception : exception.getCause();
            log("requestCaptureProxy, Request maker construction failed in " + context, cause, LogLevel.ERROR);
            if (cause instanceof RuntimeException) {
                throw (RuntimeException) cause;
            }
            if (cause instanceof Error) {
                throw (Error) cause;
            }
            throw new RuntimeException("Countly request maker construction failed in " + context, cause);
        } catch (ReflectiveOperationException exception) {
            log("requestCaptureProxy, Request maker reflection failed in " + context, exception, LogLevel.ERROR);
            throw new RuntimeException("Countly request maker reflection failed in " + context, exception);
        }
    }

    private Object createImmediateRequestProxy(final String kind, final Object delegateMaker, Class<?> immediateRequestInterface) {
        InvocationHandler requestHandler = (proxy, method, args) -> {
            if (!"doWork".equals(method.getName())) {
                return invokeProxyDelegate(delegateMaker, method, args, kind + "." + method.getName());
            }

            String requestData = args != null && args.length > 0 && args[0] instanceof String ? (String) args[0] : "";
            String customEndpoint = args != null && args.length > 1 && args[1] instanceof String ? (String) args[1] : "";
            Object connectionProcessor = args != null && args.length > 2 ? args[2] : null;
            boolean requestShouldBeDelayed = args != null && args.length > 3 && args[3] instanceof Boolean && (Boolean) args[3];
            boolean networkingIsEnabled = args != null && args.length > 4 && args[4] instanceof Boolean && (Boolean) args[4];
            Object callback = args != null && args.length > 5 ? args[5] : null;

            if (requestCaptureEnabled) {
                recordCapturedRequest(kind, requestData, customEndpoint, connectionProcessor, requestShouldBeDelayed, networkingIsEnabled);
                invokeImmediateCallback(callback);
                return null;
            }

            return invokeProxyDelegate(delegateMaker, method, args, kind + ".doWork");
        };

        return Proxy.newProxyInstance(immediateRequestInterface.getClassLoader(), new Class<?>[] { immediateRequestInterface }, requestHandler);
    }

    private void installRequestCaptureGenerator() {
        if (requestCaptureGeneratorInstalled) {
            return;
        }

        try {
            Field generatorField = CountlyConfig.class.getDeclaredField("immediateRequestGenerator");
            generatorField.setAccessible(true);

            final Object existingGenerator = generatorField.get(config);
            final Class<?> immediateRequestGeneratorInterface = Class.forName("ly.count.android.sdk.ImmediateRequestGenerator");
            final Class<?> immediateRequestInterface = Class.forName("ly.count.android.sdk.ImmediateRequestI");
            final Class<?> immediateRequestMakerClass = Class.forName("ly.count.android.sdk.ImmediateRequestMaker");
            final Class<?> preflightRequestMakerClass = Class.forName("ly.count.android.sdk.PreflightRequestMaker");

            InvocationHandler generatorHandler = (proxy, method, args) -> {
                String methodName = method.getName();
                Object delegateMaker;

                if (existingGenerator != null) {
                    delegateMaker = invokeProxyDelegate(existingGenerator, method, args, "generator." + methodName);
                } else if ("CreateImmediateRequestMaker".equals(methodName)) {
                    delegateMaker = instantiateRequestMaker(immediateRequestMakerClass, "generator." + methodName);
                } else if ("CreatePreflightRequestMaker".equals(methodName)) {
                    delegateMaker = instantiateRequestMaker(preflightRequestMakerClass, "generator." + methodName);
                } else {
                    return null;
                }

                if (delegateMaker == null) {
                    delegateMaker = "CreatePreflightRequestMaker".equals(methodName)
                        ? instantiateRequestMaker(preflightRequestMakerClass, "generator." + methodName + ".fallback")
                        : instantiateRequestMaker(immediateRequestMakerClass, "generator." + methodName + ".fallback");
                }

                if (!requestCaptureEnabled) {
                    return delegateMaker;
                }

                String kind = "CreatePreflightRequestMaker".equals(methodName) ? "preflight" : "direct";
                return createImmediateRequestProxy(kind, delegateMaker, immediateRequestInterface);
            };

            Object capturingGenerator = Proxy.newProxyInstance(
                immediateRequestGeneratorInterface.getClassLoader(),
                new Class<?>[] { immediateRequestGeneratorInterface },
                generatorHandler
            );

            generatorField.set(config, capturingGenerator);
            requestCaptureGeneratorInstalled = true;
        } catch (Exception exception) {
            requestCaptureGeneratorInstalled = false;
            log("installRequestCaptureGenerator, Failed to install capture generator: " + exception, LogLevel.WARNING);
        }
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    
    public void init(ReadableArray args, Promise promise) {
        try {
            log("Initializing...", LogLevel.DEBUG);

            String argsMap = args.getString(0);
            JSONObject argsObject = new JSONObject(argsMap);
            populateConfig(argsObject);
        } catch (Exception e) {
            log("Failed to parse Config Object. [" + e.toString() + "]", LogLevel.DEBUG);
        }

        Countly.sharedInstance().COUNTLY_SDK_NAME = COUNTLY_RN_SDK_NAME;
        Countly.sharedInstance().COUNTLY_SDK_VERSION_STRING = COUNTLY_RN_SDK_VERSION_STRING;

        config.setContext(_reactContext);
        Activity activity = getActivity();
        if (activity != null) {
            if (!applicationCallbacksConfigured) {
                config.setApplication(activity.getApplication());
            }
            config.setInitialActivity(activity);
        } else {
            log("init, Activity is null, some features will not work", LogLevel.WARNING);
        }

        try {
            if (requestCaptureEnabled) {
                installRequestCaptureGenerator();
            }
            Countly.sharedInstance().init(config);
            if (activity != null) {
                applicationCallbacksConfigured = true;
            }
            promise.resolve("Success");
        } catch (Exception exception) {
            log("init, Countly native initialization failed", exception, LogLevel.ERROR);
            promise.reject("COUNTLY_INIT_FAILED", exception.getMessage(), exception);
        }
    }

    private void populateConfig(JSONObject _config) {
        try {
            if (_config.has("serverURL")) {
                config.setServerURL(_config.getString("serverURL"));
            }
            if (_config.has("appKey")) {
                config.setAppKey(_config.getString("appKey"));
            }
            if (_config.has("deviceID")) {
                String deviceID = _config.getString("deviceID");
                if (deviceID.equals("TemporaryDeviceID")) {
                    config.enableTemporaryDeviceIdMode();
                } else {
                    config.setDeviceId(deviceID);
                }
            }
            config.enrollABOnRCDownload();
            if (_config.has("loggingEnabled")) {
                boolean isEnabled = _config.getBoolean("loggingEnabled");
                loggingEnabled = isEnabled;
                config.setLoggingEnabled(isEnabled);
            }
            if (_config.has("shouldRequireConsent")) {
                config.setRequiresConsent(_config.getBoolean("shouldRequireConsent"));
            }
            if (_config.has("tamperingProtectionSalt")) {
                config.setParameterTamperingProtectionSalt(_config.getString("tamperingProtectionSalt"));
            }

            if (_config.has("consents")) {
                JSONArray consentsArr = _config.getJSONArray("consents");
                String[] newArray = new String[consentsArr.length()];
                for (int i = 0; i < consentsArr.length(); i++) {
                    newArray[i] = consentsArr.getString(i);
                }
                config.setConsentEnabled(newArray);
            }
            if (_config.has("starRatingTextTitle")) {
                config.setStarRatingTextTitle(_config.getString("starRatingTextTitle"));
            }
            if (_config.has("starRatingTextMessage")) {
                config.setStarRatingTextMessage(_config.getString("starRatingTextMessage"));
            }
            if (_config.has("starRatingTextDismiss")) {
                config.setStarRatingTextDismiss(_config.getString("starRatingTextDismiss"));
            }
            // APM ------------------------------------------------
            if (_config.has("enableForegroundBackground")) {
                config.apm.enableForegroundBackgroundTracking();
            }
            if (_config.has("enableManualAppLoaded")) {
                config.apm.enableManualAppLoadedTrigger();
            }
            if (_config.has("startTSOverride")) {
                config.apm.setAppStartTimestampOverride(_config.getLong("startTSOverride"));
            }
            if (_config.has("trackAppStartTime")) {
                config.apm.enableAppStartTimeTracking();
            }
            // Legacy APM
            if (_config.has("enableApm")) {
                if (_config.getBoolean("enableApm")) {
                    config.apm.enableAppStartTimeTracking();
                }
            }
            // APM END --------------------------------------------
            if (_config.has("enablePreviousNameRecording")) {
                config.experimental.enablePreviousNameRecording();
            }
            if (_config.has("enableVisibilityTracking")) {
                config.experimental.enableVisibilityTracking();
            }
            if (_config.has("setZoneTimerInterval")) {
                config.content.setZoneTimerInterval(_config.getInt("setZoneTimerInterval"));
            }
            if (_config.has("setGlobalContentCallback")) {
                config.content.setGlobalContentCallback(new ContentCallback() {
                    @Override
                    public void onContentCallback(ContentStatus contentStatus,Map<String, Object> contentData) {
                        JSONObject contentMap = new JSONObject();
                        try {
                            contentMap.put("status", contentStatus.toString());
                            contentMap.put("data", new JSONObject(contentData));
                        } catch (JSONException e) {
                            log("onContentCallback, JSON exception: ", e, LogLevel.ERROR);
                        }
                        
                        ((ReactApplicationContext) _reactContext)
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("globalContentCallback", contentMap.toString());
                    }
                });
            }
            if (_config.has("webViewDisplayOption")) {
                String displayOption = _config.getString("webViewDisplayOption");
                if ("SAFE_AREA".equals(displayOption)) {
                    config.setWebviewDisplayOption(WebViewDisplayOption.SAFE_AREA);
                } else {
                    config.setWebviewDisplayOption(WebViewDisplayOption.IMMERSIVE);
                }
            }
            // Limits -----------------------------------------------
            if(_config.has("maxKeyLength")) {
                config.sdkInternalLimits.setMaxKeyLength(_config.getInt("maxKeyLength"));
            }
            if(_config.has("maxValueSize")) {
                config.sdkInternalLimits.setMaxValueSize(_config.getInt("maxValueSize"));
            }
            if(_config.has("maxSegmentationValues")) {
                config.sdkInternalLimits.setMaxSegmentationValues(_config.getInt("maxSegmentationValues"));
            }
            if(_config.has("maxBreadcrumbCount")) {
                config.sdkInternalLimits.setMaxBreadcrumbCount(_config.getInt("maxBreadcrumbCount"));
            }
            if(_config.has("maxStackTraceLinesPerThread")) {
                config.sdkInternalLimits.setMaxStackTraceLinesPerThread(_config.getInt("maxStackTraceLinesPerThread"));
            }
            if(_config.has("maxStackTraceLineLength")) {
                config.sdkInternalLimits.setMaxStackTraceLineLength(_config.getInt("maxStackTraceLineLength"));
            }
            // Limits End -------------------------------------------
            if (_config.has("crashReporting")) {
                config.crashes.enableCrashReporting();
            }
            if (_config.has("pushNotification")) {
                JSONObject pushObject = _config.getJSONObject("pushNotification");
                if (!pushObject.toString().equals("{}")) {
                    channelName = pushObject.getString("channelName");
                    channelDescription = pushObject.getString("channelDescription");
                    if (pushObject.has("accentColor")) {
                        setHexNotificationAccentColor(pushObject.getString("accentColor"));
                    }
                }
            }
            if (_config.has("attributionID")) {
                log("recordAttributionID: Not implemented for Android", LogLevel.DEBUG);
            }
            if (_config.has("disableAdditionalIntentRedirectionChecks")) {
                useAdditionalIntentRedirectionChecks = false;
            }
            if (_config.has("allowedIntentClassNames")) {
                JSONArray intentArr = _config.getJSONArray("allowedIntentClassNames");
                String[] newArray = new String[intentArr.length()];
                for (int i = 0; i < intentArr.length(); i++) {
                    newArray[i] = intentArr.getString(i);
                }
                allowedIntentClassNames = Arrays.asList(newArray);
            }
            if (_config.has("allowedIntentPackageNames")) {
                JSONArray packageArr = _config.getJSONArray("allowedIntentPackageNames");
                String[] newArray = new String[packageArr.length()];
                for (int i = 0; i < packageArr.length(); i++) {
                    newArray[i] = packageArr.getString(i);
                }
                allowedIntentPackageNames = Arrays.asList(newArray);
            }
            String countryCode = null;
            String city = null;
            String gpsCoordinates = null;
            String ipAddress = null;

            if (_config.has("locationCountryCode")) {
                countryCode = _config.getString("locationCountryCode");
            }
            if (_config.has("locationCity")) {
                city = _config.getString("locationCity");
            }
            if (_config.has("locationGpsCoordinates")) {
                gpsCoordinates = _config.getString("locationGpsCoordinates");
            }
            if (_config.has("locationIpAddress")) {
                ipAddress = _config.getString("locationIpAddress");
            }
            if (city != null || countryCode != null || gpsCoordinates != null || ipAddress != null) {
                config.setLocation(countryCode, city, gpsCoordinates, ipAddress);
            }

            if (_config.has("campaignType")) {
                String campaignType = _config.getString("campaignType");
                String campaignData = _config.getString("campaignData");
                config.setDirectAttribution(campaignType, campaignData);
            }
            if (_config.has("attributionValues")) {
                JSONObject attributionValues = _config.getJSONObject("attributionValues");
                if (attributionValues != null && attributionValues.length() > 0) {
                    Map<String, String> attributionMap = toMapString(attributionValues);
                    config.setIndirectAttribution(attributionMap);
                } else {
                    log("RecordIndirectAttribution: failure, no attribution values provided", LogLevel.DEBUG);
                }
            }
            if (_config.has("requestTimeoutDuration")) {
                int timeout = _config.getInt("requestTimeoutDuration");
                if (timeout > 0) {
                    config.setRequestTimeoutDuration(timeout);
                } else {
                    log("setRequestTimeoutDuration: failure, timeout value must be greater than 0", LogLevel.DEBUG);
                }
            }
            if (_config.has("enableAutomaticViewTracking") && _config.getBoolean("enableAutomaticViewTracking")) {
                config.enableAutomaticViewTracking();
            }
            if (_config.has("automaticViewTrackingExclusionList")) {
                JSONArray exclusionList = _config.getJSONArray("automaticViewTrackingExclusionList");
                List<Class<?>> resolvedExclusions = new ArrayList<>();
                for (int i = 0; i < exclusionList.length(); i++) {
                    String className = exclusionList.optString(i, null);
                    Class<?> resolvedClass = resolveTrackedActivityClass(className);
                    if (resolvedClass != null) {
                        resolvedExclusions.add(resolvedClass);
                    }
                }
                config.setAutomaticViewTrackingExclusions(resolvedExclusions.toArray(new Class[0]));
            }
            if (_config.has("globalViewSegmentation")) {
                JSONObject globalViewSegmentation = _config.getJSONObject("globalViewSegmentation");
                config.setGlobalViewSegmentation(toMapObject(globalViewSegmentation));
            }
            if (_config.has("manualSessionHandling") && _config.getBoolean("manualSessionHandling")) {
                config.enableManualSessionControl();
            }
            if (_config.has("enableManualSessionControlHybridMode") && _config.getBoolean("enableManualSessionControlHybridMode")) {
                config.enableManualSessionControl();
                config.enableManualSessionControlHybridMode();
            }
            if (_config.has("customNetworkRequestHeaders")) {
                JSONObject customHeaderValues = _config.getJSONObject("customNetworkRequestHeaders");
                if (customHeaderValues != null && customHeaderValues.length() > 0) {
                    config.addCustomNetworkRequestHeaders(toMapString(customHeaderValues));
                }
            }
            if (_config.has("disableSDKBehaviorSettingsUpdates")) {
                boolean disableUpdates = _config.getBoolean("disableSDKBehaviorSettingsUpdates");
                if (disableUpdates) {
                    config.disableSDKBehaviorSettingsUpdates();
                }
            }
            if (_config.has("disableBackoffMechanism")) {
                boolean disableBackoff = _config.getBoolean("disableBackoffMechanism");
                if (disableBackoff) {
                    config.disableBackoffMechanism();
                }
            }
            if (_config.has("disableGradualRequestCleaner") && _config.getBoolean("disableGradualRequestCleaner")) {
                config.disableGradualRequestCleaner();
            }
            if (_config.has("disableViewRestartForManualRecording") && _config.getBoolean("disableViewRestartForManualRecording")) {
                config.disableViewRestartForManualRecording();
            }
            if (_config.has("sdkBehaviorSettings")) {
                JSONObject sdkBehaviorSettings = _config.getJSONObject("sdkBehaviorSettings");
                String sdkBehaviorSettingsString = sdkBehaviorSettings.toString();
                config.setSDKBehaviorSettings(sdkBehaviorSettingsString);
            }
        } catch (Exception e) {
            log(e.toString(), LogLevel.DEBUG);
        }
    }

    private void setHexNotificationAccentColor(final String hex) {
        if (hex == null) {
            log("setHexNotificationAccentColor: invalid HEX color value. 'null' is not a valid color.", LogLevel.ERROR);
            return;
        }
        if (hex.isEmpty() || hex.charAt(0) != '#') {
            log("setHexNotificationAccentColor: invalid HEX color value. Valid colors should start with '#': " + hex, LogLevel.ERROR);
            return;
        }
        if (hex.length() != 7 && hex.length() != 9) {
            log("setHexNotificationAccentColor: invalid HEX color value, unexpected size. Hex color should be 7 or 9 in lenght: " + hex, LogLevel.ERROR);
            return;
        }

        try {
            int color = Color.parseColor(hex);
            CountlyPush.setNotificationAccentColor(
                Color.alpha(color),
                Color.red(color),
                Color.green(color),
                Color.blue(color)
            );
        } catch (IllegalArgumentException e) {
            log("setHexNotificationAccentColor: invalid HEX color value: " + hex + " Error: " + e, LogLevel.ERROR);
        }
    }

    public static Map<String, String> toMapString(JSONObject jsonobj) {
        Map<String, String> map = new HashMap<>();
        try {
            Iterator<String> keys = jsonobj.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                Object value = jsonobj.get(key);
                if (value instanceof String) {
                    map.put(key, (String) value);
                }
            }
        } catch (JSONException e) {
            log("Exception occurred at 'toMapString' method: ", e, LogLevel.ERROR);
        }
        return map;
    }

    public static Map<String, Object> toMapObject(JSONObject jsonobj) {
        Map<String, Object> map = new HashMap<>();
        if (jsonobj == null) {
            return map;
        }
        try {
            Iterator<String> keys = jsonobj.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                Object value = jsonobj.get(key);
                Object parsedValue = jsonValueToJava(value);
                if (parsedValue != null) {
                    map.put(key, parsedValue);
                }
            }
        } catch (JSONException e) {
            log("Exception occurred at 'toMapObject' method: ", e, LogLevel.ERROR);
        }
        return map;
    }

    private static Object jsonValueToJava(Object value) throws JSONException {
        if (value == null || value == JSONObject.NULL) {
            return null;
        }

        if (value instanceof JSONArray) {
            JSONArray array = (JSONArray) value;
            List<Object> list = new ArrayList<>();
            for (int i = 0; i < array.length(); i++) {
                Object arrayValue = jsonValueToJava(array.get(i));
                if (arrayValue != null) {
                    list.add(arrayValue);
                }
            }
            return list;
        }

        if (value instanceof JSONObject) {
            return toMapObject((JSONObject) value);
        }

        if (value instanceof Number) {
            double doubleValue = ((Number) value).doubleValue();
            int intValue = (int) doubleValue;
            if (doubleValue == intValue) {
                return intValue;
            }
            return doubleValue;
        }

        return value;
    }

    private Class<?> resolveTrackedActivityClass(String className) {
        if (className == null || className.isEmpty()) {
            return null;
        }

        try {
            return Class.forName(className);
        } catch (ClassNotFoundException ignored) {
        }

        Activity activity = getActivity();
        if (activity != null && !className.contains(".")) {
            String packageClassName = activity.getPackageName() + "." + className;
            try {
                return Class.forName(packageClassName);
            } catch (ClassNotFoundException ignored) {
            }
        }

        log("populateConfig, Failed to resolve automatic view tracking exclusion class: " + className, LogLevel.WARNING);
        return null;
    }

    private Object getReadableArrayValue(ReadableArray args, int index) {
        if (args == null || index < 0 || index >= args.size() || args.isNull(index)) {
            return null;
        }

        ReadableType type = args.getType(index);
        switch (type) {
            case Boolean:
                return args.getBoolean(index);
            case Number:
                double numberValue = args.getDouble(index);
                if (numberValue % 1 == 0) {
                    if (numberValue >= Integer.MIN_VALUE && numberValue <= Integer.MAX_VALUE) {
                        return (int) numberValue;
                    }
                    if (numberValue >= Long.MIN_VALUE && numberValue <= Long.MAX_VALUE) {
                        return (long) numberValue;
                    }
                }
                return numberValue;
            case String:
                return args.getString(index);
            case Array:
                return args.getArray(index).toArrayList();
            case Map:
                return args.getMap(index).toHashMap();
            case Null:
            default:
                return null;
        }
    }

    private Map<String, Object> convertReadableArrayToSegmentation(ReadableArray args, int startIndex) {
        Map<String, Object> segmentation = new HashMap<>();
        if (args == null) {
            return segmentation;
        }

        for (int i = startIndex; i < args.size(); i += 2) {
            if (i + 1 >= args.size() || args.isNull(i)) {
                continue;
            }

            String key = args.getString(i);
            Object value = getReadableArrayValue(args, i + 1);
            if (key != null && value != null) {
                segmentation.put(key, value);
            }
        }

        return segmentation;
    }

    public static WritableMap toWritableMap(JSONObject jsonObject) {
        WritableMap map = new WritableNativeMap();
        try {
            Iterator<String> iterator = jsonObject.keys();
            while (iterator.hasNext()) {
                String key = iterator.next();
                Object value = jsonObject.get(key);
                if (value instanceof JSONObject) {
                    map.putMap(key, toWritableMap((JSONObject) value));
                } else if (value instanceof JSONArray) {
                    map.putArray(key, toWritableArray((JSONArray) value));
                } else if (value instanceof Boolean) {
                    map.putBoolean(key, (Boolean) value);
                } else if (value instanceof Integer) {
                    map.putInt(key, (Integer) value);
                } else if (value instanceof Double) {
                    map.putDouble(key, (Double) value);
                } else if (value instanceof String) {
                    map.putString(key, (String) value);
                } else {
                    map.putString(key, value.toString());
                }
            }
        } catch (JSONException e) {
            log("Exception occurred at 'toWritableMap' method: ", e, LogLevel.ERROR);
        }
        return map;
    }

    public static WritableArray toWritableArray(JSONArray jsonArray) {
        WritableArray array = new WritableNativeArray();
        try {
            for (int i = 0; i < jsonArray.length(); i++) {
                Object value = jsonArray.get(i);
                if (value instanceof JSONObject) {
                    array.pushMap(toWritableMap((JSONObject) value));
                } else if (value instanceof JSONArray) {
                    array.pushArray(toWritableArray((JSONArray) value));
                } else if (value instanceof Boolean) {
                    array.pushBoolean((Boolean) value);
                } else if (value instanceof Integer) {
                    array.pushInt((Integer) value);
                } else if (value instanceof Double) {
                    array.pushDouble((Double) value);
                } else if (value instanceof String) {
                    array.pushString((String) value);
                } else {
                    array.pushString(value.toString());
                }
            }
        } catch (JSONException e) {
            log("Exception occurred at 'toWritableArray' method: ", e, LogLevel.ERROR);
        }
        return array;
    }

    public JSONObject toJSONObject(ReadableMap readableMap) {
        JSONObject object = new JSONObject();
        try {
            ReadableMapKeySetIterator iterator = readableMap.keySetIterator();
            while (iterator.hasNextKey()) {
                String key = iterator.nextKey();
                switch (readableMap.getType(key)) {
                    case Null:
                        object.put(key, JSONObject.NULL);
                        break;
                    case Boolean:
                        object.put(key, readableMap.getBoolean(key));
                        break;
                    case Number:
                        object.put(key, readableMap.getInt(key));
                        break;
                    case String:
                        object.put(key, readableMap.getString(key));
                        break;
                    case Map:
                        object.put(key, toJSONObject(readableMap.getMap(key)));
                        break;
                    case Array:
                        object.put(key, toJSONArray(readableMap.getArray(key)));
                        break;
                }
            }
        } catch (JSONException e) {
            log("Exception occurred at 'toJSONObject' method: ", e, LogLevel.ERROR);
        }
        return object;
    }

    public JSONArray toJSONArray(ReadableArray readableArray) {
        JSONArray array = new JSONArray();
        try {
            for (int i = 0; i < readableArray.size(); i++) {
                switch (readableArray.getType(i)) {
                    case Null:
                        break;
                    case Boolean:
                        array.put(readableArray.getBoolean(i));
                        break;
                    case Number:
                        array.put(readableArray.getDouble(i));
                        break;
                    case String:
                        array.put(readableArray.getString(i));
                        break;
                    case Map:
                        array.put(toJSONObject(readableArray.getMap(i)));
                        break;
                    case Array:
                        array.put(toJSONArray(readableArray.getArray(i)));
                        break;
                }
            }
        } catch (JSONException e) {
            log("Exception occurred at 'toJSONArray' method: ", e, LogLevel.ERROR);
        }
        return array;
    }

    
    public void setLoggingEnabled(ReadableArray args) {
        boolean enabled = args.getBoolean(0);
        config.setLoggingEnabled(enabled);
        loggingEnabled = enabled;
    }

    
    public void isLoggingEnabled(final Promise promise) {
        boolean result;
        result = loggingEnabled;
        promise.resolve(result);
    }

    
    public void isInitialized(Promise promise) {
        Boolean result = Countly.sharedInstance().isInitialized();
        promise.resolve(result);
    }

    
    public void getCurrentDeviceId(Promise promise) {
        String deviceID = Countly.sharedInstance().deviceId().getID();
        if (deviceID == null) {
            log("getCurrentDeviceId, deviceIdNotFound", LogLevel.DEBUG);
            promise.resolve("deviceIdNotFound");
        } else {
            log("getCurrentDeviceId: " + deviceID, LogLevel.DEBUG);
            promise.resolve(deviceID);
        }
    }

    
    public void getDeviceIDType(Promise promise) {
        DeviceIdType deviceIDType = Countly.sharedInstance().deviceId().getType();
        int deviceIDTypeInt = 10101;
        if (deviceIDType.equals(DeviceIdType.DEVELOPER_SUPPLIED)) {
            deviceIDTypeInt = 20202;
        } else if (deviceIDType.equals(DeviceIdType.TEMPORARY_ID)) {
            deviceIDTypeInt = 30303;
        }

        promise.resolve(deviceIDTypeInt);
    }

    
    public void changeDeviceId(ReadableArray args) {
        String newDeviceID = args.getString(0);
        String onServerString = args.getString(1);
        if (newDeviceID.equals("TemporaryDeviceID")) {
            Countly.sharedInstance().deviceId().enableTemporaryIdMode();
        } else {
            if ("1".equals(onServerString)) {
                Countly.sharedInstance().deviceId().changeWithMerge(newDeviceID);
            } else {
                Countly.sharedInstance().deviceId().changeWithoutMerge(newDeviceID);
            }
        }
    }

    
    public void setHttpPostForced(ReadableArray args) {
        int isEnabled = Integer.parseInt(args.getString(0));
        if (isEnabled == 1) {
            config.setHttpPostForced(true);
        } else {
            config.setHttpPostForced(false);
        }
    }

    
    public void pinnedCertificates(ReadableArray args) {
        String certificateName = args.getString(0);
        config.enablePublicKeyPinning(this.readCertificate(certificateName));
    }

    public String[] readCertificate(String certificateName) {
        StringBuilder certificateString = new StringBuilder();
        BufferedReader reader = null;
        try {
            reader = new BufferedReader(
                new InputStreamReader(this._reactContext.getAssets().open(certificateName)));

            // do reading, usually loop until end of file reading
            String mLine;
            while ((mLine = reader.readLine()) != null) {
                certificateString.append(mLine);
            }
            return new String[] { certificateString.toString() };
        } catch (IOException e) {
            //log the exception
        } finally {
            if (reader != null) {
                try {
                    reader.close();
                } catch (IOException e) {
                    //log the exception
                }
            }
        }
        log("Certificate failed.", LogLevel.INFO);
        return new String[] {};
    }

    
    public void setLocation(ReadableArray args) {
        String countryCode = args.getString(0);
        String city = args.getString(1);
        String location = args.getString(2);
        String ipAddress = args.getString(3);
        if ("null".equals(countryCode)) {
            countryCode = null;
        }
        if ("null".equals(city)) {
            city = null;
        }
        if ("null".equals(location)) {
            location = null;
        }
        if ("null".equals(ipAddress)) {
            ipAddress = null;
        }
        Countly.sharedInstance().location().setLocation(countryCode, city, location, ipAddress);
    }

    
    public void disableLocation() {
        if (Countly.sharedInstance().isInitialized()) {
            Countly.sharedInstance().location().disableLocation();
        } else {
            config.setDisableLocation();
        }
    }

    
    public void addCrashLog(ReadableArray args) {
        String record = args.getString(0);
        Countly.sharedInstance().crashes().addCrashBreadcrumb(record);
    }

    public void recordMetrics(ReadableArray args) {
        Map<String, String> metricsMap = new HashMap<>();
        for (int i = 0; i < args.size(); i += 2) {
            String key = args.getString(i);
            String value = args.getString(i + 1);
            metricsMap.put(key, value);
        }
        Countly.sharedInstance().requestQueue().recordMetrics(metricsMap);
    }

    public void startSession() {
        Countly.sharedInstance().sessions().beginSession();
    }

    public void updateSession() {
        Countly.sharedInstance().sessions().updateSession();
    }

    public void endSession() {
        Countly.sharedInstance().sessions().endSession();
    }

    
    public void logException(ReadableArray args) {
        String exceptionString = args.getString(0);
        Exception exception = new Exception(exceptionString);

        if (args.size() == 2 ) {
            Countly.sharedInstance().crashes().recordHandledException(exception);
            return;
        }
        
        Map<String, Object> segmentationMap = new HashMap<>();

        // TODO: refactor this tandem to iOS in the future
        // starting from index 2 because we are skipping the exceptionString and the fatality
        // from 2 onwards, the key-value pairs are coming in pairs
        // we are keeping this weird structure for compatibility with iOS
        for (int i = 2; i < args.size(); i += 2) {
            if (i + 1 < args.size()) {
                String key = args.getString(i);
                String value = args.getString(i + 1);
                segmentationMap.put(key, value);
            }
        }

        Countly.sharedInstance().crashes().recordHandledException(exception, segmentationMap);
    }

    
    public void logJSException(String err, String message, String stack) {
        Countly.sharedInstance().crashes().addCrashBreadcrumb(stack);
        Countly.sharedInstance().crashes().recordHandledException(new CountlyReactException(err, message, stack));
    }

    
    public void setCustomCrashSegments(ReadableArray args) {
        Map<String, Object> segments = new HashMap<>();
        for (int i = 0, il = args.size(); i < il; i += 2) {
            segments.put(args.getString(i), args.getString(i + 1));
        }
        config.crashes.setCustomCrashSegmentation(segments);
    }

    // Recieves an object with the following structure:
    // {string} n: event name (mandatory)
    // {number} c: event count (1 or a positive number)
    // {number} s: event sum (0 or a number)
    // {array} g: event segmentation (optional, as an array of key-value pairs consecutively)
    
    public void recordEvent(ReadableMap args) {
        String eventName = args.getString("n");
        int eventCount = args.getInt("c");
        double eventSum = args.getDouble("s");
        Map<String, Object> segmentation = null;
        if (args.hasKey("g")) {
            segmentation = convertToEventMap(args.getArray("g"));
        }     

        Countly.sharedInstance().events().recordEvent(eventName, segmentation, eventCount, eventSum);
    }

    
    public void startEvent(ReadableArray args) {
        String startEvent = args.getString(0);
        Countly.sharedInstance().events().startEvent(startEvent);
    }

    
    public void cancelEvent(ReadableArray args) {
        String cancelEvent = args.getString(0);
        Countly.sharedInstance().events().cancelEvent(cancelEvent);
    }

    
    public void endEvent(ReadableMap args) {
        String eventName = args.getString("n");
        int eventCount = args.getInt("c");
        double eventSum = args.getDouble("s");
        Map<String, Object> segmentation = null;
        if (args.hasKey("g")) {
            segmentation = convertToEventMap(args.getArray("g"));
        }     

        Countly.sharedInstance().events().endEvent(eventName, segmentation, eventCount, eventSum);
    }

    
    public void recordView(ReadableArray args) {
        String viewName = args.getString(0);
        Map<String, Object> segmentation = convertReadableArrayToSegmentation(args, 1);
        Countly.sharedInstance().views().startAutoStoppedView(viewName, segmentation);
    }

    public void startAutoStoppedView(ReadableArray args, Promise promise) {
        String viewName = args.getString(0);
        Map<String, Object> segmentation = convertReadableArrayToSegmentation(args, 1);
        promise.resolve(Countly.sharedInstance().views().startAutoStoppedView(viewName, segmentation));
    }

    public void startView(ReadableArray args, Promise promise) {
        String viewName = args.getString(0);
        Map<String, Object> segmentation = convertReadableArrayToSegmentation(args, 1);
        promise.resolve(Countly.sharedInstance().views().startView(viewName, segmentation));
    }

    public void stopViewWithName(ReadableArray args) {
        String viewName = args.getString(0);
        Map<String, Object> segmentation = convertReadableArrayToSegmentation(args, 1);
        Countly.sharedInstance().views().stopViewWithName(viewName, segmentation);
    }

    public void stopViewWithID(ReadableArray args) {
        String viewID = args.getString(0);
        Map<String, Object> segmentation = convertReadableArrayToSegmentation(args, 1);
        Countly.sharedInstance().views().stopViewWithID(viewID, segmentation);
    }

    public void stopAllViews(ReadableArray args) {
        Map<String, Object> segmentation = convertReadableArrayToSegmentation(args, 0);
        Countly.sharedInstance().views().stopAllViews(segmentation);
    }

    public void pauseViewWithID(ReadableArray args) {
        Countly.sharedInstance().views().pauseViewWithID(args.getString(0));
    }

    public void resumeViewWithID(ReadableArray args) {
        Countly.sharedInstance().views().resumeViewWithID(args.getString(0));
    }

    public void addSegmentationToViewWithID(ReadableArray args) {
        String viewID = args.getString(0);
        Map<String, Object> segmentation = convertReadableArrayToSegmentation(args, 1);
        Countly.sharedInstance().views().addSegmentationToViewWithID(viewID, segmentation);
    }

    public void addSegmentationToViewWithName(ReadableArray args) {
        String viewName = args.getString(0);
        Map<String, Object> segmentation = convertReadableArrayToSegmentation(args, 1);
        Countly.sharedInstance().views().addSegmentationToViewWithName(viewName, segmentation);
    }

    public void setGlobalViewSegmentation(ReadableArray args) {
        Map<String, Object> segmentation = convertReadableArrayToSegmentation(args, 0);
        Countly.sharedInstance().views().setGlobalViewSegmentation(segmentation);
    }

    public void updateGlobalViewSegmentation(ReadableArray args) {
        Map<String, Object> segmentation = convertReadableArrayToSegmentation(args, 0);
        Countly.sharedInstance().views().updateGlobalViewSegmentation(segmentation);
    }

    
    public void setUserData(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        ReadableMap userData = args.getMap(0);
        Countly.sharedInstance().userProfile().setProperties(userData.toHashMap());
        promise.resolve("Success");
    }

    
    public void sendPushToken(ReadableArray args) {
        String pushToken = args.getString(0);
        CountlyPush.onTokenRefresh(pushToken);
    }

    
    public static void onNotification(Map<String, String> notification) {
        JSONObject json = new JSONObject(notification);
        String notificationString = json.toString();
        log("onNotification [" + notificationString + "]", LogLevel.INFO);

        if (notificationListener != null) {
            //there is a listener for notifications, send the just received notification to it
            log("onNotification, listener exists", LogLevel.INFO);
            notificationListener.callback(notificationString);
        } else {
            //there is no listener for notifications. Store this notification for when a listener is created
            log("onNotification, listener does not exist", LogLevel.INFO);
            lastStoredNotification = notificationString;
        }
    }

    public interface CCallback {
        void callback(String result);
    }

    
    public void registerForNotification(ReadableArray args) {
        notificationListener = new CCallback() {
            @Override
            public void callback(String result) {
                log("registerForNotification callback result [" + result + "]", LogLevel.WARNING);
                ((ReactApplicationContext) _reactContext)
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(pushNotificationCallbackName, result);
            }
        };
        log("registerForNotification theCallback", LogLevel.INFO);
        if (lastStoredNotification != null) {
            notificationListener.callback(lastStoredNotification);
            lastStoredNotification = null;
        }
    }

    
    public void askForNotificationPermission(ReadableArray args) {
        Activity activity = this.getActivity();
        if (activity == null) {
            log("askForNotificationPermission failed, Activity is null", LogLevel.ERROR);
            return;
        }
        String soundPath = args.getString(0);
        Context context = this._reactContext;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                NotificationChannel channel = new NotificationChannel(CountlyPush.CHANNEL_ID, channelName, NotificationManager.IMPORTANCE_DEFAULT);
                channel.setDescription(channelDescription);
                // It will set the custom sound for push notifications
                if (!"null".equals(soundPath) && !soundPath.isEmpty()) {
                    log("askForNotificationPermission, Custom Sound provided for push notifications : " + soundPath, LogLevel.INFO);
                    AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .build();

                    try {
                        Uri soundUri = Uri.parse(soundPath);
                        channel.setSound(soundUri, audioAttributes);
                    } catch (Exception exception) {
                        log("askForNotificationPermission, Uri.parse failed with exception : ", exception, LogLevel.WARNING);
                    }
                }

                notificationManager.createNotificationChannel(channel);
            }
        }
        CountlyPush.useAdditionalIntentRedirectionChecks = useAdditionalIntentRedirectionChecks;
        CountlyConfigPush configPush = new CountlyConfigPush(activity.getApplication());
        if (allowedIntentClassNames.size() > 0) {
            configPush.setAllowedIntentClassNames(allowedIntentClassNames);
        }
        if (allowedIntentPackageNames.size() > 0) {
            configPush.setAllowedIntentPackageNames(allowedIntentPackageNames);
        }
        CountlyPush.init(configPush);
        log("askForNotificationPermission, firebaseMessagingInstance is null", LogLevel.WARNING);
    }

    
    public void userData_setProperty(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        Object keyValue = getReadableArrayValue(args, 1);
        Countly.sharedInstance().userProfile().setProperty(keyName, keyValue);
        promise.resolve("Success");
    }

    
    public void userData_increment(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        Countly.sharedInstance().userProfile().increment(keyName);
        promise.resolve("Success");
    }

    
    public void userData_incrementBy(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        int keyIncrement = Integer.parseInt(args.getString(1));
        Countly.sharedInstance().userProfile().incrementBy(keyName, keyIncrement);
        promise.resolve("Success");
    }

    
    public void userData_multiply(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        int multiplyValue = Integer.parseInt(args.getString(1));
        Countly.sharedInstance().userProfile().multiply(keyName, multiplyValue);
        promise.resolve("Success");
    }

    
    public void userData_saveMax(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        int maxScore = Integer.parseInt(args.getString(1));
        Countly.sharedInstance().userProfile().saveMax(keyName, maxScore);
        promise.resolve("Success");
    }

    
    public void userData_saveMin(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        int minScore = Integer.parseInt(args.getString(1));
        Countly.sharedInstance().userProfile().saveMin(keyName, minScore);
        promise.resolve("Success");
    }

    
    public void userData_setOnce(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        String minScore = args.getString(1);
        Countly.sharedInstance().userProfile().setOnce(keyName, minScore);
        promise.resolve("Success");
    }

    
    public void userData_pushUniqueValue(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        String keyValue = args.getString(1);
        Countly.sharedInstance().userProfile().pushUnique(keyName, keyValue);
        promise.resolve("Success");
    }

    
    public void userData_pushValue(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        String keyValue = args.getString(1);
        Countly.sharedInstance().userProfile().push(keyName, keyValue);
        promise.resolve("Success");
    }

    
    public void userData_pullValue(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        String keyValue = args.getString(1);
        Countly.sharedInstance().userProfile().pull(keyName, keyValue);
        promise.resolve("Success");
    }

    
    public void userDataBulk_setUserProperties(ReadableMap userData, Promise promise) {
        Countly.sharedInstance();
        Countly.sharedInstance().userProfile().setProperties(userData.toHashMap());
        promise.resolve("Success");
    }

    
    public void userDataBulk_save(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        Countly.sharedInstance().userProfile().save();
        promise.resolve("Success");
    }

    
    public void userDataBulk_setProperty(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        Object keyValue = getReadableArrayValue(args, 1);
        Countly.sharedInstance().userProfile().setProperty(keyName, keyValue);
        promise.resolve("Success");
    }

    
    public void userDataBulk_increment(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        Countly.sharedInstance().userProfile().increment(keyName);
        promise.resolve("Success");
    }

    
    public void userDataBulk_incrementBy(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        int keyIncrement = Integer.parseInt(args.getString(1));
        Countly.sharedInstance().userProfile().incrementBy(keyName, keyIncrement);
        promise.resolve("Success");
    }

    
    public void userDataBulk_multiply(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        int multiplyValue = Integer.parseInt(args.getString(1));
        Countly.sharedInstance().userProfile().multiply(keyName, multiplyValue);
        promise.resolve("Success");
    }

    
    public void userDataBulk_saveMax(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        int maxScore = Integer.parseInt(args.getString(1));
        Countly.sharedInstance().userProfile().saveMax(keyName, maxScore);
        promise.resolve("Success");
    }

    
    public void userDataBulk_saveMin(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        int minScore = Integer.parseInt(args.getString(1));
        Countly.sharedInstance().userProfile().saveMin(keyName, minScore);
        promise.resolve("Success");
    }

    
    public void userDataBulk_setOnce(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        String minScore = args.getString(1);
        Countly.sharedInstance().userProfile().setOnce(keyName, minScore);
        promise.resolve("Success");
    }

    
    public void userDataBulk_pushUniqueValue(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        String keyValue = args.getString(1);
        Countly.sharedInstance().userProfile().pushUnique(keyName, keyValue);
        promise.resolve("Success");
    }

    
    public void userDataBulk_pushValue(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        String keyValue = args.getString(1);
        Countly.sharedInstance().userProfile().push(keyName, keyValue);
        promise.resolve("Success");
    }

    
    public void userDataBulk_pullValue(ReadableArray args, Promise promise) {
        Countly.sharedInstance();
        String keyName = args.getString(0);
        String keyValue = args.getString(1);
        Countly.sharedInstance().userProfile().pull(keyName, keyValue);
        promise.resolve("Success");
    }

    // GDPR

    
    public void giveConsent(ReadableArray featureNames) {
        List<String> features = new ArrayList<>();
        for (int i = 0; i < featureNames.size(); i++) {
            String featureName = featureNames.getString(i);
            if (validConsentFeatureNames.contains(featureName)) {
                features.add(featureName);
            } else {
                log("Not a valid consent feature to add: " + featureName, LogLevel.DEBUG);
            }
        }
        Countly.sharedInstance().consent().giveConsent(features.toArray(new String[features.size()]));
    }

    
    public void removeConsent(ReadableArray featureNames) {
        List<String> features = new ArrayList<>();
        for (int i = 0; i < featureNames.size(); i++) {
            String featureName = featureNames.getString(i);
            if (validConsentFeatureNames.contains(featureName)) {
                features.add(featureName);
            } else {
                log("Not a valid consent feature to remove: " + featureName, LogLevel.DEBUG);
            }
        }
        Countly.sharedInstance().consent().removeConsent(features.toArray(new String[features.size()]));
    }

    
    public void giveAllConsent() {
        Countly.sharedInstance().consent().giveConsentAll();
    }

    
    public void removeAllConsent() {
        Countly.sharedInstance().consent().removeConsentAll();
    }

    
    public void remoteConfigUpdate(ReadableArray args, final Callback myCallback) {
        Countly.sharedInstance().remoteConfig().downloadAllKeys(new RCDownloadCallback() {
            @Override public void callback(RequestResult downloadResult, String error, boolean fullValueUpdate, Map<String, RCData> downloadedValues) {
                String resultString = "";
                if (error == null) {
                    resultString = "Remote Config is updated and ready to use!";
                } else {
                    resultString = "There was an error while updating Remote Config: " + error;
                }
                myCallback.invoke(resultString);
            }
        });
    }

    
    public void updateRemoteConfigForKeysOnly(ReadableArray args, final Callback myCallback) {
        String[] newArray = new String[args.size()];
        for (int cnt = 0; cnt < args.size(); cnt++) {
            newArray[cnt] = args.getString(cnt);
        }
        Countly.sharedInstance().remoteConfig().downloadSpecificKeys(newArray, new RCDownloadCallback() {
            @Override public void callback(RequestResult downloadResult, String error, boolean fullValueUpdate, Map<String, RCData> downloadedValues) {
                String resultString = "";
                if (error == null) {
                    resultString = "Remote Config is updated only for given keys and ready to use!";
                } else {
                    resultString = "There was an error while updating Remote Config: " + error;
                }
                myCallback.invoke(resultString);
            }
        });
    }

    
    public void updateRemoteConfigExceptKeys(ReadableArray args, final Callback myCallback) {
        String[] newArray = new String[args.size()];
        for (int cnt = 0; cnt < args.size(); cnt++) {
            newArray[cnt] = args.getString(cnt);
        }
        Countly.sharedInstance().remoteConfig().downloadOmittingKeys(newArray, new RCDownloadCallback() {
            @Override public void callback(RequestResult downloadResult, String error, boolean fullValueUpdate, Map<String, RCData> downloadedValues) {
                String resultString = "";
                if (error == null) {
                    resultString = "Remote Config is updated except for given keys and ready to use !";
                } else {
                    resultString = "There was an error while updating Remote Config: " + error;
                }
                myCallback.invoke(resultString);
            }
        });
    }

    
    public void getRemoteConfigValueForKey(ReadableArray args, final Callback myCallback) {
        String keyName = args.getString(0);
        RCData keyValue = Countly.sharedInstance().remoteConfig().getValue(keyName);
        if (keyValue.value == null) {
            log("getRemoteConfigValueForKey, [" + keyName + "]: ConfigKeyNotFound", LogLevel.DEBUG);
            myCallback.invoke("ConfigKeyNotFound");
        } else {
            String resultString = (keyValue.value).toString();
            log("getRemoteConfigValueForKey, [" + keyName + "]: " + resultString, LogLevel.DEBUG);
            myCallback.invoke(resultString);
        }
    }

    
    public void getRemoteConfigValueForKeyP(String keyName, Promise promise) {
        RCData keyValue = Countly.sharedInstance().remoteConfig().getValue(keyName);
        if (keyValue.value == null) {
            log("getRemoteConfigValueForKeyP, [" + keyName + "]: ConfigKeyNotFound", LogLevel.DEBUG);
            promise.resolve("ConfigKeyNotFound");
        } else {
            String resultString = (keyValue.value).toString();
            log("getRemoteConfigValueForKeyP, [" + keyName + "]: " + resultString, LogLevel.DEBUG);
            promise.resolve(resultString);
        }
    }

    
    public void remoteConfigClearValues(Promise promise) {
        Countly.sharedInstance().remoteConfig().clearAll();
        promise.resolve("Remote Config Cleared.");
    }

    
    public void showStarRating(ReadableArray args, final Callback callback) {
        Activity activity = getActivity();
        if (activity == null) {
            log("showStarRating failed, Activity is null", LogLevel.ERROR);
            return;
        }
        activity.runOnUiThread(() -> Countly.sharedInstance().ratings().showStarRating(activity, new StarRatingCallback() {

            @Override
            public void onRate(int rating) {
                callback.invoke("Rating: " + rating);
            }

            @Override
            public void onDismiss() {
                callback.invoke("User canceled");
            }
        }));
    }

    
    public void presentRatingWidgetWithID(ReadableArray args) {
        Activity activity = getActivity();
        if (activity == null) {
            log("presentRatingWidgetWithID failed, Activity is null", LogLevel.ERROR);
            return;
        }
        String widgetId = args.getString(0);
        String closeButtonText = args.getString(1);

        activity.runOnUiThread(() -> Countly.sharedInstance().ratings().presentRatingWidgetWithID(widgetId, closeButtonText, activity, new FeedbackRatingCallback() {
            @Override
            public void callback(String error) {
                ((ReactApplicationContext) _reactContext)
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(ratingWidgetCallbackName, error);
            }
        }));
    }

    private String getOptionalStringArg(ReadableArray args, int index) {
        if (args == null || args.size() <= index || args.isNull(index)) {
            return "";
        }

        return args.getString(index);
    }

    private void emitWidgetEvent(String eventName) {
        ((ReactApplicationContext) _reactContext)
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, null);
    }

    private FeedbackCallback createWidgetPresentationCallback(String operationName) {
        return new FeedbackCallback() {
            @Override
            public void onFinished(String error) {
                if (error != null) {
                    log(operationName + " failed : " + error, LogLevel.ERROR);
                    return;
                }

                emitWidgetEvent(widgetShownCallbackName);
            }

            @Override
            public void onClosed() {
                emitWidgetEvent(widgetClosedCallbackName);
            }
        };
    }

    public void presentNPS(ReadableArray args) {
        Activity activity = getActivity();
        if (activity == null) {
            log("presentNPS failed, Activity is null", LogLevel.ERROR);
            return;
        }

        String nameIDorTag = getOptionalStringArg(args, 0);
        activity.runOnUiThread(() -> Countly.sharedInstance().feedback().presentNPS(activity, nameIDorTag, createWidgetPresentationCallback("presentNPS")));
    }

    public void presentSurvey(ReadableArray args) {
        Activity activity = getActivity();
        if (activity == null) {
            log("presentSurvey failed, Activity is null", LogLevel.ERROR);
            return;
        }

        String nameIDorTag = getOptionalStringArg(args, 0);
        activity.runOnUiThread(() -> Countly.sharedInstance().feedback().presentSurvey(activity, nameIDorTag, createWidgetPresentationCallback("presentSurvey")));
    }

    public void presentRating(ReadableArray args) {
        Activity activity = getActivity();
        if (activity == null) {
            log("presentRating failed, Activity is null", LogLevel.ERROR);
            return;
        }

        String nameIDorTag = getOptionalStringArg(args, 0);
        activity.runOnUiThread(() -> Countly.sharedInstance().feedback().presentRating(activity, nameIDorTag, createWidgetPresentationCallback("presentRating")));
    }

    
    public void getFeedbackWidgets(final Promise promise) {
        Countly.sharedInstance().feedback().getAvailableFeedbackWidgets(new RetrieveFeedbackWidgets() {
            @Override
            public void onFinished(List<CountlyFeedbackWidget> retrievedWidgets, String error) {
                if (error != null) {
                    promise.reject("getFeedbackWidgets_failure", error);
                    return;
                }
                WritableArray retrievedWidgetsArray = new WritableNativeArray();
                for (CountlyFeedbackWidget presentableFeedback : retrievedWidgets) {
                    WritableMap feedbackWidget = new WritableNativeMap();
                    feedbackWidget.putString("id", presentableFeedback.widgetId);
                    feedbackWidget.putString("type", presentableFeedback.type.name());
                    feedbackWidget.putString("name", presentableFeedback.name);
                    WritableArray tags = new WritableNativeArray();
                    for (int a = 0; a < presentableFeedback.tags.length; a++) {
                        tags.pushString(presentableFeedback.tags[a]);
                    }
                    feedbackWidget.putArray("tags", tags);
                    if (presentableFeedback.widgetVersion == null) {
                        feedbackWidget.putNull("widgetVersion");
                    } else {
                        feedbackWidget.putString("widgetVersion", presentableFeedback.widgetVersion);
                    }
                    retrievedWidgetsArray.pushMap(feedbackWidget);
                }
                retrievedWidgetList = new ArrayList(retrievedWidgets);
                promise.resolve(retrievedWidgetsArray);
            }
        });
    }

    
    public CountlyFeedbackWidget getFeedbackWidget(String widgetId) {
        if (retrievedWidgetList == null) {
            return null;
        }
        for (CountlyFeedbackWidget feedbackWidget : retrievedWidgetList) {
            if (feedbackWidget.widgetId.equals(widgetId)) {
                return feedbackWidget;
            }
        }
        return null;
    }

    
    public void getFeedbackWidgetData(ReadableArray args, final Promise promise) {
        String widgetId = args.getString(0);
        CountlyFeedbackWidget feedbackWidget = getFeedbackWidget(widgetId);
        if (feedbackWidget == null) {
            String errorMessage = "No feedbackWidget is found against widget id : '" + widgetId + "' , always call 'getFeedbackWidgets' to get updated list of feedback widgets.";
            promise.reject("getFeedbackWidgetData_failure", errorMessage);
        } else {
            Countly.sharedInstance().feedback().getFeedbackWidgetData(feedbackWidget, new RetrieveFeedbackWidgetData() {
                @Override
                public void onFinished(JSONObject retrievedWidgetData, String error) {
                    if (error != null) {
                        promise.reject("getFeedbackWidgetData_failure", error);
                    } else {
                        promise.resolve(toWritableMap(retrievedWidgetData));
                    }
                }
            });
        }
    }

    
    public void reportFeedbackWidgetManually(ReadableArray args, final Promise promise) {
        try {
            ReadableArray widgetInfo = args.getArray(0);
            ReadableMap widgetData = args.getMap(1);
            ReadableMap widgetResult = args.getMap(2);
            Map<String, Object> widgetResultMap = widgetResult.toHashMap();

            if (widgetResultMap.containsKey("rating") && widgetResultMap.get("rating") instanceof Double) {
                widgetResultMap.put("rating", ((Number) widgetResultMap.get("rating")).intValue());
            }
            String widgetId = widgetInfo.getString(0);
            CountlyFeedbackWidget feedbackWidget = getFeedbackWidget(widgetId);
            if (feedbackWidget == null) {
                String errorMessage = "No feedbackWidget is found against widget id : '" + widgetId + "' , always call 'getFeedbackWidgets' to get updated list of feedback widgets.";
                promise.reject("reportFeedbackWidgetManually_failure", errorMessage);
            } else {
                Countly.sharedInstance().feedback().reportFeedbackWidgetManually(feedbackWidget, toJSONObject(widgetData), widgetResultMap);
                promise.resolve("reportFeedbackWidgetManually success");
            }
        } catch (Exception e) {
            log("Failed to parse Config Object. [" + e.toString() + "]", LogLevel.DEBUG);
        }
    }

    
    public void getAvailableFeedbackWidgets(final Promise promise) {
        Countly.sharedInstance().feedback().getAvailableFeedbackWidgets(new RetrieveFeedbackWidgets() {
            @Override
            public void onFinished(List<CountlyFeedbackWidget> retrievedWidgets, String error) {
                if (error != null) {
                    promise.reject("getAvailableFeedbackWidgets", error);
                    return;
                }
                WritableMap retrievedWidgetsMap = new WritableNativeMap();
                for (CountlyFeedbackWidget presentableFeedback : retrievedWidgets) {
                    retrievedWidgetsMap.putString(presentableFeedback.type.name(), presentableFeedback.widgetId);
                }
                promise.resolve(retrievedWidgetsMap);
            }
        });
    }

    
    public void presentFeedbackWidget(ReadableArray args, final Promise promise) {
        Activity activity = getActivity();
        if (activity == null) {
            log("presentFeedbackWidget failed : Activity is null", LogLevel.ERROR);
            promise.reject("presentFeedbackWidget Failed", "Activity is null");
            return;
        }
        String widgetId = args.getString(0);
        String type = args.getString(1);
        String name = args.getString(2);
        String widgetVersion = args.size() > 4 && !args.isNull(4) ? args.getString(4) : null;

        CountlyFeedbackWidget presentableFeedback = getFeedbackWidget(widgetId);
        if (presentableFeedback == null) {
            presentableFeedback = new CountlyFeedbackWidget();
            presentableFeedback.widgetId = widgetId;
            presentableFeedback.type = FeedbackWidgetType.valueOf(type);
            presentableFeedback.name = name;
            presentableFeedback.widgetVersion = widgetVersion;
        } else {
            if ((presentableFeedback.name == null || presentableFeedback.name.isEmpty()) && name != null) {
                presentableFeedback.name = name;
            }
            if ((presentableFeedback.widgetVersion == null || presentableFeedback.widgetVersion.isEmpty()) && widgetVersion != null && !widgetVersion.isEmpty()) {
                presentableFeedback.widgetVersion = widgetVersion;
            }
        }
        CountlyFeedbackWidget feedbackWidgetToPresent = presentableFeedback;
        activity.runOnUiThread(() -> Countly.sharedInstance().feedback().presentFeedbackWidget(feedbackWidgetToPresent, activity, new FeedbackCallback() {
            @Override
            public void onFinished(String error) {
                if (error != null) {
                    promise.reject("presentFeedbackWidget", error);
                } else {
                    promise.resolve("presentFeedbackWidget success");
                    emitWidgetEvent(widgetShownCallbackName);
                }
            }

            @Override
            public void onClosed() {
                promise.resolve("presentFeedbackWidget success");
                emitWidgetEvent(widgetClosedCallbackName);
            }
        }));
    }

    
    public void replaceAllAppKeysInQueueWithCurrentAppKey() {
        Countly.sharedInstance().requestQueue().overwriteAppKeys();
    }

    
    public void removeDifferentAppKeysFromQueue() {
        Countly.sharedInstance().requestQueue().eraseWrongAppKeyRequests();
    }

    
    public void setEventSendThreshold(ReadableArray args) {
        int size = Integer.parseInt(args.getString(0));
        config.setEventQueueSizeToSend(size);
        // Countly.sharedInstance().setEventQueueSizeToSend(size);
    }

    public void addCustomNetworkRequestHeaders(ReadableArray args) {
        Map<String, String> customHeaderValues = new HashMap<>();
        for (int i = 0; i < args.size(); i += 2) {
            String key = args.getString(i);
            String value = args.getString(i + 1);
            customHeaderValues.put(key, value);
        }
        Countly.sharedInstance().requestQueue().addCustomNetworkRequestHeaders(customHeaderValues);
    }

    
    public void startTrace(ReadableArray args) {
        String traceKey = args.getString(0);
        Countly.sharedInstance().apm().startTrace(traceKey);
    }

    
    public void cancelTrace(ReadableArray args) {
        String traceKey = args.getString(0);
        Countly.sharedInstance().apm().cancelTrace(traceKey);
    }

    
    public void clearAllTraces(ReadableArray args) {
        Countly.sharedInstance().apm().cancelAllTraces();
    }

    
    public void endTrace(ReadableArray args) {
        String traceKey = args.getString(0);
        HashMap<String, Integer> customMetric = new HashMap<>();
        for (int i = 1, il = args.size(); i < il; i += 2) {
            try {
                customMetric.put(args.getString(i), Integer.parseInt(args.getString(i + 1)));
            } catch (Exception exception) {
                log("endTrace, could not parse metrics, skipping it. ", LogLevel.ERROR);
            }
        }
        Countly.sharedInstance().apm().endTrace(traceKey, customMetric);
    }

    
    public void recordNetworkTrace(ReadableArray args) {
        try {
            String networkTraceKey = args.getString(0);
            int responseCode = Integer.parseInt(args.getString(1));
            int requestPayloadSize = Integer.parseInt(args.getString(2));
            int responsePayloadSize = Integer.parseInt(args.getString(3));
            long startTime = Long.parseLong(args.getString(4));
            long endTime = Long.parseLong(args.getString(5));
            Countly.sharedInstance().apm().recordNetworkTrace(networkTraceKey, responseCode, requestPayloadSize, responsePayloadSize, startTime, endTime);
        } catch (Exception exception) {
            log("Exception occurred at recordNetworkTrace method: " + exception, LogLevel.ERROR);
        }
    }

    
    public void recordIndirectAttribution(ReadableArray args) {
        ReadableMap values = args.getMap(0);
        Map<String, Object> objectMap = values.toHashMap();
        if (values != null) {
            Map<String, String> map = new HashMap<String, String>();
            for (Map.Entry<String, Object> entry : objectMap.entrySet()) {
                if (entry.getValue() instanceof String) {
                    map.put(entry.getKey(), (String) entry.getValue());
                }
            }

            Countly.sharedInstance().attribution().recordIndirectAttribution(map);
        } else {
            log("RecordIndirectAttribution: failure, no attribution values provided", LogLevel.DEBUG);
        }
    }

    
    public void recordDirectAttribution(ReadableArray args) {
        String campaignType = args.getString(0);
        String campaignData = args.getString(1);

        Countly.sharedInstance().attribution().recordDirectAttribution(campaignType, campaignData);
    }

    
    public void appLoadingFinished() {
        Countly.sharedInstance().apm().setAppIsLoaded();
    }

    public void enableRequestCapture(Promise promise) {
        synchronized (capturedRequests) {
            capturedRequests.clear();
        }
        requestCaptureEnabled = true;
        if (Countly.sharedInstance().isInitialized() && !requestCaptureGeneratorInstalled) {
            installRequestCaptureGenerator();
        }
        promise.resolve(null);
    }

    public void getCapturedRequests(Promise promise) {
        WritableArray directRequestLog = Arguments.createArray();
        synchronized (capturedRequests) {
            for (String request : capturedRequests) {
                directRequestLog.pushString(request);
            }
        }
        promise.resolve(directRequestLog);
    }

    public void getRequestQueue(Promise promise) {
        CountlyStore countlyStore = new CountlyStore(_reactContext, new ModuleLog());
        String[] requests = countlyStore.getRequests();
        WritableArray requestQueue = Arguments.createArray();
        if (requests != null) {
            for (String request : requests) {
                requestQueue.pushString(request);
            }
        }
        promise.resolve(requestQueue);
    }

    public void getEventQueue(Promise promise) {
        CountlyStore countlyStore = new CountlyStore(_reactContext, new ModuleLog());
        String[] events = countlyStore.getEvents();
        WritableArray eventQueue = Arguments.createArray();
        if (events != null) {
            for (String event : events) {
                eventQueue.pushString(event);
            }
        }
        promise.resolve(eventQueue);
    }

    public void halt(Promise promise) {
        Countly.sharedInstance().halt();
        resetTestingState();
        promise.resolve(null);
    }

    
    public void enterContentZone() {
        Countly.sharedInstance().contents().enterContentZone();
    }

    public void refreshContentZone() {
        Countly.sharedInstance().contents().refreshContentZone();
    }

    public void previewContent(ReadableArray args) {
        String contentId = args.getString(0);
        Countly.sharedInstance().contents().previewContent(contentId);
    }

    
    public void exitContentZone() {
        Countly.sharedInstance().contents().exitContentZone();
    }

    
    public void setID(String newDeviceID) {
        if ("TemporaryDeviceID".equals(newDeviceID)) {
            Countly.sharedInstance().deviceId().enableTemporaryIdMode();
        } else {
            Countly.sharedInstance().deviceId().setID(newDeviceID);
        }
    }

    
    public void setCustomMetrics(ReadableArray args) {
        Map<String, String> customMetric = new HashMap<>();
        for (int i = 0, il = args.size(); i < il; i += 2) {
            try {
                if (i + 1 < il) {
                    customMetric.put(args.getString(i), args.getString(i + 1));
                }
            } catch (Exception exception) {
                log("setCustomMetrics, could not parse metrics, skipping it. ", LogLevel.ERROR);
            }
        }
        config.setMetricOverride(customMetric);
    }

    enum LogLevel {INFO, DEBUG, VERBOSE, WARNING, ERROR}

    static void log(String message, LogLevel logLevel) {
        log(message, null, logLevel);
    }

    static void log(String message, Throwable tr, LogLevel logLevel) {
        if (!loggingEnabled) {
            return;
        }
        switch (logLevel) {
            case INFO:
                Log.i(TAG, message, tr);
                break;
            case DEBUG:
                Log.d(TAG, message, tr);
                break;
            case WARNING:
                Log.w(TAG, message, tr);
                break;
            case ERROR:
                Log.e(TAG, message, tr);
                break;
            case VERBOSE:
                Log.v(TAG, message, tr);
                break;
        }
    }

    public Map<String, Object> convertToEventMap(ReadableArray segments) {
        Map<String, Object> segmentation = new HashMap<>();
        if (segments == null) {
            return segmentation;
        }
        int len = segments.size();
        for (int i = 0; i < len; i += 2) {
            String key = segments.getString(i);
            if (i + 1 < len) {
                ReadableType valueType = segments.getType(i + 1);
                switch (valueType) {
                    case String:
                        segmentation.put(key, segments.getString(i + 1));
                        break;
                    case Boolean:
                        segmentation.put(key, segments.getBoolean(i + 1));
                        break;
                    case Number:
                        double doubleValue = segments.getDouble(i + 1);
                        int intValue = (int) doubleValue; // casting to int will remove the decimal part
                        if (doubleValue == intValue) {
                            segmentation.put(key, intValue);
                        } else {
                            segmentation.put(key, doubleValue);
                        }
                        break;
                    case Array:
                        ReadableArray array = segments.getArray(i + 1);
                        List<Object> list = new ArrayList<>();
                        for (int j = 0; j < array.size(); j++) {
                            ReadableType arrayValueType = array.getType(j);
                            switch (arrayValueType) {
                                case String:
                                    list.add(array.getString(j));
                                    break;
                                case Number:
                                    double arrayDoubleValue = array.getDouble(j);
                                    int arrayIntValue = (int) arrayDoubleValue; // casting to int will remove the decimal part
                                    if (arrayDoubleValue == arrayIntValue) {
                                        list.add(arrayIntValue);
                                    } else {
                                        list.add(arrayDoubleValue);
                                    }
                                    break;
                                case Boolean:
                                    list.add(array.getBoolean(j));
                                    break;
                                default:
                                    break;
                            }
                        }
                        segmentation.put(key, list);
                        break;
                    default:
                        // Skip other types
                        break;
                }
            }
        }
        return segmentation;
    }

    Activity getActivity() {
        Activity activity = getCurrentActivity();
        if (activity == null && _reactContext != null) {
            activity = _reactContext.getCurrentActivity();
        }
        return activity;
    }

    @Override
    public void onHostResume() {
    }

    @Override
    public void onHostPause() {

    }

    @Override
    public void onHostDestroy() {

    }

    public void addListener(String eventType) {
        log("addListener", LogLevel.ERROR);
    }

    public void removeListeners(double id) {
        log("removeListeners", LogLevel.ERROR);
    }
}
