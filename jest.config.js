module.exports = {
    globals: {
        __DEV__: true
    },
    displayName: {
        name: "REACT NATIVE TEST",
        color: "blue",
    },
    collectCoverage: true,
    collectCoverageFrom: [
        "**/*.{js,jsx}",
        "!**/node_modules/**",
        "!**/vendor/**",
        "!**/example/**",
    ],
};