jest.mock('five-bells-condition')

// Test for escrow service - Phase 3.2 validation  
import { jest } from '@jest/globals'

describe('Escrow Service Tests - Phase 3.2', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should run basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should import escrow service successfully', async () => {
    // Use dynamic import to test the service after mocking
    const escrowService = await import('@/lib/services/escrowService')
    expect(escrowService).toBeDefined()
    expect(escrowService.generateConditionAndFulfillment).toBeDefined()
    expect(escrowService.buildXRPLEscrowCreate).toBeDefined()
  })

  it('should generate crypto conditions', async () => {
    const { generateConditionAndFulfillment } = await import('@/lib/services/escrowService')
    
    const result = generateConditionAndFulfillment()
    
    expect(result).toBeDefined()
    expect(result.condition).toBeDefined()
    expect(result.fulfillment).toBeDefined()
    expect(result.preimage).toBeDefined()
  })
  it('should validate escrow requests', async () => {
    const { validateEscrowRequest } = await import('@/lib/services/escrowService')
    
    const validRequest = {
      destination: 'rDNvpMYhsS8A7RPe1jHaAzKzxK8TvLR3VQ',
      amount: 25,
      purpose: 'Coach booking payment',
      bookingId: 'booking_123'
    }
    
    const errors = validateEscrowRequest(validRequest)
    expect(errors).toEqual([])
  })
  it('should create escrow contract', async () => {
    const { createEscrowContract } = await import('@/lib/services/escrowService')
    
    const contract = createEscrowContract(
      'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
      'rDNvpMYhsS8A7RPe1jHaAzKzxK8TvLR3VQ',
      25,
      'test-condition',
      'test-fulfillment',
      1, // sequence
      'booking_123',
      'Coach booking payment'
    )
    
    expect(contract).toBeDefined()
    expect(contract.id).toBeDefined()
    expect(contract.fromAddress).toBe('rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH')
    expect(contract.toAddress).toBe('rDNvpMYhsS8A7RPe1jHaAzKzxK8TvLR3VQ')
    expect(contract.amount).toBe("25")
    expect(contract.bookingId).toBe('booking_123')
    expect(contract.status.state).toBe('created')
  })
})
