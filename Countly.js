/**
 * Countly SDK React Native Bridge
 * https://github.com/Countly/countly-sdk-react-native-bridge
 * @Countly
 */

import {
    Platform,
    NativeModules,
    NativeEventEmitter
} from 'react-native';
import parseErrorStackLib from '../react-native/Libraries/Core/Devtools/parseErrorStack.js';

const CountlyReactNative = NativeModules.CountlyReactNative;
const eventEmitter = new NativeEventEmitter(CountlyReactNative);

const Countly = {};
Countly.serverUrl = "";
Countly.appKey = "";

Countly.messagingMode = {"DEVELOPMENT":"1","PRODUCTION":"0", "ADHOC": "2"};
if (Platform.OS.match("android")) {
    Countly.messagingMode.DEVELOPMENT = "2";
}

// countly initialization
Countly.init = async function(serverUrl, appKey, deviceId = ""){

    if(deviceId == "") {
        deviceId = null;
        if(await CountlyReactNative.isLoggingEnabled()) {
            console.error("[CountlyReactNative] init, Device Id during init can't be empty string");
        }
    }
    Countly.serverUrl = serverUrl;
    Countly.appKey = appKey;
    var args = [];
    args.push(serverUrl);
    args.push(appKey);
    args.push(deviceId);
    await CountlyReactNative.init(args);
}

Countly.isInitialized = async function(){
    // returns a promise
    return await CountlyReactNative.isInitialized();
}

Countly.hasBeenCalledOnStart = function(){
    // returns a promise
    return CountlyReactNative.hasBeenCalledOnStart();
}

// countly sending various types of events
Countly.sendEvent = function(options){
    var args = [];
    var eventType = "event"; //event, eventWithSum, eventWithSegment, eventWithSumSegment
    var segments = {};

    if(options.eventSum)
        eventType = "eventWithSum";
    if(options.segments)
        eventType = "eventWithSegment";
    if(options.segments && options.eventSum)
        eventType = "eventWithSumSegment";

    args.push(eventType);

    if(options.eventName){
        args.push(options.eventName.toString());
    }else{
        args.push("");
    }
    if(options.eventCount){
        args.push(options.eventCount.toString());
    }
    else{
        args.push("1");
    }

    if(options.eventSum){
        options.eventSum = options.eventSum.toString();
        if(options.eventSum.indexOf(".") == -1){
            options.eventSum = parseFloat(options.eventSum).toFixed(2);
            args.push(options.eventSum);
        }else{
            args.push(options.eventSum);
        }
    }

    if(options.segments)
        segments = options.segments;
    for (var event in segments) {
        args.push(event);
        args.push(segments[event]);
    }
    CountlyReactNative.event(args);
}

/**
 * Record custom view to Countly.
 * 
 * @param {string} recordView - name of the view
 * @param {Map} segments - allows to add optional segmentation,
 * Supported data type for segments values are String, int, double and bool
 */
Countly.recordView = function(recordView, segments){
    var args = [];
    args.push(String(recordView) || "");
    if(!segments){
        segments = {};
    }
    for(var key in segments){
        args.push(key);
        args.push(segments[key]);
    }
    CountlyReactNative.recordView(args);
};

/**
 * 
 * Set messaging mode for push notifications
 * Should be call before Countly init
 */
Countly.pushTokenType = function(tokenType, channelName, channelDescription){
    var args = [];
    args.push(tokenType || "");
    args.push(channelName || "");
    args.push(channelDescription || "");
    CountlyReactNative.pushTokenType(args);
}
Countly.sendPushToken = function(options){
    var args = [];
    args.push(options.token || "");
    CountlyReactNative.sendPushToken(args);
}

/**
 * This method will ask for permission, enables push notification and send push token to countly server.
 * Should be call after Countly init
 */
Countly.askForNotificationPermission = function(){
    CountlyReactNative.askForNotificationPermission([]);
}

/**
 * 
 * Set callback to receive push notifications
 * @param { callback listner } theListener 
 */
Countly.registerForNotification = function(theListener){
    var event = eventEmitter.addListener('onCountlyPushNotification', theListener);
    CountlyReactNative.registerForNotification([]);
    return event;
};
// countly start for android
Countly.start = function(){
    CountlyReactNative.start();
}

// countly stop for android
Countly.stop = function(){
    CountlyReactNative.stop();
}

/**
 * Enable countly internal debugging logs
 * Should be call before Countly init
 * 
 * @deprecated in 20.04.6
 * 
 * @function Countly.setLoggingEnabled should be used to enable/disable countly internal debugging logs
 */

Countly.enableLogging = function(){
    CountlyReactNative.setLoggingEnabled([true]);
}

/**
 * Disable countly internal debugging logs
 * 
 * @deprecated in 20.04.6
 * 
 * @function Countly.setLoggingEnabled should be used to enable/disable countly internal debugging logs
 */
Countly.disableLogging = function(){
    CountlyReactNative.setLoggingEnabled([false]);
}

/**
 * Set to true if you want to enable countly internal debugging logs
 * Should be call before Countly init
 */
Countly.setLoggingEnabled = function(enabled = true){
    CountlyReactNative.setLoggingEnabled([enabled]);
}

Countly.onSuccess = function(result){
    // alert(result);
}

Countly.onError = function(error){
     // alert("error");
     // alert(error);
}
Countly.demo = function(){

}

/**
 * Set user initial location
 * Should be call before init
 * @param {ISO Country code for the user's country} countryCode 
 * @param {Name of the user's city} city 
 * @param {comma separate lat and lng values. For example, "56.42345,123.45325"} location 
 * @param {IP address of user's} ipAddress 
 * */

Countly.setLocationInit = function(countryCode, city, location, ipAddress){
    var args = [];
    args.push(countryCode || "null");
    args.push(city || "null");
    args.push(location || "null");
    args.push(ipAddress || "null");
    CountlyReactNative.setLocationInit(args);
}

Countly.setLocation = function(countryCode, city, location, ipAddress){
    var args = [];
    args.push(countryCode || "null");
    args.push(city || "null");
    args.push(location || "null");
    args.push(ipAddress || "null");
    CountlyReactNative.setLocation(args);
}
Countly.disableLocation = function(){
    CountlyReactNative.disableLocation();
}
/** 
 * 
 * Get currently used device Id.
 * Should be call after Countly init
 * */
Countly.getCurrentDeviceId = async function(){
    if(!await Countly.isInitialized()) {
        if(await CountlyReactNative.isLoggingEnabled()) {
            console.warn('[CountlyReactNative] getCurrentDeviceId, init must be called before getCurrentDeviceId');
        }
        return "init must be called before getCurrentDeviceId";
      }
      const result = await CountlyReactNative.getCurrentDeviceId();
      return result;
  }

Countly.changeDeviceId = function(newDeviceID, onServer){
    if(onServer === false){
        onServer = "0";
    }else{
        onServer = "1";
    }
    newDeviceID = newDeviceID.toString() || "";
    CountlyReactNative.changeDeviceId([newDeviceID, onServer]);
}

/**
 * 
 * Set to "true" if you want HTTP POST to be used for all requests
 * Should be call before Countly init
 */
Countly.setHttpPostForced = function(boolean = true){
    var args = [];
    args.push(boolean == true ?"1":"0");
    CountlyReactNative.setHttpPostForced(args);
}

Countly.isCrashReportingEnabled = false;
/**
 * Enable crash reporting to report unhandled crashes to Countly
 * Should be call before Countly init
 */
Countly.enableCrashReporting = async function(){
    if (ErrorUtils && !Countly.isCrashReportingEnabled) {
        if(await CountlyReactNative.isLoggingEnabled()) {
            console.log("[CountlyReactNative] Adding Countly JS error handler.");
        }
        var previousHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler(function (error, isFatal) {
            var jsStackTrace = parseErrorStackLib(error);
            var fname = jsStackTrace[0].file;
            if (fname.startsWith("http")) {
                var chunks = fname.split("/");
                fname = chunks[chunks.length-1].split("?")[0];
            }
            var errorTitle = `${error.name} (${jsStackTrace[0].methodName}@${fname})`;
            const regExp = "(.*)(@?)http(s?).*/(.*)\\?(.*):(.*):(.*)";
            const stackArr = error.stack.split("\n").map(row => {
                row = row.trim();
                if (!row.includes("http")) return row;
                else {
                    const matches = row.match(regExp);
                    return matches && matches.length == 8 ? `${matches[1]}${matches[2]}${matches[4]}(${matches[6]}:${matches[7]})` : row;
                }
            })
            const stack = stackArr.join("\n");
            if (Platform.OS.match("android")) {
                CountlyReactNative.logJSException(errorTitle, error.message.trim(), stack);
            }
            else if (Platform.OS.match("ios")) {
                const errMessage = `[React] ${errorTitle}: ${error.message}`;
                const errStack = error.message + "\n" + stack;
                CountlyReactNative.logJSException(errorTitle, errMessage, errStack);
            }
            if (previousHandler) {
                previousHandler(error, isFatal);
            }
        });
    }
    Countly.isCrashReportingEnabled = true;
    CountlyReactNative.enableCrashReporting();
}

Countly.addCrashLog = function(crashLog){
    CountlyReactNative.addCrashLog([crashLog]);
}

Countly.logException = function(exception, nonfatal, segments){
    var exceptionArray = exception.split('\n');
    var exceptionString = "";
    for(var i=0,il=exceptionArray.length;i<il;i++){
        exceptionString += "" +exceptionArray[i] +"\n";
    }
    var args = [];
    args.push(exceptionString || "");
    args.push(nonfatal || false);
    for(var key in segments){
        args.push(key);
        args.push(segments[key].toString());
    }
    CountlyReactNative.logException(args);
}
Countly.setCustomCrashSegments = function(segments){
    var args = [];
    for(var key in segments){
        args.push(key.toString());
        args.push(segments[key].toString());
    }
    CountlyReactNative.setCustomCrashSegments(args);
}
Countly.startSession = function(){
    CountlyReactNative.startSession();
}
Countly.endSession = function(){
    CountlyReactNative.endSession();
}

/**
 * 
 * Set the optional salt to be used for calculating the checksum of requested data which will be sent with each request, using the &checksum field
 * Should be call before Countly init
 */
Countly.enableParameterTamperingProtection = function(salt){
    CountlyReactNative.enableParameterTamperingProtection([salt.toString() || ""]);
}

/**
 * 
 * It will ensure that connection is made with one of the public keys specified
 * Should be call before Countly init
 */
Countly.pinnedCertificates = function(certificateName){
    CountlyReactNative.pinnedCertificates([certificateName || ""]);
}
Countly.startEvent = function(eventName){
    CountlyReactNative.startEvent([eventName.toString() || ""]);
}
Countly.cancelEvent = function(eventName){
    CountlyReactNative.cancelEvent([eventName.toString() || ""]);
}
Countly.endEvent = function(options){
    if(typeof options === "string") {
        options = {eventName: options};
    }
    var args = [];
    var eventType = "event"; //event, eventWithSum, eventWithSegment, eventWithSumSegment
    var segments = {};

    if(options.eventSum)
        eventType = "eventWithSum";
    if(options.segments)
        eventType = "eventWithSegment";
    if(options.segments && options.eventSum)
        eventType = "eventWithSumSegment";

    args.push(eventType);

    if(!options.eventName)
        options.eventName = "";
    args.push(options.eventName.toString());

    if(!options.eventCount)
        options.eventCount = "1";
    args.push(options.eventCount.toString());

    if(options.eventSum){
        var eventSumTemp = options.eventSum.toString();
        if(eventSumTemp.indexOf(".") == -1){
            eventSumTemp = parseFloat(eventSumTemp).toFixed(2);
            args.push(eventSumTemp);
        }else{
            args.push(eventSumTemp);
        }
    }else{
        args.push('0.0');
    }

    if(options.segments)
        segments = options.segments;
    for (var event in segments) {
        args.push(event);
        args.push(segments[event]);
    }
    CountlyReactNative.endEvent(args);
};

// countly sending user data
Countly.setUserData = function(options){
    var args = [];
    args.push(options.name || "");
    args.push(options.username || "");
    args.push(options.email || "");
    args.push(options.org || "");
    args.push(options.phone || "");
    args.push(options.picture || "");
    args.push(options.picturePath || "");
    args.push(options.gender || "");
    args.push(options.byear || 0);
    CountlyReactNative.setUserData(args);
}

Countly.userData = {};
Countly.userData.setProperty = function(keyName, keyValue){
    CountlyReactNative.userData_setProperty([keyName.toString() || "", keyValue.toString() || ""]);
};
Countly.userData.increment = function(keyName){
    CountlyReactNative.userData_increment([keyName.toString() || ""]);
};
Countly.userData.incrementBy = function(keyName, keyIncrement){
    CountlyReactNative.userData_incrementBy([keyName.toString() || "", keyIncrement.toString() || ""]);
};
Countly.userData.multiply = function(keyName, multiplyValue){
    CountlyReactNative.userData_multiply([keyName.toString() || "", multiplyValue.toString() || ""]);
};
Countly.userData.saveMax = function(keyName, saveMax){
    CountlyReactNative.userData_saveMax([keyName.toString() || "", saveMax.toString() || ""]);
};
Countly.userData.saveMin = function(keyName, saveMin){
    CountlyReactNative.userData_saveMin([keyName.toString() || "", saveMin.toString() || ""]);
};
Countly.userData.setOnce = function(keyName, setOnce){
    CountlyReactNative.userData_setOnce([keyName.toString() || "", setOnce.toString() || ""]);
};
Countly.userData.pushUniqueValue = function(keyName, keyValue){
    CountlyReactNative.userData_pushUniqueValue([keyName.toString() || "", keyValue.toString() || ""]);
};
Countly.userData.pushValue = function(keyName, keyValue){
    CountlyReactNative.userData_pushValue([keyName.toString() || "", keyValue.toString() || ""]);
};
Countly.userData.pullValue = function(keyName, keyValue){
    CountlyReactNative.userData_pullValue([keyName.toString() || "", keyValue.toString() || ""]);
};


/**
 * 
 * Set that consent should be required for features to work.
 * Should be call before Countly init
 */
Countly.setRequiresConsent = function(flag){
    CountlyReactNative.setRequiresConsent([flag]);
}

Countly.giveConsent = function(args){
    var features = [];
    if (typeof args == "string") {
        features.push(args);
    }
    else {
        features = args;
    }
    CountlyReactNative.giveConsent(features);
}

/**
 * 
 * Give consent for specific features before init.
 * Should be call after Countly init
 */
Countly.giveConsentInit = async function(args){
    var features = [];
    if (typeof args == "string") {
        features.push(args);
    }
    else if(Array.isArray(args)) {
        features = args;
    }
    else {
        if(await CountlyReactNative.isLoggingEnabled()) {
            console.warn("[CountlyReactNative] giveConsentInit, unsupported data type '" + (typeof args) + "'");
        }
    }
    CountlyReactNative.giveConsentInit(features);
}

Countly.removeConsent = function(args){
    var features = [];
    if (typeof args == "string") {
        features.push(args);
    }
    else {
        features = args;
    }
    CountlyReactNative.removeConsent(features);
}

/**
 * 
 * Give consent for all features
 * Should be call after Countly init
 */
Countly.giveAllConsent = function(){
    CountlyReactNative.giveAllConsent();
}

Countly.removeAllConsent = function(){
    CountlyReactNative.removeAllConsent();
}

Countly.remoteConfigUpdate = function(callback){
    CountlyReactNative.remoteConfigUpdate([], (stringItem) => {
        callback(stringItem);
    });
}


Countly.updateRemoteConfigForKeysOnly = function(keyNames, callback){
    var args = [];
    if(keyNames.length){
        for(var i=0,il=keyNames.length;i<il;i++){
            args.push(keyNames[i])
        }
        CountlyReactNative.updateRemoteConfigForKeysOnly(args, (stringItem) => {
            callback(stringItem);
        });
    }
}

Countly.updateRemoteConfigExceptKeys = function(keyNames, callback){
    var args = [];
    if(keyNames.length){
        for(var i=0,il=keyNames.length;i<il;i++){
            args.push(keyNames[i])
        }
        CountlyReactNative.updateRemoteConfigExceptKeys(args, (stringItem) => {
            callback(stringItem);
        });
    }
}

Countly.getRemoteConfigValueForKey = function(keyName, callback){
    CountlyReactNative.getRemoteConfigValueForKey([keyName.toString() || ""], (value) => {
        if (Platform.OS == "android" ) {
            try {
                value = JSON.parse(value);
            }
            catch (e) {
               // console.log(e.message);
               // noop. value will remain string if not JSON parsable and returned as string
             }
        }
        callback(value);
    });
}

Countly.getRemoteConfigValueForKeyP = function(keyName){
        if (Platform.OS != "android" ) return "To be implemented";
        const promise = CountlyReactNative.getRemoteConfigValueForKeyP(keyName);
        return promise.then(value => {
            if (Platform.OS == "android" ) {
                try {
                    value = JSON.parse(value);
                }
                catch (e) {
                   // console.log(e.message);
                   // noop. value will remain string if not JSON parsable and returned as string
                 }
            }
            return value;
        })
}

Countly.remoteConfigClearValues = async function(){
    const result = await CountlyReactNative.remoteConfigClearValues();
    return result;
}

Countly.showStarRating = function(callback){
    if(!callback){callback = function(){}};
    CountlyReactNative.showStarRating([], callback);
}

Countly.showFeedbackPopup = function(widgetId, closeButtonText,){
    CountlyReactNative.showFeedbackPopup([widgetId.toString() || "", closeButtonText.toString() || "Done"]);
}

/**
 * 
 * Events get grouped together and are sent either every minute or after the unsent event count reaches a threshold. By default it is 10
 * Should be call before Countly init
 */
Countly.setEventSendThreshold = function(size){
    CountlyReactNative.setEventSendThreshold([size.toString() || ""]);
}

Countly.startTrace = function(traceKey){
    var args = [];
    args.push(traceKey);
    CountlyReactNative.startTrace(args);
}

Countly.cancelTrace = function(traceKey){
    var args = [];
    args.push(traceKey);
    CountlyReactNative.cancelTrace(args);
}

Countly.clearAllTraces = function(){
    var args = [];
    CountlyReactNative.clearAllTraces(args);
}

Countly.endTrace = function(traceKey, customMetric){
    var args = [];
    args.push(traceKey);
    customMetric = customMetric || {};
    for(var key in customMetric){
        args.push(key.toString());
        args.push(customMetric[key].toString());
    }
    CountlyReactNative.endTrace(args);
}


Countly.recordNetworkTrace = function(networkTraceKey, responseCode, requestPayloadSize, responsePayloadSize, startTime, endTime){
    var args = [];
    args.push(networkTraceKey);
    args.push(responseCode.toString());
    args.push(requestPayloadSize.toString());
    args.push(responsePayloadSize.toString());
    args.push(startTime.toString());
    args.push(endTime.toString());
    CountlyReactNative.recordNetworkTrace(args);
}

/**
 * 
 * Enable APM features, which includes the recording of app start time.
 * Should be call before Countly init
 */
Countly.enableApm = function(){
    var args = [];
    CountlyReactNative.enableApm(args);
}

/**
 * 
 * Enable campaign attribution reporting to Countly.
 * Should be call before Countly init
 */
Countly.enableAttribution = function() {
    CountlyReactNative.enableAttribution();
}

/**
 * 
 * set attribution Id for campaign attribution reporting.
 */

Countly.recordAttributionID = function(attributionID){
    var args = [];
    args.push(attributionID);
    CountlyReactNative.recordAttributionID(args);
}

/*
Countly.initNative = function(){
    CountlyReactNative.initNative();
}

Countly.testCrash = function(){
    CountlyReactNative.testCrash();
}
*/


export default Countly;
