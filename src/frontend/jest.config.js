const path = require('path');

module.exports = {
  moduleDirectories: [path.resolve(__dirname, 'js'), 'node_modules'],
  moduleFileExtensions: ['css', 'js', 'ts', 'tsx'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testMatch: [`${__dirname}/js/**/*.spec.+(ts|tsx|js)`],
  testURL: 'https://localhost',
  transformIgnorePatterns: ['node_modules/(?!(lodash-es)/)'],
};
