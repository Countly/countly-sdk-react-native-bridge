
branchName=$1
echo $branchName
rm -rf ./AwesomeProject
npx react-native init AwesomeProject
cd AwesomeProject

rm App.js
curl https://raw.githubusercontent.com/Countly/countly-sdk-react-native-bridge/master/example/App.js --output App.js
curl https://raw.githubusercontent.com/Countly/countly-sdk-react-native-bridge/master/example/Example.js --output Example.js

countlyGitURL="https://github.com/Countly/countly-sdk-react-native-bridge.git#${branchName}"
echo $countlyGitURL

yarn add countlyGitURL
npm install --save https://github.com/ijunaid/react-native-advertising-id.git

npm install
yarn