/**
 * XRPL Payment Service for Coach Platform
 * Handles direct payments and escrow management
 */

import { Client, Payment, xrpToDrops } from 'xrpl';
import { Wallet } from 'xrpl';
import { createXRPLClient, connectWithRetry } from './client';
import { escrowService, EscrowSession, CreateEscrowParams, EscrowResult } from './escrow';
import { formatXRPAmount, generateDestinationTag } from './utils';

export interface PaymentRequest {
  sessionId: string;
  clientAddress: string;
  coachAddress: string;
  amount: string; // in XRP
  sessionDateTime: Date;
  duration: number; // in minutes
  paymentType: 'direct' | 'escrow';
  memo?: string;
}

export interface PaymentResult {
  success: boolean;
  txHash?: string;
  paymentType: 'direct' | 'escrow';
  amount: string;
  escrowDetails?: {
    sequence?: number;
    condition?: string;
    fulfillment?: string;
    preimage?: string;
  };
  error?: string;
}

export interface SessionPaymentStatus {
  sessionId: string;
  paymentType: 'direct' | 'escrow';
  status: 'pending' | 'paid' | 'escrowed' | 'completed' | 'cancelled' | 'disputed';
  amount: string;
  txHash?: string;
  escrowSequence?: number;
  canComplete: boolean;
  canCancel: boolean;
  autoReleaseTime?: Date;
  cancelAfterTime?: Date;
}

export class XRPLPaymentService {
  private client: Client;
  private activeSessions: Map<string, EscrowSession> = new Map();

  constructor() {
    this.client = createXRPLClient();
  }

  /**
   * Process payment for a coaching session
   */
  async processSessionPayment(
    paymentRequest: PaymentRequest,
    clientWallet: Wallet
  ): Promise<PaymentResult> {
    try {
      if (paymentRequest.paymentType === 'direct') {
        return await this.processDirectPayment(paymentRequest, clientWallet);
      } else {
        return await this.processEscrowPayment(paymentRequest, clientWallet);
      }
    } catch (error) {
      console.error('Error processing session payment:', error);
      return {
        success: false,
        paymentType: paymentRequest.paymentType,
        amount: paymentRequest.amount,
        error: `Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process direct payment (immediate transfer to coach)
   */
  private async processDirectPayment(
    paymentRequest: PaymentRequest,
    clientWallet: Wallet
  ): Promise<PaymentResult> {
    try {
      await connectWithRetry(this.client);

      const destinationTag = generateDestinationTag();
      
      const paymentTx: Payment = {
        TransactionType: 'Payment',
        Account: paymentRequest.clientAddress,
        Destination: paymentRequest.coachAddress,
        Amount: xrpToDrops(paymentRequest.amount),
        DestinationTag: destinationTag,
        Memos: [
          {
            Memo: {
              MemoType: Buffer.from('session-payment', 'utf8').toString('hex'),
              MemoData: Buffer.from(JSON.stringify({
                sessionId: paymentRequest.sessionId,
                sessionDateTime: paymentRequest.sessionDateTime.toISOString(),
                duration: paymentRequest.duration,
                amount: paymentRequest.amount,
                memo: paymentRequest.memo || 'Coaching session payment'
              }), 'utf8').toString('hex'),
              MemoFormat: Buffer.from('application/json', 'utf8').toString('hex')
            }
          }
        ]
      };

      const result = await this.client.submitAndWait(paymentTx, {
        autofill: true,
        wallet: clientWallet
      });

      if (result.result.validated) {
        return {
          success: true,
          txHash: result.result.hash,
          paymentType: 'direct',
          amount: paymentRequest.amount
        };
      } else {
        return {
          success: false,
          paymentType: 'direct',
          amount: paymentRequest.amount,
          error: `Direct payment failed: ${JSON.stringify(result.result.meta)}`
        };
      }
    } catch (error) {
      console.error('Error processing direct payment:', error);
      return {
        success: false,
        paymentType: 'direct',
        amount: paymentRequest.amount,
        error: `Direct payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process escrow payment (secured payment released after session completion)
   */
  private async processEscrowPayment(
    paymentRequest: PaymentRequest,
    clientWallet: Wallet
  ): Promise<PaymentResult> {
    try {
      const escrowParams: CreateEscrowParams = {
        sessionId: paymentRequest.sessionId,
        clientAddress: paymentRequest.clientAddress,
        coachAddress: paymentRequest.coachAddress,
        amount: paymentRequest.amount,
        sessionDateTime: paymentRequest.sessionDateTime,
        duration: paymentRequest.duration
      };

      const escrowResult = await escrowService.createSessionEscrow(escrowParams, clientWallet);

      if (escrowResult.success) {
        // Store escrow session details
        const session: EscrowSession = {
          sessionId: paymentRequest.sessionId,
          clientAddress: paymentRequest.clientAddress,
          coachAddress: paymentRequest.coachAddress,
          amount: paymentRequest.amount,
          sessionDateTime: paymentRequest.sessionDateTime,
          duration: paymentRequest.duration,
          status: 'pending',
          escrowSequence: escrowResult.sequence,
          condition: escrowResult.condition,
          fulfillment: escrowResult.fulfillment,
          preimage: escrowResult.preimage,
          txHash: escrowResult.txHash
        };

        this.activeSessions.set(paymentRequest.sessionId, session);

        return {
          success: true,
          txHash: escrowResult.txHash,
          paymentType: 'escrow',
          amount: paymentRequest.amount,
          escrowDetails: {
            sequence: escrowResult.sequence,
            condition: escrowResult.condition,
            fulfillment: escrowResult.fulfillment,
            preimage: escrowResult.preimage
          }
        };
      } else {
        return {
          success: false,
          paymentType: 'escrow',
          amount: paymentRequest.amount,
          error: escrowResult.error
        };
      }
    } catch (error) {
      console.error('Error processing escrow payment:', error);
      return {
        success: false,
        paymentType: 'escrow',
        amount: paymentRequest.amount,
        error: `Escrow payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Complete an escrow session (release payment to coach)
   */
  async completeSession(
    sessionId: string,
    executorWallet: Wallet
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      if (!session.escrowSequence || !session.condition || !session.fulfillment) {
        return { success: false, error: 'Escrow details not available' };
      }

      const result = await escrowService.completeSessionEscrow(
        session.clientAddress,
        session.coachAddress,
        session.escrowSequence,
        session.condition,
        session.fulfillment,
        executorWallet
      );

      if (result.success) {
        session.status = 'completed';
        this.activeSessions.set(sessionId, session);
        
        return {
          success: true,
          txHash: result.txHash
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Error completing session:', error);
      return {
        success: false,
        error: `Failed to complete session: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Cancel an escrow session (refund client)
   */
  async cancelSession(
    sessionId: string,
    executorWallet: Wallet
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      if (!session.escrowSequence) {
        return { success: false, error: 'Escrow sequence not available' };
      }

      const result = await escrowService.cancelSessionEscrow(
        session.clientAddress,
        session.escrowSequence,
        executorWallet
      );

      if (result.success) {
        session.status = 'cancelled';
        this.activeSessions.set(sessionId, session);
        
        return {
          success: true,
          txHash: result.txHash
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      return {
        success: false,
        error: `Failed to cancel session: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get payment status for a session
   */
  getSessionPaymentStatus(sessionId: string): SessionPaymentStatus | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    const now = new Date();
    const sessionEnd = new Date(session.sessionDateTime);
    sessionEnd.setMinutes(sessionEnd.getMinutes() + session.duration);
    
    const autoReleaseTime = new Date(sessionEnd);
    autoReleaseTime.setHours(autoReleaseTime.getHours() + 24);
    
    const cancelAfterTime = new Date();
    cancelAfterTime.setDate(cancelAfterTime.getDate() + 7);    return {
      sessionId: session.sessionId,
      paymentType: 'escrow',
      status: session.status === 'active' ? 'escrowed' : session.status,
      amount: session.amount,
      txHash: session.txHash,
      escrowSequence: session.escrowSequence,
      canComplete: now > sessionEnd && session.status === 'pending',
      canCancel: now > cancelAfterTime && session.status === 'pending',
      autoReleaseTime,
      cancelAfterTime
    };
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): EscrowSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): EscrowSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: string): string {
    return formatXRPAmount(amount);
  }

  /**
   * Disconnect from XRPL
   */
  async disconnect() {
    await escrowService.disconnect();
    if (this.client.isConnected()) {
      await this.client.disconnect();
    }
  }
}

export const paymentService = new XRPLPaymentService();
