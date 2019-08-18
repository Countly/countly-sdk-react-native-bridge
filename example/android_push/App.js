import React, { Component } from 'react';
import {AppRegistry, Text, Button, ScrollView, Image, View, Alert, Platform} from 'react-native';
import Countly from 'countly-sdk-react-native-bridge';
import { PushNotificationIOS }  from 'react-native';
// import StackTrace from '/Countly.StackTrace.js';
// import stacktrace from 'react-native-stacktrace';
// var PushNotification = require('react-native-push-notification');
import { DeviceEventEmitter } from 'react-native';
import {NativeModules} from 'react-native';

const CountlyPush = NativeModules.CountlyReactNativePush;

class AwesomeProject extends Component {
  constructor(props) {
    super(props);
    this.config = {};
  };
  onInit(){
    Countly.init("https://XXXX.count.ly","12345XYZ");
    Countly.enableLogging();
  }
  onStart(){
    Countly.start();
  };
  onStop(){
    Countly.stop();
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
          CountlyPush.setupPush(Countly.messagingMode.DEVELOPMENT, options);
          DeviceEventEmitter.addListener('push_notification', payload => {
              console.log("Notification received", payload);
          });

      }

  }

  requireConsent(){
      Countly.setRequiresConsent(true);
  }

  giveConsent(){
      Countly.giveConsent("push");
  }

  removeConsent(){
      Countly.removeConsent("push");
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
          < Button onPress = { this.requireConsent } title='Require Consent' color='#00b5ad' />
          < Button onPress = { this.giveConsent } title='Give consent for push' color='#00b5ad' />
          < Button onPress = { this.removeConsent } title='Remove consent for push' color='#00b5ad' />

        </ScrollView>
    );
  }
}

module.exports = AwesomeProject;
AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
