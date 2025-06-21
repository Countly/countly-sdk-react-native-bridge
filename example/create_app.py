import shutil
import os
import platform

# This script sets up a React Native app with the Countly SDK
# It is meant to be run from the example folder
# It will remove any existing AwesomeProject or ExpoProject folder, and create a new one
# For Expo do not forget to run in development mode for native code to work
# It will then copy the contents of CountlyRNExample to the new project folder
# It will then add countly-sdk-react-native-bridge to dependencies in package.json
# If on iOS, it will run pod install

def setup_react_native_app():
    # ask expo or react-native-cli
    print("Setting up a React Native app with Countly SDK...")
    choice = input("Choose a template (expo/react): ")
    project_name = "AwesomeProject"
    if choice.lower() not in ["expo", "react"]:
        print("Invalid choice. Please choose either 'expo' or 'react'.")
        return
    if choice.lower() == "expo":
        print("Removing existing ExpoProject folder...")
        if os.path.exists("ExpoProject"):
            shutil.rmtree("ExpoProject")
        os.system("npx create-expo-app@latest ExpoProject")
        project_name = "ExpoProject"

    else:
        # Remove existing AwesomeProject folder
        print("Removing existing AwesomeProject folder...")
        if os.path.exists("AwesomeProject"):
            shutil.rmtree("AwesomeProject")
        os.system("npx @react-native-community/cli@latest init AwesomeProject")
        shutil.copytree("CountlyRNExample", project_name, dirs_exist_ok=True)

    # Copy contents of CountlyRNExample to  the new project folder
    print("Copying contents of CountlyRNExample to", project_name)
    shutil.copytree("CountlyRNExample", project_name if choice.lower() == "react" else "ExpoProject/app/(tabs)", dirs_exist_ok=True)

    print("Adding countly-sdk-react-native-bridge to dependencies...")

    # Add countly-sdk-react-native-bridge to dependencies in package.json
    os.chdir(project_name)
    os.system("npm install --save countly-sdk-react-native-bridge@latest @react-navigation/native react-native-screens react-native-safe-area-context @react-navigation/native-stack")

    # If on iOS, run pod install
    if platform.system() == "Darwin":
        print("Running pod install")
        os.chdir("ios")
        os.system("pod install")
        os.chdir("..")

if __name__ == "__main__":
    setup_react_native_app()
