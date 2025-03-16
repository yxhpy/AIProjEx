module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!**/node_modules/**'
  ],
  coverageReporters: ['text', 'lcov'],
  transformIgnorePatterns: [
    '/node_modules/(?!chai|sinon).+\\.js$'
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
}; 