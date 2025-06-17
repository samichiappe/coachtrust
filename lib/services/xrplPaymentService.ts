// XRPL Payment Service - Based on xrpl-playground example
import { Client, Payment, xrpToDrops, convertStringToHex, TxResponse } from 'xrpl'
import { PaymentTransaction, PaymentResult, PaymentRequest, PaymentStatus } from '@/lib/types/payment'

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

export async function getXRPLClient(): Promise<Client> {
  if (!client) {
    client = new Client(NETWORK_URL)
    console.log(`🔗 Connecting to XRPL network: ${NETWORK_URL}`)
  }
  
  if (!client.isConnected()) {
    await client.connect()
    console.log('✅ Connected to XRPL network')
  }
  
  return client
}

export async function disconnectXRPLClient(): Promise<void> {
  if (client && client.isConnected()) {
    await client.disconnect()
    console.log('🔌 Disconnected from XRPL network')
    client = null
  }
}

// Create a payment transaction - Following xrpl-playground payment pattern
export async function createPaymentTransaction(
  request: PaymentRequest,
  senderAddress: string
): Promise<PaymentTransaction> {
  const amountInDrops = xrpToDrops(request.amount)
  
  const transaction: PaymentTransaction = {
    id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    fromAddress: senderAddress,
    toAddress: request.toAddress,
    amount: request.amount,
    amountInDrops,
    status: {
      state: 'pending',
      lastUpdated: Date.now()
    },
    timestamp: Date.now(),
    purpose: request.purpose,
    memo: request.memo
  }
  
  return transaction
}

// Build XRPL Payment object - Following xrpl-playground pattern
export function buildXRPLPayment(
  senderAddress: string,
  request: PaymentRequest
): Payment {
  const payment: Payment = {
    TransactionType: "Payment",
    Account: senderAddress,
    Destination: request.toAddress,
    Amount: xrpToDrops(request.amount)
  }

  // Add memo if provided - Following xrpl-playground memo pattern
  if (request.memo || request.purpose) {
    const memoData = request.memo || `Coach booking: ${request.purpose}`
    payment.Memos = [{
      Memo: {
        MemoType: convertStringToHex('coach-booking'),
        MemoData: convertStringToHex(memoData)
      }
    }]
  }

  return payment
}

// Submit payment via Xaman (for signed transactions)
export async function submitPaymentToXRPL(
  signedTxBlob: string
): Promise<PaymentResult> {
  try {
    const client = await getXRPLClient()
    
    console.log('📤 Submitting payment to XRPL...')
    const result = await client.submitAndWait(signedTxBlob)
    
    console.log('📋 XRPL Payment Result:', {
      hash: result.result.hash,
      validated: result.result.validated,
      meta: result.result.meta
    })

    if (result.result.validated) {
      console.log(`✅ Payment successful! Transaction hash: ${result.result.hash}`)
      return {
        success: true,
        transactionHash: result.result.hash,
        txResponse: result,
        validated: true
      }
    } else {
      console.log(`❌ Payment validation failed! Meta: ${result.result.meta}`)
      return {
        success: false,
        validated: false,
        error: 'Transaction failed validation'
      }
    }
  } catch (error) {
    console.error('❌ Payment submission error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown payment error'
    }
  }
}

// Get transaction status from XRPL - Following xrpl-playground validation pattern
export async function getPaymentStatus(txHash: string): Promise<PaymentStatus> {
  try {
    const client = await getXRPLClient()
    
    const response = await client.request({
      command: 'tx',
      transaction: txHash
    })

    if (response.result) {
      return {
        hash: txHash,
        validated: response.result.validated || false,
        successful: response.result.meta?.TransactionResult === 'tesSUCCESS',
        ledgerIndex: response.result.ledger_index
      }
    }

    return {
      hash: txHash,
      validated: false,
      successful: false,
      error: 'Transaction not found'
    }
  } catch (error) {
    console.error('Error getting payment status:', error)
    return {
      hash: txHash,
      validated: false,
      successful: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Validate XRP address format
export function isValidXRPAddress(address: string): boolean {
  // Basic XRP address validation (starts with 'r' and is 25-34 chars)
  return /^r[1-9A-HJ-NP-Za-km-z]{24,33}$/.test(address)
}

// Convert drops to XRP for display
export function dropsToXRP(drops: string): string {
  return (parseInt(drops) / 1000000).toString()
}

// Mock payment service for development (when XRPL is not available)
export class MockPaymentService {
  private transactions: PaymentTransaction[] = []

  async sendPayment(request: PaymentRequest, fromAddress: string): Promise<PaymentResult> {
    try {
      const transaction = await createPaymentTransaction(request, fromAddress)
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update status to submitted
      transaction.status.state = 'submitted'
      transaction.status.lastUpdated = Date.now()
      transaction.txid = `mock_${Date.now()}`
      
      this.transactions.push(transaction)

      // Simulate validation after delay
      setTimeout(() => {
        transaction.status.state = 'validated'
        transaction.status.lastUpdated = Date.now()
      }, 2000)

      return {
        success: true,
        transaction,
        txid: transaction.txid
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      }
    }
  }

  async getTransactionStatus(txid: string): Promise<PaymentStatus> {
    const transaction = this.transactions.find(tx => tx.txid === txid)
    
    if (!transaction) {
      return {
        state: 'failed',
        message: 'Transaction not found',
        lastUpdated: Date.now()
      }
    }

    return transaction.status
  }

  getTransactionHistory(): PaymentTransaction[] {
    return [...this.transactions].reverse()
  }

  clearHistory(): void {
    this.transactions = []
  }
}

// Export services
export const mockPaymentService = new MockPaymentService()

/**
 * High-level function to create a payment
 */
export async function createPayment(request: PaymentRequest): Promise<PaymentResult> {
  try {
    // Validate the request
    if (!isValidXRPAddress(request.toAddress)) {
      return {
        success: false,
        error: 'Invalid destination address'
      };
    }

    if (!request.amount || parseFloat(request.amount) <= 0) {
      return {
        success: false,
        error: 'Invalid amount'
      };
    }

    // For now, mock the payment submission and return a mock result
    // In a real implementation, this would submit to XRPL via Xaman
    const mockTxHash = `payment_${Date.now()}`;    return {
      success: true,
      txid: mockTxHash
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment creation failed'
    };
  }
}
