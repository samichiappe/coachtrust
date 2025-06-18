// Backend Xaman service - SECURE SERVER-SIDE ONLY - UPDATED
import { Xumm } from 'xumm'
import type { XummSdk, XummTypes } from 'xumm-sdk'

let xummClient: Xumm | null = null

export function getXummClient(): Xumm {
  if (!xummClient) {
    const apiKey = process.env.XUMM_APIKEY
    const apiSecret = process.env.XUMM_APISECRET

    console.log('XUMM API Key available:', !!apiKey)
    console.log('XUMM API Secret available:', !!apiSecret)

    if (!apiKey || !apiSecret) {
      throw new Error('XUMM credentials not configured. Please set XUMM_APIKEY and XUMM_APISECRET environment variables.')
    }

    xummClient = new Xumm(apiKey, apiSecret)
    console.log('Xumm client created successfully')
  }

  return xummClient
}

export interface SignRequestPayload extends XummTypes.XummPostPayloadBodyJson {
  // All properties are inherited from XummPostPayloadBodyJson
}

export interface AuthPayload {
  txjson: {
    TransactionType: 'SignIn'
  }
  options?: {
    submit?: boolean
    expire?: number
    return_url?: {
      web?: string
    }
  }
  custom_meta?: {
    identifier?: string
    instruction?: string
    blob?: any
  }
}

export interface PayloadResponse extends XummTypes.XummPostPayloadResponse {
  // All properties are inherited from XummPostPayloadResponse
}

export async function createAuthRequest(payload: AuthPayload): Promise<PayloadResponse> {
  const xumm = getXummClient()
  
  try {
    if (!xumm.payload) {
      throw new Error('Payload service not available')
    }

    console.log('Creating auth payload with Xumm SDK...')
    console.log('Payload structure:', JSON.stringify(payload, null, 2))
    
    // Try to create the payload with proper error handling
    const result = await xumm.payload.create(payload as any)
    
    console.log('Xumm SDK raw result:', result)
    console.log('Result type:', typeof result)
    console.log('Result keys:', result ? Object.keys(result) : 'no result')
    
    if (!result) {
      throw new Error('XUMM API returned null/undefined result')
    }

    // Check if result has the expected properties
    if (!result.uuid || !result.next) {
      console.error('Invalid XUMM response structure:', result)
      throw new Error('XUMM API returned invalid response structure')
    }

    console.log('Xumm SDK response:', JSON.stringify(result, null, 2))
    return result as PayloadResponse
  } catch (error) {
    console.error('Error creating auth request:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Log additional details about the XUMM client state
    console.error('XUMM client state:', {
      hasClient: !!xumm,
      hasPayload: !!(xumm && xumm.payload),
      apiKeySet: !!process.env.XUMM_APIKEY,
      apiSecretSet: !!process.env.XUMM_APISECRET
    })
    
    throw new Error(`Failed to create auth request: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getPayloadStatus(payloadId: string): Promise<XummTypes.XummGetPayloadResponse | null> {
  const xumm = getXummClient()
  
  try {
    if (!xumm.payload) {
      throw new Error('Payload service not available')
    }

    const result = await xumm.payload.get(payloadId)
    return result
  } catch (error) {
    console.error('Error getting payload status:', error)
    throw new Error('Failed to get payload status')
  }
}

export async function verifyUserTokens(userTokens: string[]) {
  const xumm = getXummClient()
  
  try {
    if (!xumm.helpers) {
      throw new Error('Helpers service not available')
    }

    const result = await xumm.helpers.verifyUserTokens(userTokens)
    return result
  } catch (error) {
    console.error('Error verifying user tokens:', error)
    throw new Error('Failed to verify user tokens')
  }
}

// Utility function to create authentication payload
export function createAuthPayload(purpose: string = 'Authentication'): AuthPayload {
  return {
    txjson: {
      TransactionType: 'SignIn'
    },
    options: {
      submit: false,
      expire: 5, // 5 minutes
      return_url: {
        web: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      }
    },
    custom_meta: {
      identifier: `auth-${Date.now()}`,
      instruction: `Sign in to CoachTrust Platform`,
      blob: {
        purpose,
        timestamp: Date.now()
      }
    }
  }
}

// Utility function to create payment payload for escrow
export function createEscrowPayload(
  destination: string,
  amount: string,
  bookingId: string,
  condition: string
): SignRequestPayload {
  return {
    txjson: {
      TransactionType: 'EscrowCreate',
      Destination: destination,
      Amount: amount,
      Condition: condition,
      FinishAfter: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      Memos: [{
        Memo: {
          MemoType: Buffer.from('booking', 'utf8').toString('hex').toUpperCase(),
          MemoData: Buffer.from(bookingId, 'utf8').toString('hex').toUpperCase()
        }
      }]
    },
    options: {
      submit: true,
      expire: 10 // 10 minutes to complete payment
    },
    custom_meta: {
      identifier: `escrow-${bookingId}`,
      instruction: `Create escrow payment for booking ${bookingId}`,
      blob: {
        purpose: 'escrow_payment',
        booking_id: bookingId,
        amount,
        destination
      }
    }
  }
}

// Utility function to create payment request - Following xrpl-playground patterns
export async function createPaymentRequest(payload: SignRequestPayload): Promise<PayloadResponse> {
  const xumm = getXummClient()
  
  try {
    if (!xumm.payload) {
      throw new Error('Payload service not available')
    }

    console.log('Creating payment payload with Xumm SDK...')
    console.log('Payment payload structure:', JSON.stringify(payload, null, 2))
    
    // Validate payment structure
    if (!payload.txjson || payload.txjson.TransactionType !== 'Payment') {
      throw new Error('Invalid payment transaction structure')
    }

    const result = await xumm.payload.create(payload as any)
    
    console.log('Payment Xumm SDK response:', JSON.stringify(result, null, 2))
    
    if (!result) {
      throw new Error('XUMM API returned null/undefined result for payment')
    }

    if (!result.uuid || !result.next) {
      console.error('Invalid XUMM payment response structure:', result)
      throw new Error('XUMM API returned invalid payment response structure')
    }

    return result as PayloadResponse
  } catch (error) {
    console.error('Error creating payment request:', error)
    throw new Error(`Failed to create payment request: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Cancel a payload by UUID (see https://docs.xaman.dev/js-ts-sdk/sdk-syntax/xumm.payload/cancel)
export async function cancelPayload(payloadId: string): Promise<any> {
  const xumm = getXummClient();
  try {
    if (!xumm.payload) {
      throw new Error('Payload service not available');
    }
    const result = await xumm.payload.cancel(payloadId);
    console.log('Cancel payload result:', result);
    return result;
  } catch (error) {
    console.error('Error cancelling payload:', error);
    throw new Error('Failed to cancel payload');
  }
}
