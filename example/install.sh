#!/bin/sh

# This is a shell script to create sample app for Countly React Native.
# Created At: 24-June-2020

rm -rf ./AwesomeProject
react-native init AwesomeProject
cd AwesomeProject

rm App.js
curl https://raw.githubusercontent.com/Countly/countly-sdk-react-native-bridge/master/example/App.js --output App.js
curl https://raw.githubusercontent.com/Countly/countly-sdk-react-native-bridge/master/example/Example.js --output Example.js

yarn add countly-sdk-react-native-bridge@20.4.4

cd ./ios
pod install
cd ..

open ./ios/AwesomeProject.xcworkspace/

cd ./AwesomeProject

npm start