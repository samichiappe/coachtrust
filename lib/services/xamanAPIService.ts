/**
 * Modern Xaman API Service
 * Based on official Xaman documentation: https://docs.xaman.dev/
 * Uses REST API instead of deprecated xumm-sdk
 */

interface XamanPayloadRequest {
  txjson: any
  user_token?: string
  options?: {
    submit?: boolean
    multisign?: boolean
    expire?: number
    instruction?: string
  }
}

interface XamanPayloadResponse {
  uuid: string
  next: {
    always: string
    no_push_msg_received?: string
  }
  refs: {
    qr_png: string
    qr_matrix: string
    qr_uri_quality_opts: string[]
    websocket_status: string
  }
  pushed: boolean
}

interface XamanPayloadResult {
  payload: {
    tx_type: string
    tx_destination: string
    tx_destination_tag?: number
    request_json: any
    created_at: string
    expires_at: string
    payload_uuidv4: string
  }
  application: {
    name: string
    description: string
    disabled: number
    uuidv4: string
  }
  response: {
    hex: string
    txid: string
    resolved_at: string
    dispatched_to: string
    multisign_account: string
    account: string
  } | null
  custom_meta: {
    identifier: string | null
    blob: any | null
    instruction: string | null
  }
}

export class XamanAPIService {
  private readonly apiKey: string
  private readonly apiSecret: string
  private readonly baseUrl = 'https://xumm.app/api/v1/platform'

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  /**
   * Create authentication headers for Xaman API
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-API-Secret': this.apiSecret,
      'User-Agent': 'XRPL-Coach-Platform/1.0'
    }
  }

  /**
   * Create a payload for user to sign
   * Following official Xaman documentation patterns
   */
  async createPayload(request: XamanPayloadRequest): Promise<{
    success: boolean
    payload?: XamanPayloadResponse
    error?: string
  }> {
    try {
      console.log('🔗 Creating Xaman payload:', {
        txType: request.txjson.TransactionType,
        account: request.txjson.Account,
        destination: request.txjson.Destination || request.txjson.Owner
      })

      const response = await fetch(`${this.baseUrl}/payload`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Xaman API error:', response.status, errorText)
        return {
          success: false,
          error: `Xaman API error: ${response.status} - ${errorText}`
        }
      }

      const payload: XamanPayloadResponse = await response.json()
      
      console.log('✅ Xaman payload created:', {
        uuid: payload.uuid,
        qrCode: payload.refs.qr_png,
        websocket: payload.refs.websocket_status
      })

      return {
        success: true,
        payload
      }

    } catch (error) {
      console.error('❌ Failed to create Xaman payload:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get payload result (after user signs)
   * Following official Xaman documentation patterns
   */
  async getPayloadResult(payloadUuid: string): Promise<{
    success: boolean
    result?: XamanPayloadResult
    error?: string
  }> {
    try {
      console.log('🔍 Getting Xaman payload result:', payloadUuid)

      const response = await fetch(`${this.baseUrl}/payload/${payloadUuid}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Xaman result error:', response.status, errorText)
        return {
          success: false,
          error: `Xaman result error: ${response.status} - ${errorText}`
        }
      }

      const result: XamanPayloadResult = await response.json()
      
      console.log('✅ Xaman payload result:', {
        uuid: payloadUuid,
        signed: !!result.response,
        txid: result.response?.txid,
        account: result.response?.account
      })

      return {
        success: true,
        result
      }

    } catch (error) {
      console.error('❌ Failed to get Xaman result:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Wait for payload to be signed by user
   * Polls the result until signed or timeout
   */
  async waitForSignature(
    payloadUuid: string, 
    timeoutMs: number = 300000, // 5 minutes
    pollIntervalMs: number = 2000 // 2 seconds
  ): Promise<{
    success: boolean
    result?: XamanPayloadResult
    error?: string
    txHash?: string
  }> {
    const startTime = Date.now()
    
    console.log('⏳ Waiting for user signature...', {
      uuid: payloadUuid,
      timeout: `${timeoutMs / 1000}s`,
      pollInterval: `${pollIntervalMs / 1000}s`
    })

    while (Date.now() - startTime < timeoutMs) {
      const { success, result, error } = await this.getPayloadResult(payloadUuid)
      
      if (!success) {
        return { success: false, error }
      }

      // Check if signed
      if (result?.response?.txid) {
        console.log('✅ Transaction signed successfully!', {
          txid: result.response.txid,
          account: result.response.account
        })
        
        return {
          success: true,
          result,
          txHash: result.response.txid
        }
      }

      // Check if rejected/expired
      if (result?.response && !result.response.txid) {
        console.log('❌ Transaction rejected by user')
        return {
          success: false,
          error: 'Transaction rejected by user'
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
    }

    console.log('⏰ Signature timeout')
    return {
      success: false,
      error: 'Signature timeout - user did not sign within time limit'
    }
  }

  /**
   * Create and wait for escrow transaction signature
   * High-level function for escrow transactions
   */
  async signEscrowTransaction(
    transaction: any,
    userAccount?: string,
    instruction?: string
  ): Promise<{
    success: boolean
    txHash?: string
    error?: string
    payloadUuid?: string
  }> {
    try {
      console.log('🔐 Starting escrow transaction signature process...', {
        txType: transaction.TransactionType,
        account: transaction.Account,
        amount: transaction.Amount
      })

      // Create payload
      const payloadRequest: XamanPayloadRequest = {
        txjson: transaction,
        options: {
          submit: true, // Auto-submit after signing
          instruction: instruction || `Sign this ${transaction.TransactionType} transaction`
        }
      }

      const createResult = await this.createPayload(payloadRequest)
      if (!createResult.success || !createResult.payload) {
        return {
          success: false,
          error: createResult.error || 'Failed to create payload'
        }
      }

      const payloadUuid = createResult.payload.uuid

      // Wait for signature
      const signResult = await this.waitForSignature(payloadUuid)
      
      return {
        success: signResult.success,
        txHash: signResult.txHash,
        error: signResult.error,
        payloadUuid
      }

    } catch (error) {
      console.error('❌ Escrow transaction signing failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Singleton instance
let xamanService: XamanAPIService | null = null

export function getXamanService(): XamanAPIService {
  if (!xamanService) {
    const apiKey = process.env.XUMM_APIKEY
    const apiSecret = process.env.XUMM_APISECRET

    if (!apiKey || !apiSecret) {
      throw new Error('Xaman API credentials not configured. Set XUMM_APIKEY and XUMM_APISECRET in environment.')
    }

    xamanService = new XamanAPIService(apiKey, apiSecret)
    console.log('🔗 Xaman API service initialized')
  }

  return xamanService
}

export { XamanPayloadRequest, XamanPayloadResponse, XamanPayloadResult }
