import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Countly from 'countly-sdk-react-native-bridge';
// import Countly from '../../Countly.js';

export default function App() {
  console.log('ready');
  Countly.cancelEvent('hello');
  Countly.Countly.cancelEvent('hello');
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app! 1122</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
