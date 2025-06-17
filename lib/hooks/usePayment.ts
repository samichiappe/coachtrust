// usePayment hook - XRPL payment integration following xrpl-playground patterns
'use client'

import { useState, useCallback } from 'react'
import { useXamanWallet } from './useXamanWallet'
import { PaymentRequest, PaymentResult, PaymentTransaction, PaymentStatus } from '@/lib/types/payment'
import { buildXRPLPayment, isValidXRPAddress } from '@/lib/services/xrplPaymentService'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api'

export interface UsePaymentState {
  isLoading: boolean
  error: string | null
  currentTransaction: PaymentTransaction | null
  history: PaymentTransaction[]
  
  // Actions
  sendPayment: (request: PaymentRequest) => Promise<PaymentResult>
  getTransactionStatus: (txid: string) => Promise<PaymentStatus>
  clearError: () => void
  refreshHistory: () => Promise<void>
}

export function usePayment(): UsePaymentState {
  const { address, isConnected } = useXamanWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTransaction, setCurrentTransaction] = useState<PaymentTransaction | null>(null)
  const [history, setHistory] = useState<PaymentTransaction[]>([])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const validatePaymentRequest = useCallback((request: PaymentRequest): string | null => {
    if (!request.toAddress || !isValidXRPAddress(request.toAddress)) {
      return 'Invalid destination address'
    }

    const amount = parseFloat(request.amount)
    if (isNaN(amount) || amount <= 0) {
      return 'Invalid amount'
    }

    if (amount < 0.000001) {
      return 'Amount too small (minimum 0.000001 XRP)'
    }

    if (request.memo && request.memo.length > 1000) {
      return 'Memo too long (maximum 1000 characters)'
    }

    return null
  }, [])

  const sendPayment = useCallback(async (request: PaymentRequest): Promise<PaymentResult> => {
    if (!isConnected || !address) {
      const error = 'Wallet not connected'
      setError(error)
      return { success: false, error }
    }

    // Validate request
    const validationError = validatePaymentRequest(request)
    if (validationError) {
      setError(validationError)
      return { success: false, error: validationError }
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('=== CREATING PAYMENT ===')
      console.log('From:', address)
      console.log('To:', request.toAddress)
      console.log('Amount:', request.amount, 'XRP')
      console.log('Purpose:', request.purpose)
      console.log('Memo:', request.memo)

      // Build XRPL payment transaction following xrpl-playground pattern
      const xrplPayment = buildXRPLPayment(address, request)
      
      console.log('XRPL Payment object:', JSON.stringify(xrplPayment, null, 2))

      // Create payload for Xaman signing
      const payload = {
        txjson: xrplPayment,
        options: {
          submit: true,
          expire: 10, // 10 minutes
          return_url: {
            web: `${window.location.origin}/?payment=success`
          }
        },
        custom_meta: {
          identifier: `payment-${Date.now()}`,
          instruction: `Send ${request.amount} XRP to ${request.toAddress}`,
          blob: {
            purpose: request.purpose || 'payment',
            amount: request.amount,
            destination: request.toAddress,
            timestamp: Date.now()
          }
        }
      }

      console.log('Creating Xaman payload:', JSON.stringify(payload, null, 2))

      // Send to backend API to create Xaman payload
      const response = await fetch(`${API_BASE}/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to create payment request')
      }

      const { success, payload: xamanPayload } = await response.json()
      
      if (!success || !xamanPayload) {
        throw new Error('Invalid response from payment service')
      }

      console.log('Xaman payment payload created:', xamanPayload)

      // Create transaction record
      const transaction: PaymentTransaction = {
        id: xamanPayload.uuid,
        fromAddress: address,
        toAddress: request.toAddress,
        amount: request.amount,
        amountInDrops: xrplPayment.Amount.toString(),
        status: {
          state: 'pending',
          message: 'Waiting for signature',
          lastUpdated: Date.now()
        },
        timestamp: Date.now(),
        purpose: request.purpose,
        memo: request.memo
      }

      setCurrentTransaction(transaction)

      // Open Xaman for signing
      if (typeof window !== 'undefined') {
        window.open(xamanPayload.next.always, '_blank')
      }

      // Poll for payment status - Following auth polling pattern
      const payloadId = xamanPayload.uuid
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${API_BASE}/auth/xaman/${payloadId}`)
          
          if (statusResponse.ok) {
            const responseData = await statusResponse.json()
            const { payload: statusPayload } = responseData

            console.log('Payment status:', statusPayload.meta.signed, statusPayload.meta.cancelled)

            if (statusPayload.meta.signed === true) {
              clearInterval(pollInterval)
              
              console.log('=== PAYMENT SIGNED SUCCESSFULLY ===')
              console.log('Transaction hash:', statusPayload.response.txid)
              
              // Update transaction status
              transaction.status = {
                state: 'validated',
                message: 'Payment completed successfully',
                lastUpdated: Date.now()
              }
              transaction.txid = statusPayload.response.txid

              setCurrentTransaction(transaction)
              setHistory(prev => [transaction, ...prev])
              setIsLoading(false)

              return {
                success: true,
                transaction,
                txid: statusPayload.response.txid
              }

            } else if (statusPayload.meta.cancelled === true) {
              clearInterval(pollInterval)
              
              transaction.status = {
                state: 'failed',
                message: 'Payment was cancelled',
                lastUpdated: Date.now()
              }
              
              setCurrentTransaction(transaction)
              setError('Payment was cancelled')
              setIsLoading(false)

              return {
                success: false,
                error: 'Payment was cancelled'
              }
            }
          }
        } catch (error) {
          console.error('Payment polling error:', error)
        }
      }, 2000)

      // Return pending result immediately
      return {
        success: true,
        transaction
      }

    } catch (error) {
      console.error('Payment error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown payment error'
      setError(errorMessage)
      setIsLoading(false)
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }, [isConnected, address, validatePaymentRequest])

  const getTransactionStatus = useCallback(async (txid: string): Promise<PaymentStatus> => {
    try {
      // For now, return from local state
      // TODO: Implement XRPL transaction status check
      const transaction = history.find(tx => tx.txid === txid)
      
      if (transaction) {
        return transaction.status
      }

      return {
        state: 'failed',
        message: 'Transaction not found',
        lastUpdated: Date.now()
      }
    } catch (error) {
      console.error('Error getting transaction status:', error)
      return {
        state: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: Date.now()
      }
    }
  }, [history])

  const refreshHistory = useCallback(async () => {
    // TODO: Implement XRPL transaction history fetching
    console.log('Refreshing payment history...')
  }, [])

  return {
    isLoading,
    error,
    currentTransaction,
    history,
    sendPayment,
    getTransactionStatus,
    clearError,
    refreshHistory
  }
}
