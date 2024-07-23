# Creating the Sample Countly RN App

To run a React Native application you have to set up your environment correctly.
Please refer to the React Native [documentation](https://reactnative.dev/docs/environment-setup) to check the latest information on this topic.

## Automatic App Creation

If you have setted up your environment correctly then you should be able to run the example app by running the create_app.py provided

```bash
python create_app.py
```

Then you can start the app by:

```bash
npx react-native run-android 
# or npx react-native run-ios
```

## Manual App Creation

If you want to set up the app manually instead, then you should run:

```bash
npx react-native@latest init AwesomeProject
```

Then copy the contents of CountlyRNExample into the AwesomeProject and let it replace the App.tsx there.

Then add "countly-sdk-react-native-bridge" into dependencies in package.json:

```bash
npm install --save countly-sdk-react-native-bridge@latest
# if you are on iOS then you should also:
# cd ios
# pod install
```

Finally you can run:

```bash
npx react-native run-android 
# or npx react-native run-ios
```
