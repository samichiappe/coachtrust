/**
 * TypeScript types for XRPL integration
 */

// Wallet types
export interface XRPLWallet {
  classicAddress: string;
  address: string;
  publicKey: string;
  privateKey: string;
  seed: string;
}

// Transaction types
export interface BaseTransaction {
  TransactionType: string;
  Account: string;
  Sequence?: number;
  Fee?: string;
  LastLedgerSequence?: number;
  Memos?: Array<{ Memo: MemoObject }>;
  DestinationTag?: number;
}

export interface MemoObject {
  MemoData?: string;
  MemoType?: string;
  MemoFormat?: string;
}

export interface PaymentTransaction extends BaseTransaction {
  TransactionType: 'Payment';
  Destination: string;
  Amount: string | IssuedCurrency;
  DestinationTag?: number;
  SendMax?: string | IssuedCurrency;
  Paths?: Path[][];
}

export interface EscrowCreateTransaction extends BaseTransaction {
  TransactionType: 'EscrowCreate';
  Destination: string;
  Amount: string;
  FinishAfter?: number;
  CancelAfter?: number;
  Condition?: string;
  DestinationTag?: number;
}

export interface EscrowFinishTransaction extends BaseTransaction {
  TransactionType: 'EscrowFinish';
  Owner: string;
  OfferSequence: number;
  Condition?: string;
  Fulfillment?: string;
}

export interface EscrowCancelTransaction extends BaseTransaction {
  TransactionType: 'EscrowCancel';
  Owner: string;
  OfferSequence: number;
}

// Currency types
export interface IssuedCurrency {
  currency: string;
  value: string;
  issuer: string;
}

export interface Path {
  account?: string;
  currency?: string;
  issuer?: string;
}

// Response types
export interface TransactionResult {
  result: {
    validated: boolean;
    hash: string;
    meta: any;
    ledger_index?: number;
    engine_result?: string;
    engine_result_code?: number;
    engine_result_message?: string;
  };
}

export interface AccountInfo {
  account_data: {
    Account: string;
    Balance: string;
    Flags: number;
    LedgerEntryType: string;
    OwnerCount: number;
    PreviousTxnID: string;
    PreviousTxnLgrSeq: number;
    Sequence: number;
    index: string;
  };
  ledger_current_index: number;
  validated: boolean;
}

export interface ServerInfo {
  build_version: string;
  complete_ledgers: string;
  hostid: string;
  load_factor: number;
  peers: number;
  pubkey_node: string;
  server_state: string;
  validated_ledger: {
    age: number;
    base_fee_xrp: number;
    hash: string;
    reserve_base_xrp: number;
    reserve_inc_xrp: number;
    seq: number;
  };
}

// Escrow specific types
export interface EscrowObject {
  Account: string;
  Destination: string;
  Amount: string;
  PreviousTxnID: string;
  PreviousTxnLgrSeq: number;
  OwnerNode: string;
  DestinationNode?: string;
  FinishAfter?: number;
  CancelAfter?: number;
  Condition?: string;
  DestinationTag?: number;
  Flags: number;
  LedgerEntryType: 'Escrow';
  index: string;
}

// Booking and payment types for the app
export interface BookingPayment {
  id: string;
  coachId: string;
  userId: string;
  amount: string; // in drops
  currency: 'XRP';
  status: PaymentStatus;
  escrowSequence?: number;
  transactionHash?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export type PaymentStatus = 
  | 'pending'
  | 'escrowed'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'failed';

export interface EscrowCondition {
  condition: string;
  fulfillment?: string;
  preimage?: string;
}

// Network configuration
export interface NetworkConfig {
  name: string;
  url: string;
  type: 'mainnet' | 'testnet' | 'devnet';
  explorer: string;
}

// Error types
export interface XRPLError extends Error {
  code?: string;
  type: 'connection' | 'transaction' | 'validation' | 'network';
  details?: any;
}

// Wallet connection types
export interface WalletConnection {
  address: string;
  isConnected: boolean;
  provider: 'xaman' | 'ledger' | 'metamask' | 'other';
  networkId?: string;
}

// Transaction signing types
export interface SignRequest {
  transaction: BaseTransaction;
  instructions?: {
    fee?: string;
    sequence?: number;
    maxLedgerVersionOffset?: number;
  };
}

export interface SignResponse {
  id: string;
  signed: boolean;
  txBlob?: string;
  txHash?: string;
  error?: string;
}

// Utility types
export type TransactionType = 
  | 'Payment'
  | 'EscrowCreate'
  | 'EscrowFinish'
  | 'EscrowCancel'
  | 'AccountSet'
  | 'TrustSet'
  | 'OfferCreate'
  | 'OfferCancel';

export type LedgerIndex = number | 'validated' | 'closed' | 'current';

// Mock data types for development
export interface MockTransaction {
  hash: string;
  type: TransactionType;
  account: string;
  destination?: string;
  amount?: string;
  fee: string;
  sequence: number;
  ledgerIndex: number;
  date: string;
  validated: boolean;
}

export interface MockEscrow extends EscrowObject {
  mockId: string;
  bookingId: string;
  status: 'active' | 'finished' | 'cancelled';
}
