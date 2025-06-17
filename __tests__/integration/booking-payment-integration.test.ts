/**
 * Integration Tests - Booking + Payment Workflow
 * Tests the complete workflow: reservation → escrow → finalization
 * Based on xrpl-playground patterns
 */

import { bookingPaymentOrchestrator } from '../../lib/services/bookingPaymentOrchestrator';
import { BookingRequest } from '../../lib/types';

// Mock XRPL client and services
jest.mock('../../lib/services/escrowService', () => ({
  escrowService: {
    createEscrow: jest.fn(),
    finalizeEscrow: jest.fn(),
    cancelEscrow: jest.fn(),
  }
}));

jest.mock('../../lib/services/xrplPaymentService', () => ({
  xrplPaymentService: {
    createPayment: jest.fn(),
  }
}));

describe('Booking Payment Integration Tests', () => {
  const mockClientAddress = 'rClient123456789';
  const mockCoachAddress = 'rCoach987654321';
  
  const mockBookingRequest: BookingRequest = {
    coachId: 'coach-1',
    sessionDateTime: new Date('2024-02-15T10:00:00Z'),
    duration: 60, // 1 hour
    court: 'Court A',
    amount: '30.0', // 30 XRP
    paymentType: 'escrow',
    memo: 'Tennis lesson with coach 1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Escrow Workflow', () => {
    test('should complete full workflow: booking → escrow → finalization', async () => {
      // Mock escrow service responses
      const mockEscrowService = require('../../lib/services/escrowService').escrowService;
      
      mockEscrowService.createEscrow.mockResolvedValue({
        success: true,
        escrow: {
          sequence: 12345,
          condition: 'A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
          fulfillment: 'A0278020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100',
          fromAddress: mockClientAddress,
          toAddress: mockCoachAddress,
          amount: '30.0',
          releaseTime: new Date('2024-02-16T10:00:00Z'),
          status: 'pending',
          txHash: 'escrow_create_hash_123',
        },
        txHash: 'escrow_create_hash_123',
      });

      mockEscrowService.finalizeEscrow.mockResolvedValue({
        success: true,
        txHash: 'escrow_finish_hash_456',
      });

      // Step 1: Start booking workflow
      const workflowResult = await bookingPaymentOrchestrator.startBookingWorkflow(
        mockBookingRequest,
        mockClientAddress,
        mockCoachAddress
      );

      // Verify workflow started successfully
      expect(workflowResult.success).toBe(true);
      expect(workflowResult.workflow.currentStep).toBe('session_scheduled');
      expect(workflowResult.workflow.escrow).toBeDefined();
      expect(workflowResult.workflow.session).toBeDefined();
      expect(workflowResult.workflow.transactions).toHaveLength(1);
      expect(workflowResult.workflow.transactions[0].type).toBe('escrow_create');

      // Step 2: Finalize escrow after session
      const bookingId = workflowResult.workflow.bookingId;
      const fulfillment = 'A0278020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100';

      const finalizationResult = await bookingPaymentOrchestrator.finalizeSessionEscrow(
        bookingId,
        fulfillment
      );

      // Verify finalization succeeded
      expect(finalizationResult.success).toBe(true);
      expect(finalizationResult.workflow.currentStep).toBe('completed');
      expect(finalizationResult.workflow.transactions).toHaveLength(2);
      expect(finalizationResult.workflow.transactions[1].type).toBe('escrow_finish');

      // Verify escrow service was called correctly
      expect(mockEscrowService.createEscrow).toHaveBeenCalledWith(
        expect.objectContaining({
          fromAddress: mockClientAddress,
          toAddress: mockCoachAddress,
          amount: '30.0',
          memo: expect.stringContaining('Escrow for coaching session'),
        })
      );

      expect(mockEscrowService.finalizeEscrow).toHaveBeenCalledWith(
        12345, // sequence
        'A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855', // condition
        fulfillment,
        mockClientAddress,
        'coach-1'
      );
    });

    test('should handle escrow creation failure gracefully', async () => {
      // Mock escrow creation failure
      const mockEscrowService = require('../../lib/services/escrowService').escrowService;
      
      mockEscrowService.createEscrow.mockResolvedValue({
        success: false,
        error: 'Insufficient funds for escrow creation',
      });

      // Start booking workflow
      const workflowResult = await bookingPaymentOrchestrator.startBookingWorkflow(
        mockBookingRequest,
        mockClientAddress,
        mockCoachAddress
      );

      // Verify workflow failed with proper error handling
      expect(workflowResult.success).toBe(false);
      expect(workflowResult.workflow.currentStep).toBe('cancelled');
      expect(workflowResult.error).toContain('Insufficient funds');
      expect(workflowResult.workflow.transactions).toHaveLength(0);
    });
  });

  describe('Direct Payment Workflow', () => {
    test('should complete direct payment workflow', async () => {
      // Mock payment service response
      const mockPaymentService = require('../../lib/services/xrplPaymentService').xrplPaymentService;
      
      mockPaymentService.createPayment.mockResolvedValue({
        success: true,
        txHash: 'direct_payment_hash_789',
      });

      const directPaymentBooking: BookingRequest = {
        ...mockBookingRequest,
        paymentType: 'direct',
      };

      // Start direct payment workflow
      const workflowResult = await bookingPaymentOrchestrator.startBookingWorkflow(
        directPaymentBooking,
        mockClientAddress,
        mockCoachAddress
      );

      // Verify direct payment succeeded
      expect(workflowResult.success).toBe(true);
      expect(workflowResult.workflow.currentStep).toBe('session_scheduled');
      expect(workflowResult.workflow.escrow).toBeUndefined();
      expect(workflowResult.workflow.transactions).toHaveLength(1);
      expect(workflowResult.workflow.transactions[0].type).toBe('payment');
      expect(workflowResult.workflow.transactions[0].status).toBe('confirmed');

      // Verify payment service was called correctly
      expect(mockPaymentService.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          fromAddress: mockClientAddress,
          toAddress: mockCoachAddress,
          amount: '30.0',
          memo: expect.stringContaining('Direct payment for coaching session'),
        })
      );
    });
  });

  describe('Booking Cancellation', () => {
    test('should cancel escrow booking and process refund', async () => {
      // Setup successful escrow creation
      const mockEscrowService = require('../../lib/services/escrowService').escrowService;
      
      mockEscrowService.createEscrow.mockResolvedValue({
        success: true,
        escrow: {
          sequence: 12345,
          condition: 'A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
          fulfillment: 'A0278020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100',
          fromAddress: mockClientAddress,
          toAddress: mockCoachAddress,
          amount: '30.0',
          releaseTime: new Date('2024-02-16T10:00:00Z'),
          status: 'pending',
          txHash: 'escrow_create_hash_123',
        },
        txHash: 'escrow_create_hash_123',
      });

      mockEscrowService.cancelEscrow.mockResolvedValue({
        success: true,
        txHash: 'escrow_cancel_hash_999',
      });

      // Start workflow
      const workflowResult = await bookingPaymentOrchestrator.startBookingWorkflow(
        mockBookingRequest,
        mockClientAddress,
        mockCoachAddress
      );

      expect(workflowResult.success).toBe(true);

      // Cancel booking
      const bookingId = workflowResult.workflow.bookingId;
      const cancellationResult = await bookingPaymentOrchestrator.cancelBooking(
        bookingId,
        'User requested cancellation'
      );

      // Verify cancellation succeeded
      expect(cancellationResult.success).toBe(true);
      expect(cancellationResult.workflow.currentStep).toBe('refunded');
      expect(cancellationResult.workflow.transactions).toHaveLength(2);
      expect(cancellationResult.workflow.transactions[1].type).toBe('escrow_cancel');

      // Verify escrow cancellation was called
      expect(mockEscrowService.cancelEscrow).toHaveBeenCalledWith(
        12345, // sequence
        mockClientAddress,
        'coach-1'
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should validate booking request before processing', async () => {
      const invalidBookingRequest: BookingRequest = {
        coachId: '',
        sessionDateTime: new Date(),
        duration: 0,
        court: '',
        amount: '0',
        paymentType: 'escrow',
      };

      const workflowResult = await bookingPaymentOrchestrator.startBookingWorkflow(
        invalidBookingRequest,
        mockClientAddress,
        mockCoachAddress
      );

      expect(workflowResult.success).toBe(false);
      expect(workflowResult.error).toContain('Coach ID is required');
    });

    test('should handle workflow not found for finalization', async () => {
      const result = await bookingPaymentOrchestrator.finalizeSessionEscrow(
        'non-existent-booking-id',
        'fake-fulfillment'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Workflow not found');
    });

    test('should handle workflow not found for cancellation', async () => {
      const result = await bookingPaymentOrchestrator.cancelBooking(
        'non-existent-booking-id',
        'Test cancellation'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Workflow not found');
    });
  });

  describe('Workflow State Management', () => {
    test('should track workflow states correctly', async () => {
      const mockEscrowService = require('../../lib/services/escrowService').escrowService;
      
      mockEscrowService.createEscrow.mockResolvedValue({
        success: true,
        escrow: {
          sequence: 12345,
          condition: 'test-condition',
          fulfillment: 'test-fulfillment',
          fromAddress: mockClientAddress,
          toAddress: mockCoachAddress,
          amount: '30.0',
          releaseTime: new Date(),
          status: 'pending',
          txHash: 'test-hash',
        },
        txHash: 'test-hash',
      });

      // Start workflow
      const workflowResult = await bookingPaymentOrchestrator.startBookingWorkflow(
        mockBookingRequest,
        mockClientAddress,
        mockCoachAddress
      );

      const bookingId = workflowResult.workflow.bookingId;

      // Check workflow status
      const status = bookingPaymentOrchestrator.getWorkflowStatus(bookingId);
      expect(status).toBeDefined();
      expect(status!.bookingId).toBe(bookingId);
      expect(status!.currentStep).toBe('session_scheduled');

      // Check all workflows
      const allWorkflows = bookingPaymentOrchestrator.getAllWorkflows();
      expect(allWorkflows.length).toBeGreaterThan(0);
      expect(allWorkflows.some(w => w.bookingId === bookingId)).toBe(true);
    });
  });
});
