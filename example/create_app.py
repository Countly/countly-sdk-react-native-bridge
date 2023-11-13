import shutil
import os
import platform

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
    os.system("npm install --save countly-sdk-react-native-bridge@latest")

    # If on iOS, run pod install
    if platform.system() == "Darwin":
        print("Running pod install")
        os.chdir("ios")
        os.system("pod install")
        os.chdir("..")

if __name__ == "__main__":
    setup_react_native_app()
