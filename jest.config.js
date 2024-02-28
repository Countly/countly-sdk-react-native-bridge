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
};