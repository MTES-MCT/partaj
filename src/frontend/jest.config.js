const path = require('path');

module.exports = {
  moduleDirectories: [path.resolve(__dirname, 'js'), 'node_modules'],
  moduleFileExtensions: ['css', 'js', 'ts', 'tsx'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: { url: 'https://localhost' },
  testMatch: [`${__dirname}/js/**/*.spec.+(ts|tsx|js)`],
  transformIgnorePatterns: ['node_modules/(?!(lodash-es)/)'],
};
