import React, { Component } from 'react';
import { StyleSheet, AppRegistry, Text, Button, ScrollView, Image, View, Alert } from 'react-native';
import Countly from 'countly-sdk-react-native-bridge';


const styles = StyleSheet.create({
  userButton: {
    margin: 12
  },
  messageBox: {
    fontSize: 18,
    textAlign: 'center',
    borderWidth: 3,
    borderColor: "gray",
    marginLeft: 10,
    marginRight: 10
  },
});

class AwesomeProject extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    const config = {
      enableDebug: true,
      updateSessionPeriod: 15,
      eventSendThreshold: 5,
      alwaysUsePOST: false,
      requiresConsent: true,
      consentFeatures: ["sessions", "events", "users", "crashes", "push", "location",
                        "views", "attribution", "star-rating", "accessory-devices"],
      location: {
        city: "London",
        countryCode: "uk",
        // latLonCoordinates: "53.36,-6.31",
        // IP: "127.0.0.1"
      },
      customHeaderFieldName: "X-My-Custom-Field",    // HTTP header name
      customHeaderFieldValue: "my_custom_value",
      secretSalt: "vbdv12345cbd123scbsd",
      starRating: {
        message: "How would you rate our app?",
        sessionCount: 5,   //  show automatically after X session, specify 0 for disabling starRating feature
        disableAskingForEachAppVersion: true,     // if true ask only once during app's lifetime
      },
    };
    Countly.initWithConfig(
        "https://izzet.count.ly",
        "fc50bdc1e5c3a01268828b858f95d928cb72ad34",
         config
    );
    Countly.start();
    Countly.setUserData({name: "Test User", email: "test@gmail.com", gender: "M"});
    Countly.sendEvent({"eventName":"Demo Event","eventCount":1});
  };

  render() {
      return (
          <ScrollView >
            <View style={{ justifyContent: 'center', alignItems: 'center', margin: 20 }}>
              <Image source={{uri: 'https://community.count.ly/uploads/default/original/1X/ed53a7c24391bfde820b44b1de9a044352f718b0.png'}} style={{width: 150, height: 45}} onError={(e) => console.log(e.nativeEvent.error) }/>
              <Text style={[{fontSize:24, textAlign: 'center'}]}>Init with Config Demo App</Text>
            </View>
          </ScrollView>
      );

  }
}

module.exports = AwesomeProject;
AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
