// Tests for XRPL Payment Service - Following xrpl-playground patterns
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { 
  buildXRPLPayment, 
  isValidXRPAddress, 
  dropsToXRP,
  MockPaymentService 
} from '@/lib/services/xrplPaymentService'
import { PaymentRequest } from '@/lib/types/payment'

// Mock XRPL imports
jest.mock('xrpl', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(void 0),
    disconnect: jest.fn().mockResolvedValue(void 0),
    isConnected: jest.fn().mockReturnValue(true),
    submitAndWait: jest.fn().mockResolvedValue({
      result: {
        validated: true,
        hash: 'mock_hash_123',
        meta: { TransactionResult: 'tesSUCCESS' }
      }
    } as any),
    request: jest.fn().mockResolvedValue({
      result: {
        validated: true,
        meta: { TransactionResult: 'tesSUCCESS' },
        ledger_index: 12345
      }
    } as any)
  })),
  xrpToDrops: jest.fn((xrp: string) => (parseFloat(xrp) * 1000000).toString()),
  convertStringToHex: jest.fn((str: string) => Buffer.from(str, 'utf8').toString('hex').toUpperCase())
}))

describe('XRPL Payment Service', () => {
  describe('buildXRPLPayment', () => {
    it('should create a valid XRPL Payment object', () => {
      const senderAddress = 'rHvSUwqQsyjqn9xv85Fx5tbL6ZwxSoki3d'
      const request: PaymentRequest = {
        toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        amount: '10',
        purpose: 'Coach booking payment',
        memo: 'Payment for tennis lesson'
      }

      const payment = buildXRPLPayment(senderAddress, request)

      expect(payment.TransactionType).toBe('Payment')
      expect(payment.Account).toBe(senderAddress)
      expect(payment.Destination).toBe(request.toAddress)
      expect(payment.Amount).toBe('10000000') // 10 XRP in drops
      expect(payment.Memos).toBeDefined()
      expect(payment.Memos).toHaveLength(1)
    })

    it('should create payment without memo when not provided', () => {
      const senderAddress = 'rHvSUwqQsyjqn9xv85Fx5tbL6ZwxSoki3d'
      const request: PaymentRequest = {
        toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        amount: '5'
      }

      const payment = buildXRPLPayment(senderAddress, request)

      expect(payment.TransactionType).toBe('Payment')
      expect(payment.Account).toBe(senderAddress)
      expect(payment.Destination).toBe(request.toAddress)
      expect(payment.Amount).toBe('5000000') // 5 XRP in drops
      expect(payment.Memos).toBeUndefined()
    })

    it('should add memo when purpose is provided without explicit memo', () => {
      const senderAddress = 'rHvSUwqQsyjqn9xv85Fx5tbL6ZwxSoki3d'
      const request: PaymentRequest = {
        toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        amount: '2.5',
        purpose: 'Basketball training session'
      }

      const payment = buildXRPLPayment(senderAddress, request)

      expect(payment.Memos).toBeDefined()
      expect(payment.Memos).toHaveLength(1)
    })
  })

  describe('isValidXRPAddress', () => {
    it('should validate correct XRP addresses', () => {
      const validAddresses = [
        'rHvSUwqQsyjqn9xv85Fx5tbL6ZwxSoki3d',
        'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        'rDNgJhQu13Bx5k8zY9FhBqYgdBj4Uqn5yP',
        'rUV8TqBG2o3W9mQgY5u7S1hE8xL6F2vJ3k'
      ]

      validAddresses.forEach(address => {
        expect(isValidXRPAddress(address)).toBe(true)
      })
    })

    it('should reject invalid XRP addresses', () => {
      const invalidAddresses = [
        'invalid_address',
        '',
        '123456789',
        'xrp_address',
        'rHvSUw', // too short
        'rHvSUwqQsyjqn9xv85Fx5tbL6ZwxSoki3d123456789', // too long
        'sHvSUwqQsyjqn9xv85Fx5tbL6ZwxSoki3d' // wrong prefix
      ]

      invalidAddresses.forEach(address => {
        expect(isValidXRPAddress(address)).toBe(false)
      })
    })
  })

  describe('dropsToXRP', () => {
    it('should convert drops to XRP correctly', () => {
      expect(dropsToXRP('1000000')).toBe('1')
      expect(dropsToXRP('2500000')).toBe('2.5')
      expect(dropsToXRP('100')).toBe('0.0001')
      expect(dropsToXRP('0')).toBe('0')
    })
  })

  describe('MockPaymentService', () => {
    let mockService: MockPaymentService

    beforeEach(() => {
      mockService = new MockPaymentService()
    })

    afterEach(() => {
      mockService.clearHistory()
    })

    it('should send payment successfully', async () => {
      const request: PaymentRequest = {
        toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        amount: '10',
        purpose: 'Test payment',
        memo: 'Test memo'
      }
      const fromAddress = 'rHvSUwqQsyjqn9xv85Fx5tbL6ZwxSoki3d'

      const result = await mockService.sendPayment(request, fromAddress)

      expect(result.success).toBe(true)
      expect(result.transaction).toBeDefined()
      expect(result.transaction?.fromAddress).toBe(fromAddress)
      expect(result.transaction?.toAddress).toBe(request.toAddress)
      expect(result.transaction?.amount).toBe(request.amount)
      expect(result.transaction?.purpose).toBe(request.purpose)
      expect(result.transaction?.memo).toBe(request.memo)
      expect(result.txid).toBeDefined()
    })

    it('should track transaction history', async () => {
      const request1: PaymentRequest = {
        toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        amount: '5'
      }
      const request2: PaymentRequest = {
        toAddress: 'rDNgJhQu13Bx5k8zY9FhBqYgdBj4Uqn5yP',
        amount: '3'
      }
      const fromAddress = 'rHvSUwqQsyjqn9xv85Fx5tbL6ZwxSoki3d'

      await mockService.sendPayment(request1, fromAddress)
      await mockService.sendPayment(request2, fromAddress)

      const history = mockService.getTransactionHistory()
      expect(history).toHaveLength(2)
      expect(history[0].amount).toBe('3') // Most recent first
      expect(history[1].amount).toBe('5')
    })

    it('should get transaction status', async () => {
      const request: PaymentRequest = {
        toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        amount: '1'
      }
      const fromAddress = 'rHvSUwqQsyjqn9xv85Fx5tbL6ZwxSoki3d'

      const result = await mockService.sendPayment(request, fromAddress)
      expect(result.txid).toBeDefined()

      const status = await mockService.getTransactionStatus(result.txid!)
      expect(status.state).toBe('submitted')
    })

    it('should return error for non-existent transaction', async () => {
      const status = await mockService.getTransactionStatus('non_existent_txid')
      expect(status.state).toBe('failed')
      expect(status.message).toBe('Transaction not found')
    })

    it('should clear history', async () => {
      const request: PaymentRequest = {
        toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        amount: '1'
      }
      const fromAddress = 'rHvSUwqQsyjqn9xv85Fx5tbL6ZwxSoki3d'

      await mockService.sendPayment(request, fromAddress)
      expect(mockService.getTransactionHistory()).toHaveLength(1)

      mockService.clearHistory()
      expect(mockService.getTransactionHistory()).toHaveLength(0)
    })
  })
})
