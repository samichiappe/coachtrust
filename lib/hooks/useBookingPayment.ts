/**
 * useBookingPayment Hook - Complete booking + payment orchestration
 * Manages the full workflow from reservation to payment completion
 * Based on xrpl-playground patterns for XRPL integration
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { bookingPaymentOrchestrator, BookingPaymentWorkflow, BookingPaymentResult } from '../services/bookingPaymentOrchestrator';
import { BookingRequest, BookingResult } from '../types';
import { useXamanWallet } from './useXamanWallet';

export interface BookingPaymentState {
  isLoading: boolean;
  currentWorkflow: BookingPaymentWorkflow | null;
  error: string | null;
  success: boolean;
}

export interface BookingPaymentActions {
  startBooking: (booking: BookingRequest, coachAddress: string) => Promise<BookingResult>;
  finalizeSession: (bookingId: string, fulfillment: string) => Promise<BookingResult>;
  cancelBooking: (bookingId: string, reason?: string) => Promise<BookingResult>;
  getWorkflowStatus: (bookingId: string) => BookingPaymentWorkflow | null;
  clearState: () => void;
}

export interface UseBookingPaymentReturn {
  state: BookingPaymentState;
  actions: BookingPaymentActions;
}

export const useBookingPayment = (): UseBookingPaymentReturn => {
  const { address: userAddress, isConnected } = useXamanWallet();
  const [state, setState] = useState<BookingPaymentState>({
    isLoading: false,
    currentWorkflow: null,
    error: null,
    success: false,
  });

  const workflowRef = useRef<string | null>(null);

  // Clear state on unmount
  useEffect(() => {
    return () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
    };
  }, []);

  /**
   * Start complete booking workflow
   */
  const startBooking = useCallback(async (
    booking: BookingRequest,
    coachAddress: string
  ): Promise<BookingResult> => {
    if (!isConnected || !userAddress) {
      const error = 'Wallet not connected';
      setState(prev => ({
        ...prev,
        error,
        success: false,
      }));
      return { success: false, error };
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      success: false,
    }));

    try {
      console.log('🚀 Starting booking workflow:', {
        booking,
        clientAddress: userAddress,
        coachAddress,
      });

      const result: BookingPaymentResult = await bookingPaymentOrchestrator.startBookingWorkflow(
        booking,
        userAddress,
        coachAddress
      );

      if (result.success) {
        workflowRef.current = result.workflow.bookingId;
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          currentWorkflow: result.workflow,
          success: true,
          error: null,
        }));

        console.log('✅ Booking workflow started successfully:', result.workflow);

        return {
          success: true,
          sessionId: result.workflow.sessionId,
          paymentTxHash: result.workflow.transactions[0]?.txHash,
          escrowDetails: result.workflow.escrow ? {
            sequence: result.workflow.escrow.sequence,
            condition: result.workflow.escrow.condition,
            fulfillment: result.workflow.escrow.fulfillment,
          } : undefined,
        };
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          currentWorkflow: result.workflow,
          error: result.error || 'Booking failed',
          success: false,
        }));

        console.error('❌ Booking workflow failed:', result.error);
        return { success: false, error: result.error || 'Booking failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        success: false,
      }));

      console.error('❌ Booking workflow error:', error);
      return { success: false, error: errorMessage };
    }
  }, [isConnected, userAddress]);

  /**
   * Finalize escrow after session completion
   */
  const finalizeSession = useCallback(async (
    bookingId: string,
    fulfillment: string
  ): Promise<BookingResult> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      console.log('🏁 Finalizing session escrow:', { bookingId, fulfillment });

      const result: BookingPaymentResult = await bookingPaymentOrchestrator.finalizeSessionEscrow(
        bookingId,
        fulfillment
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          currentWorkflow: result.workflow,
          success: true,
          error: null,
        }));

        console.log('✅ Session finalized successfully:', result.workflow);

        const finalizationTx = result.workflow.transactions.find(tx => tx.type === 'escrow_finish');
        
        return {
          success: true,
          sessionId: result.workflow.sessionId,
          paymentTxHash: finalizationTx?.txHash,
        };
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          currentWorkflow: result.workflow,
          error: result.error || 'Session finalization failed',
          success: false,
        }));

        console.error('❌ Session finalization failed:', result.error);
        return { success: false, error: result.error || 'Session finalization failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        success: false,
      }));

      console.error('❌ Session finalization error:', error);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Cancel booking and process refund
   */
  const cancelBooking = useCallback(async (
    bookingId: string,
    reason: string = 'User cancellation'
  ): Promise<BookingResult> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      console.log('❌ Cancelling booking:', { bookingId, reason });

      const result: BookingPaymentResult = await bookingPaymentOrchestrator.cancelBooking(
        bookingId,
        reason
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          currentWorkflow: result.workflow,
          success: true,
          error: null,
        }));

        console.log('✅ Booking cancelled successfully:', result.workflow);

        const cancellationTx = result.workflow.transactions.find(
          tx => tx.type === 'escrow_cancel' || tx.type === 'refund'
        );
        
        return {
          success: true,
          sessionId: result.workflow.sessionId,
          paymentTxHash: cancellationTx?.txHash,
        };
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          currentWorkflow: result.workflow,
          error: result.error || 'Booking cancellation failed',
          success: false,
        }));

        console.error('❌ Booking cancellation failed:', result.error);
        return { success: false, error: result.error || 'Booking cancellation failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        success: false,
      }));

      console.error('❌ Booking cancellation error:', error);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Get workflow status by ID
   */
  const getWorkflowStatus = useCallback((bookingId: string): BookingPaymentWorkflow | null => {
    return bookingPaymentOrchestrator.getWorkflowStatus(bookingId);
  }, []);

  /**
   * Clear state and reset
   */
  const clearState = useCallback(() => {
    setState({
      isLoading: false,
      currentWorkflow: null,
      error: null,
      success: false,
    });
    workflowRef.current = null;
  }, []);

  const actions: BookingPaymentActions = {
    startBooking,
    finalizeSession,
    cancelBooking,
    getWorkflowStatus,
    clearState,
  };

  return {
    state,
    actions,
  };
};

export default useBookingPayment;
