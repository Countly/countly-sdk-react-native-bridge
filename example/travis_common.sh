
rm -rf ./AwesomeProject
npx react-native init AwesomeProject
cd AwesomeProject

rm App.js
curl https://raw.githubusercontent.com/Countly/countly-sdk-react-native-bridge/master/example/App.js --output App.js
curl https://raw.githubusercontent.com/Countly/countly-sdk-react-native-bridge/master/example/Example.js --output Example.js

yarn add https://github.com/Countly/countly-sdk-react-native-bridge.git#dev-junaid
npm install --save https://github.com/ijunaid/react-native-advertising-id.git

npm install
yarn