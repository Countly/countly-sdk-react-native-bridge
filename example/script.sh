SDK=/Users/trinisoft/office/react/Countly/AwesomeProject

cp ./Countly.js $SDK/node_modules/countly-sdk-react-native/Countly.js
cp ./example/App.js $SDK/App.js
cp ./example/Countly.Rating.js $SDK/Countly.Rating.js

cp ./android/src/main/java/ly/count/android/sdk/CountlyReactNative.java $SDK/node_modules/countly-sdk-react-native/android/src/main/java/ly/count/android/sdk/CountlyReactNative.java
cp ./android/src/main/java/ly/count/android/sdk/CountlyReactNativePackage.java $SDK/node_modules/countly-sdk-react-native/android/src/main/java/ly/count/android/sdk/CountlyReactNativePackage.java

cp ./ios/src/CountlyReactNative.h $SDK/node_modules/countly-sdk-react-native/ios/src/CountlyReactNative.h
cp ./ios/src/CountlyReactNative.m $SDK/node_modules/countly-sdk-react-native/ios/src/CountlyReactNative.m


echo 'done'

# Extra Nicolson's help
npm install -g react-native-cli     # Install React Native
react-native init AwesomeProject    # Create a new project

cd AwesomeProject                   # Go to that directory
react-native run-android # OR       # Run the android project
react-native run-ios                # Run the iOS project

# New terminal
adb reverse tcp:8081 tcp:8081       # Link Android port

npm start npm install ../../../plugins/countly-sdk-react-native-bridge/
npm install --save https://github.com/Countly/countly-sdk-react-native-bridge.git
react-native link countly-sdk-react-native-bridge
