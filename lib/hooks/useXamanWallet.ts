'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { 
  XamanWalletState, 
  UseXamanWallet, 
  XRPLTransaction, 
  XamanError, 
  XamanErrorType,
  TransactionValidationResult,
  XamanPayloadStatus 
} from '@/lib/types/xaman'
import { validateTransaction } from '@/lib/utils/xrpl-validation'

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
  const lastErrorRef = useRef<XamanError | null>(null)
  
  const saveSession = useCallback((userToken: string, address: string) => {
    localStorage.setItem(STORAGE_KEYS.USER_TOKEN, userToken)
    localStorage.setItem(STORAGE_KEYS.ADDRESS, address)
  }, [])
  
  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.ADDRESS)
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID)
  }, [])

  const clearError = useCallback(() => {
    lastErrorRef.current = null
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const setError = useCallback((error: string | XamanError) => {
    const xamanError: XamanError = typeof error === 'string' 
      ? { type: XamanErrorType.UNKNOWN, message: error }
      : error
    
    lastErrorRef.current = xamanError
    setState(prev => ({ ...prev, error: xamanError.message }))
  }, [])

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    clearError()
    
    try {
      const response = await fetch(`${API_BASE}/auth/xaman`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      })

      if (!response.ok) {
        throw new Error('Failed to create authentication request')
      }

      const { success, payload } = await response.json()
      
      if (!success || !payload) {
        throw new Error('Invalid response from authentication service')
      }

      if (typeof window !== 'undefined') {
        window.open(payload.next.always, '_blank')
      }

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }

      const payloadId = payload.uuid
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${API_BASE}/auth/xaman/${payloadId}`)
          
          if (statusResponse.ok) {
            const responseData = await statusResponse.json()
            const { payload: statusPayload } = responseData

            if (statusPayload.meta.cancelled === true) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
              }
              setError({
                type: XamanErrorType.USER_CANCELLED,
                message: 'Authentication was cancelled by user'
              })
              setState(prev => ({ ...prev, isLoading: false }))
              return
            }
            
            if (statusPayload.meta.expired === true) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
              }
              setError({
                type: XamanErrorType.EXPIRED,
                message: 'Authentication request expired'
              })
              setState(prev => ({ ...prev, isLoading: false }))
              return
            }

            if (statusPayload.meta.signed === true) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
              }
              
              const userToken = statusPayload.response.user || 
                               statusPayload.response.user_token ||
                               statusPayload.response.userToken
              
              const address = statusPayload.response.account || 
                             statusPayload.response.signer

              if (address) { 
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
                setError({
                  type: XamanErrorType.INVALID_RESPONSE,
                  message: 'Unable to extract account information from Xaman response'
                })
                setState(prev => ({ ...prev, isLoading: false }))
              }
            }
          }
        } catch (error) {
          console.error('Polling error:', error)
        }
      }, 2000)

      setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setError({
          type: XamanErrorType.EXPIRED,
          message: 'Authentication request timed out after 5 minutes'
        })
        setState(prev => ({ ...prev, isLoading: false }))
      }, 5 * 60 * 1000)

    } catch (error) {
      console.error('Connection error:', error)
      setError({
        type: XamanErrorType.CONNECTION_FAILED,
        message: error instanceof Error ? error.message : 'Failed to connect to Xaman wallet',
        details: error
      })
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [saveSession, clearError, setError])

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

  const signTransaction = useCallback(async (txJson: XRPLTransaction) => {
    if (!state.userToken) {
      throw new Error('Wallet not connected')
    }

    const validation = validateTransaction(txJson)
    if (!validation.isValid) {
      const error: XamanError = {
        type: XamanErrorType.INVALID_TRANSACTION,
        message: `Transaction validation failed: ${validation.errors.join(', ')}`,
        details: { errors: validation.errors, warnings: validation.warnings }
      }
      setError(error)
      throw new Error(error.message)
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))
    clearError()

    try {
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

      if (typeof window !== 'undefined') {
        window.open(payload.next.always, '_blank')
      }

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
                setState(prev => ({ ...prev, isLoading: false }))
                setError({
                  type: XamanErrorType.USER_CANCELLED,
                  message: 'Transaction was rejected by user'
                })
                reject(new Error('Transaction was rejected'))
              }
            }
          } catch (error) {
            console.error('Transaction polling error:', error)
          }
        }, 2000)

        setTimeout(() => {
          clearInterval(pollInterval)
          setState(prev => ({ ...prev, isLoading: false }))
          setError({
            type: XamanErrorType.EXPIRED,
            message: 'Transaction signing timed out after 10 minutes'
          })
          reject(new Error('Transaction timeout'))
        }, 10 * 60 * 1000)      })

    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      setError({
        type: XamanErrorType.UNKNOWN,
        message: error instanceof Error ? error.message : 'Transaction failed'
      })
      throw error
    }
  }, [state.userToken, clearError, setError])

  const refreshStatus = useCallback(async () => {
    if (!state.userToken) return

    try {
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

  const validateTransactionWrapper = useCallback((txJson: XRPLTransaction): TransactionValidationResult => {
    return validateTransaction(txJson)
  }, [])

  const getLastError = useCallback((): XamanError | null => {
    return lastErrorRef.current
  }, [])

  useEffect(() => {
    const loadSavedSession = async () => {
      try {
        const savedToken = localStorage.getItem(STORAGE_KEYS.USER_TOKEN)
        const savedAddress = localStorage.getItem(STORAGE_KEYS.ADDRESS)

        if (savedToken && savedAddress) {
          try {
            const response = await fetch(`${API_BASE}/auth/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userToken: savedToken, address: savedAddress })
            })

            if (response.ok) {
              const { valid } = await response.json()
              if (valid) {
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

          clearSession()
        }
      } catch (error) {
        console.error('Error loading saved session:', error)
      }
    }

    loadSavedSession()
  }, [clearSession])

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [])

  return {
    ...state,
    connect,
    disconnect,
    signTransaction,
    refreshStatus,
    validateTransaction: validateTransactionWrapper,
    getLastError,
    clearError
  }
}
