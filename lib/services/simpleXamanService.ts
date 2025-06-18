/**
 * Simple Xaman Integration
 * Based on https://docs.xaman.dev/ official documentation
 * Focuses on core functionality: payload creation and signing
 */

interface XamanPayloadRequest {
  txjson: any; // XRPL transaction JSON
  options?: {
    submit?: boolean;
    multisign?: boolean;
    expire?: number;
  };
}

interface XamanPayloadResponse {
  uuid: string;
  next: {
    always: string; // Deep link
  };
  refs: {
    qr_png: string; // QR code URL
    qr_matrix: string;
    qr_uri_quality_opts: string[];
    websocket_status: string;
  };
  pushed: boolean;
}

interface XamanPayloadResult {
  meta: {
    exists: boolean;
    uuid: string;
    multisign: boolean;
    submit: boolean;
    destination: string;
    resolved_destination: string;
    signed: boolean;
    cancelled: boolean;
    expired: boolean;
    pushed: boolean;
    app_opened: boolean;
    return_url_app?: string;
    return_url_web?: string;
  };
  application: {
    name: string;
    description: string;
    disabled: number;
    uuidv4: string;
  };
  payload: {
    tx_type: string;
    tx_destination: string;
    tx_destination_tag?: number;
    request_json: any;
    origintype: string;
    signmethod: string;
    created_at: string;
    expires_at: string;
    payload_uuidv4: string;
  };
  response?: {
    hex: string;
    txid: string;
    resolved_at: string;
    dispatched_to: string;
    multisign_account: string;
    account: string;
  };
}

class SimpleXamanService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string = 'https://xumm.app/api/v1/platform';

  constructor() {
    this.apiKey = process.env.XAMAN_API_KEY || '';
    this.apiSecret = process.env.XAMAN_API_SECRET || '';
    
    if (!this.apiKey || !this.apiSecret) {
      console.warn('⚠️ Xaman API credentials not found in environment variables');
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-API-Secret': this.apiSecret,
    };
  }

  /**
   * Create a payload for user to sign
   * https://docs.xaman.dev/app-development/payload-flow
   */
  async createPayload(txjson: any): Promise<{
    success: boolean;
    uuid?: string;
    qr?: string;
    deepLink?: string;
    error?: string;
  }> {
    try {
      console.log('🚀 Creating Xaman payload for transaction:', txjson.TransactionType);

      const payload: XamanPayloadRequest = {
        txjson,
        options: {
          submit: true, // Auto-submit after signing
          expire: 5 // 5 minutes to sign
        }
      };

      const response = await fetch(`${this.baseUrl}/payload`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Xaman payload creation failed:', response.status, error);
        return {
          success: false,
          error: `Xaman API error: ${response.status} - ${error}`
        };
      }

      const result: XamanPayloadResponse = await response.json();

      console.log('✅ Xaman payload created:', {
        uuid: result.uuid,
        hasQR: !!result.refs.qr_png,
        hasDeepLink: !!result.next.always
      });

      return {
        success: true,
        uuid: result.uuid,
        qr: result.refs.qr_png,
        deepLink: result.next.always
      };

    } catch (error) {
      console.error('❌ Error creating Xaman payload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get payload status and result
   * https://docs.xaman.dev/app-development/payload-flow
   */
  async getPayloadStatus(uuid: string): Promise<{
    success: boolean;
    signed?: boolean;
    txHash?: string;
    cancelled?: boolean;
    expired?: boolean;
    error?: string;
  }> {
    try {
      console.log('🔍 Checking Xaman payload status:', uuid);

      const response = await fetch(`${this.baseUrl}/payload/${uuid}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Xaman status check failed:', response.status, error);
        return {
          success: false,
          error: `Xaman API error: ${response.status} - ${error}`
        };
      }

      const result: XamanPayloadResult = await response.json();

      console.log('✅ Xaman payload status:', {
        uuid,
        signed: result.meta.signed,
        cancelled: result.meta.cancelled,
        expired: result.meta.expired,
        txHash: result.response?.txid
      });

      return {
        success: true,
        signed: result.meta.signed,
        cancelled: result.meta.cancelled,
        expired: result.meta.expired,
        txHash: result.response?.txid
      };

    } catch (error) {
      console.error('❌ Error checking Xaman payload status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Wait for payload to be signed (polling)
   */
  async waitForSignature(uuid: string, timeoutMs: number = 300000): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    const pollInterval = 3000; // 3 seconds

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getPayloadStatus(uuid);
      
      if (!status.success) {
        return { success: false, error: status.error };
      }

      if (status.signed && status.txHash) {
        return { success: true, txHash: status.txHash };
      }

      if (status.cancelled) {
        return { success: false, error: 'Transaction was cancelled by user' };
      }

      if (status.expired) {
        return { success: false, error: 'Transaction expired' };
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return { success: false, error: 'Timeout waiting for signature' };
  }
}

export const simpleXamanService = new SimpleXamanService();
