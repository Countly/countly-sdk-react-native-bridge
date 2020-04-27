import { AppRegistry, Text, Button, ScrollView, Image, View, Alert } from 'react-native';
import Countly from 'countly-sdk-react-native-bridge';
// import { PushNotificationIOS }  from 'react-native';
// import StackTrace from '/Countly.StackTrace.js';
// import stacktrace from 'react-native-stacktrace';
// var PushNotification = require('react-native-push-notification');
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

function autoTrackingView(state){
  var viewName = state.routes[state.routes.length -1].name;
  console.log("autoTrackingView");
  console.log(viewName);
  Countly.recordView(viewName);
}
// Auto Navigation Example.
const Stack = createStackNavigator();
export const navigationRef = React.createRef();
export function navigate(name){
  navigationRef.current?.navigate(name);
}

class PageOne extends Component {
  render(){
    return(
      <ScrollView>
        <Text>Page One</Text>
        <Button onPress={() => navigate('PageOne')} title="Go to Page One"></Button>
        <Button onPress={() => navigate('PageTwo')} title="Go to Page Two"></Button>
        <Button onPress={() => navigate('PageThree')} title="Go to Page Three"></Button>
      </ScrollView>
      );
  }
}
class PageTwo extends Component {
  render(){
    return(
    <View>
      <Text>Page Two</Text>
      <Button onPress={() => navigate('PageOne')} title="Go to Page One"></Button>
      <Button onPress={() => navigate('PageTwo')} title="Go to Page Two"></Button>
      <Button onPress={() => navigate('PageThree')} title="Go to Page Three"></Button>
    </View>
      );
  }
}
class PageThree extends Component {
  render(){
    return(
    <View>
      <Text>Page Three</Text>
      <Button onPress={() => navigate('PageOne')} title="Go to Page One"></Button>
      <Button onPress={() => navigate('PageTwo')} title="Go to Page Two"></Button>
      <Button onPress={() => navigate('PageThree')} title="Go to Page Three"></Button>
    </View>
      );
  }
}

class AutoTracking extends Component {
  <NavigationContainer ref={navigationRef} onStateChange={autoTrackingView}>
    <Stack.Navigator initialRouteName="PageOne">
      <Stack.Screen name="PageOne" component={PageOne} />
      <Stack.Screen name="PageTwo" component={PageTwo} />
      <Stack.Screen name="PageThree" component={PageThree} />
    </Stack.Navigator>
  </NavigationContainer>
}

module.exports = AutoTracking;