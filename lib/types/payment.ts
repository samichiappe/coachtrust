// Types for payment functionality
export interface PaymentTransaction {
  id: string
  fromAddress: string
  toAddress: string
  amount: string // Amount in XRP
  amountInDrops: string // Amount in drops
  status: PaymentStatus
  txid?: string
  timestamp: number
  purpose?: string
  memo?: string
  fee?: string
}

export interface PaymentStatus {
  state: 'pending' | 'submitted' | 'validated' | 'failed' | 'expired'
  message?: string
  errorCode?: string
  lastUpdated: number
}

export interface PaymentRequest {
  toAddress: string
  amount: string // Amount in XRP
  purpose?: string
  memo?: string
}

export interface PaymentResult {
  success: boolean
  transaction?: PaymentTransaction
  error?: string
  txid?: string
}

export interface PaymentHistory {
  transactions: PaymentTransaction[]
  totalCount: number
  hasMore: boolean
}

// Hook state interface
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
