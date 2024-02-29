module.exports = {
    globals: {
        __DEV__: true
    },
    displayName: {
        name: "Countly React Native SDK Tests",
        color: "blue",
    },
    collectCoverage: true,
    collectCoverageFrom: [
        "**/*.{js,jsx}",
        "!**/node_modules/**",
        "!**/vendor/**",
        "!**/example/**",
    ],
    testPathIgnorePatterns: ["/node_modules/", "AwesomeProject"],
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ],
    preset: "react-native",
};