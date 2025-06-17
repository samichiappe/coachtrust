/**
 * useXamanTransaction Hook
 * Manages Xaman transaction signing process
 * Uses modern Xaman REST API via our backend
 */

import { useState, useCallback } from 'react'

interface XamanTransactionState {
  isLoading: boolean
  isWaitingForSignature: boolean
  qrCode?: string
  deeplink?: string
  payloadUuid?: string
  txHash?: string
  error?: string
  success: boolean
}

interface XamanTransactionResult {
  success: boolean
  txHash?: string
  error?: string
  payloadUuid?: string
}

export const useXamanTransaction = () => {
  const [state, setState] = useState<XamanTransactionState>({
    isLoading: false,
    isWaitingForSignature: false,
    success: false
  })

  /**
   * Sign transaction via Xaman
   * Creates payload, shows QR code, waits for signature
   */
  const signTransaction = useCallback(async (
    transaction: any,
    userAddress: string
  ): Promise<XamanTransactionResult> => {
    setState({
      isLoading: true,
      isWaitingForSignature: false,
      success: false
    })

    try {
      console.log('🔐 Starting Xaman transaction signing...', {
        type: transaction.TransactionType,
        account: transaction.Account
      })

      // Create payload via our API
      const createResponse = await fetch('/api/xaman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_payload',
          transaction,
          userAddress
        })
      })

      const createResult = await createResponse.json()

      if (!createResult.success) {
        setState({
          isLoading: false,
          isWaitingForSignature: false,
          success: false,
          error: createResult.error
        })
        return { success: false, error: createResult.error }
      }

      const { uuid, qrCode, deeplink } = createResult.payload

      setState({
        isLoading: false,
        isWaitingForSignature: true,
        qrCode,
        deeplink,
        payloadUuid: uuid,
        success: false
      })

      console.log('✅ Xaman payload created:', { uuid, deeplink })

      // Poll for result
      const pollResult = await pollForSignature(uuid)

      if (pollResult.success) {
        setState(prev => ({
          ...prev,
          isWaitingForSignature: false,
          success: true,
          txHash: pollResult.txHash
        }))

        return {
          success: true,
          txHash: pollResult.txHash,
          payloadUuid: uuid
        }
      } else {
        setState(prev => ({
          ...prev,
          isWaitingForSignature: false,
          success: false,
          error: pollResult.error
        }))

        return {
          success: false,
          error: pollResult.error,
          payloadUuid: uuid
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setState({
        isLoading: false,
        isWaitingForSignature: false,
        success: false,
        error: errorMessage
      })

      return { success: false, error: errorMessage }
    }
  }, [])

  /**
   * Poll for signature result
   * Checks payload status until signed or timeout
   */
  const pollForSignature = useCallback(async (
    payloadUuid: string,
    timeoutMs: number = 300000, // 5 minutes
    pollIntervalMs: number = 2000 // 2 seconds
  ): Promise<{ success: boolean, txHash?: string, error?: string }> => {
    const startTime = Date.now()

    console.log('⏳ Polling for Xaman signature...', { payloadUuid })

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch(`/api/xaman?uuid=${payloadUuid}`)
        const result = await response.json()

        if (result.success && result.signed && result.txHash) {
          console.log('✅ Transaction signed!', { txHash: result.txHash })
          return {
            success: true,
            txHash: result.txHash
          }
        }

        if (result.success && result.payload?.response && !result.payload.response.txid) {
          console.log('❌ Transaction rejected by user')
          return {
            success: false,
            error: 'Transaction rejected by user'
          }
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs))

      } catch (error) {
        console.error('❌ Polling error:', error)
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
      }
    }

    console.log('⏰ Signature timeout')
    return {
      success: false,
      error: 'Signature timeout - user did not sign within time limit'
    }
  }, [])

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isWaitingForSignature: false,
      success: false
    })
  }, [])

  /**
   * Open Xaman app with deeplink
   */
  const openXamanApp = useCallback(() => {
    if (state.deeplink) {
      console.log('📱 Opening Xaman app:', state.deeplink)
      window.open(state.deeplink, '_blank')
    }
  }, [state.deeplink])

  return {
    state,
    signTransaction,
    reset,
    openXamanApp
  }
}
