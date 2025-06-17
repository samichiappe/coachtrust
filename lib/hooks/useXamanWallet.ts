'use client'

// Frontend Xaman Wallet Hook - SECURE API VERSION
// Communicates with secure backend APIs instead of exposing credentials

import { useState, useCallback, useEffect, useRef } from 'react'

export interface XamanWalletState {
  isConnected: boolean
  address: string | null
  userToken: string | null
  isLoading: boolean
  error: string | null
}

export interface SignTransactionRequest {
  TransactionType: string
  Destination?: string
  Amount?: string
  Memos?: Array<{
    Memo: {
      MemoType: string
      MemoData: string
    }
  }>
  [key: string]: any
}

export interface UseXamanWallet extends XamanWalletState {
  connect: () => Promise<void>
  disconnect: () => void
  signTransaction: (txJson: SignTransactionRequest) => Promise<any>
  refreshStatus: () => Promise<void>
}

// Storage keys
const STORAGE_KEYS = {
  USER_TOKEN: 'xaman_user_token',
  ADDRESS: 'xaman_address',
  SESSION_ID: 'xaman_session_id'
} as const

// API endpoints
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export function useXamanWallet(): UseXamanWallet {
  const [state, setState] = useState<XamanWalletState>({
    isConnected: false,
    address: null,
    userToken: null,
    isLoading: false,
    error: null
  })
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const saveSession = useCallback((userToken: string, address: string) => {
    localStorage.setItem(STORAGE_KEYS.USER_TOKEN, userToken)
    localStorage.setItem(STORAGE_KEYS.ADDRESS, address)
  }, [])
  
  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.ADDRESS)
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID)
  }, [])

  const loadSavedSession = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem(STORAGE_KEYS.USER_TOKEN)
      const savedAddress = localStorage.getItem(STORAGE_KEYS.ADDRESS)

      if (savedToken && savedAddress) {
        console.log('🔄 Found saved session, verifying token validity...')
        
        // Vérifier que le token est toujours valide
        try {
          const response = await fetch(`${API_BASE}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userToken: savedToken, address: savedAddress })
          })

          if (response.ok) {
            const { valid } = await response.json()
            if (valid) {
              console.log('✅ Saved session is valid, auto-connecting...')
              setState(prev => ({
                ...prev,
                userToken: savedToken,
                address: savedAddress,
                isConnected: true
              }))
              return
            }
          }
        } catch (verifyError) {
          console.warn('Token verification failed, will need fresh login')
        }

        // Si la vérification échoue, nettoyer la session sauvegardée
        clearSession()
      }
    } catch (error) {
      console.error('Error loading saved session:', error)
    }
  }, [clearSession])

  // Load saved session on mount
  useEffect(() => {
    loadSavedSession()
  }, [loadSavedSession])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [])
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // Call our secure backend API to create auth payload
      const response = await fetch(`${API_BASE}/auth/xaman`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },        body: JSON.stringify({ action: 'create' })
      })

      if (!response.ok) {
        throw new Error('Failed to create authentication request')
      }

      const { success, payload } = await response.json()
      
      if (!success || !payload) {
        throw new Error('Invalid response from authentication service')
      }

      // Open the sign URL
      if (typeof window !== 'undefined') {
        window.open(payload.next.always, '_blank')
      }      // Clear any existing polling
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }

      // Poll for payload status
      const payloadId = payload.uuid
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${API_BASE}/auth/xaman/${payloadId}`)
          
          console.log('Polling status response:', statusResponse.status)
          
          if (statusResponse.ok) {
            const responseData = await statusResponse.json()
            console.log('Full polling response:', JSON.stringify(responseData, null, 2))
            
            const { payload: statusPayload } = responseData

            // Check if authentication was explicitly cancelled or expired
            if (statusPayload.meta.cancelled === true) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
              }
              setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Authentication was cancelled'
              }))
              return
            }
            
            if (statusPayload.meta.expired === true) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
              }
              setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Authentication expired'
              }))
              return
            }            // Check if authentication was completed successfully
            if (statusPayload.meta.signed === true) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
              }
              
              console.log('=== SIGNED SUCCESSFULLY ===')
              console.log('Response object:', JSON.stringify(statusPayload.response, null, 2))
                // Extract user token (UUID) and account address correctly
              const userToken = statusPayload.response.user || // Main user UUID token
                               statusPayload.response.user_token ||
                               statusPayload.response.userToken // Alternative field names
              
              const address = statusPayload.response.account || 
                             statusPayload.response.signer // XRPL address fields              console.log('Extracted userToken:', userToken)
              console.log('Extracted address:', address)

              if (address) { 
                // Create a session token based on user UUID or address-based fallback
                const sessionToken = userToken || `session_${address}_${Date.now()}`
                
                setState(prev => ({
                  ...prev,
                  isConnected: true,
                  userToken: sessionToken,
                  address,
                  isLoading: false,
                  error: null
                }))

                saveSession(sessionToken, address)
              } else {
                console.error('No account/address found in response')
                setState(prev => ({
                  ...prev,
                  isLoading: false,
                  error: 'Unable to extract account information'
                }))
              }
            }
            // Check if authentication was explicitly rejected
            else if (statusPayload.meta.signed === false && statusPayload.meta.cancelled === true) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
              }
              console.log('=== AUTHENTICATION CANCELLED BY USER ===')
              setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Authentication was cancelled by user'
              }))
            }
            // Continue polling if signed === false AND not cancelled (waiting for user to sign)
            else if (statusPayload.meta.signed === false && statusPayload.meta.cancelled === false) {
              console.log('⏳ Waiting for user to sign... (signed:', statusPayload.meta.signed, ', cancelled:', statusPayload.meta.cancelled, ')')
            }
          } else {
            console.error('Status response not ok:', statusResponse.status)
          }
        } catch (error) {
          console.error('Polling error:', error)
        }
      }, 2000) // Poll every 2 seconds      // Clear polling after 5 minutes timeout
      setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Authentication timeout'
        }))
      }, 5 * 60 * 1000)

    } catch (error) {
      console.error('Connection error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet'
      }))
    }
  }, [saveSession])

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      userToken: null,
      isLoading: false,
      error: null
    })
    clearSession()
  }, [clearSession])

  const signTransaction = useCallback(async (txJson: SignTransactionRequest) => {
    if (!state.userToken) {
      throw new Error('Wallet not connected')
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Call backend API to create transaction payload
      const response = await fetch(`${API_BASE}/transactions/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txJson,
          userToken: state.userToken
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create transaction request')
      }

      const { payload } = await response.json()

      // Open the sign URL if needed
      if (typeof window !== 'undefined') {
        window.open(payload.next.always, '_blank')
      }

      // Poll for transaction status
      const payloadId = payload.uuid
      return new Promise((resolve, reject) => {
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${API_BASE}/auth/xaman/${payloadId}`)
            
            if (statusResponse.ok) {
              const { payload: statusPayload } = await statusResponse.json()

              if (statusPayload.meta.signed === true) {
                clearInterval(pollInterval)
                setState(prev => ({ ...prev, isLoading: false }))
                resolve(statusPayload.response)
              } else if (statusPayload.meta.signed === false) {
                clearInterval(pollInterval)
                setState(prev => ({
                  ...prev,
                  isLoading: false,
                  error: 'Transaction was rejected'
                }))
                reject(new Error('Transaction was rejected'))
              }
            }
          } catch (error) {
            console.error('Transaction polling error:', error)
          }
        }, 2000)

        // Timeout after 10 minutes
        setTimeout(() => {
          clearInterval(pollInterval)
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Transaction timeout'
          }))
          reject(new Error('Transaction timeout'))
        }, 10 * 60 * 1000)
      })

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      }))
      throw error
    }
  }, [state.userToken])
  const refreshStatus = useCallback(async () => {
    if (!state.userToken) return

    try {
      // Call backend API to verify token
      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userToken: state.userToken })
      })

      if (!response.ok || !(await response.json()).valid) {
        disconnect()
      }
    } catch (error) {
      console.error('Error refreshing status:', error)
      disconnect()
    }
  }, [state.userToken, disconnect])

  return {
    ...state,
    connect,
    disconnect,
    signTransaction,
    refreshStatus
  }
}
