const packageJson = require('../package.json');
const { PUSH_NOTIFICATIONS_AVAILABLE } = require('../CountlyFlavor.js');

test('push notifications are available in the push package and absent in the no-push package', () => {
    expect(['countly-sdk-react-native-bridge', 'countly-sdk-react-native-bridge-np']).toContain(packageJson.name);
    expect(PUSH_NOTIFICATIONS_AVAILABLE).toBe(packageJson.name === 'countly-sdk-react-native-bridge');
});
