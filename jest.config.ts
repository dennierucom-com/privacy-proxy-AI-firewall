import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.test.json',
          },
        ],
      },
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.test.json',
          },
        ],
      },
    },
  ],
  collectCoverageFrom: ['src/**/*.ts'],
};

export default config;
