module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json',
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      branches: 65,
    },
  },
};
