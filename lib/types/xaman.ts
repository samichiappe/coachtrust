// Enhanced Xaman and XRPL Type Definitions
// Based on Xaman SDK and XRPL standards from the playground examples

export interface XamanWalletState {
  isConnected: boolean
  address: string | null
  userToken: string | null
  isLoading: boolean
  error: string | null
  networkType?: 'mainnet' | 'testnet' | 'devnet'
}

// Enhanced error types for better user feedback
export enum XamanErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  USER_CANCELLED = 'USER_CANCELLED',
  EXPIRED = 'EXPIRED',
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  UNKNOWN = 'UNKNOWN'
}

export interface XamanError {
  type: XamanErrorType
  message: string
  details?: any
}

// Comprehensive XRPL Transaction Types based on playground examples
export interface BaseTransaction {
  TransactionType: string
  Account?: string
  Fee?: string
  Sequence?: number
  LastLedgerSequence?: number
  Memos?: Array<{
    Memo: {
      MemoType?: string
      MemoData?: string
      MemoFormat?: string
    }
  }>
  [key: string]: any
}

export interface PaymentTransaction extends BaseTransaction {
  TransactionType: 'Payment'
  Destination: string
  Amount: string | {
    currency: string
    issuer: string
    value: string
  }
  DestinationTag?: number
  Paths?: any[]
  SendMax?: string | {
    currency: string
    issuer: string
    value: string
  }
}

export interface EscrowCreateTransaction extends BaseTransaction {
  TransactionType: 'EscrowCreate'
  Destination: string
  Amount: string
  Condition?: string
  FinishAfter?: number
  CancelAfter?: number
}

export interface EscrowFinishTransaction extends BaseTransaction {
  TransactionType: 'EscrowFinish'
  Owner: string
  OfferSequence: number
  Condition?: string
  Fulfillment?: string
}

export interface TrustSetTransaction extends BaseTransaction {
  TransactionType: 'TrustSet'
  LimitAmount: {
    currency: string
    issuer: string
    value: string
  }
  QualityIn?: number
  QualityOut?: number
  Flags?: number
}

export interface NFTokenMintTransaction extends BaseTransaction {
  TransactionType: 'NFTokenMint'
  NFTokenTaxon: number
  Flags?: number
  TransferFee?: number
  Issuer?: string
  URI?: string
}

export interface NFTokenCreateOfferTransaction extends BaseTransaction {
  TransactionType: 'NFTokenCreateOffer'
  NFTokenID: string
  Amount: string
  Owner?: string
  Expiration?: number
  Destination?: string
  Flags?: number
}

export interface PaymentChannelCreateTransaction extends BaseTransaction {
  TransactionType: 'PaymentChannelCreate'
  Destination: string
  Amount: string
  SettleDelay: number
  PublicKey: string
  CancelAfter?: number
  DestinationTag?: number
}

export interface PaymentChannelClaimTransaction extends BaseTransaction {
  TransactionType: 'PaymentChannelClaim'
  Channel: string
  Balance?: string
  Amount?: string
  Signature?: string
  PublicKey?: string
  Flags?: number
}

export interface SignInTransaction extends BaseTransaction {
  TransactionType: 'SignIn'
}

// Union type for all supported transactions
export type XRPLTransaction = 
  | PaymentTransaction
  | EscrowCreateTransaction
  | EscrowFinishTransaction
  | TrustSetTransaction
  | NFTokenMintTransaction
  | NFTokenCreateOfferTransaction
  | PaymentChannelCreateTransaction
  | PaymentChannelClaimTransaction
  | SignInTransaction
  | BaseTransaction

// Xaman Payload interfaces
export interface XamanPayloadOptions {
  submit?: boolean
  expire?: number
  return_url?: {
    web?: string
    app?: string
  }
  pathfinding?: boolean
  pathfinding_fallback?: boolean
  force_network?: string
}

export interface XamanCustomMeta {
  identifier?: string
  instruction?: string
  blob?: any
}

export interface XamanPayload {
  txjson: XRPLTransaction
  options?: XamanPayloadOptions
  custom_meta?: XamanCustomMeta
}

export interface XamanPayloadResponse {
  uuid: string
  next: {
    always: string
    no_push_msg_received?: string
  }
  refs: {
    qr_png: string
    qr_matrix: string
    qr_uri_quality_opts?: string[]
    websocket_status: string
  }
  pushed: boolean
}

export interface XamanPayloadStatus {
  meta: {
    exists: boolean
    uuid: string
    multisign: boolean
    submit: boolean
    destination: string
    resolved_destination: string
    resolved: boolean
    signed: boolean
    cancelled: boolean
    expired: boolean
    pushed: boolean
    app_opened: boolean
    return_url_app?: string
    return_url_web?: string
    is_xapp: boolean
    opened_by_deeplink?: boolean
  }
  application: {
    name: string
    description: string
    disabled: number
    uuidv4: string
    icon_url: string
    issued_user_token?: string
  }
  payload: {
    tx_type: string
    tx_destination: string
    tx_destination_tag?: number
    request_json: XRPLTransaction
    created_at: string
    expires_at: string
    expires_in_seconds: number
  }
  response?: {
    txid?: string
    resolved_at?: string
    dispatched_to?: string
    dispatched_result?: string
    multisign_account?: string
    account?: string
    signer?: string
    user_token?: string
    user?: string
    environment_nodeuri?: string
    environment_networkendpoint?: string
    hex?: string
    txblob?: string
  }
}

// Transaction validation result
export interface TransactionValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Enhanced hook interface
export interface UseXamanWallet extends XamanWalletState {
  connect: () => Promise<void>
  disconnect: () => void
  signTransaction: (txJson: XRPLTransaction) => Promise<any>
  refreshStatus: () => Promise<void>
  validateTransaction: (txJson: XRPLTransaction) => TransactionValidationResult
  getLastError: () => XamanError | null
  clearError: () => void
}

// API Response types
export interface XamanAPIResponse<T = any> {
  success: boolean
  data?: T
  payload?: any
  error?: string
}

export interface TokenVerificationResult {
  valid: boolean
  expired?: boolean
  user_token?: string
  account?: string
}
