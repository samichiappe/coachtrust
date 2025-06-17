/**
 * Application-wide TypeScript types
 */

// Coach types
export interface Coach {
  id: string | number;
  name: string;
  sport: string;
  rating: number;
  reviews: number;
  price?: number; // Legacy EUR price
  hourlyRate: number; // XRP hourly rate
  location: string;
  image?: string;
  description: string;
  phone: string;
  email: string;
  certifications: string[];
  courts: CoachCourt[];
  availability: { [date: string]: string[] };
  xrplAddress: string; // Coach's XRPL wallet address
}

export interface CoachCourt {
  name: string;
  address: string;
}

// Session types
export interface CoachingSession {
  id: string;
  coachId: string | number;
  clientAddress: string;
  sessionDateTime: Date;
  duration: number; // in minutes
  court: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  amount: string; // in XRP
  paymentType: 'direct' | 'escrow';
  escrowDetails?: {
    sequence: number;
    condition: string;
    fulfillment: string;
  };
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  xrplAddress?: string;
  role: 'client' | 'coach';
}

// Booking types
export interface BookingRequest {
  coachId: string | number;
  sessionDateTime: Date;
  duration: number;
  court: string;
  amount: string;
  paymentType: 'direct' | 'escrow';
  memo?: string;
}

export interface BookingResult {
  success: boolean;
  sessionId?: string;
  paymentTxHash?: string;
  escrowDetails?: {
    sequence: number;
    condition: string;
    fulfillment: string;
  };
  error?: string;
}

// Payment and Transaction types
export interface PaymentTransaction {
  id: string;
  sessionId: string;
  clientAddress: string;
  coachAddress: string;
  amount: string; // in XRP
  type: 'payment' | 'escrow_create' | 'escrow_finish' | 'escrow_cancel' | 'refund';
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  timestamp: Date;
  blockHeight?: number;
  fees?: string; // in XRP
  memo?: string;
}

export interface WalletInfo {
  address: string;
  balance: string; // in XRP
  isConnected: boolean;
  network: 'mainnet' | 'testnet' | 'devnet';
}

export interface PaymentSummary {
  totalPaid: string; // in XRP
  totalReceived: string; // in XRP
  totalEscrowed: string; // in XRP
  totalSessions: number;
  completedSessions: number;
  pendingSessions: number;
}
