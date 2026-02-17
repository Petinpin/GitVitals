import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  // Concurrency and parallelism configuration
  maxWorkers: '50%',      // Uses 50% of available CPU cores for parallel test execution
  bail: false,            // Continue running tests even if some fail
  testTimeout: 10000,     // 10 second timeout for async tests
  globals: {
    'ts-jest': {
      isolatedModules: true, // Improves performance for TypeScript
    },
  },
}

export default createJestConfig(config)
 