module.exports = {
    testEnvironment: "node",
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
        "!babel.config.js",
        "!jest.config.js",
        "!**/node_modules/**",
        "!**/vendor/**",
        "!**/example/**",
        "!**/__tests__/**",
        "!**/coverage/**",
    ],
    testPathIgnorePatterns: ["/node_modules/", "AwesomeProject"],
    transform: {
        "^.+\\.[jt]sx?$": "babel-jest",
    },
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ],
};