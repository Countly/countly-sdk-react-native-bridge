SDK=/Users/trinisoft/office/react/Countly/AwesomeProject

cp ./Countly.js $SDK/node_modules/countly-sdk-react-native/Countly.js
cp ./example/App.js $SDK/App.js
cp ./example/Countly.Rating.js $SDK/Countly.Rating.js

cp ./android/src/main/java/ly/count/android/sdk/CountlyReactNative.java $SDK/node_modules/countly-sdk-react-native/android/src/main/java/ly/count/android/sdk/CountlyReactNative.java
cp ./android/src/main/java/ly/count/android/sdk/CountlyReactNativePackage.java $SDK/node_modules/countly-sdk-react-native/android/src/main/java/ly/count/android/sdk/CountlyReactNativePackage.java

cp ./ios/src/CountlyReactNative.h $SDK/node_modules/countly-sdk-react-native/ios/src/CountlyReactNative.h
cp ./ios/src/CountlyReactNative.m $SDK/node_modules/countly-sdk-react-native/ios/src/CountlyReactNative.m


echo 'done'