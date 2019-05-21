/**
 * Countly SKD React Native
 * https://github.com/facebook/react-native
 * @flow
 */

import {
    Platform,
    NativeModules
} from 'react-native';

// import StackTrace from './Countly.StackTrace.js';

const CountlyReactNative = NativeModules.CountlyReactNative;

const Countly = {};
Countly.serverUrl = "";
Countly.appKey = "";
Countly.ready = false;

Countly.messagingMode = {"DEVELOPMENT":1,"PRODUCTION":0, "ADHOC": 2};
if (Platform.OS.match("android")) {
    Countly.messagingMode.DEVELOPMENT = 2;
}

// countly initialization
Countly.init = function(serverUrl,appKey, deviceId){
    Countly.serverUrl = serverUrl;
    Countly.appKey = appKey;
    var args = [];
    args.push(serverUrl || "");
    args.push(appKey || "");
    args.push(deviceId || "");
    CountlyReactNative.init(args);
}
Countly.isInitialized = function(){
    return CountlyReactNative.isInitialized([]);
}
Countly.hasBeenCalledOnStart = function(){
    return CountlyReactNative.hasBeenCalledOnStart([]);
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
        args.push(options.eventSum.toString());
    }

    if(options.segments)
        segments = options.segments;
    for (var event in segments) {
        args.push(event);
        args.push(segments[event]);
    }
    CountlyReactNative.event(args);
}
Countly.recordView = function(recordView){
    CountlyReactNative.recordView([recordView || ""]);
};

// countly enable logger
Countly.setViewTracking = function(boolean){
    CountlyReactNative.setViewTracking([boolean || "false"]);
}

Countly.sendPushToken = function(options, successCallback, failureCallback){
    var args = [];
    args.push(options.token || "");
    args.push(options.messagingMode || "");
    args.push(options.projectId || "");
    CountlyReactNative.onregistrationid(args);
}

// countly start for android
Countly.start = function(){
    CountlyReactNative.start();
}

// countly stop for android
Countly.stop = function(){
    CountlyReactNative.stop();
}

Countly.enableLogging = function(){
    if (Platform.OS.match("android")) {
        CountlyReactNative.setLoggingEnabled([true]);
    }
}

Countly.disableLogging = function(){
    if (Platform.OS.match("android")) {
        CountlyReactNative.setLoggingEnabled([false]);
    }
}

// countly deviceready for testing purpose
Countly.deviceready = function(){
    Countly.ready = true;
    //testing
}

// countly dummy success and error event
Countly.onSuccess = function(result){
    // alert(result);
}

Countly.onError = function(error){
     // alert("error");
     // alert(error);
}
Countly.demo = function(){

}

Countly.setOptionalParametersForInitialization = function(options){
    var args = [];
    args.push(options.city || "");
    args.push(options.country || "");
    args.push(String(options.latitude) || "0.0");
    args.push(String(options.longitude) || "0.0");
    args.push(String(options.ipAddress) || "0.0.0.0");
    CountlyReactNative.setLocation(args);
}
Countly.setLocation = function(countryCode, city, location, ipAddress){
    var args = [];
    args.push(countryCode || "");
    args.push(city || "");
    args.push(location || "0,0");
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
Countly.userLoggedIn = function(deviceId){
    var args = [];
    args.push(deviceId || "");
    CountlyReactNative.userLoggedIn(args);
}
Countly.userLoggedOut = function(deviceId){
    CountlyReactNative.userLoggedOut([]);
}
Countly.setHttpPostForced = function(bool){
    var args = [];
    args.push(bool?"1":"0");
    CountlyReactNative.setHttpPostForced(args);
}
Countly.enableCrashReporting = function(){
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
Countly.startEvent = function(eventName){
    CountlyReactNative.startEvent([eventName.toString() || ""]);
}
Countly.endEvent = function(options){
    if(typeof options === "string")
        options = {eventName: options};
    var args = [];
    var eventType = "event"; //event, eventWithSum, eventWithSegment, eventWithSumSegment
    var segments = {};

    if(options.segments && options.eventSum)
        eventType = "eventWithSumSegment";

    args.push(eventType);

    if(!options.eventName)
        options.eventName = "";
    args.push(options.eventName.toString());

    if(!options.eventCount)
        options.eventCount = "1";
    args.push(options.eventCount.toString());

    if(!options.eventSum)
        options.eventSum = "0";
    args.push(options.eventSum.toString());

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

    CountlyReactNative.setuserdata(args);
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
Countly.setRequiresConsent = function(){
    CountlyReactNative.setRequiresConsent([]);
}

Countly.giveConsent = function(keyName){
    CountlyReactNative.giveConsent([keyName.toString() || ""]);
}

Countly.removeConsent = function(keyName){
    CountlyReactNative.removeConsent([keyName.toString() || ""]);
}

Countly.giveAllConsent = function(keyName){
    CountlyReactNative.giveAllConsent([]);
}

Countly.removeAllConsent = function(keyName){
    CountlyReactNative.removeAllConsent([]);
}

Countly.remoteConfigUpdate = function(){
    var stringItem = CountlyReactNative.remoteConfigUpdate([], (stringItem) => {
        alert(stringItem);
    });
}

Countly.updateRemoteConfigForKeysOnly = function(keyName){
    CountlyReactNative.updateRemoteConfigForKeysOnly([keyName.toString() || ""], (stringItem) => {
        alert(stringItem);
    });
}

Countly.updateRemoteConfigExceptKeys = function(keyName){
    CountlyReactNative.updateRemoteConfigExceptKeys([keyName.toString() || ""], (stringItem) => {
        alert(stringItem);
    });
}

Countly.getRemoteConfigValueForKey = function(keyName){
    CountlyReactNative.getRemoteConfigValueForKey([keyName.toString() || ""], (stringItem) => {
        alert(stringItem);
    });

}

Countly.setStarRatingDialogTexts = function(keyName){
    CountlyReactNative.setStarRatingDialogTexts([]);
}

Countly.showStarRating = function(keyName){
    CountlyReactNative.showStarRating([]);
}

Countly.setEventSendThreshold = function(size){
    CountlyReactNative.setEventSendThreshold([size.toString() || ""]);
}




export default Countly;