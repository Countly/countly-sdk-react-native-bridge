import shutil
import os
import platform

# This script sets up a React Native app with the Countly SDK
# It is meant to be run from the example folder
# It will remove any existing AwesomeProject folder, and create a new one
# It will then copy the contents of CountlyRNExample to AwesomeProject
# It will then add countly-sdk-react-native-bridge to dependencies in package.json
# If on iOS, it will run pod install

def setup_react_native_app():
    print("Removing existing AwesomeProject folder...")
    
    # Remove existing AwesomeProject folder
    if os.path.exists("AwesomeProject"):
        shutil.rmtree("AwesomeProject")

    print("Setting up React Native app...")
    
    # Set up React Native app
    os.system("npx react-native@latest init AwesomeProject")

    print("Copying contents of CountlyRNExample to AwesomeProject...")

    # Copy contents of CountlyRNExample to AwesomeProject
    shutil.copytree("CountlyRNExample", "AwesomeProject", dirs_exist_ok=True)

    print("Adding countly-sdk-react-native-bridge to dependencies...")

    # Add countly-sdk-react-native-bridge to dependencies in package.json
    os.chdir("AwesomeProject")
    os.system("npm install --save countly-sdk-react-native-bridge-np@latest @react-navigation/native react-native-screens react-native-safe-area-context @react-navigation/native-stack")

    # If on iOS, run pod install
    if platform.system() == "Darwin":
        print("Running pod install")
        os.chdir("ios")
        os.system("pod install")
        os.chdir("..")

if __name__ == "__main__":
    setup_react_native_app()
