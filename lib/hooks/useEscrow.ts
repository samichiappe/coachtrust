// useEscrow hook - XRPL escrow integration
'use client'

import { useState, useCallback } from 'react'
import { useXamanWallet } from './useXamanWallet'
import { EscrowRequest, EscrowResult, EscrowContract, EscrowFinishRequest } from '@/lib/types/escrow'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api'

export interface UseEscrowState {
  isLoading: boolean
  error: string | null
  currentEscrow: EscrowContract | null
  escrowHistory: EscrowContract[]
  
  // Actions
  createEscrow: (request: EscrowRequest) => Promise<EscrowResult>
  finishEscrow: (request: EscrowFinishRequest) => Promise<EscrowResult>
  cancelEscrow: (escrowId: string) => Promise<EscrowResult>
  clearError: () => void
  refreshHistory: () => Promise<void>
}

export function useEscrow(): UseEscrowState {
  const { address, isConnected } = useXamanWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentEscrow, setCurrentEscrow] = useState<EscrowContract | null>(null)
  const [escrowHistory, setEscrowHistory] = useState<EscrowContract[]>([])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const createEscrow = useCallback(async (request: EscrowRequest): Promise<EscrowResult> => {
    if (!isConnected || !address) {
      const error = 'Wallet not connected'
      setError(error)
      throw new Error(error)
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Creating escrow:', request)

      const response = await fetch(`${API_BASE}/payments/escrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create escrow')
      }

      const result = await response.json()
      console.log('Escrow creation result:', result)

      if (result.success) {
        // Open Xaman app to sign the escrow transaction
        if (result.payload?.next?.always) {
          console.log('Opening Xaman for escrow signing...')
          window.open(result.payload.next.always, '_blank')
        }

        // Create escrow contract object for tracking
        if (result.escrowData) {
          const escrowContract: EscrowContract = {
            id: `escrow_${Date.now()}`,
            sequence: 0, // Will be updated after signing
            account: address,
            destination: request.destination,
            amount: request.amount.toString(),
            amountInDrops: (request.amount * 1000000).toString(),
            condition: result.escrowData.condition,
            fulfillment: result.escrowData.fulfillment,
            status: {
              state: 'pending_completion',
              message: 'Waiting for Xaman signature',
              lastUpdated: Date.now()
            },
            bookingId: request.bookingId,
            purpose: request.purpose,
            createdAt: Date.now()
          }

          setCurrentEscrow(escrowContract)
        }

        return {
          success: true,
          escrow: currentEscrow || undefined,
          payloadId: result.payload?.uuid
        }
      } else {
        throw new Error(result.error || 'Escrow creation failed')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Escrow creation error:', errorMessage)
      setError(errorMessage)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address, currentEscrow])
  const finishEscrow = useCallback(async (request: EscrowFinishRequest): Promise<EscrowResult> => {
    if (!isConnected || !address) {
      const error = 'Wallet not connected'
      setError(error)
      throw new Error(error)
    }

    if (!currentEscrow) {
      const error = 'No active escrow to finish'
      setError(error)
      throw new Error(error)
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Finishing escrow:', request)

      const response = await fetch(`${API_BASE}/payments/escrow/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: currentEscrow.account,
          condition: currentEscrow.condition,
          fulfillment: request.fulfillment,
          offerSequence: currentEscrow.sequence,
          escrowId: request.escrowId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to finish escrow')
      }

      const result = await response.json()
      console.log('Escrow finish result:', result)

      if (result.success) {
        // Open Xaman app to sign the escrow finish transaction
        if (result.payload?.next?.always) {
          console.log('Opening Xaman for escrow finish signing...')
          window.open(result.payload.next.always, '_blank')
        }

        // Update escrow status
        const updatedEscrow: EscrowContract = {
          ...currentEscrow,
          status: {
            state: 'pending_completion',
            message: 'Waiting for escrow finish signature',
            lastUpdated: Date.now()
          }
        }
        
        setCurrentEscrow(updatedEscrow)

        return {
          success: true,
          escrow: updatedEscrow,
          payloadId: result.payload?.uuid
        }
      } else {
        throw new Error(result.error || 'Escrow finish failed')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Escrow finish error:', errorMessage)
      setError(errorMessage)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address, currentEscrow])
  const cancelEscrow = useCallback(async (escrowId: string): Promise<EscrowResult> => {
    if (!isConnected || !address) {
      const error = 'Wallet not connected'
      setError(error)
      throw new Error(error)
    }

    if (!currentEscrow) {
      const error = 'No active escrow to cancel'
      setError(error)
      throw new Error(error)
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Cancelling escrow:', escrowId)

      const response = await fetch(`${API_BASE}/payments/escrow/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: currentEscrow.account,
          offerSequence: currentEscrow.sequence,
          escrowId: escrowId,
          reason: 'User requested cancellation'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel escrow')
      }

      const result = await response.json()
      console.log('Escrow cancel result:', result)

      if (result.success) {
        // Open Xaman app to sign the escrow cancel transaction
        if (result.payload?.next?.always) {
          console.log('Opening Xaman for escrow cancel signing...')
          window.open(result.payload.next.always, '_blank')
        }

        // Update escrow status
        const updatedEscrow: EscrowContract = {
          ...currentEscrow,
          status: {
            state: 'cancelled',
            message: 'Escrow cancellation initiated',
            lastUpdated: Date.now()
          }
        }
        
        setCurrentEscrow(updatedEscrow)
        setEscrowHistory(prev => [...prev, updatedEscrow])

        return {
          success: true,
          escrow: updatedEscrow,
          payloadId: result.payload?.uuid
        }
      } else {
        throw new Error(result.error || 'Escrow cancel failed')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Escrow cancel error:', errorMessage)
      setError(errorMessage)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address, currentEscrow])

  const refreshHistory = useCallback(async (): Promise<void> => {
    if (!isConnected || !address) {
      return
    }

    try {
      // TODO: Implement API endpoint to fetch escrow history
      // For now, keep the current history
      console.log('Refreshing escrow history for:', address)
    } catch (error) {
      console.error('Failed to refresh escrow history:', error)
    }
  }, [isConnected, address])

  return {
    isLoading,
    error,
    currentEscrow,
    escrowHistory,
    createEscrow,
    finishEscrow,
    cancelEscrow,
    clearError,
    refreshHistory
  }
}
