// Types for escrow functionality based on xrpl-playground patterns
export interface EscrowContract {
  id: string
  sequence: number
  account: string // Owner of the escrow (client/customer)
  fromAddress?: string // Alias for account (compatibility)
  destination: string // Beneficiary (coach)
  toAddress?: string // Alias for destination (compatibility)
  amount: string // Amount in XRP
  amountInDrops: string // Amount in drops
  condition: string // Crypto-condition
  fulfillment?: string // Fulfillment (kept secret until completion)
  status: EscrowStatus
  bookingId?: string
  purpose?: string
  createdAt: number
  expiresAt?: number
}

export interface EscrowStatus {
  state: 'created' | 'pending_completion' | 'completed' | 'cancelled' | 'expired'
  message?: string
  errorCode?: string
  lastUpdated: number
}

export interface EscrowCondition {
  condition: string
  fulfillment: string
  preimage: string
}

export interface EscrowRequest {
  destination: string
  amount: number // In XRP
  purpose?: string
  bookingId?: string
  memo?: string
}

export interface EscrowResult {
  success: boolean
  escrow?: EscrowContract
  error?: string
  payloadId?: string
}

export interface EscrowFinishRequest {
  escrowId: string
  fulfillment: string
}

export interface EscrowCancelRequest {
  escrowId: string
  reason?: string
}
