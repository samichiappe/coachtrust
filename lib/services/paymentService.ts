// XRPL Payment Service
import { Client, Payment, SubmitResponse } from 'xrpl'
import { getXRPLClient } from '../xrpl/client'
import { convertXRPToDrops, convertDropsToXRP } from '../xrpl/utils'
import type { PaymentTransaction, PaymentRequest, PaymentResult, PaymentStatus } from '../types/payment'

export class PaymentService {
  private client: Client

  constructor() {
    this.client = getXRPLClient()
  }

  /**
   * Create a payment transaction via Xaman
   */
  async createPaymentPayload(
    fromAddress: string,
    request: PaymentRequest
  ): Promise<any> {
    try {
      const amountInDrops = convertXRPToDrops(request.amount)
      
      const paymentTx: Payment = {
        TransactionType: 'Payment',
        Account: fromAddress,
        Destination: request.toAddress,
        Amount: amountInDrops,
        Fee: '12', // Standard fee in drops
      }

      // Add memo if provided
      if (request.memo) {
        paymentTx.Memos = [{
          Memo: {
            MemoType: Buffer.from('payment', 'utf8').toString('hex').toUpperCase(),
            MemoData: Buffer.from(request.memo, 'utf8').toString('hex').toUpperCase()
          }
        }]
      }

      // Create payload for Xaman signing
      const payload = {
        txjson: paymentTx,
        options: {
          submit: true,
          expire: 10, // 10 minutes
        },
        custom_meta: {
          identifier: `payment-${Date.now()}`,
          instruction: `Send ${request.amount} XRP to ${request.toAddress}`,
          blob: {
            purpose: request.purpose || 'payment',
            amount: request.amount,
            destination: request.toAddress
          }
        }
      }

      // Send to backend API to create Xaman payload
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to create payment request')
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating payment payload:', error)
      throw error
    }
  }

  /**
   * Check transaction status on XRPL
   */
  async getTransactionStatus(txid: string): Promise<PaymentStatus> {
    try {
      if (!this.client.isConnected()) {
        await this.client.connect()
      }

      const response = await this.client.request({
        command: 'tx',
        transaction: txid
      })

      if (response.result) {
        const tx = response.result
        
        if (tx.validated) {
          return {
            state: tx.meta?.TransactionResult === 'tesSUCCESS' ? 'validated' : 'failed',
            message: tx.meta?.TransactionResult || 'Unknown',
            lastUpdated: Date.now()
          }
        } else {
          return {
            state: 'submitted',
            message: 'Transaction submitted, waiting for validation',
            lastUpdated: Date.now()
          }
        }
      }

      return {
        state: 'pending',
        message: 'Transaction not found',
        lastUpdated: Date.now()
      }
    } catch (error) {
      console.error('Error getting transaction status:', error)
      return {
        state: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'NETWORK_ERROR',
        lastUpdated: Date.now()
      }
    }
  }

  /**
   * Validate payment transaction before sending
   */
  validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate destination address
    if (!request.toAddress || !this.isValidXRPLAddress(request.toAddress)) {
      errors.push('Invalid destination address')
    }

    // Validate amount
    const amount = parseFloat(request.amount)
    if (isNaN(amount) || amount <= 0) {
      errors.push('Invalid amount')
    }

    if (amount < 0.000001) { // Minimum XRP amount
      errors.push('Amount too small (minimum 0.000001 XRP)')
    }

    // Validate memo length if provided
    if (request.memo && request.memo.length > 1000) {
      errors.push('Memo too long (maximum 1000 characters)')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Basic XRPL address validation
   */
  private isValidXRPLAddress(address: string): boolean {
    // Basic validation - starts with 'r' and is proper length
    return /^r[a-zA-Z0-9]{24,34}$/.test(address)
  }

  /**
   * Get payment history for an address
   */
  async getPaymentHistory(address: string, limit: number = 10): Promise<PaymentTransaction[]> {
    try {
      if (!this.client.isConnected()) {
        await this.client.connect()
      }

      const response = await this.client.request({
        command: 'account_tx',
        account: address,
        limit,
        ledger_index_min: -1,
        ledger_index_max: -1,
        forward: false
      })

      const transactions: PaymentTransaction[] = []

      if (response.result?.transactions) {
        for (const txData of response.result.transactions) {
          const tx = txData.tx
          
          if (tx?.TransactionType === 'Payment') {
            const transaction: PaymentTransaction = {
              id: tx.hash || '',
              fromAddress: tx.Account || '',
              toAddress: tx.Destination || '',
              amount: convertDropsToXRP(tx.Amount?.toString() || '0'),
              amountInDrops: tx.Amount?.toString() || '0',
              status: {
                state: txData.validated ? 'validated' : 'submitted',
                message: txData.meta?.TransactionResult || 'Unknown',
                lastUpdated: Date.now()
              },
              txid: tx.hash,
              timestamp: this.convertRippleTimeToUnix(tx.date || 0),
              memo: this.extractMemoFromTx(tx)
            }
            
            transactions.push(transaction)
          }
        }
      }

      return transactions
    } catch (error) {
      console.error('Error getting payment history:', error)
      return []
    }
  }

  /**
   * Convert Ripple timestamp to Unix timestamp
   */
  private convertRippleTimeToUnix(rippleTime: number): number {
    return (rippleTime + 946684800) * 1000 // Ripple epoch is Jan 1, 2000
  }

  /**
   * Extract memo from transaction
   */
  private extractMemoFromTx(tx: any): string | undefined {
    if (tx.Memos && tx.Memos.length > 0) {
      const memo = tx.Memos[0].Memo
      if (memo.MemoData) {
        return Buffer.from(memo.MemoData, 'hex').toString('utf8')
      }
    }
    return undefined
  }
}

// Export singleton instance
export const paymentService = new PaymentService()
