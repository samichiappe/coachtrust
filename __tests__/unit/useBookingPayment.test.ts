/**
 * Tests for useBookingPayment Hook
 * Tests the React hook for complete booking + payment orchestration
 */

import { renderHook, act } from '@testing-library/react';
import { useBookingPayment } from '../../lib/hooks/useBookingPayment';
import { BookingRequest } from '../../lib/types';

// Mock dependencies
jest.mock('../../lib/services/bookingPaymentOrchestrator', () => ({
  bookingPaymentOrchestrator: {
    startBookingWorkflow: jest.fn(),
    finalizeSessionEscrow: jest.fn(),
    cancelBooking: jest.fn(),
    getWorkflowStatus: jest.fn(),
  }
}));

jest.mock('../../lib/hooks/useXamanWallet', () => ({
  useXamanWallet: jest.fn(),
}));

describe('useBookingPayment Hook Tests', () => {
  const mockBookingRequest: BookingRequest = {
    coachId: 'coach-1',
    sessionDateTime: new Date('2024-02-15T10:00:00Z'),
    duration: 60,
    court: 'Court A',
    amount: '30.0',
    paymentType: 'escrow',
    memo: 'Tennis lesson',
  };

  const mockCoachAddress = 'rCoach987654321';
  const mockUserAddress = 'rUser123456789';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock wallet connected by default
    const mockUseXamanWallet = require('../../lib/hooks/useXamanWallet').useXamanWallet;
    mockUseXamanWallet.mockReturnValue({
      userAddress: mockUserAddress,
      isConnected: true,
    });
  });

  describe('Initial State', () => {
    test('should initialize with correct default state', () => {
      const { result } = renderHook(() => useBookingPayment());

      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.currentWorkflow).toBeNull();
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.success).toBe(false);
    });

    test('should provide all required actions', () => {
      const { result } = renderHook(() => useBookingPayment());

      expect(result.current.actions.startBooking).toBeDefined();
      expect(result.current.actions.finalizeSession).toBeDefined();
      expect(result.current.actions.cancelBooking).toBeDefined();
      expect(result.current.actions.getWorkflowStatus).toBeDefined();
      expect(result.current.actions.clearState).toBeDefined();
    });
  });

  describe('Start Booking Workflow', () => {
    test('should start booking successfully', async () => {
      const mockOrchestrator = require('../../lib/services/bookingPaymentOrchestrator').bookingPaymentOrchestrator;
      
      const mockWorkflow = {
        bookingId: 'booking-123',
        sessionId: 'session-456',
        currentStep: 'session_scheduled',
        booking: mockBookingRequest,
        transactions: [{
          id: 'tx-1',
          txHash: 'hash-123',
          type: 'escrow_create',
        }],
        escrow: {
          sequence: 12345,
          condition: 'test-condition',
          fulfillment: 'test-fulfillment',
        },
      };

      mockOrchestrator.startBookingWorkflow.mockResolvedValue({
        success: true,
        workflow: mockWorkflow,
      });

      const { result } = renderHook(() => useBookingPayment());

      // Start booking
      let bookingResult;
      await act(async () => {
        bookingResult = await result.current.actions.startBooking(
          mockBookingRequest,
          mockCoachAddress
        );
      });

      // Verify result
      expect(bookingResult).toEqual({
        success: true,
        sessionId: 'session-456',
        paymentTxHash: 'hash-123',
        escrowDetails: {
          sequence: 12345,
          condition: 'test-condition',
          fulfillment: 'test-fulfillment',
        },
      });

      // Verify state updates
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.success).toBe(true);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.currentWorkflow).toEqual(mockWorkflow);

      // Verify orchestrator was called correctly
      expect(mockOrchestrator.startBookingWorkflow).toHaveBeenCalledWith(
        mockBookingRequest,
        mockUserAddress,
        mockCoachAddress
      );
    });

    test('should handle wallet not connected', async () => {
      // Mock wallet disconnected
      const mockUseXamanWallet = require('../../lib/hooks/useXamanWallet').useXamanWallet;
      mockUseXamanWallet.mockReturnValue({
        userAddress: null,
        isConnected: false,
      });

      const { result } = renderHook(() => useBookingPayment());

      let bookingResult;
      await act(async () => {
        bookingResult = await result.current.actions.startBooking(
          mockBookingRequest,
          mockCoachAddress
        );
      });

      expect(bookingResult).toEqual({
        success: false,
        error: 'Wallet not connected',
      });

      expect(result.current.state.error).toBe('Wallet not connected');
      expect(result.current.state.success).toBe(false);
    });

    test('should handle booking workflow failure', async () => {
      const mockOrchestrator = require('../../lib/services/bookingPaymentOrchestrator').bookingPaymentOrchestrator;
      
      mockOrchestrator.startBookingWorkflow.mockResolvedValue({
        success: false,
        workflow: {
          bookingId: 'booking-123',
          currentStep: 'cancelled',
          error: 'Insufficient funds',
        },
        error: 'Insufficient funds',
      });

      const { result } = renderHook(() => useBookingPayment());

      let bookingResult;
      await act(async () => {
        bookingResult = await result.current.actions.startBooking(
          mockBookingRequest,
          mockCoachAddress
        );
      });

      expect(bookingResult).toEqual({
        success: false,
        error: 'Insufficient funds',
      });

      expect(result.current.state.error).toBe('Insufficient funds');
      expect(result.current.state.success).toBe(false);
    });
  });

  describe('Finalize Session', () => {
    test('should finalize session successfully', async () => {
      const mockOrchestrator = require('../../lib/services/bookingPaymentOrchestrator').bookingPaymentOrchestrator;
      
      const mockWorkflow = {
        bookingId: 'booking-123',
        sessionId: 'session-456',
        currentStep: 'completed',
        transactions: [
          { type: 'escrow_create', txHash: 'create-hash' },
          { type: 'escrow_finish', txHash: 'finish-hash' },
        ],
      };

      mockOrchestrator.finalizeSessionEscrow.mockResolvedValue({
        success: true,
        workflow: mockWorkflow,
      });

      const { result } = renderHook(() => useBookingPayment());

      let finalizationResult;
      await act(async () => {
        finalizationResult = await result.current.actions.finalizeSession(
          'booking-123',
          'test-fulfillment'
        );
      });

      expect(finalizationResult).toEqual({
        success: true,
        sessionId: 'session-456',
        paymentTxHash: 'finish-hash',
      });

      expect(result.current.state.success).toBe(true);
      expect(result.current.state.currentWorkflow).toEqual(mockWorkflow);

      expect(mockOrchestrator.finalizeSessionEscrow).toHaveBeenCalledWith(
        'booking-123',
        'test-fulfillment'
      );
    });

    test('should handle finalization failure', async () => {
      const mockOrchestrator = require('../../lib/services/bookingPaymentOrchestrator').bookingPaymentOrchestrator;
      
      mockOrchestrator.finalizeSessionEscrow.mockResolvedValue({
        success: false,
        workflow: {
          currentStep: 'cancelled',
          error: 'Finalization failed',
        },
        error: 'Finalization failed',
      });

      const { result } = renderHook(() => useBookingPayment());

      let finalizationResult;
      await act(async () => {
        finalizationResult = await result.current.actions.finalizeSession(
          'booking-123',
          'test-fulfillment'
        );
      });

      expect(finalizationResult).toEqual({
        success: false,
        error: 'Finalization failed',
      });

      expect(result.current.state.error).toBe('Finalization failed');
      expect(result.current.state.success).toBe(false);
    });
  });

  describe('Cancel Booking', () => {
    test('should cancel booking successfully', async () => {
      const mockOrchestrator = require('../../lib/services/bookingPaymentOrchestrator').bookingPaymentOrchestrator;
      
      const mockWorkflow = {
        bookingId: 'booking-123',
        sessionId: 'session-456',
        currentStep: 'refunded',
        transactions: [
          { type: 'escrow_create', txHash: 'create-hash' },
          { type: 'escrow_cancel', txHash: 'cancel-hash' },
        ],
      };

      mockOrchestrator.cancelBooking.mockResolvedValue({
        success: true,
        workflow: mockWorkflow,
      });

      const { result } = renderHook(() => useBookingPayment());

      let cancellationResult;
      await act(async () => {
        cancellationResult = await result.current.actions.cancelBooking(
          'booking-123',
          'User requested cancellation'
        );
      });

      expect(cancellationResult).toEqual({
        success: true,
        sessionId: 'session-456',
        paymentTxHash: 'cancel-hash',
      });

      expect(result.current.state.success).toBe(true);
      expect(result.current.state.currentWorkflow).toEqual(mockWorkflow);

      expect(mockOrchestrator.cancelBooking).toHaveBeenCalledWith(
        'booking-123',
        'User requested cancellation'
      );
    });
  });

  describe('Utility Actions', () => {
    test('should get workflow status', () => {
      const mockOrchestrator = require('../../lib/services/bookingPaymentOrchestrator').bookingPaymentOrchestrator;
      
      const mockWorkflow = { bookingId: 'booking-123' };
      mockOrchestrator.getWorkflowStatus.mockReturnValue(mockWorkflow);

      const { result } = renderHook(() => useBookingPayment());

      const status = result.current.actions.getWorkflowStatus('booking-123');

      expect(status).toEqual(mockWorkflow);
      expect(mockOrchestrator.getWorkflowStatus).toHaveBeenCalledWith('booking-123');
    });

    test('should clear state', () => {
      const { result } = renderHook(() => useBookingPayment());

      // Set some state first
      act(() => {
        result.current.state.error = 'Test error';
        result.current.state.success = true;
      });

      // Clear state
      act(() => {
        result.current.actions.clearState();
      });

      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.currentWorkflow).toBeNull();
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.success).toBe(false);
    });
  });

  describe('Loading States', () => {
    test('should manage loading state during booking', async () => {
      const mockOrchestrator = require('../../lib/services/bookingPaymentOrchestrator').bookingPaymentOrchestrator;
      
      // Make the promise resolve after we can check loading state
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockOrchestrator.startBookingWorkflow.mockReturnValue(mockPromise);

      const { result } = renderHook(() => useBookingPayment());

      // Start booking (but don't await yet)
      act(() => {
        result.current.actions.startBooking(mockBookingRequest, mockCoachAddress);
      });

      // Check loading state
      expect(result.current.state.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          success: true,
          workflow: {
            bookingId: 'booking-123',
            transactions: [],
          },
        });
      });

      // Check loading state is false
      expect(result.current.state.isLoading).toBe(false);
    });
  });
});
