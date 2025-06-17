/**
 * Booking Payment Orchestrator - Integration service
 * Manages the complete workflow: reservation → escrow → finalization
 * Based on patterns from xrpl-playground for XRPL integration
 */

import { Client, xrpToDrops } from 'xrpl';
import { 
  createEscrowContract, 
  generateConditionAndFulfillment, 
  buildXRPLEscrowCreate,
  buildXRPLEscrowFinish,
  buildXRPLEscrowCancel,
  getXRPLClient as getEscrowClient,
  disconnectXRPLClient as disconnectEscrowClient,
  createEscrow,
  createEscrowWithSigning,
  finalizeEscrow,
  cancelEscrow
} from './escrowService';
import { 
  createPaymentTransaction,
  buildXRPLPayment,
  getXRPLClient as getPaymentClient,
  disconnectXRPLClient as disconnectPaymentClient,
  isValidXRPAddress,
  createPayment
} from './xrplPaymentService';
import { BookingRequest, BookingResult, PaymentTransaction, CoachingSession } from '../types';
import { EscrowContract, EscrowRequest } from '../types/escrow';

// Configuration option for real XRPL transactions
const ENABLE_REAL_XRPL_TRANSACTIONS = process.env.ENABLE_REAL_XRPL === 'true';

export interface BookingPaymentWorkflow {
  bookingId: string;
  sessionId: string;
  currentStep: 'booking' | 'escrow_creation' | 'escrow_pending' | 'session_scheduled' | 'escrow_finalization' | 'completed' | 'cancelled' | 'refunded';
  booking: BookingRequest;
  session?: CoachingSession;
  escrow?: EscrowContract;
  transactions: PaymentTransaction[];
  error?: string;
}

export interface BookingPaymentResult {
  success: boolean;
  workflow: BookingPaymentWorkflow;
  error?: string;
}

class BookingPaymentOrchestrator {
  private client: Client;
  private workflows: Map<string, BookingPaymentWorkflow> = new Map();

  constructor() {
    this.client = new Client("wss://s.altnet.rippletest.net:51233/");
  }

  /**
   * Start complete booking + payment workflow
   * Follows the xrpl-playground pattern for escrow creation
   */
  async startBookingWorkflow(
    booking: BookingRequest,
    clientAddress: string,
    coachAddress: string
  ): Promise<BookingPaymentResult> {
    const bookingId = this.generateBookingId();
    const sessionId = this.generateSessionId();

    try {
      // Initialize workflow
      const workflow: BookingPaymentWorkflow = {
        bookingId,
        sessionId,
        currentStep: 'booking',
        booking,
        transactions: [],
      };

      this.workflows.set(bookingId, workflow);

      // Step 1: Validate booking request
      await this.validateBookingRequest(booking);
      
      // Step 2: Create coaching session
      const session = await this.createCoachingSession(booking, sessionId, clientAddress);
      workflow.session = session;
      workflow.currentStep = 'escrow_creation';

      // Step 3: Create escrow for payment protection
      if (booking.paymentType === 'escrow') {
        const escrowResult = await this.createBookingEscrow(
          booking,
          sessionId,
          clientAddress,
          coachAddress
        );

        if (!escrowResult.success) {
          workflow.currentStep = 'cancelled';
          workflow.error = escrowResult.error;
          return { success: false, workflow, error: escrowResult.error };
        }

        workflow.escrow = escrowResult.escrow;
        workflow.currentStep = 'escrow_pending';
        
        // Add escrow transaction to workflow
        workflow.transactions.push({
          id: this.generateTransactionId(),
          sessionId,
          clientAddress,
          coachAddress,
          amount: booking.amount,
          type: 'escrow_create',
          status: 'pending',
          txHash: escrowResult.txHash,
          timestamp: new Date(),
          memo: `Escrow for session ${sessionId}`
        });
      } else {
        // Direct payment
        const paymentResult = await this.processDirectPayment(
          booking,
          sessionId,
          clientAddress,
          coachAddress
        );        if (!paymentResult.success) {
          workflow.currentStep = 'cancelled';
          workflow.error = paymentResult.error;
          return { success: false, workflow, error: paymentResult.error };
        }

        // Handle real XRPL transactions via Xaman
        const transactionStatus = paymentResult.payloadUuid ? 'pending_signature' : 'confirmed';
        const txHash = paymentResult.txHash || paymentResult.payloadUuid || `temp_${Date.now()}`;

        workflow.transactions.push({
          id: this.generateTransactionId(),
          sessionId,
          clientAddress,
          coachAddress,
          amount: booking.amount,
          type: 'payment',
          status: transactionStatus,
          txHash,
          payloadUuid: paymentResult.payloadUuid,
          requiresSignature: paymentResult.requiresSignature,
          timestamp: new Date(),
          memo: `Direct payment for session ${sessionId}`
        });
      }

      workflow.currentStep = 'session_scheduled';
      this.workflows.set(bookingId, workflow);

      return { success: true, workflow };

    } catch (error) {
      console.error('Booking workflow error:', error);
      
      const workflow = this.workflows.get(bookingId);
      if (workflow) {
        workflow.currentStep = 'cancelled';
        workflow.error = error instanceof Error ? error.message : 'Unknown error';
        this.workflows.set(bookingId, workflow);
      }

      return { 
        success: false, 
        workflow: workflow || this.createErrorWorkflow(bookingId, booking, error),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Finalize escrow after session completion
   * Based on xrpl-playground escrow finalization pattern
   */
  async finalizeSessionEscrow(
    bookingId: string,
    fulfillment: string
  ): Promise<BookingPaymentResult> {
    const workflow = this.workflows.get(bookingId);
    
    if (!workflow) {
      return { 
        success: false, 
        workflow: this.createEmptyWorkflow(), 
        error: 'Workflow not found' 
      };
    }

    if (!workflow.escrow) {
      return { 
        success: false, 
        workflow, 
        error: 'No escrow found for this booking' 
      };
    }

    try {
      workflow.currentStep = 'escrow_finalization';      // Finalize escrow using escrow service
      // finisherAddress = coach (who finishes), ownerAddress = client (who created)
      const finalizationResult = await finalizeEscrow(
        workflow.escrow.sequence,
        workflow.escrow.condition,
        fulfillment,
        workflow.booking.coachId.toString(),      // finisherAddress (coach)
        workflow.session?.clientAddress || ''    // ownerAddress (client)
      );

      if (!finalizationResult.success) {
        workflow.currentStep = 'cancelled';
        workflow.error = finalizationResult.error;
        return { success: false, workflow, error: finalizationResult.error };
      }

      // Add finalization transaction
      workflow.transactions.push({
        id: this.generateTransactionId(),
        sessionId: workflow.sessionId,
        clientAddress: workflow.session?.clientAddress || '',
        coachAddress: workflow.booking.coachId.toString(),
        amount: workflow.booking.amount,
        type: 'escrow_finish',
        status: 'confirmed',
        txHash: finalizationResult.txHash,
        timestamp: new Date(),
        memo: `Escrow finalization for session ${workflow.sessionId}`
      });

      workflow.currentStep = 'completed';
      this.workflows.set(bookingId, workflow);

      return { success: true, workflow };

    } catch (error) {
      console.error('Escrow finalization error:', error);
      
      workflow.currentStep = 'cancelled';
      workflow.error = error instanceof Error ? error.message : 'Finalization failed';
      this.workflows.set(bookingId, workflow);

      return { 
        success: false, 
        workflow, 
        error: error instanceof Error ? error.message : 'Finalization failed' 
      };
    }
  }

  /**
   * Cancel booking and process refund if necessary
   */
  async cancelBooking(
    bookingId: string,
    reason: string = 'User cancellation'
  ): Promise<BookingPaymentResult> {
    const workflow = this.workflows.get(bookingId);
    
    if (!workflow) {
      return { 
        success: false, 
        workflow: this.createEmptyWorkflow(), 
        error: 'Workflow not found' 
      };
    }

    try {      // If escrow exists, cancel it
      if (workflow.escrow) {
        const cancellationResult = await cancelEscrow(
          workflow.escrow.sequence,
          workflow.session?.clientAddress || '',    // cancellerAddress (client)
          workflow.session?.clientAddress || ''     // ownerAddress (client)
        );

        if (cancellationResult.success) {
          workflow.transactions.push({
            id: this.generateTransactionId(),
            sessionId: workflow.sessionId,
            clientAddress: workflow.session?.clientAddress || '',
            coachAddress: workflow.booking.coachId.toString(),
            amount: workflow.booking.amount,
            type: 'escrow_cancel',
            status: 'confirmed',
            txHash: cancellationResult.txHash,
            timestamp: new Date(),
            memo: `Booking cancellation: ${reason}`
          });

          workflow.currentStep = 'refunded';
        } else {
          workflow.currentStep = 'cancelled';
          workflow.error = `Cancellation failed: ${cancellationResult.error}`;
        }
      } else {
        // For direct payments, process refund
        const refundResult = await this.processRefund(workflow, reason);
        
        if (refundResult.success) {
          workflow.currentStep = 'refunded';
        } else {
          workflow.currentStep = 'cancelled';
          workflow.error = `Refund failed: ${refundResult.error}`;
        }
      }

      this.workflows.set(bookingId, workflow);
      return { success: true, workflow };

    } catch (error) {
      console.error('Booking cancellation error:', error);
      
      workflow.currentStep = 'cancelled';
      workflow.error = error instanceof Error ? error.message : 'Cancellation failed';
      this.workflows.set(bookingId, workflow);

      return { 
        success: false, 
        workflow, 
        error: error instanceof Error ? error.message : 'Cancellation failed' 
      };
    }
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(bookingId: string): BookingPaymentWorkflow | null {
    return this.workflows.get(bookingId) || null;
  }

  /**
   * Get all workflows for debugging
   */
  getAllWorkflows(): BookingPaymentWorkflow[] {
    return Array.from(this.workflows.values());
  }

  // Private helper methods

  private async validateBookingRequest(booking: BookingRequest): Promise<void> {
    if (!booking.coachId) throw new Error('Coach ID is required');
    if (!booking.sessionDateTime) throw new Error('Session date/time is required');
    if (booking.duration <= 0) throw new Error('Session duration must be positive');
    if (!booking.court) throw new Error('Court selection is required');
    if (!booking.amount || parseFloat(booking.amount) <= 0) {
      throw new Error('Valid amount is required');
    }
  }

  private async createCoachingSession(
    booking: BookingRequest,
    sessionId: string,
    clientAddress: string
  ): Promise<CoachingSession> {
    return {
      id: sessionId,
      coachId: booking.coachId,
      clientAddress,
      sessionDateTime: booking.sessionDateTime,
      duration: booking.duration,
      court: booking.court,
      status: 'scheduled',
      amount: booking.amount,
      paymentType: booking.paymentType
    };
  }
  private async createBookingEscrow(
    booking: BookingRequest,
    sessionId: string,
    clientAddress: string,
    coachAddress: string
  ): Promise<{ success: boolean; escrow?: EscrowContract; txHash?: string; error?: string; payloadUuid?: string; requiresSignature?: boolean }> {
    try {      // Calculate escrow release time (24 hours after session)
      const releaseTime = new Date(booking.sessionDateTime);
      releaseTime.setHours(releaseTime.getHours() + 24);      const escrowRequest: EscrowRequest = {
        fromAddress: clientAddress,
        toAddress: coachAddress,
        destination: coachAddress,
        amount: booking.amount,
        releaseTime: releaseTime.getTime(),
        memo: `Escrow for coaching session ${sessionId}`
      };      // Use real XRPL transactions if enabled, otherwise use mock
      const result = ENABLE_REAL_XRPL_TRANSACTIONS 
        ? await createEscrowWithSigning(escrowRequest, true)
        : await createEscrow(escrowRequest);
      
      console.log(`${ENABLE_REAL_XRPL_TRANSACTIONS ? '🔗 Real XRPL' : '🧪 Mock'} escrow transaction:`, {
        enabled: ENABLE_REAL_XRPL_TRANSACTIONS,
        success: result.success,
        txHash: result.txHash,
        payloadUuid: result.payloadUuid,
        requiresSignature: result.requiresSignature
      });
      
      // Accept successful escrow creation even if txHash is null (Xaman pending signature)
      if (result.success && result.escrow) {
        return {
          success: true,
          escrow: result.escrow,
          txHash: result.txHash || result.payloadUuid || `pending_${Date.now()}`,
          payloadUuid: result.payloadUuid,
          requiresSignature: result.requiresSignature
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to create escrow'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Escrow creation failed'
      };
    }
  }  private async processDirectPayment(
    booking: BookingRequest,
    sessionId: string,
    clientAddress: string,
    coachAddress: string
  ): Promise<{ 
    success: boolean; 
    txHash?: string; 
    error?: string;
    payloadUuid?: string;
    requiresSignature?: boolean;
  }> {
    try {
      console.log('🔄 Processing direct payment using escrow service...');
      
      // Use escrow service for payment (will create immediate escrow that coach can finish)
      const escrowRequest: EscrowRequest = {
        fromAddress: clientAddress,     // owner (client)
        toAddress: coachAddress,        // kept for compatibility
        destination: coachAddress,      // destination (coach) 
        amount: booking.amount,         // amount
        purpose: `Direct payment for coaching session ${sessionId}`,
        bookingId: sessionId,
        releaseTime: Math.floor(Date.now() / 1000) + 3600  // finish after 1 hour
      };
      
      const escrowResult = await createEscrow(escrowRequest);

      if (escrowResult.success) {
        return {
          success: true,
          txHash: escrowResult.txHash,
          payloadUuid: escrowResult.payloadUuid,
          requiresSignature: escrowResult.requiresSignature
        };
      } else {
        return {
          success: false,
          error: escrowResult.error || 'Escrow creation failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  private async processRefund(
    workflow: BookingPaymentWorkflow,
    reason: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    // For direct payments, we would need to implement refund logic
    // This is a simplified implementation
    try {
      workflow.transactions.push({
        id: this.generateTransactionId(),
        sessionId: workflow.sessionId,
        clientAddress: workflow.session?.clientAddress || '',
        coachAddress: workflow.booking.coachId.toString(),
        amount: workflow.booking.amount,
        type: 'refund',
        status: 'pending',
        timestamp: new Date(),
        memo: `Refund: ${reason}`
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed'
      };
    }
  }

  // Utility methods

  private generateBookingId(): string {
    return `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createErrorWorkflow(
    bookingId: string, 
    booking: BookingRequest, 
    error: any
  ): BookingPaymentWorkflow {
    return {
      bookingId,
      sessionId: '',
      currentStep: 'cancelled',
      booking,
      transactions: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  private createEmptyWorkflow(): BookingPaymentWorkflow {
    return {
      bookingId: '',
      sessionId: '',
      currentStep: 'cancelled',
      booking: {} as BookingRequest,
      transactions: [],
      error: 'Workflow not found'
    };
  }
}

// Export singleton instance
export const bookingPaymentOrchestrator = new BookingPaymentOrchestrator();
