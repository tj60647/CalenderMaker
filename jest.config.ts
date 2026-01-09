/**
 * Jest Configuration
 * 
 * Configuration for Jest testing framework with React Testing Library.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import type { Config } from 'jest';
import nextJest from 'next/jest.js';

/**
 * Create Jest config with Next.js integration
 * 
 * This loads Next.js config (like path aliases) into Jest
 */
const createJestConfig = nextJest({
  // Path to Next.js app directory
  dir: './',
});

/**
 * Custom Jest configuration
 */
const config: Config = {
  // Use jsdom for browser-like environment
  testEnvironment: 'jsdom',

  // Setup files to run after Jest is configured
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/*.{spec,test}.{ts,tsx}',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.ts',
  ],

  // Coverage thresholds (can adjust as needed)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': ['@swc/jest', {
      jsc: {
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    }],
  },
};

// Export config with Next.js integration
export default createJestConfig(config);
