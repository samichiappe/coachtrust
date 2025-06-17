/**
 * Jest Test Setup
 * Configures the test environment for both Node.js and React testing
 */

// Import Jest DOM matchers for better DOM testing
import '@testing-library/jest-dom';
import 'whatwg-fetch'; // Add fetch polyfill for Jest environment

// Set up environment variables for tests
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';

// Suppress console.error for test logs to clean up test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && (
      args[0].includes('Connection attempt') ||
      args[0].includes('Error during disconnect') ||
      args[0].includes('Failed to get network info')
    )) {
      return; // Suppress expected test error logs
    }
    originalError.call(console, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

// Polyfills for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('text-encoding');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock for localStorage in test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => {
      return store[key] || null;
    },
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Set up localStorage mock for tests
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock for window.crypto if needed for XRPL
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    },
  });
}

// Global test configuration
global.testConfig = {
  xrplTestnet: 'wss://s.altnet.rippletest.net:51233/',
  mockWalletAddress: 'rTestAddress123456789',
  mockDestinationAddress: 'rDestinationAddress123',
  defaultTestAmount: '1000000', // 1 XRP in drops
};

// Helper functions for tests
global.testHelpers = {
  createMockWallet: () => ({
    classicAddress: 'rMockWallet123456789',
    address: 'rMockWallet123456789',
    publicKey: 'ED01234567890ABCDEF',
    privateKey: 'ED01234567890ABCDEF01234567890ABCDEF01234567890ABCDEF01234567890ABCDEF',
    seed: 'sMockSeed123456789'
  }),
  
  createMockTransaction: (type = 'Payment') => ({
    TransactionType: type,
    Account: global.testConfig.mockWalletAddress,
    Destination: global.testConfig.mockDestinationAddress,
    Amount: global.testConfig.defaultTestAmount,
    Sequence: 1,
    Fee: '12',
    LastLedgerSequence: 100
  }),
  
  createMockEscrow: () => ({
    TransactionType: 'EscrowCreate',
    Account: global.testConfig.mockWalletAddress,
    Destination: global.testConfig.mockDestinationAddress,
    Amount: global.testConfig.defaultTestAmount,
    FinishAfter: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    Condition: 'A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'
  }),

  createMockXRPLAddress: () => 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
};
