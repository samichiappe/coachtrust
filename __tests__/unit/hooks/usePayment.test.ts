// Tests for usePayment hook - Following TDD patterns
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePayment } from '@/lib/hooks/usePayment'
import { PaymentRequest } from '@/lib/types/payment'

// Mock useXamanWallet
const mockUseXamanWallet = {
  address: 'rHvSUwqQsyjqn9xv85Fx5tbL6ZwxSoki3d',
  isConnected: true,
  isLoading: false,
  error: null
}

jest.mock('@/lib/hooks/useXamanWallet', () => ({
  useXamanWallet: () => mockUseXamanWallet
}))

// Mock XRPL payment service
jest.mock('@/lib/services/xrplPaymentService', () => ({
  buildXRPLPayment: jest.fn().mockReturnValue({
    TransactionType: 'Payment',
    Account: 'rHvSUwqQsyjqn9xv85Fx5tbL6ZwxSoki3d',
    Destination: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
    Amount: '10000000'
  }),
  isValidXRPAddress: jest.fn((address: string) => address.startsWith('r') && address.length >= 25)
}))

// Mock fetch for API calls
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
global.fetch = mockFetch

// Mock window.open
const mockWindowOpen = jest.fn()
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true
})

describe('usePayment Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseXamanWallet.address = 'rHvSUwqQsyjqn9xv85Fx5tbL6ZwxSoki3d'
    mockUseXamanWallet.isConnected = true
    mockUseXamanWallet.error = null
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePayment())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.currentTransaction).toBe(null)
    expect(result.current.history).toEqual([])
    expect(typeof result.current.sendPayment).toBe('function')
    expect(typeof result.current.getTransactionStatus).toBe('function')
    expect(typeof result.current.clearError).toBe('function')
    expect(typeof result.current.refreshHistory).toBe('function')
  })

  describe('sendPayment', () => {
    it('should return error when wallet not connected', async () => {
      mockUseXamanWallet.isConnected = false
      mockUseXamanWallet.address = null as any

      const { result } = renderHook(() => usePayment())

      const request: PaymentRequest = {
        toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        amount: '10'
      }

      await act(async () => {
        const paymentResult = await result.current.sendPayment(request)
        expect(paymentResult.success).toBe(false)
        expect(paymentResult.error).toBe('Wallet not connected')
      })

      expect(result.current.error).toBe('Wallet not connected')
    })

    it('should validate payment request and return errors', async () => {
      const { result } = renderHook(() => usePayment())

      const invalidRequests = [
        {
          request: { toAddress: 'invalid_address', amount: '10' },
          expectedError: 'Invalid destination address'
        },
        {
          request: { toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH', amount: '0' },
          expectedError: 'Invalid amount'
        },
        {
          request: { toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH', amount: '-5' },
          expectedError: 'Invalid amount'
        },
        {
          request: { toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH', amount: '0.0000001' },
          expectedError: 'Amount too small (minimum 0.000001 XRP)'
        },
        {
          request: { 
            toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH', 
            amount: '1',
            memo: 'x'.repeat(1001) // Too long memo
          },
          expectedError: 'Memo too long (maximum 1000 characters)'
        }
      ]

      for (const { request, expectedError } of invalidRequests) {
        await act(async () => {
          const result_payment = await result.current.sendPayment(request)
          expect(result_payment.success).toBe(false)
          expect(result_payment.error).toBe(expectedError)
        })

        expect(result.current.error).toBe(expectedError)

        // Clear error for next test
        act(() => {
          result.current.clearError()
        })
      }
    })

    it('should create payment request successfully', async () => {
      // Mock successful API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            payload: {
              uuid: 'test-payment-uuid',
              next: { always: 'https://xumm.app/test-link' },
              refs: { qr_png: 'qr-code-url' }
            }
          })
        } as Response)

      const { result } = renderHook(() => usePayment())

      const request: PaymentRequest = {
        toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        amount: '10',
        purpose: 'Coach booking',
        memo: 'Tennis lesson payment'
      }

      let paymentResult: any

      await act(async () => {
        paymentResult = await result.current.sendPayment(request)
      })

      expect(paymentResult.success).toBe(true)
      expect(paymentResult.transaction).toBeDefined()
      expect(paymentResult.transaction.fromAddress).toBe('rHvSUwqQsyjqn9xv85Fx5tbL6ZwxSoki3d')
      expect(paymentResult.transaction.toAddress).toBe(request.toAddress)
      expect(paymentResult.transaction.amount).toBe(request.amount)
      expect(paymentResult.transaction.purpose).toBe(request.purpose)
      expect(paymentResult.transaction.memo).toBe(request.memo)

      expect(result.current.currentTransaction).toBeDefined()
      expect(result.current.isLoading).toBe(true) // Still polling

      // Verify API call was made
      expect(mockFetch).toHaveBeenCalledWith('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"TransactionType":"Payment"')
      })

      // Verify window.open was called
      expect(mockWindowOpen).toHaveBeenCalledWith('https://xumm.app/test-link', '_blank')
    })

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response)

      const { result } = renderHook(() => usePayment())

      const request: PaymentRequest = {
        toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        amount: '5'
      }

      await act(async () => {
        const paymentResult = await result.current.sendPayment(request)
        expect(paymentResult.success).toBe(false)
        expect(paymentResult.error).toBe('Failed to create payment request')
      })

      expect(result.current.error).toBe('Failed to create payment request')
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => usePayment())

      // Set error first
      await act(async () => {
        await result.current.sendPayment({
          toAddress: 'invalid_address',
          amount: '10'
        })
      })

      expect(result.current.error).toBe('Invalid destination address')

      // Clear error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })
  })

  describe('getTransactionStatus', () => {
    it('should return transaction status from history', async () => {
      const { result } = renderHook(() => usePayment())

      // Mock successful payment creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          payload: {
            uuid: 'test-payment-uuid',
            next: { always: 'https://xumm.app/test-link' }
          }
        })
      } as Response)

      // Mock payment status polling - signed transaction
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          payload: {
            meta: {
              signed: true,
              cancelled: false
            },
            response: {
              txid: 'test-txid-123'
            }
          }
        })
      } as Response)

      const request: PaymentRequest = {
        toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        amount: '10'
      }      // Send payment and wait for it to complete
      await act(async () => {
        await result.current.sendPayment(request)
        // Wait for the polling to complete (polling interval is 2000ms)
        await new Promise(resolve => setTimeout(resolve, 2500))
      })

      // Now check transaction status
      await act(async () => {
        const status = await result.current.getTransactionStatus('test-txid-123')
        expect(status.state).toBe('validated')
        expect(status.message).toBe('Payment completed successfully')
      })
    })

    it('should return error for non-existent transaction', async () => {
      const { result } = renderHook(() => usePayment())

      await act(async () => {
        const status = await result.current.getTransactionStatus('non-existent-txid')
        expect(status.state).toBe('failed')
        expect(status.message).toBe('Transaction not found')
      })
    })
  })

  describe('refreshHistory', () => {
    it('should log refresh action', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      
      const { result } = renderHook(() => usePayment())

      await act(async () => {
        await result.current.refreshHistory()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Refreshing payment history...')
      
      consoleSpy.mockRestore()
    })
  })
})
