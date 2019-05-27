/**
 * Countly SDK React Native Bridge
 * https://github.com/Countly/countly-sdk-react-native-bridge
 * @Countly
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

Countly.messagingMode = {"DEVELOPMENT":1,"PRODUCTION":0, "ADHOC": 2};
if (Platform.OS.match("android")) {
    Countly.messagingMode.DEVELOPMENT = 2;
}

// countly initialization
Countly.init = function(serverUrl,appKey, deviceId, starRatingLimit, titleText, messageText, buttonText){
    Countly.serverUrl = serverUrl;
    Countly.appKey = appKey;
    var args = [];
    args.push(serverUrl || "");
    args.push(appKey || "");
    args.push(deviceId || "");
    args.push(starRatingLimit || "5");
    args.push(titleText || "Rate us.");
    args.push(messageText || "How would you rate the app?");
    args.push(buttonText || "Dismiss");

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
Countly.recordView = function(recordView){
    CountlyReactNative.recordView([recordView || ""]);
};

// countly enable logger
Countly.setViewTracking = function(boolean){
    CountlyReactNative.setViewTracking([boolean || "false"]);
}

Countly.sendPushToken = function(options){
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
    args.push(newStringLocation || "0,0");
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
Countly.userLoggedOut = function(){
    CountlyReactNative.userLoggedOut([]);
}
Countly.setHttpPostForced = function(boolean){
    var args = [];
    args.push(boolean?"1":"0");
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

    if(options.eventSum){
        var eventSumTemp = options.eventSum.toString();
        if(eventSumTemp.indexOf(".") == -1){
            eventSumTemp = parseFloat(eventSumTemp).toFixed(2);
            args.push(eventSumTemp);
        }else{
            args.push(eventSumTemp);
        }
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

Countly.giveAllConsent = function(){
    CountlyReactNative.giveAllConsent([]);
}

Countly.removeAllConsent = function(){
    CountlyReactNative.removeAllConsent([]);
}

Countly.remoteConfigUpdate = function(callback){
    CountlyReactNative.remoteConfigUpdate([], (stringItem) => {
        callback(stringItem);
    });
}

Countly.updateRemoteConfigForKeysOnly = function(keyName, callback){
    CountlyReactNative.updateRemoteConfigForKeysOnly([keyName.toString() || ""], (stringItem) => {
        callback(stringItem);
    });
}

Countly.updateRemoteConfigExceptKeys = function(keyName, callback){
    CountlyReactNative.updateRemoteConfigExceptKeys([keyName.toString() || ""], (stringItem) => {
        callback(stringItem);
    });
}

Countly.getRemoteConfigValueForKey = function(keyName, callback){
    CountlyReactNative.getRemoteConfigValueForKey([keyName.toString() || ""], (stringItem) => {
        callback(stringItem);
    });
}

Countly.showStarRating = function(){
    CountlyReactNative.showStarRating([]);
}

Countly.setEventSendThreshold = function(size){
    CountlyReactNative.setEventSendThreshold([size.toString() || ""]);
}

export default Countly;