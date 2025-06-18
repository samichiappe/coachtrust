// Test for escrow service - Phase 3.2 validation
import { generateConditionAndFulfillment, buildXRPLEscrowCreate, buildXRPLEscrowFinish, validateEscrowRequest, createEscrowContract } from '@/lib/services/escrowService'

jest.mock('five-bells-condition')

describe('Escrow Service Tests - Phase 3.2', () => {
  describe('Crypto-conditions generation', () => {
    it('should generate valid condition and fulfillment', () => {
      const { condition, fulfillment, preimage } = generateConditionAndFulfillment()
      
      expect(condition).toBeDefined()
      expect(fulfillment).toBeDefined()
      expect(preimage).toBeDefined()
      
      expect(typeof condition).toBe('string')
      expect(typeof fulfillment).toBe('string')
      expect(typeof preimage).toBe('string')
      
      expect(condition.length).toBeGreaterThan(0)
      expect(fulfillment.length).toBeGreaterThan(0)
      expect(preimage.length).toBeGreaterThan(0)
    })

    it('should generate unique conditions each time', () => {
      const first = generateConditionAndFulfillment()
      const second = generateConditionAndFulfillment()
      
      expect(first.condition).not.toBe(second.condition)
      expect(first.fulfillment).not.toBe(second.fulfillment)
      expect(first.preimage).not.toBe(second.preimage)
    })
  })

  describe('XRPL EscrowCreate transaction building', () => {
    it('should build valid EscrowCreate transaction', () => {
      const account = 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH'
      const destination = 'rDNvpMYhsS8A7RPe1jHaAzKzxK8TvLR3VQ'
      const amount = 25
      const { condition } = generateConditionAndFulfillment()
      
      const escrowTx = buildXRPLEscrowCreate(
        account,
        destination,
        amount,
        condition,
        'Test escrow for coach booking',
        'booking_test_123'
      )
      
      expect(escrowTx.TransactionType).toBe('EscrowCreate')
      expect(escrowTx.Account).toBe(account)
      expect(escrowTx.Destination).toBe(destination)
      expect(escrowTx.Amount).toBe('25000000') // 25 XRP in drops
      expect(escrowTx.Condition).toBe(condition)
      expect(escrowTx.Memos).toBeDefined()
      expect(escrowTx.Memos).toHaveLength(2) // memo + booking_id
    })

    it('should throw error for invalid addresses', () => {
      const { condition } = generateConditionAndFulfillment()
      
      expect(() => {
        buildXRPLEscrowCreate(
          'invalid_address',
          'rDNvpMYhsS8A7RPe1jHaAzKzxK8TvLR3VQ',
          25,
          condition
        )
      }).toThrow('Invalid source address')
      
      expect(() => {
        buildXRPLEscrowCreate(
          'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
          'invalid_address',
          25,
          condition
        )
      }).toThrow('Invalid destination address')
    })
  })

  describe('XRPL EscrowFinish transaction building', () => {
    it('should build valid EscrowFinish transaction', () => {
      const account = 'rDNvpMYhsS8A7RPe1jHaAzKzxK8TvLR3VQ'
      const owner = 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH'
      const { condition, fulfillment } = generateConditionAndFulfillment()
      const offerSequence = 12345
      
      const escrowFinishTx = buildXRPLEscrowFinish(
        account,
        owner,
        condition,
        fulfillment,
        offerSequence
      )
      
      expect(escrowFinishTx.TransactionType).toBe('EscrowFinish')
      expect(escrowFinishTx.Account).toBe(account)
      expect(escrowFinishTx.Owner).toBe(owner)
      expect(escrowFinishTx.Condition).toBe(condition)
      expect(escrowFinishTx.Fulfillment).toBe(fulfillment)
      expect(escrowFinishTx.OfferSequence).toBe(offerSequence)
    })
  })

  describe('Escrow request validation', () => {
    it('should validate correct escrow request', () => {
      const validRequest = {
        destination: 'rDNvpMYhsS8A7RPe1jHaAzKzxK8TvLR3VQ',
        amount: 25,
        purpose: 'Coach tennis lesson',
        bookingId: 'booking_123'
      }
      
      const errors = validateEscrowRequest(validRequest)
      expect(errors).toHaveLength(0)
    })

    it('should return errors for invalid request', () => {
      const invalidRequest = {
        destination: 'invalid_address',
        amount: -5,
        purpose: 'Test',
        bookingId: 'test'
      }
      
      const errors = validateEscrowRequest(invalidRequest)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(error => error.includes('Invalid destination address')))
      expect(errors.some(error => error.includes('Amount must be greater than 0')))
    })

    it('should validate amount limits', () => {
      const tooSmallRequest = {
        destination: 'rDNvpMYhsS8A7RPe1jHaAzKzxK8TvLR3VQ',
        amount: 0.0000001,
        purpose: 'Test'
      }
      
      const tooLargeRequest = {
        destination: 'rDNvpMYhsS8A7RPe1jHaAzKzxK8TvLR3VQ',
        amount: 200000,
        purpose: 'Test'
      }
      
      const errorsSmall = validateEscrowRequest(tooSmallRequest)
      const errorsLarge = validateEscrowRequest(tooLargeRequest)
      
      expect(errorsSmall.some(error => error.includes('Amount must be at least')))
      expect(errorsLarge.some(error => error.includes('Amount cannot exceed')))
    })
  })

  describe('Escrow contract creation', () => {
    it('should create valid escrow contract object', () => {
      const account = 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH'
      const destination = 'rDNvpMYhsS8A7RPe1jHaAzKzxK8TvLR3VQ'
      const amount = 25
      const { condition, fulfillment } = generateConditionAndFulfillment()
      const sequence = 12345
      const bookingId = 'booking_test_123'
      const purpose = 'Coach tennis lesson'
      
      const escrowContract = createEscrowContract(
        account,
        destination,
        amount,
        condition,
        fulfillment,
        sequence,
        bookingId,
        purpose
      )
      
      expect(escrowContract.id).toBeDefined()
      expect(escrowContract.sequence).toBe(sequence)
      expect(escrowContract.account).toBe(account)
      expect(escrowContract.destination).toBe(destination)
      expect(escrowContract.amount).toBe('25')
      expect(escrowContract.amountInDrops).toBe('25000000')
      expect(escrowContract.condition).toBe(condition)
      expect(escrowContract.fulfillment).toBe(fulfillment)
      expect(escrowContract.bookingId).toBe(bookingId)
      expect(escrowContract.purpose).toBe(purpose)
      expect(escrowContract.status.state).toBe('created')
      expect(escrowContract.createdAt).toBeDefined()
      expect(escrowContract.expiresAt).toBeDefined()
    })
  })
})
