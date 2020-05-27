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
    Countly.messagingMode.DEVELOPMENT = 2;
}

// countly initialization
Countly.init = function(serverUrl,
                        appKey,
                        deviceId = ""){
                        //     ,
                        // starRatingAutoSessionCount = "0",
                        // starRatingTitle = "Rate us.",
                        // starRatingMessage = "How would you rate the app?",
                        // starRatingButtonText = "Dismiss",
                        // consentFlag = false

    Countly.serverUrl = serverUrl;
    Countly.appKey = appKey;
    var args = [];
    args.push(serverUrl);
    args.push(appKey);
    args.push(deviceId);
    // args.push(starRatingAutoSessionCount);
    // args.push(starRatingTitle);
    // args.push(starRatingMessage);
    // args.push(starRatingButtonText);
    // args.push(consentFlag);

    CountlyReactNative.init(args);
}

Countly.isInitialized = function(){
    // returns a promise
    return CountlyReactNative.isInitialized();
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

Countly.setViewTracking = function(boolean){
    CountlyReactNative.setViewTracking([boolean || "false"]);
}

Countly.pushTokenType = function(tokenType){
    var args = [];
    args.push(tokenType || "");
    if(CountlyReactNative.pushTokenType){
        CountlyReactNative.pushTokenType(args);
    }else{
        console.log("CountlyReactNative.pushTokenType is only supported in iOS");
    }
}
Countly.sendPushToken = function(options){
    var args = [];
    args.push(options.token || "");
    args.push((options.messagingMode || "").toString());
    CountlyReactNative.sendPushToken(args);
}
Countly.askForNotificationPermission = function(){
    CountlyReactNative.askForNotificationPermission([]);
}
Countly.registerForNotification = function(theListener){
    var event = eventEmitter.addListener('onCountlyPushNotification', theListener);
    if(CountlyReactNative.registerForNotification){
        CountlyReactNative.registerForNotification([]);
    }else{
        console.log("Countly.registerForNotification is only available for iOS");
    }
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

Countly.enableLogging = function(){
    CountlyReactNative.setLoggingEnabled([true]);
}

Countly.disableLogging = function(){
    CountlyReactNative.setLoggingEnabled([false]);
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

Countly.setLocation = function(countryCode, city, location, ipAddress){
    var args = [];
    args.push(countryCode || "");
    args.push(city || "");
    if(!location){
        location = "0.0,0.0";
    }
    var locationArray = location.split(",")
    var newStringLocation = "";
    if(locationArray[0].indexOf(".") == -1){
        newStringLocation = newStringLocation+""+parseFloat(locationArray[0]).toFixed(2);
    }else{
        newStringLocation = newStringLocation+""+locationArray[0]
    }
    if(locationArray[1].indexOf(".") == -1){
        newStringLocation = newStringLocation+","+ parseFloat(locationArray[1]).toFixed(2);
    }else{
        newStringLocation = newStringLocation+","+locationArray[1]
    }
    args.push(newStringLocation);
    args.push(ipAddress || "0.0.0.0");
    CountlyReactNative.setLocation(args);
}
Countly.disableLocation = function(){
    CountlyReactNative.disableLocation();
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
Countly.setHttpPostForced = function(boolean){
    var args = [];
    args.push(boolean?"1":"0");
    CountlyReactNative.setHttpPostForced(args);
}

Countly.isCrashReportingEnabled = false;
Countly.enableCrashReporting = function(){
    if (ErrorUtils && !Countly.isCrashReportingEnabled) {
        console.log("Adding Countly JS error handler.");
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

/*
Countly.testAndroidCrash = function(x) {
    if (Platform.OS.match("android")) {
        CountlyReactNative.testCrash();
    }
}
*/
Countly.setCustomCrashSegments = function(logs){
    if(!logs){
        logs = [];
    }
    CountlyReactNative.setCustomCrashSegments(logs);
}
Countly.startSession = function(){
    CountlyReactNative.startSession();
}
Countly.endSession = function(){
    CountlyReactNative.endSession();
}
Countly.enableParameterTamperingProtection = function(salt){
    CountlyReactNative.enableParameterTamperingProtection([salt.toString() || ""]);
}
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

// GDPR
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

Countly.setEventSendThreshold = function(size){
    CountlyReactNative.setEventSendThreshold([size.toString() || ""]);
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
