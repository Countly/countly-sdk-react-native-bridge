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
Countly.init = async function(serverUrl, appKey, deviceId){

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
 * Enable or disable automatic view tracking
 * 
 * @deprecated in 20.04.6
 * 
 */
Countly.setViewTracking = async function(boolean) {
    if(await CountlyReactNative.isLoggingEnabled()) {
        console.log("[CountlyReactNative] setViewTracking is deprecated.");
    }
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
 * Disable push notifications feature, by default it is enabled.
 * Currently implemented for iOS only
 * Should be called before Countly init
 */
Countly.disablePushNotifications = function(){
    if (!Platform.OS.match("ios")) return "disablePushNotifications : To be implemented";
    CountlyReactNative.disablePushNotifications();
}

/**
 * 
 * Set messaging mode for push notifications
 * Should be called before Countly init
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
 * Should be called after Countly init
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
 * Should be called before Countly init
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
 * Should be called before Countly init
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
 * Should be called before init
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
 * Should be called after Countly init
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
 * Should be called before Countly init
 */
Countly.setHttpPostForced = function(boolean = true){
    var args = [];
    args.push(boolean == true ?"1":"0");
    CountlyReactNative.setHttpPostForced(args);
}

Countly.isCrashReportingEnabled = false;
/**
 * Enable crash reporting to report unhandled crashes to Countly
 * Should be called before Countly init
 */
Countly.enableCrashReporting = async function(){
    CountlyReactNative.enableCrashReporting();
    if (ErrorUtils && !Countly.isCrashReportingEnabled) {
        if(await CountlyReactNative.isLoggingEnabled()) {
            console.log("[CountlyReactNative] Adding Countly JS error handler.");
        }
        var previousHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler(function (error, isFatal) {
            let jsStackTrace = Countly.getStackTrace(error);
            let errorTitle;
            let stackArr;
            if(jsStackTrace == null) {
                errorTitle = error.name;
                stackArr = error.stack;
            }
            else {
                var fname = jsStackTrace[0].file;
                if (fname.startsWith("http")) {
                    var chunks = fname.split("/");
                    fname = chunks[chunks.length-1].split("?")[0];
                }
                errorTitle = `${error.name} (${jsStackTrace[0].methodName}@${fname})`;
                const regExp = "(.*)(@?)http(s?).*/(.*)\\?(.*):(.*):(.*)";
                stackArr = error.stack.split("\n").map(row => {
                    row = row.trim();
                    if (!row.includes("http")) return row;
                    else {
                        const matches = row.match(regExp);
                        return matches && matches.length == 8 ? `${matches[1]}${matches[2]}${matches[4]}(${matches[6]}:${matches[7]})` : row;
                    }
                })
                stackArr = stackArr.join("\n");
            }
            
            CountlyReactNative.logJSException(errorTitle, error.message.trim(), stackArr);
            
            if (previousHandler) {
                previousHandler(error, isFatal);
            }
        });
    }
    Countly.isCrashReportingEnabled = true;
}

Countly.getStackTrace = (e) => {
    let jsStackTrace = null;
    try {
        if (Platform.hasOwnProperty("constants")) {
            // RN version >= 0.63
            if (Platform.constants.reactNativeVersion.minor >= 64)
              // RN version >= 0.64
              jsStackTrace = parseErrorStackLib(e.stack);
            // RN version == 0.63
            else jsStackTrace = parseErrorStackLib(e);
          }
          // RN version < 0.63
          else jsStackTrace = parseErrorStackLib(e);
    }
    catch (e) {
       // console.log(e.message);
     }
    return jsStackTrace;
  };

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
 * Should be called before Countly init
 */
Countly.enableParameterTamperingProtection = function(salt){
    CountlyReactNative.enableParameterTamperingProtection([salt.toString() || ""]);
}

/**
 * 
 * It will ensure that connection is made with one of the public keys specified
 * Should be called before Countly init
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
    if(options.name) {
        args.push(options.name);
    }
    if(options.username) {
        args.push(options.username);
    }
    if(options.email) {
        args.push(options.email);
    }
    if(options.org) {
        args.push(options.org);
    }
    if(options.phone) {
        args.push(options.phone);
    }
    if(options.picture) {
        args.push(options.picture);
    }
    if(options.picturePath) {
        args.push(options.picturePath);
    }
    if(options.gender) {
        args.push(options.gender);
    }
    if(options.byear) {
        args.push(options.byear);
    }
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
 * Should be called before Countly init
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
 * Should be called after Countly init
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
 * Should be called after Countly init
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
/**
 * Set's the text's for the different fields in the star rating dialog. Set value null if for some field you want to keep the old value
 * 
 * @param {String} starRatingTextTitle - dialog's title text (Only for Android)
 * @param {String} starRatingTextMessage - dialog's message text 
 * @param {String} starRatingTextDismiss - dialog's dismiss buttons text (Only for Android)
 */
Countly.setStarRatingDialogTexts = function(starRatingTextTitle, starRatingTextMessage, starRatingTextDismiss){
    var args = [];
    args.push(starRatingTextTitle);
    args.push(starRatingTextMessage);
    args.push(starRatingTextDismiss);
    CountlyReactNative.setStarRatingDialogTexts(args);
}

Countly.showStarRating = function(callback){
    if(!callback){callback = function(){}};
    CountlyReactNative.showStarRating([], callback);
}

Countly.showFeedbackPopup = function(widgetId, closeButtonText){
    CountlyReactNative.showFeedbackPopup([widgetId.toString() || "", closeButtonText.toString() || "Done"]);
}

/**
 * Get a list of available feedback widgets as array of object to handle multiple widgets of same type.
 */
Countly.getFeedbackWidgets = async function(){
     const result = await CountlyReactNative.getFeedbackWidgets();
      return result;
  }

/**
 * Get a list of available feedback widgets for this device ID
 * @deprecated in 20.11.1 : use 'getFeedbackWidgets' intead of 'getAvailableFeedbackWidgets'.
 * Using the old function it will not be possible to see all the available feedback widgets. 
 * In case there are multiple ones for the same type, only the last one will be returned due to their id being overwritten in the type field.
 * The newer function allow also to see the widgets 'name' field which can be further used to filter and identify specific widgets.
 */
Countly.getAvailableFeedbackWidgets = async function(){
    const result = await CountlyReactNative.getAvailableFeedbackWidgets();
     return result;
 }

/**
 * Present a chosen feedback widget
 * 
 * @param {Object} feedbackWidget - feeback Widget with id, type and name
 * @param {String} closeButtonText - text for cancel/close button
 */  
Countly.presentFeedbackWidgetObject = async function(feedbackWidget, closeButtonText){
    if(!feedbackWidget) {
        if(await CountlyReactNative.isLoggingEnabled()) {
            console.error("[CountlyReactNative] presentFeedbackWidgetObject, feedbackWidget should not be null or undefined");
        }
        return "feedbackWidget should not be null or undefined";
    }
    if(!feedbackWidget.id) {
        if(await CountlyReactNative.isLoggingEnabled()) {
            console.error("[CountlyReactNative] presentFeedbackWidgetObject, feedbackWidget id should not be null or empty");
        }
        return "FeedbackWidget id should not be null or empty";
    }
    if(!feedbackWidget.type) {
        if(await CountlyReactNative.isLoggingEnabled()) {
            console.error("[CountlyReactNative] presentFeedbackWidgetObject, feedbackWidget type should not be null or empty");
        }
        return "FeedbackWidget type should not be null or empty";
    }
    if (typeof closeButtonText != "string") { 
            closeButtonText = "";
            if(await CountlyReactNative.isLoggingEnabled()) {
            console.warn("[CountlyReactNative] presentFeedbackWidgetObject, unsupported data type of closeButtonText : '" + (typeof args) + "'");
        }
    }
    feedbackWidget.name = feedbackWidget.name || "";
    closeButtonText = closeButtonText || "";
    CountlyReactNative.presentFeedbackWidget([feedbackWidget.id, feedbackWidget.type, feedbackWidget.name, closeButtonText]);
}

/**
* Present a chosen feedback widget
* 
* @param {String} widgetType - type of widget : "nps" or "survey"
* @param {String} widgetId - id of widget to present
* @param {String} closeButtonText - text for cancel/close button
* @deprecated in 20.11.1 : use 'presentFeedbackWidgetObject' intead of 'presentFeedbackWidget'.
*/  
Countly.presentFeedbackWidget = function(widgetType, widgetId, closeButtonText){
    var feedbackWidget = {
        "id": widgetId,
        "type": widgetType
      };
    Countly.presentFeedbackWidgetObject(feedbackWidget, closeButtonText)
}

/**
 * 
 * Events get grouped together and are sent either every minute or after the unsent event count reaches a threshold. By default it is 10
 * Should be called before Countly init
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
 * Should be called before Countly init
 */
Countly.enableApm = function(){
    var args = [];
    CountlyReactNative.enableApm(args);
}

/**
 * 
 * Enable campaign attribution reporting to Countly.
 * For iOS use "recordAttributionID" instead of "enableAttribution"
 * Should be called before Countly init
 */
Countly.enableAttribution = async function(attributionID = "") {
    if (Platform.OS.match("ios")) {
        if(attributionID == "") {
            if(await CountlyReactNative.isLoggingEnabled()) {
                console.error("[CountlyReactNative] enableAttribution, attribution Id for iOS can't be empty string");
            }
            return "attribution Id for iOS can't be empty string";
        }
        Countly.recordAttributionID(attributionID);
    }
    else {
        CountlyReactNative.enableAttribution();
    }
}

/**
 * 
 * set attribution Id for campaign attribution reporting.
 * Currently implemented for iOS only
 * For Android just call the enableAttribution to enable campaign attribution.
 */
Countly.recordAttributionID = function(attributionID){
    if (!Platform.OS.match("ios")) return "recordAttributionID : To be implemented";
    var args = [];
    args.push(attributionID);
    CountlyReactNative.recordAttributionID(args);
}
/**
 * Replaces all requests with a different app key with the current app key.
 * In request queue, if there are any request whose app key is different than the current app key,
 * these requests' app key will be replaced with the current app key.
 */
Countly.replaceAllAppKeysInQueueWithCurrentAppKey = function(){
    CountlyReactNative.replaceAllAppKeysInQueueWithCurrentAppKey();
}
/**
 * Removes all requests with a different app key in request queue.
 * In request queue, if there are any request whose app key is different than the current app key,
 * these requests will be removed from request queue.
 */
Countly.removeDifferentAppKeysFromQueue = function(){
  CountlyReactNative.removeDifferentAppKeysFromQueue()
}


/**
 * Call this function when app is loaded, so that the app launch duration can be recorded.
 * Should be called after init.
 */
Countly.appLoadingFinished = async function(){
    if(!await Countly.isInitialized()) {
        if(await CountlyReactNative.isLoggingEnabled()) {
            console.warn('[CountlyReactNative] appLoadingFinished, init must be called before appLoadingFinished');
        }
        return "init must be called before appLoadingFinished";
      }
    CountlyReactNative.appLoadingFinished()
  }

  /**
   * Set the metrics you want to override
   * Should be called before Countly init
   * @param {Object} customMetric - metric with key/value pair
   * Supported data type for customMetric values is String
   */
  Countly.setCustomMetrics = async function(customMetric){
    if(!customMetric) {
        if(await CountlyReactNative.isLoggingEnabled()) {
            console.error("[CountlyReactNative] setCustomMetrics, customMetric should not be null or undefined");
        }
        return "customMetric should not be null or undefined";
    }
    if(typeof customMetric !== 'object'){
        if(await CountlyReactNative.isLoggingEnabled()) {
            console.warn("[CountlyReactNative] setCustomMetrics, unsupported data type of customMetric '" + (typeof customMetric) + "'");
        }
        return "Unsupported data type of customMetric '" + (typeof customMetric) + "'";
    }
    var args = [];
    customMetric = customMetric || {};
    for(var key in customMetric){
        if (typeof customMetric[key] == "string") {
            args.push(key.toString());
            args.push(customMetric[key].toString());
        }
        else {
            if(await CountlyReactNative.isLoggingEnabled()) {
                console.warn("[CountlyReactNative] setCustomMetrics, skipping value for key '" + key.toString() + "', due to unsupported data type '" + (typeof customMetric[key]) + "'");
            }
        }
    }
    if(args.length != 0) {
        CountlyReactNative.setCustomMetrics(args);
    }
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
