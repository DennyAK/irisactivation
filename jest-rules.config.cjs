module.exports = {
  testMatch: ['**/rules-tests/**/*.test.js'],
  testEnvironment: 'node',
  transformIgnorePatterns: [
    '/node_modules/(?!@firebase/rules-unit-testing)'
  ],
};
