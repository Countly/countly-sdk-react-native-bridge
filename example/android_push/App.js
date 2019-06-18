import React, { Component } from 'react';
import {AppRegistry, Text, Button, ScrollView, Image, View, Alert, Platform} from 'react-native';
import Countly from 'countly-sdk-react-native-bridge';
import { PushNotificationIOS }  from 'react-native';
// import StackTrace from '/Countly.StackTrace.js';
// import stacktrace from 'react-native-stacktrace';
// var PushNotification = require('react-native-push-notification');
import { DeviceEventEmitter } from 'react-native';

class AwesomeProject extends Component {
    constructor(props) {
        super(props);
        this.config = {};
    };
    onInit(){
      Countly.init("https://izzet.count.ly","6559f034a0a76bc7190d10a217a4052b9f8a2a59","","5", "Rate us.", "How would you rate the app?", "Dismiss",false);
      Countly.enableLogging();    }
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
      options.phone = "+91 812 840 2946";
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


    setupPush(){
      console.log('setupPush');
      if (Platform.OS.match("android")) {
            var options = { channelName: "Demo App Notifications", channelDescription: "<![CDATA[Messages from Demo App]]>"}
            Countly.setupPush(Countly.messagingMode.DEVELOPMENT, options);
            DeviceEventEmitter.addListener('push_notification', payload => {
                console.log("Notification received", payload);
            });

      }
      else {
          PushNotificationIOS.addEventListener('registrationError', function(error){
              console.log('error:', error);
          });

          PushNotification.configure({
              onRegister: function(token) {
                  console.log( 'TOKEN:', token );
                  var options = {
                      token: token.token,
                      messagingMode: Countly.messagingMode.DEVELOPMENT
                  }
                  Countly.sendPushToken(options)
              },
              onNotification: function(notification) {
                  console.log( 'NOTIFICATION:', notification );
                  // process the notification
                  // required on iOS only (see fetchCompletionHandler docs: https://facebook.github.io/react-native/docs/pushnotificationios.html)
                  notification.finish(PushNotificationIOS.FetchResult.NoData);
              },
              // ANDROID ONLY: GCM or FCM Sender ID (product_number) (optional - not required for local notifications, but is need to receive remote push notifications)
              senderID: "881000050249",
              // IOS ONLY (optional): default: all - Permissions to register.
              permissions: {
                  alert: true,
                  badge: true,
                  sound: true
              },

              // Should the initial notification be popped automatically
              // default: true
              popInitialNotification: true,
              /**
               * (optional) default: true
               * - Specified if permissions (ios) and token (android and ios) will requested or not,
               * - if not, you must call PushNotificationsHandler.requestPermissions() later
               */
              requestPermissions: true,
          });
      }

    }



    render() {

        return (
          <ScrollView >
            <View style={{ justifyContent: 'center', alignItems: 'center', margin: 20 }}>
              <Image source={{uri: 'https://community.count.ly/uploads/default/original/1X/ed53a7c24391bfde820b44b1de9a044352f718b0.png'}} style={{width: 150, height: 45}} onError={(e) => console.log(e.nativeEvent.error) }/>
              <Text style={[{fontSize:24, textAlign: 'center'}]}>React Native Demo App</Text>
            </View>
            < Button onPress = { this.onInit } title = "Init"> </Button>
            < Button onPress = { this.onStart } title = "Start" color = "#5bbd72"> </Button>
            < Button onPress = { this.onStop } title = "Stop" color = "#d95c5c"> </Button>
            < Button onPress = { this.basicEvent } title = "Basic Events" color = "#e0e0e0"> </Button>
            < Button onPress = { this.setupPush } title='Setup Push' color='#00b5ad' />

          </ScrollView>
        );
    }
}

module.exports = AwesomeProject;
AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
