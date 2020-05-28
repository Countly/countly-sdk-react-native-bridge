import React, { Component } from 'react';
import { Text, Button, ScrollView, Image, View, Alert } from 'react-native';
import Countly from 'countly-sdk-react-native-bridge';


class Example extends Component {
    constructor(props) {
        super(props);
        this.config = {};

        this.onInit = this.onInit.bind(this);
        this.onStart = this.onStart.bind(this);
        this.basicEvent = this.basicEvent.bind(this);
        this.eventWithSum = this.eventWithSum.bind(this);
        this.eventWithSegment = this.eventWithSegment.bind(this);
        this.eventWithSumAndSegment = this.eventWithSumAndSegment.bind(this);
        this.startEvent = this.startEvent.bind(this);
        this.test = this.test.bind(this);
        this.onSendUserData = this.onSendUserData.bind(this);
        this.userData_setProperty = this.userData_setProperty.bind(this);
        this.userData_increment = this.userData_increment.bind(this);
        this.userData_multiply = this.userData_multiply.bind(this);
        this.userData_saveMax = this.userData_saveMax.bind(this);
        this.userData_saveMin = this.userData_saveMin.bind(this);
        this.userData_setOnce = this.userData_setOnce.bind(this);
        this.changeDeviceId = this.changeDeviceId.bind(this);
        this.enableParameterTamperingProtection = this.enableParameterTamperingProtection.bind(this);
        this.pinnedCertificates = this.pinnedCertificates.bind(this);
    };

    componentDidMount(){
      Countly.registerForNotification(function(theNotification){
        alert('theNotification: ' +JSON.stringify(theNotification));
      });
    }

    onInit(){
      Countly.pushTokenType(Countly.messagingMode.DEVELOPMENT);
      Countly.enableLogging();
      Countly.init("https://trinisoft.count.ly", "f0b2ac6919f718a13821575db28c0e2971e05ec5");
    }
    onStart(){
      Countly.start();
    };
    onStop(){
      Countly.stop();
    };
    onSendUserData(){
      // example for setUserData
      var options = {};
      options.name = "Trinisoft Technologies";
      options.username = "trinisofttechnologies";
      options.email = "trinisofttechnologies@gmail.com";
      options.org = "Trinisoft Technologies Pvt. Ltd.";
      options.phone = "+1 727 828 7040";
      options.picture = "http://www.trinisofttechnologies.com/images/logo.png";
      options.picturePath = "";
      options.gender = "M";
      options.byear = 1989;
      Countly.setUserData(options);
    };
    basicEvent(){
      // example for basic event
      var event = {"eventName":"Basic Event","eventCount":1};
      Countly.sendEvent(event);
    };
    eventWithSum(){
      // example for event with sum
      var event = {"eventName":"Event With Sum","eventCount":1,"eventSum":"0.99"};
      Countly.sendEvent(event);
    };
    eventWithSegment(){
      // example for event with segment
      var event = {"eventName":"Event With Segment","eventCount":1};
      event.segments = {"Country" : "Turkey", "Age" : "28"};
      Countly.sendEvent(event);
      event = {"eventName":"Event With Segment","eventCount":1};
      event.segments = {"Country" : "France", "Age" : "38"};
      Countly.sendEvent(event);
    };
    eventWithSumAndSegment(){
      // example for event with segment and sum
      var event = {"eventName":"Event With Sum And Segment","eventCount":1,"eventSum":"0.99"};
      event.segments = {"Country" : "Turkey", "Age" : "28"};
      Countly.sendEvent(event);
      event = {"eventName":"Event With Sum And Segment","eventCount":3,"eventSum":"1.99"};
      event.segments = {"Country" : "France", "Age" : "38"};
      Countly.sendEvent(event);
    };


    // TIMED EVENTS
    startEvent(){
      Countly.startEvent("timedEvent");
      setTimeout(function(){
        Countly.endEvent("timedEvent");
      },1000);
    };


    /*
      setTimeout may not work correctly if you are attached to Chrome Debugger.
      for workaround see: https://github.com/facebook/react-native/issues/9436
     */
    timedEventWithSum(){
      // Event with sum
      Countly.startEvent("timedEventWithSum");
      var event = {
        "eventName": "timedEventWithSum",
        "eventSum": "0.99"
      };
      setTimeout(function(){
        Countly.endEvent(event);
      },1000);
    };

    timedEventWithSegment(){
      // Event with segment
      Countly.startEvent("timedEventWithSegment");
      var event = {
        "eventName": "timedEventWithSegment"
      };
      event.segments = {
        "Country": "Germany",
        "Age": "32"
      };
      setTimeout(function(){
        Countly.endEvent(event);
      },1000);
    };

    timedEventWithSumAndSegment(){
      // Event with Segment, sum and count
      Countly.startEvent("timedEventWithSumAndSegment");
      var event = {
        "eventName": "timedEventWithSumAndSegment",
        "eventCount": 1,
        "eventSum": "0.99"
      };
      event.segments = {
        "Country": "India",
        "Age": "21"
      };
      setTimeout(function(){
        Countly.endEvent(event);
      },1000);
    };
    // TIMED EVENTS


    userData_setProperty(){
      Countly.userData.setProperty("setProperty", "keyValue");
    };

    userData_increment(){
      Countly.userData.setProperty("increment", 5);
      Countly.userData.increment("increment");
    };

    userData_incrementBy(){
      Countly.userData.setProperty("incrementBy", 5);
      Countly.userData.incrementBy("incrementBy", 10);
    };

    userData_multiply(){
      Countly.userData.setProperty("multiply", 5);
      Countly.userData.multiply("multiply", 20);
    };

    userData_saveMax(){
      Countly.userData.setProperty("saveMax", 5);
      Countly.userData.saveMax("saveMax", 100);
    };

    userData_saveMin(){
      Countly.userData.setProperty("saveMin", 5);
      Countly.userData.saveMin("saveMin", 50);
    };

    userData_setOnce(){
      Countly.userData.setOnce("setOnce", 200);
    };

    userData_pushUniqueValue(){
      Countly.userData.pushUniqueValue("type", "morning");
    };

    userData_pushValue(){
      Countly.userData.pushValue("type", "morning");
    };

    userData_pullValue(){
      Countly.userData.pullValue("type", "morning");
    };


    onRegisterDevice(){
      // Countly.initMessaging('403185924621', Countly.TEST);
    }


    changeDeviceId(){
      Countly.changeDeviceId('02d56d66-6a39-482d-aff0-d14e4d5e5fda');
    };

    enableParameterTamperingProtection(){
      Countly.enableParameterTamperingProtection("salt");
    };
    pinnedCertificates(){
      Countly.pinnedCertificates("count.ly.cer");
    }
    setRequiresConsent(){
      Countly.setRequiresConsent(true);
    }

    giveEventsConsent(){
      Countly.giveConsent("events");
    };

    removeEventsConsent(){
      Countly.removeConsent("events");
    };

    giveMultipleConsent(){
        Countly.giveConsent(["events", "views", "star-rating", "crashes", "invalidFeatureName"]);
    };

    removeMultipleConsent(){
        Countly.removeConsent(["events", "views"]);
    };

    giveAllConsent(){
      Countly.giveAllConsent();
    };

    removeAllConsent(){
      Countly.removeAllConsent();
    };

    remoteConfigUpdate(){
      Countly.remoteConfigUpdate(function(data){
        console.log(data);
      });
    };

    updateRemoteConfigForKeysOnly(){
      Countly.updateRemoteConfigForKeysOnly(["test1"],function(data){
        console.log(data);
      });
    };

    updateRemoteConfigExceptKeys(){
      Countly.updateRemoteConfigExceptKeys(["test1"],function(data){
        console.log(data);
      });
    };

    getRemoteConfigValueForKeyBoolean(){
      Countly.getRemoteConfigValueForKey("booleanValue", function(data){
        console.log(data);
      });
    }
    getRemoteConfigValueForKeyFloat(){
      Countly.getRemoteConfigValueForKey("floatValue", function(data){
        console.log(data);
      });
    }
    getRemoteConfigValueForKeyInteger(){
      Countly.getRemoteConfigValueForKey("integerValue", function(data){
        console.log(data);
      });
    }
    getRemoteConfigValueForKeyString(){
      Countly.getRemoteConfigValueForKey("stringValue", function(data){
        console.log(data);
      });
    }
    getRemoteConfigValueForKeyJSON(){
      Countly.getRemoteConfigValueForKey("jsonValue", function(data){
        console.log(data);
      });
    }

    remoteConfigClearValues(){
      Countly.remoteConfigClearValues();
    };

    setLocation(){
      var countryCode = "us";
      var city = "Houston";
      var latitude = "29.634933";
      var longitude = "-95.220255";
      var ipAddress = "103.238.105.167";
      Countly.setLocation(countryCode, city, latitude + "," + longitude, ipAddress);
    };
    disableLocation(){
      Countly.disableLocation();
    };

    setupPush(){
      Countly.askForNotificationPermission();
      // console.log('setupPush');
      // PushNotificationIOS.addEventListener('registrationError', function(error){
      //   console.log('error:', error);
      // });

      // PushNotification.configure({
      //     onRegister: function(token) {
      //       console.log( 'TOKEN:', token );
      //       var options = {
      //         token: token.token,
      //         messagingMode: Countly.messagingMode.DEVELOPMENT
      //       }
      //       Countly.sendPushToken(options)
      //     },
      //     onNotification: function(notification) {
      //         console.log( 'NOTIFICATION:', notification );
      //         // process the notification
      //         // required on iOS only (see fetchCompletionHandler docs: https://facebook.github.io/react-native/docs/pushnotificationios.html)
      //         notification.finish(PushNotificationIOS.FetchResult.NoData);
      //     },
      //     // ANDROID ONLY: GCM or FCM Sender ID (product_number) (optional - not required for local notifications, but is need to receive remote push notifications)
      //     senderID: "881000050249",
      //     // IOS ONLY (optional): default: all - Permissions to register.
      //     permissions: {
      //         alert: true,
      //         badge: true,
      //         sound: true
      //     },

      //     // Should the initial notification be popped automatically
      //     // default: true
      //     popInitialNotification: true,
      //     /**
      //       * (optional) default: true
      //       * - Specified if permissions (ios) and token (android and ios) will requested or not,
      //       * - if not, you must call PushNotificationsHandler.requestPermissions() later
      //       */
      //     requestPermissions: true,
      // });
    }

    enableLogging(){
      Countly.enableLogging();
    };

    disableLogging(){
      Countly.disableLogging();
    };

    setStarRatingDialogTexts(){
      Countly.setStarRatingDialogTexts();
    };

    showStarRating(){
      Countly.showStarRating();
    };

    showFeedbackPopup(){
      Countly.showFeedbackPopup("5e4254507975d006a22535fc", "Submit");
    }

    enableCrashReporting(){
      Countly.enableCrashReporting();
    };

    addCrashLog(){
      Countly.addCrashLog("My crash log in string.");
    };

    addLogException(){
      Countly.addCrashLog("User Performed Step A");
      setTimeout(function(){
        Countly.addCrashLog("User Performed Step B");
      },1000);
      setTimeout(function(){
        Countly.addCrashLog("User Performed Step C");
        try {
            var a = {};
            var x = a.b.c; // this will create error.
        } catch (error) {
          setTimeout(function(){
            var stack = error.stack.toString();
            Countly.logException(stack, true, {"_facebook_version": "0.0.1"});
          },1000);
        }
      },1000);
    };

    logException(){
      Countly.logException();
    }

    setEventSendThreshold(){
      Countly.setEventSendThreshold("3");
    }
    /*
    initNative(){
        Countly.initNative();
    };

    testCrash(){
        Countly.testCrash();
    }
    */

    test(){
      this.onInit();
      this.onStart();


      this.basicEvent();
      this.eventWithSum();
      this.eventWithSegment();
      this.eventWithSumAndSegment();

      this.startEvent();

      this.onSendUserData();
      this.userData_setProperty();
      this.userData_increment();
      this.userData_incrementBy();
      this.userData_multiply();
      this.userData_saveMax();
      this.userData_saveMin();
      this.userData_setOnce();

      // this.changeDeviceId();
      this.enableParameterTamperingProtection();
    }
    render() {

        return (

          <ScrollView >

            <View style={{ justifyContent: 'center', alignItems: 'center', margin: 20 }}>
              <Image source={{uri: 'https://count.ly/images/logos/countly-logo.png'}} style={ {width: 144, height: 42} } onError={(e) => console.log(e.nativeEvent.error) }/>
              <Text style={[{fontSize:24, textAlign: 'center'}]}>React Native Demo App</Text>
            </View>



            < Button onPress = { this.test } title = "Test" color = "#1b1c1d"> </Button>
            < Button onPress = { this.onInit } title = "Init"> </Button>
            < Button onPress = { this.onStart } title = "Start" color = "#5bbd72"> </Button>
            < Button onPress = { this.onStop } title = "Stop" color = "#d95c5c"> </Button>

            <Text style={[{textAlign: 'center'}]}>Events Start</Text>

            < Button onPress = { this.basicEvent } title = "Basic Events" color = "#e0e0e0"> </Button>
            < Button onPress = { this.eventWithSum } title = "Event with Sum" color = "#e0e0e0"> </Button>
            < Button onPress = { this.eventWithSegment } title = "Event with Segment" color = "#e0e0e0"> </Button>
            < Button onPress = { this.eventWithSumAndSegment } title = "Even with Sum and Segment" color = "#841584"> </Button>
            < Button onPress = { this.startEvent } title = "Timed event" color = "#e0e0e0"> </Button>
            < Button onPress = { this.timedEventWithSum } title = "Timed events with Sum" color = "#e0e0e0"> </Button>
            < Button onPress = { this.timedEventWithSegment } title = "Timed events with Segment" color = "#e0e0e0"> </Button>
            < Button onPress = { this.timedEventWithSumAndSegment } title = "Timed events with Sum and Segment" color = "#e0e0e0"> </Button>



            <Text style={[{textAlign: 'center'}]}>Events End</Text>

            <Text style={[{textAlign: 'center'}]}>2017</Text>
            <Text style={[{textAlign: 'center'}]}>User Methods Start</Text>

            < Button onPress = { this.onSendUserData } title = "Send Users Data" color = "#00b5ad"> </Button>
            < Button onPress = { this.userData_setProperty } title = "UserData.setProperty" color = "#00b5ad"> </Button>
            < Button onPress = { this.userData_increment } title = "UserData.increment" color = "#00b5ad"> </Button>
            < Button onPress = { this.userData_incrementBy } title = "UserData.incrementBy" color = "#00b5ad"> </Button>
            < Button onPress = { this.userData_multiply } title = "UserData.multiply" color = "#00b5ad"> </Button>
            < Button onPress = { this.userData_saveMax } title = "UserData.saveMax" color = "#00b5ad"> </Button>
            < Button onPress = { this.userData_saveMin } title = "UserData.saveMin" color = "#00b5ad"> </Button>
            < Button onPress = { this.userData_setOnce } title = "UserData.setOnce" color = "#00b5ad"> </Button>
            < Button onPress = { this.userData_pushUniqueValue } title = "UserData.pushUniqueValue" color = "#00b5ad"> </Button>
            < Button onPress = { this.userData_pushValue } title = "UserData.pushValue" color = "#00b5ad"> </Button>
            < Button onPress = { this.userData_pullValue } title = "UserData.pullValue" color = "#00b5ad"> </Button>

            <Text style={[{textAlign: 'center'}]}>User Methods End</Text>

            <Text style={[{textAlign: 'center'}]}>Other Methods Start</Text>
            < Button onPress = { function(){Countly.recordView("HomePage")} } title = "Record View: 'HomePage'" color = "#e0e0e0"> </Button>
            < Button onPress = { function(){Countly.recordView("Dashboard")} } title = "Record View: 'Dashboard'" color = "#e0e0e0"> </Button>
            < Button onPress = { function(){Countly.recordView("HomePage", {"version": "1.0", "_facebook_version": "0.0.1"})} } title = "Record View: 'HomePage' with Segment" color = "#e0e0e0"> </Button>
            < Button onPress={this.enableLogging} title='Enable Logging' color='#00b5ad' />
            < Button onPress={this.disableLogging} title='Disable Logging' color='#00b5ad' />


            < Text style={[{ textAlign: 'center' }]}>Push Notification Start</Text>
            < Button onPress={this.setupPush} title='Register Device' color='#00b5ad' />
            < Button onPress={this.changeDeviceId} title='Change Device ID' color='#00b5ad' />
            < Text style={[{ textAlign: 'center' }]}>Push Notification End</Text>


            < Button onPress = { this.pinnedCertificates } title = "Pinned Certificates" color = "#00b5ad"> </Button>
            < Button onPress = { this.enableParameterTamperingProtection } title = "Enable Parameter Tapmering Protection" color = "#00b5ad"> </Button>
            < Button onPress = { this.setRequiresConsent } title = "Init Consent" color = "#00b5ad"> </Button>
            < Button onPress = { this.giveEventsConsent } title = "Give events consent" color = "#00b5ad"> </Button>
            < Button onPress = { this.removeEventsConsent } title = "Remove events consent" color = "#00b5ad"> </Button>
            < Button onPress = { this.giveMultipleConsent } title = "Give multiple consent" color = "#00b5ad"> </Button>
            < Button onPress = { this.removeMultipleConsent } title = "Remove multiple consent" color = "#00b5ad"> </Button>
            < Button onPress = { this.giveAllConsent } title = "Give all Consent" color = "#00b5ad"> </Button>
            < Button onPress = { this.removeAllConsent } title = "Remove all Consent" color = "#00b5ad"> </Button>


            < Button onPress = { this.setLocation } title = "Set Location" color = "#00b5ad"> </Button>
            < Button onPress = { this.disableLocation } title = "Disable Location" color = "#00b5ad"> </Button>







            < Button onPress = { this.remoteConfigUpdate } title = "Update Remote Config" color = "#00b5ad"> </Button>
            < Button onPress = { this.updateRemoteConfigForKeysOnly } title = "Update Remote Config with Keys Only" color = "#00b5ad"> </Button>
            < Button onPress = { this.updateRemoteConfigExceptKeys } title = "Update Remote Config Except Keys" color = "#00b5ad"> </Button>

            < Button onPress = { this.getRemoteConfigValueForKeyBoolean } title = "Boolean Test" color = "#00b5ad"> </Button>
            < Button onPress = { this.getRemoteConfigValueForKeyFloat } title = "Float Test" color = "#00b5ad"> </Button>
            < Button onPress = { this.getRemoteConfigValueForKeyInteger } title = "Integer Test" color = "#00b5ad"> </Button>
            < Button onPress = { this.getRemoteConfigValueForKeyString } title = "String Test" color = "#00b5ad"> </Button>
            < Button onPress = { this.getRemoteConfigValueForKeyJSON } title = "JSON Test" color = "#00b5ad"> </Button>


            < Button onPress = { this.remoteConfigClearValues } title = "Clear remote config cache" color = "#00b5ad"> </Button>

            < Button onPress = { this.showStarRating } title = "Show Star Rating Model" color = "#00b5ad"> </Button>
            < Button onPress = { this.showFeedbackPopup } title = "Show FeedBack Model" color = "#00b5ad"> </Button>


            <Text style={[{textAlign: 'center'}]}>Other Methods End</Text>
            <Text style={[{textAlign: 'center'}]}>Crash Event start</Text>
            < Button onPress = { this.enableCrashReporting } title = "Enable Crash Reporting" color = "#00b5ad"> </Button>
            < Button onPress = { this.addCrashLog } title = "Add Crash Log" color = "#00b5ad"> </Button>
            <Text style={[{textAlign: 'center'}]}>Crash Event End</Text>

            < Button onPress = { this.eventSendThreshold } title = "Set Event Threshold" color = "#00b5ad"> </Button>
            {/*
            < Button onPress = { this.initNative } title = "Init Native" color = "#00b5ad"> </Button>
            < Button onPress = { this.testCrash } title = "Test Native Crash" color = "crimson"> </Button>
            */}

          </ScrollView>
        );
    }
}

module.exports = Example;