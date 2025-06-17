/**
 * Integration Tests - Coach Booking Page Integration
 * Tests the complete integration between coach page UI and booking-payment system
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

describe('Coach Booking Page Integration Tests', () => {
  const mockCoachData = {
    id: 1,
    name: "Marc Dubois",
    sport: "Padel",
    xrplAddress: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
    hourlyRate: 25,
    availability: {
      "2025-06-17": ["09:00", "10:30", "14:00", "16:30", "18:00"],
      "2025-06-18": ["08:00", "11:00", "15:00", "17:30", "19:00"],
    }
  };

  const mockUserAddress = 'rUser123456789';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock wallet connected by default
    const mockUseXamanWallet = require('../../lib/hooks/useXamanWallet').useXamanWallet;
    mockUseXamanWallet.mockReturnValue({
      userAddress: mockUserAddress,
      isConnected: true,
      address: mockUserAddress,
    });
  });

  describe('Booking Workflow Integration', () => {
    test('should create valid booking request from coach page selections', async () => {
      const mockOrchestrator = require('../../lib/services/bookingPaymentOrchestrator').bookingPaymentOrchestrator;
      
      const mockWorkflow = {
        bookingId: 'booking-123',
        sessionId: 'session-456',
        currentStep: 'session_scheduled',
        booking: {} as BookingRequest,
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

      // Simulate coach page booking creation
      const selectedDate = new Date('2025-06-17T09:00:00Z');
      const selectedTime = '09:00';
      const selectedCourt = 'Padel Club Paris';
      const sessionDuration = 60;

      const bookingRequest: BookingRequest = {
        coachId: mockCoachData.id.toString(),
        sessionDateTime: selectedDate,
        duration: sessionDuration,
        court: selectedCourt,
        amount: (mockCoachData.hourlyRate * sessionDuration / 60).toString(),
        paymentType: 'escrow',
        memo: `Cours de ${mockCoachData.sport} avec ${mockCoachData.name} - 2025-06-17 ${selectedTime}`
      };

      // Test booking workflow
      let bookingResult;
      await act(async () => {
        bookingResult = await result.current.actions.startBooking(
          bookingRequest,
          mockCoachData.xrplAddress
        );
      });

      // Verify booking was successful
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

      // Verify orchestrator was called with correct parameters
      expect(mockOrchestrator.startBookingWorkflow).toHaveBeenCalledWith(
        bookingRequest,
        mockUserAddress,
        mockCoachData.xrplAddress
      );

      // Verify state updates
      expect(result.current.state.success).toBe(true);
      expect(result.current.state.currentWorkflow).toEqual(mockWorkflow);
      expect(result.current.state.error).toBeNull();
    });

    test('should handle coach availability validation', () => {
      const selectedDate = '2025-06-17';
      const availableSlots = mockCoachData.availability[selectedDate];

      expect(availableSlots).toBeDefined();
      expect(availableSlots).toContain('09:00');
      expect(availableSlots).toContain('14:00');
      expect(availableSlots).toHaveLength(5);
    });

    test('should calculate session amount correctly', () => {
      const sessionDuration = 60; // 1 hour
      const hourlyRate = mockCoachData.hourlyRate;
      const expectedAmount = (hourlyRate * sessionDuration / 60).toString();

      expect(expectedAmount).toBe('25');

      // Test for 90 minutes
      const sessionDuration90 = 90;
      const expectedAmount90 = (hourlyRate * sessionDuration90 / 60).toString();
      expect(expectedAmount90).toBe('37.5');
    });

    test('should validate required fields before booking', async () => {
      const { result } = renderHook(() => useBookingPayment());

      // Test incomplete booking request
      const incompleteBookingRequest: BookingRequest = {
        coachId: '',
        sessionDateTime: new Date(),
        duration: 0,
        court: '',
        amount: '0',
        paymentType: 'escrow',
      };

      const mockOrchestrator = require('../../lib/services/bookingPaymentOrchestrator').bookingPaymentOrchestrator;
      mockOrchestrator.startBookingWorkflow.mockResolvedValue({
        success: false,
        workflow: {
          currentStep: 'cancelled',
          error: 'Coach ID is required',
        },
        error: 'Coach ID is required',
      });

      let bookingResult;
      await act(async () => {
        bookingResult = await result.current.actions.startBooking(
          incompleteBookingRequest,
          mockCoachData.xrplAddress
        );
      });

      expect(bookingResult).toEqual({
        success: false,
        error: 'Coach ID is required',
      });

      expect(result.current.state.error).toBe('Coach ID is required');
    });
  });

  describe('UI State Management', () => {
    test('should manage loading states during booking process', async () => {
      const mockOrchestrator = require('../../lib/services/bookingPaymentOrchestrator').bookingPaymentOrchestrator;
      
      // Create a promise that we can control
      let resolveBooking: (value: any) => void;
      const bookingPromise = new Promise((resolve) => {
        resolveBooking = resolve;
      });

      mockOrchestrator.startBookingWorkflow.mockReturnValue(bookingPromise);

      const { result } = renderHook(() => useBookingPayment());

      const validBookingRequest: BookingRequest = {
        coachId: mockCoachData.id.toString(),
        sessionDateTime: new Date('2025-06-17T09:00:00Z'),
        duration: 60,
        court: 'Padel Club Paris',
        amount: '25',
        paymentType: 'escrow',
        memo: 'Test booking'
      };

      // Start booking (don't await yet)
      act(() => {
        result.current.actions.startBooking(validBookingRequest, mockCoachData.xrplAddress);
      });

      // Check loading state
      expect(result.current.state.isLoading).toBe(true);
      expect(result.current.state.error).toBeNull();

      // Resolve the booking
      await act(async () => {
        resolveBooking!({
          success: true,
          workflow: {
            bookingId: 'booking-123',
            sessionId: 'session-456',
            currentStep: 'session_scheduled',
          },
        });
      });

      // Check final state
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.success).toBe(true);
    });

    test('should clear state and reset form', () => {
      const { result } = renderHook(() => useBookingPayment());

      // Set some state
      act(() => {
        result.current.state.error = 'Test error';
        result.current.state.success = true;
      });

      // Clear state
      act(() => {
        result.current.actions.clearState();
      });

      expect(result.current.state.error).toBeNull();
      expect(result.current.state.success).toBe(false);
      expect(result.current.state.currentWorkflow).toBeNull();
    });
  });

  describe('Coach Data Validation', () => {
    test('should have valid coach data structure', () => {
      expect(mockCoachData.id).toBeDefined();
      expect(mockCoachData.name).toBeDefined();
      expect(mockCoachData.xrplAddress).toMatch(/^r[A-Za-z0-9]{24,34}$/);
      expect(mockCoachData.hourlyRate).toBeGreaterThan(0);
      expect(mockCoachData.availability).toBeDefined();
    });

    test('should have availability data for current week', () => {
      const currentDate = new Date();
      const dateKeys = Object.keys(mockCoachData.availability);
      
      expect(dateKeys.length).toBeGreaterThan(0);
      
      // Check that availability slots are valid time formats
      dateKeys.forEach(dateKey => {
        const slots = mockCoachData.availability[dateKey];
        expect(Array.isArray(slots)).toBe(true);
        
        slots.forEach(slot => {
          expect(slot).toMatch(/^\d{2}:\d{2}$/);
        });
      });
    });
  });
});
