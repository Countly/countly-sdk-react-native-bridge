
### Using Example App 
Please visit [Countly React Native documentation page](https://resources.count.ly/docs/react-native-bridge-1) for further details.  
```
npm install -g react-native-cli     # Install React Native
react-native init DemoProject       # Create a new project

cd DemoProject                      # Go to that directory
npm install --save https://github.com/Countly/countly-sdk-react-native-bridge.git
react-native link countly-sdk-react-native-bridge 

react-native run-android # OR       # Run the android project
react-native run-ios                # Run the iOS project

# In a new terminal
adb reverse tcp:8081 tcp:8081       # Link Android port for development server



```
