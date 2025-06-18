/**
 * Booking Payment Integration Test Component
 * Complete UI for testing the booking + payment workflow
 * Based on xrpl-playground patterns for XRPL integration
 */

'use client';

import React, { useState } from 'react';
import { useBookingPayment } from '../lib/hooks/useBookingPayment';
import { useXamanWallet } from '../lib/hooks/useXamanWallet';
import { BookingRequest } from '../lib/types';

export function BookingPaymentIntegrationTest() {
  const { userAddress, isConnected } = useXamanWallet();
  const { state, actions } = useBookingPayment();
  
  const [formData, setFormData] = useState({
    coachId: 'coach-1',
    coachAddress: 'rCoach987654321',
    sessionDate: '2024-02-15',
    sessionTime: '10:00',
    duration: 60,
    court: 'Court A',
    amount: '30.0',
    paymentType: 'escrow' as 'escrow' | 'direct',
    memo: 'Tennis lesson integration test',
  });

  const [fulfillmentInput, setFulfillmentInput] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  const createBookingRequest = (): BookingRequest => {
    const sessionDateTime = new Date(`${formData.sessionDate}T${formData.sessionTime}:00Z`);
    
    return {
      coachId: formData.coachId,
      sessionDateTime,
      duration: formData.duration,
      court: formData.court,
      amount: formData.amount,
      paymentType: formData.paymentType,
      memo: formData.memo,
    };
  };

  const handleStartBooking = async () => {
    const bookingRequest = createBookingRequest();
    const result = await actions.startBooking(bookingRequest, formData.coachAddress);
    
    if (result.success) {
      console.log('✅ Booking started successfully:', result);
    } else {
      console.error('❌ Booking failed:', result.error);
    }
  };

  const handleFinalizeSession = async () => {
    if (!state.currentWorkflow) {
      alert('No active workflow to finalize');
      return;
    }

    if (!fulfillmentInput.trim()) {
      alert('Please enter fulfillment data');
      return;
    }

    const result = await actions.finalizeSession(
      state.currentWorkflow.bookingId,
      fulfillmentInput.trim()
    );
    
    if (result.success) {
      console.log('✅ Session finalized successfully:', result);
      setFulfillmentInput('');
    } else {
      console.error('❌ Session finalization failed:', result.error);
    }
  };

  const handleCancelBooking = async () => {
    if (!state.currentWorkflow) {
      alert('No active workflow to cancel');
      return;
    }

    const result = await actions.cancelBooking(
      state.currentWorkflow.bookingId,
      cancellationReason || 'Integration test cancellation'
    );
    
    if (result.success) {
      console.log('✅ Booking cancelled successfully:', result);
      setCancellationReason('');
    } else {
      console.error('❌ Booking cancellation failed:', result.error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  const getStepColor = (step: string) => {
    switch (step) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      case 'refunded': return 'text-blue-600 bg-blue-50';
      case 'session_scheduled': return 'text-purple-600 bg-purple-50';
      case 'escrow_pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          📋 Booking Payment Integration Test
        </h2>
        
        {/* Connection Status */}
        <div className="mb-6 p-4 rounded-lg bg-blue-50">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="font-medium">
              {isConnected ? `Connected: ${userAddress}` : 'Wallet not connected'}
            </span>
          </div>
        </div>

        {/* Booking Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coach ID
            </label>
            <input
              type="text"
              value={formData.coachId}
              onChange={(e) => setFormData(prev => ({ ...prev, coachId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coach Address
            </label>
            <input
              type="text"
              value={formData.coachAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, coachAddress: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Date
            </label>
            <input
              type="date"
              value={formData.sessionDate}
              onChange={(e) => setFormData(prev => ({ ...prev, sessionDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Time
            </label>
            <input
              type="time"
              value={formData.sessionTime}
              onChange={(e) => setFormData(prev => ({ ...prev, sessionTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Court
            </label>
            <input
              type="text"
              value={formData.court}
              onChange={(e) => setFormData(prev => ({ ...prev, court: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (XRP)
            </label>
            <input
              type="text"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Type
            </label>
            <select
              value={formData.paymentType}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value as 'escrow' | 'direct' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="escrow">Escrow (Recommended)</option>
              <option value="direct">Direct Payment</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleStartBooking}
            disabled={!isConnected || state.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isLoading ? '⏳ Processing...' : '🚀 Start Booking'}
          </button>

          <button
            onClick={actions.clearState}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            🧹 Clear State
          </button>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">❌</span>
              <span className="text-red-800 font-medium">Error:</span>
            </div>
            <p className="text-red-700 mt-1">{state.error}</p>
          </div>
        )}

        {/* Success Display */}
        {state.success && !state.error && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-green-800 font-medium">Success!</span>
            </div>
          </div>
        )}

        {/* Current Workflow Display */}
        {state.currentWorkflow && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Current Workflow</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-sm text-gray-600">Booking ID:</span>
                <p className="font-mono text-sm break-all">{state.currentWorkflow.bookingId}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Session ID:</span>
                <p className="font-mono text-sm break-all">{state.currentWorkflow.sessionId}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Current Step:</span>
                <p className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getStepColor(state.currentWorkflow.currentStep)}`}>
                  {state.currentWorkflow.currentStep}
                </p>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Transactions:</span>
                <p className="font-medium">{state.currentWorkflow.transactions.length}</p>
              </div>
            </div>

            {/* Escrow Details */}
            {state.currentWorkflow.escrow && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">🔒 Escrow Details</h4>
                <div className="text-sm space-y-1">
                  <div><span className="text-blue-600">Sequence:</span> {state.currentWorkflow.escrow.sequence}</div>
                  <div><span className="text-blue-600">Condition:</span> <span className="font-mono break-all">{state.currentWorkflow.escrow.condition}</span></div>
                  <div><span className="text-blue-600">Status:</span> {state.currentWorkflow.escrow.status}</div>
                </div>
              </div>
            )}

            {/* Session Management Actions */}
            {state.currentWorkflow.currentStep === 'session_scheduled' && state.currentWorkflow.escrow && (
              <div className="mb-4 p-3 bg-purple-50 rounded-md">
                <h4 className="font-medium text-purple-800 mb-3">🏁 Session Management</h4>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-purple-700 mb-1">
                    Fulfillment Data (for escrow finalization)
                  </label>
                  <input
                    type="text"
                    value={fulfillmentInput}
                    onChange={(e) => setFulfillmentInput(e.target.value)}
                    placeholder="Enter fulfillment hex string..."
                    className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <button
                  onClick={handleFinalizeSession}
                  disabled={state.isLoading || !fulfillmentInput.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed mr-3"
                >
                  ✅ Finalize Session
                </button>
                
                <div className="mt-3">
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    Cancellation Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Reason for cancellation..."
                    className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-2"
                  />
                  <button
                    onClick={handleCancelBooking}
                    disabled={state.isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ❌ Cancel Booking
                  </button>
                </div>
              </div>
            )}

            {/* Transaction History */}
            {state.currentWorkflow.transactions.length > 0 && (
              <div className="p-3 bg-gray-100 rounded-md">
                <h4 className="font-medium text-gray-800 mb-2">📜 Transaction History</h4>
                <div className="space-y-2">
                  {state.currentWorkflow.transactions.map((tx, index) => (
                    <div key={index} className="text-sm bg-white p-2 rounded border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800">{tx.type}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          tx.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      {tx.txHash && <div className="text-gray-600 font-mono break-all">TxHash: {tx.txHash}</div>}
                      <div className="text-gray-500">{formatDate(tx.timestamp)}</div>
                      {tx.memo && <div className="text-gray-600 italic">{tx.memo}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
