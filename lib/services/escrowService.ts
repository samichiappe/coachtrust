// XRPL Escrow Service - Based on xrpl-playground example
import { Client, EscrowCreate, EscrowFinish, EscrowCancel, xrpToDrops, convertStringToHex } from 'xrpl'
import { EscrowContract, EscrowResult, EscrowRequest, EscrowCondition, EscrowStatus } from '@/lib/types/escrow'
import crypto from 'crypto'

let client: Client | null = null

// Import five-bells-condition for crypto-conditions
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cc = require('five-bells-condition')

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

// Generate crypto-condition and fulfillment - Following xrpl-playground pattern
export function generateConditionAndFulfillment(): EscrowCondition {
  console.log("******* GENERATING CRYPTO CONDITION AND FULFILLMENT *******")
  
  // Use cryptographically secure random bytes generation
  const preimage = crypto.randomBytes(32)
  
  const fulfillment = new cc.PreimageSha256()
  fulfillment.setPreimage(preimage)
  
  const condition = fulfillment
    .getConditionBinary()
    .toString('hex')
    .toUpperCase()
  
  // Keep secret until you want to finish the escrow
  const fulfillment_hex = fulfillment
    .serializeBinary()
    .toString('hex')
    .toUpperCase()
  
  console.log('Condition:', condition)
  console.log('Fulfillment (keep secret until completion):', fulfillment_hex)
  
  return {
    condition,
    fulfillment: fulfillment_hex,
    preimage: preimage.toString('hex').toUpperCase()
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
export function buildXRPLEscrowFinish(
  account: string,
  owner: string,
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
  if (!request.amount || request.amount <= 0) {
    errors.push('Amount must be greater than 0')
  } else if (request.amount < 0.000001) {
    errors.push('Amount must be at least 0.000001 XRP')
  } else if (request.amount > 100000) {
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
