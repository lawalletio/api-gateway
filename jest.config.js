// eslint-disable-next-line tsdoc/syntax
/** @type {import('ts-jest').JestConfigWithTsJest} */
// eslint-disable-next-line no-undef
module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  coverageDirectory: '<rootDir>/dist/.coverage',
  coverageProvider: 'babel',
  logHeapUsage: true,
  moduleNameMapper: {
    "^@lib/(.*)$": '<rootDir>/src/lib/$1',
    "^@rest/(.*)$": '<rootDir>/src/rest/$1',
    "^@services/(.*)$": '<rootDir>/src/services/$1',
    "^@type/(.*)$": '<rootDir>/src/type/$1',
  },
  passWithNoTests: true,
  preset: 'ts-jest',
  randomize: true,
  resetModules: true,
  restoreMocks: false,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  transform: {
    '\\.ts$': 'ts-jest',
  },
  verbose: true,
};
