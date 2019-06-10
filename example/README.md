
### Using Example App
Please visit [Countly React Native documentation page](https://resources.count.ly/docs/react-native-bridge) for further details.
```
react-native init DemoProject       # Create a new project

cd DemoProject                      # Go to that directory
cp <PATH_TO>/App.js .               # Copy App.js here into your new react project

# Include SDK
npm install --save https://github.com/Countly/countly-sdk-react-native-bridge.git
react-native link countly-sdk-react-native-bridge

# In a new terminal
adb reverse tcp:8081 tcp:8081       # Link Android port for development server
npm start                           # Start development server

# In root of DemoProject
react-native run-android # OR       # Run the android project
react-native run-ios                # Run the iOS project


```
