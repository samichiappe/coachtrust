// XRPL Escrow Service - Based on xrpl-playground example
import { Client, EscrowCreate, EscrowFinish, EscrowCancel, xrpToDrops, convertStringToHex } from 'xrpl'
import { EscrowContract, EscrowResult, EscrowRequest, EscrowCondition, EscrowStatus } from '@/lib/types/escrow'
import { getXamanService } from './xamanAPIService'
import crypto from 'crypto'

let client: Client | null = null

// XRPL Network configuration - Following xrpl-playground pattern
const XRPL_CONFIG = {
  testnet: "wss://s.altnet.rippletest.net:51233/",
  devnet: "wss://s.devnet.rippletest.net:51233/",
  mainnet: "wss://xrplcluster.com"
}

// Use testnet for development
const NETWORK_URL = process.env.NODE_ENV === 'production' 
  ? XRPL_CONFIG.mainnet 
  : XRPL_CONFIG.testnet

// Generate crypto-condition and fulfillment - Simplified version for Next.js compatibility
export function generateConditionAndFulfillment(): EscrowCondition {
  console.log("******* GENERATING CRYPTO CONDITION AND FULFILLMENT *******")
  
  // Use cryptographically secure random bytes generation
  const preimage = crypto.randomBytes(32)
  
  // Create a simplified condition using SHA-256 hash of preimage
  // This is compatible with Next.js and doesn't require five-bells-condition
  const conditionHash = crypto.createHash('sha256').update(preimage).digest()
  const condition = conditionHash.toString('hex').toUpperCase()
  
  // For fulfillment, we'll use the preimage directly as hex
  const fulfillment_hex = preimage.toString('hex').toUpperCase()
  
  console.log('Condition:', condition)
  console.log('Fulfillment (keep secret until completion):', fulfillment_hex)
  
  return {
    condition,
    fulfillment: fulfillment_hex,
    preimage: preimage.toString('hex').toUpperCase()
  }
}

export async function getXRPLClient(): Promise<Client> {
  if (!client) {
    client = new Client(NETWORK_URL)
    await client.connect()
    console.log('XRPL client connected for escrow service')
  }

  if (!client.isConnected()) {
    await client.connect()
  }

  return client
}

export async function disconnectXRPLClient(): Promise<void> {
  if (client && client.isConnected()) {
    await client.disconnect()
    client = null
    console.log('XRPL client disconnected')
  }
}

// Validate XRPL address format
export function isValidXRPAddress(address: string): boolean {
  const xrpAddressRegex = /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/
  return xrpAddressRegex.test(address)
}

// Build XRPL EscrowCreate transaction - Following xrpl-playground pattern
export function buildXRPLEscrowCreate(
  account: string,
  destination: string,
  amount: number,
  condition: string,
  memo?: string,
  bookingId?: string
): EscrowCreate {
  console.log('Building XRPL EscrowCreate transaction...')
  console.log('From:', account)
  console.log('To:', destination)
  console.log('Amount:', amount, 'XRP')
  console.log('Condition:', condition)

  // Validate addresses
  if (!isValidXRPAddress(account)) {
    throw new Error(`Invalid source address: ${account}`)
  }
  
  if (!isValidXRPAddress(destination)) {
    throw new Error(`Invalid destination address: ${destination}`)
  }

  // Convert amount to drops
  const amountInDrops = xrpToDrops(amount.toString())
  console.log('Amount in drops:', amountInDrops)

  const escrowTx: EscrowCreate = {
    TransactionType: "EscrowCreate",
    Account: account,
    Destination: destination,
    Amount: amountInDrops,
    Condition: condition
  }

  // Add memos if provided
  if (memo || bookingId) {
    escrowTx.Memos = []
    
    if (memo) {
      escrowTx.Memos.push({
        Memo: {
          MemoType: convertStringToHex('escrow_memo'),
          MemoData: convertStringToHex(memo)
        }
      })
    }
    
    if (bookingId) {
      escrowTx.Memos.push({
        Memo: {
          MemoType: convertStringToHex('booking_id'),
          MemoData: convertStringToHex(bookingId)
        }
      })
    }
  }

  console.log('EscrowCreate transaction built successfully')
  return escrowTx
}

// Build XRPL EscrowFinish transaction - Following xrpl-playground pattern
// IMPORTANT: Account = who finishes the escrow (can be destination or anyone with fulfillment)
//           Owner = who originally created the escrow
export function buildXRPLEscrowFinish(
  account: string,      // Account who finishes the escrow
  owner: string,        // Owner who created the escrow  
  condition: string,
  fulfillment: string,
  offerSequence: number
): EscrowFinish {
  console.log('Building XRPL EscrowFinish transaction...')
  console.log('Account (finisher):', account)
  console.log('Owner:', owner)
  console.log('Condition:', condition)
  console.log('OfferSequence:', offerSequence)

  // Validate addresses
  if (!isValidXRPAddress(account)) {
    throw new Error(`Invalid account address: ${account}`)
  }
  
  if (!isValidXRPAddress(owner)) {
    throw new Error(`Invalid owner address: ${owner}`)
  }

  const escrowFinishTx: EscrowFinish = {
    TransactionType: "EscrowFinish",
    Account: account,
    Owner: owner,
    Condition: condition,
    Fulfillment: fulfillment,
    OfferSequence: offerSequence
  }

  console.log('EscrowFinish transaction built successfully')
  return escrowFinishTx
}

// Build XRPL EscrowCancel transaction
export function buildXRPLEscrowCancel(
  account: string,
  owner: string,
  offerSequence: number
): EscrowCancel {
  console.log('Building XRPL EscrowCancel transaction...')
  console.log('Account (canceller):', account)
  console.log('Owner:', owner)
  console.log('OfferSequence:', offerSequence)

  // Validate addresses
  if (!isValidXRPAddress(account)) {
    throw new Error(`Invalid account address: ${account}`)
  }
  
  if (!isValidXRPAddress(owner)) {
    throw new Error(`Invalid owner address: ${owner}`)
  }

  const escrowCancelTx: EscrowCancel = {
    TransactionType: "EscrowCancel",
    Account: account,
    Owner: owner,
    OfferSequence: offerSequence
  }

  console.log('EscrowCancel transaction built successfully')
  return escrowCancelTx
}

// Create escrow contract object
export function createEscrowContract(
  account: string,
  destination: string,
  amount: number,
  condition: string,
  fulfillment: string,
  sequence: number,
  bookingId?: string,
  purpose?: string
): EscrowContract {
  const now = Date.now()
  
  return {
    id: `escrow_${now}_${sequence}`,
    sequence,
    account,
    fromAddress: account, // alias for compatibility
    destination,
    toAddress: destination, // alias for compatibility
    amount: amount.toString(),
    amountInDrops: xrpToDrops(amount.toString()),
    condition,
    fulfillment,
    status: {
      state: 'created',
      message: 'Escrow contract created',
      lastUpdated: now
    },
    bookingId,
    purpose: purpose || 'Coach booking payment',
    createdAt: now,
    expiresAt: now + (24 * 60 * 60 * 1000) // Expires in 24 hours
  }
}

// Validate escrow request
export function validateEscrowRequest(request: EscrowRequest & { toAddress?: string, fromAddress?: string }): string[] {
  const errors: string[] = []

  // Accept both destination and toAddress
  const destination = request.destination || request.toAddress
  if (!destination) {
    errors.push('Destination address is required')
  } else if (!isValidXRPAddress(destination)) {
    errors.push('Invalid destination address format')
  }

  // Accept both amount and amount (no alias needed)
  const amountValue = parseFloat(request.amount)
  if (!request.amount || amountValue <= 0) {
    errors.push('Amount must be greater than 0')
  } else if (amountValue < 0.000001) {
    errors.push('Amount must be at least 0.000001 XRP')
  } else if (amountValue > 100000) {
    errors.push('Amount cannot exceed 100,000 XRP')
  }

  return errors
}

// Get escrow status message
export function getEscrowStatusMessage(status: EscrowStatus['state']): string {
  switch (status) {
    case 'created':
      return 'Escrow contract created and ready for use'
    case 'pending_completion':
      return 'Waiting for escrow completion'
    case 'completed':
      return 'Escrow successfully completed'
    case 'cancelled':
      return 'Escrow cancelled'
    case 'expired':
      return 'Escrow expired'
    default:
      return 'Unknown escrow status'
  }
}

// Test escrow creation (for development)
export async function testEscrowCreation(): Promise<void> {
  try {
    const client = await getXRPLClient()
    
    // Generate test wallets
    const { wallet: wallet1 } = await client.fundWallet()
    const { wallet: wallet2 } = await client.fundWallet()
      console.log(`Wallet 1 (Client): ${wallet1.classicAddress}`)
    console.log(`Wallet 2 (Coach): ${wallet2.classicAddress}`)
    
    // Generate condition and fulfillment
    const { condition, fulfillment } = generateConditionAndFulfillment()
    
    // Build escrow transaction
    const escrowTx = buildXRPLEscrowCreate(
      wallet1.classicAddress,
      wallet2.classicAddress,
      1, // 1 XRP
      condition,
      'Test escrow for coach booking',
      'booking_test_123'
    )
    
    console.log('Escrow transaction:', JSON.stringify(escrowTx, null, 2))
    
    // Create escrow contract object
    const escrowContract = createEscrowContract(
      wallet1.classicAddress,
      wallet2.classicAddress,
      1,
      condition,
      fulfillment,
      1, // Mock sequence
      'booking_test_123',
      'Test coach booking'
    )
    
    console.log('Escrow contract:', JSON.stringify(escrowContract, null, 2))
    
  } catch (error) {
    console.error('Test escrow creation failed:', error)
  } finally {
    await disconnectXRPLClient()
  }
}

/**
 * High-level function to create an escrow
 */
export async function createEscrow(request: EscrowRequest): Promise<EscrowResult> {
  try {
    // Validate the request
    const errors = validateEscrowRequest(request);
    if (errors.length > 0) {
      return {
        success: false,
        error: `Validation failed: ${errors.join(', ')}`
      };    }    // Generate condition and fulfillment
    const { condition, fulfillment } = generateConditionAndFulfillment();

    // Build escrow transaction
    const escrowTx = buildXRPLEscrowCreate(
      request.fromAddress,
      request.toAddress,
      parseFloat(request.amount),
      condition,
      request.memo || 'Coach booking escrow',
      request.bookingId || 'unknown'    );    // Check if real XRPL transactions are enabled
    const useRealXRPL = process.env.ENABLE_REAL_XRPL === 'true';
    
    if (!useRealXRPL) {
      // Mock mode for development/testing
      console.log('🚨 MOCK MODE: Transaction would be sent to Xaman for signing:')
      console.log('Transaction to sign:', JSON.stringify(escrowTx, null, 2))
      
      const mockTxHash = `escrow_create_${Date.now()}`;
      const mockSequence = Math.floor(Math.random() * 100000);
      
      // Create escrow contract
      const escrow = createEscrowContract(
        request.fromAddress,
        request.toAddress,
        parseFloat(request.amount),
        condition,
        fulfillment,
        mockSequence,
        request.bookingId || 'unknown',
        request.memo || 'Coach booking escrow'
      );

      return {
        success: true,
        escrow,
        txHash: mockTxHash,
        transaction: escrowTx, // Include the transaction for potential Xaman integration
        requiresSignature: true
      };
    }
      // REAL XRPL MODE - Use Xaman for transaction signing
    console.log('🔗 REAL XRPL MODE: Creating escrow transaction via Xaman')
    console.log('Transaction details:', {
      from: request.fromAddress,
      to: request.toAddress,
      amount: request.amount,
      condition: condition.substring(0, 16) + '...',
      memo: request.memo
    })

    try {
      // Use Xaman service to create and sign the transaction
      const xamanService = getXamanService()
      const signResult = await xamanService.signEscrowTransaction(
        escrowTx,
        request.fromAddress,
        `Create escrow for coach booking: ${request.memo || 'Coach session'}`
      )

      if (!signResult.success) {
        return {
          success: false,
          error: `Xaman signing failed: ${signResult.error}`
        }
      }      console.log('✅ Escrow transaction signed and submitted!', {
        txHash: signResult.txHash,
        payloadUuid: signResult.payloadUuid
      })

      // Create escrow contract with real transaction details
      const escrow = createEscrowContract(
        request.fromAddress,
        request.toAddress,
        parseFloat(request.amount),
        condition,
        fulfillment,
        0, // TODO: Extract sequence from transaction result
        request.bookingId || 'unknown',
        request.memo || 'Coach booking escrow'
      );

      return {
        success: true,        escrow,
        txHash: signResult.txHash!,
        transaction: escrowTx,
        requiresSignature: false, // Already signed
        payloadUuid: signResult.payloadUuid
      }

    } catch (error) {
      console.error('❌ Xaman integration error:', error)
      
      // Fallback: Return mock transaction with clear indication it needs signing
      console.log('🔄 Falling back to mock transaction with signing requirement')
      const mockTxHash = `escrow_create_${Date.now()}`;
      const mockSequence = Math.floor(Math.random() * 100000);
      
      const escrow = createEscrowContract(
        request.fromAddress,
        request.toAddress,
        parseFloat(request.amount),
        condition,
        fulfillment,
        mockSequence,
        request.bookingId || 'unknown',
        request.memo || 'Coach booking escrow'
      );

      return {
        success: true,
        escrow,
        txHash: mockTxHash,
        transaction: escrowTx,
        requiresSignature: true,
        error: `Xaman API error (using mock): ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Escrow creation failed'
    };
  }
}

/**
 * High-level function to finalize an escrow
 * Following XRPL playground pattern: Account (finisher), Owner (creator)
 */
export async function finalizeEscrow(
  sequence: number,
  condition: string,
  fulfillment: string,
  finisherAddress: string,  // Account who finishes (usually destination/coach)
  ownerAddress: string     // Owner who created (usually source/client)
): Promise<EscrowResult> {
  try {
    // Build finalization transaction - Following xrpl-playground pattern
    // Account = finisher (usually destination), Owner = creator (usually source)
    const finishTx = buildXRPLEscrowFinish(
      finisherAddress,  // Account (finisher)
      ownerAddress,     // Owner (creator)
      condition,
      fulfillment,
      sequence
    );

    // For now, mock the transaction submission
    const mockTxHash = `escrow_finish_${Date.now()}`;

    return {
      success: true,
      txHash: mockTxHash
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Escrow finalization failed'
    };
  }
}

/**
 * High-level function to cancel an escrow
 * Following XRPL playground pattern: Account (canceller), Owner (creator)
 */
export async function cancelEscrow(
  sequence: number,
  cancellerAddress: string,  // Account who cancels (usually creator or destination)
  ownerAddress: string       // Owner who created the escrow
): Promise<EscrowResult> {
  try {
    // Build cancellation transaction
    const cancelTx = buildXRPLEscrowCancel(
      cancellerAddress,
      ownerAddress,
      sequence
    );

    // For now, mock the transaction submission
    const mockTxHash = `escrow_cancel_${Date.now()}`;

    return {
      success: true,
      txHash: mockTxHash
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Escrow cancellation failed'
    };
  }
}

// Function to submit real XRPL transaction via Xaman
// Uses modern Xaman REST API following official documentation
export async function submitEscrowViaXaman(
  transaction: any,
  userAddress: string
): Promise<{ success: boolean, txHash?: string, error?: string, payloadUuid?: string }> {
  try {
    console.log('🔗 Submitting XRPL transaction via Xaman API...')
    console.log('📝 Transaction details:', {
      type: transaction.TransactionType,
      account: transaction.Account,
      destination: transaction.Destination || transaction.Owner,
      amount: transaction.Amount
    })

    // Get Xaman service
    const xamanService = getXamanService()
    
    // Create instruction based on transaction type
    let instruction = ''
    switch (transaction.TransactionType) {
      case 'EscrowCreate':
        instruction = `Create escrow of ${transaction.Amount} drops to ${transaction.Destination}`
        break
      case 'EscrowFinish':
        instruction = `Finish escrow and release funds`
        break
      case 'EscrowCancel':
        instruction = `Cancel escrow and return funds`
        break
      default:
        instruction = `Sign ${transaction.TransactionType} transaction`
    }

    // Sign transaction via Xaman
    const result = await xamanService.signEscrowTransaction(
      transaction,
      userAddress,
      instruction
    )
    
    if (result.success) {
      console.log('✅ XRPL transaction signed and submitted via Xaman:', {
        txHash: result.txHash,
        payloadUuid: result.payloadUuid
      })
      
      return {
        success: true,
        txHash: result.txHash,
        payloadUuid: result.payloadUuid
      }
    } else {
      console.error('❌ Xaman transaction signing failed:', result.error)
      return {
        success: false,
        error: result.error || 'Transaction signing failed',
        payloadUuid: result.payloadUuid
      }
    }
    
  } catch (error) {
    console.error('❌ Xaman transaction submission failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction submission failed'
    }
  }
}

// Function to create escrow with optional Xaman integration
export async function createEscrowWithSigning(
  request: EscrowRequest,
  submitViaXaman: boolean = false
): Promise<EscrowResult> {
  try {
    // First create the unsigned transaction
    const result = await createEscrow(request)
    
    if (!result.success || !result.transaction) {
      return result
    }
    
    // If Xaman integration requested, submit the transaction
    if (submitViaXaman) {
      console.log('🚀 Submitting escrow transaction via Xaman...')
      
      const xamanResult = await submitEscrowViaXaman(
        result.transaction,
        request.fromAddress
      )
        if (xamanResult.success) {
        // Update the escrow with real transaction hash
        if (result.escrow) {
          result.escrow.status.state = 'pending_completion'
          result.escrow.status.message = 'Escrow submitted to XRPL, waiting for confirmation'
        }
        
        return {
          ...result,
          txHash: xamanResult.txHash,
          payloadUuid: xamanResult.payloadUuid,
          requiresSignature: false,
          message: 'Escrow transaction submitted successfully to XRPL'
        }
      } else {
        return {
          success: false,
          error: `Xaman submission failed: ${xamanResult.error}`,
          payloadUuid: xamanResult.payloadUuid
        }
      }
    }
    
    // Return unsigned transaction for manual Xaman integration
    return result
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Escrow creation with signing failed'
    }
  }
}
