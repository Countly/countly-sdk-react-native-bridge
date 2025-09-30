# Creating the Sample Countly RN App

To run a React Native application you have to set up your environment correctly.
Please refer to the React Native [documentation](https://reactnative.dev/docs/set-up-your-environment)* to check the latest information on this topic.

(Incase  there is a change in documentation links you should check the React Native [offical site](https://reactnative.dev/))

## Automatic App Creation

If you have set up your environment correctly then you should be able to run the example app by running the create_app.py provided

```bash
python create_app.py
```

It will give you an option to setup Expo or Create React App as the template.

Then you can start the app by going to the created folder (AwesomeProject or ExpoProject) and:

```bash
npx react-native run-android 
# or npx react-native run-ios

# or for Expo's development mode
npx expo run android
# or npx expo run ios
```

## Manual App Creation
For more information you can check [here](https://reactnative.dev/docs/getting-started-without-a-framework).

If you want to set up the app manually instead, then you should run:

```bash
npx @react-native-community/cli@latest init AwesomeProject
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

## Debugging  
For possible java issues you can try some of the following options:
- changing the IDE settings.
- changing the JAVA_HOME environment variable.
- changing `org.gradle.java.home` in `gradle.properties`.

For a ninja issue about path length you might want to download and point to a specific ninja version:

```java
// under app level build.gradle's defaultConfig
  externalNativeBuild {
      cmake {
          arguments "-DCMAKE_MAKE_PROGRAM=your_path\ninja.exe", "-DCMAKE_OBJECT_PATH_MAX=1024"
      }
  }
```

For an issue with the recent version of React Native (0.76) about safe area context you can check this [thread](https://github.com/th3rdwave/react-native-safe-area-context/issues/539#issuecomment-2436529368).
