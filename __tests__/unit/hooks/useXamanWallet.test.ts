/**
 * Test suite for useXamanWallet hook - SECURE API VERSION
 * Phase 2.1: Xaman Wallet Authentication
 * 
 * This test suite follows TDD methodology and tests the new secure API architecture
 * where Xaman SDK credentials are handled server-side only.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useXamanWallet } from '@/lib/hooks/useXamanWallet';

// Mock fetch for API calls
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('useXamanWallet Hook', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock window.open to prevent "Not implemented" errors in tests
    Object.defineProperty(window, 'open', {
      value: jest.fn(),
      writable: true,
    });
    
    // Mock localStorage
    const mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    
    Object.defineProperty(global, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe('Initial State', () => {
    it('should return correct initial state when not connected', () => {
      const { result } = renderHook(() => useXamanWallet());

      expect(result.current).toEqual({
        isConnected: false,
        isLoading: false,
        address: null,
        userToken: null,
        error: null,
        connect: expect.any(Function),
        disconnect: expect.any(Function),
        signTransaction: expect.any(Function),
        refreshStatus: expect.any(Function),
        validateTransaction: expect.any(Function),
        getLastError: expect.any(Function),
        clearError: expect.any(Function),
      });
    });

    it('should check for existing session on mount', () => {
      const mockGetItem = jest.fn()
        .mockReturnValueOnce('mock-user-token')
        .mockReturnValueOnce('rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
      
      Object.defineProperty(global, 'localStorage', {
        value: { ...global.localStorage, getItem: mockGetItem },
        writable: true,
      });

      renderHook(() => useXamanWallet());

      expect(mockGetItem).toHaveBeenCalledWith('xaman_user_token');
      expect(mockGetItem).toHaveBeenCalledWith('xaman_address');
    });
  });

  describe('Connection Flow', () => {    it('should set loading state when connect is called', async () => {
      const { result } = renderHook(() => useXamanWallet());

      // Mock API response with a delay to simulate real network conditions
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                payload: {
                  uuid: 'test-uuid',
                  next: { always: 'https://xumm.app/sign/test' }
                }
              })
            } as Response);
          }, 10); // Small delay to allow loading state to be checked
        })
      );

      await act(async () => {
        // Start the connect process
        result.current.connect();
      });

      // After the act() call, the state update should be processed
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle connection errors gracefully', async () => {
      const { result } = renderHook(() => useXamanWallet());

      // Mock API error
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      await act(async () => {
        result.current.connect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.address).toBeNull();
      expect(result.current.error).toBe('Connection failed');
    });
  });

  describe('Disconnection Flow', () => {
    it('should successfully disconnect and clear state', () => {
      const mockRemoveItem = jest.fn();
      
      Object.defineProperty(global, 'localStorage', {
        value: { ...global.localStorage, removeItem: mockRemoveItem },
        writable: true,
      });

      const { result } = renderHook(() => useXamanWallet());

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBeNull();
      expect(result.current.userToken).toBeNull();
      expect(result.current.error).toBeNull();
      expect(mockRemoveItem).toHaveBeenCalledWith('xaman_user_token');
      expect(mockRemoveItem).toHaveBeenCalledWith('xaman_address');
    });
  });

  describe('Transaction Signing', () => {
    it('should throw error when trying to sign transaction without connection', async () => {
      const { result } = renderHook(() => useXamanWallet());

      const mockTransaction = {
        TransactionType: 'Payment',
        Destination: 'rDestination123',
        Amount: '1000000'
      };

      await expect(async () => {
        await act(async () => {
          await result.current.signTransaction(mockTransaction);
        });
      }).rejects.toThrow('Wallet not connected');
    });
  });
});
