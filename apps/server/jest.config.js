module.exports = {
  name: 'server',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/server',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/test-setup.ts']
};
