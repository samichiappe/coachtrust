/**
 * Payment Session Management Component
 * 
 * Displays payment history, session status, and allows completion/cancellation of escrow sessions
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useXamanWallet } from '@/lib/hooks/useXamanWallet';
import { paymentService, SessionPaymentStatus } from '@/lib/xrpl/payment';
import { escrowService, EscrowSession } from '@/lib/xrpl/escrow';

interface PaymentSessionManagerProps {
  userType: 'client' | 'coach';
  userAddress?: string;
}

export function PaymentSessionManager({ userType, userAddress }: PaymentSessionManagerProps) {
  const { address, isConnected } = useXamanWallet();
  const [sessions, setSessions] = useState<EscrowSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingSession, setProcessingSession] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);  useEffect(() => {
    loadSessions();
  }, [address, userAddress]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);      if (!address && !userAddress) {
        setSessions([]);
        return;
      }

      const walletAddress = address || userAddress || '';
      
      // Get sessions from escrow service - temporarily return empty array until method is implemented
      const escrowSessions: EscrowSession[] = [];
      
      setSessions(escrowSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError('Failed to load payment sessions');
    } finally {
      setLoading(false);
    }
  };  const handleCompleteSession = async (session: EscrowSession) => {
    if (!address || !session.escrowSequence || !session.condition || !session.fulfillment) {
      setError('Missing wallet or escrow details for completion');
      return;
    }

    setProcessingSession(session.sessionId);
    setError(null);    try {
      // TODO: Implement proper escrow completion through Xaman signature
      // This requires wallet signing capability which needs to be handled through the Xaman flow
      setError('Escrow completion requires Xaman wallet signing - feature coming soon');
      
      /*
      const result = await escrowService.completeSessionEscrow(
        session.clientAddress,
        session.coachAddress,
        session.escrowSequence,
        session.condition,
        session.fulfillment,
        walletObject // This needs to be a proper Wallet object from Xaman
      );

      if (result.success) {
        setSessions(prev => 
          prev.map(s => 
            s.sessionId === session.sessionId 
              ? { ...s, status: 'completed' }
              : s
          )
        );
        alert('Session completed successfully!');
      } else {
        setError(result.error || 'Failed to complete session');
      }
      */
    } catch (error) {
      console.error('Error completing session:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setProcessingSession(null);
    }
  };  const handleCancelSession = async (session: EscrowSession) => {
    if (!address || !session.escrowSequence) {
      setError('Missing wallet or escrow details for cancellation');
      return;
    }

    if (!confirm('Are you sure you want to cancel this session? This will refund the client.')) {
      return;
    }

    setProcessingSession(session.sessionId);
    setError(null);    try {
      // TODO: Implement proper escrow cancellation through Xaman signature
      // This requires wallet signing capability which needs to be handled through the Xaman flow
      setError('Escrow cancellation requires Xaman wallet signing - feature coming soon');
      
      /*
      const result = await escrowService.cancelSessionEscrow(
        session.clientAddress,
        session.escrowSequence,
        walletObject // This needs to be a proper Wallet object from Xaman
      );

      if (result.success) {
        setSessions(prev => 
          prev.map(s => 
            s.sessionId === session.sessionId 
              ? { ...s, status: 'cancelled' }
              : s
          )
        );
        alert('Session cancelled successfully!');
      } else {
        setError(result.error || 'Failed to cancel session');
      }
      */
    } catch (error) {
      console.error('Error cancelling session:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setProcessingSession(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'active':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'disputed':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const canCompleteSession = (session: EscrowSession) => {
    if (session.status !== 'pending') return false;
    
    const sessionEnd = new Date(session.sessionDateTime);
    sessionEnd.setMinutes(sessionEnd.getMinutes() + session.duration);
    
    return new Date() > sessionEnd;
  };

  const canCancelSession = (session: EscrowSession) => {
    if (session.status !== 'pending') return false;
    
    // Can cancel 7 days after session creation (dispute window)
    const cancelAfter = new Date();
    cancelAfter.setDate(cancelAfter.getDate() + 7);
    
    return new Date() > cancelAfter;
  };
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Payment Sessions ({userType === 'client' ? 'Your Bookings' : 'Your Coaching Sessions'})
        </h2>
        <button
          onClick={loadSessions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-700">
            Please connect your Xaman wallet to view and manage your payment sessions.
          </p>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Payment Sessions Found</h3>
          <p className="text-gray-500">
            {userType === 'client' 
              ? "You haven't booked any coaching sessions yet."
              : "You don't have any active coaching sessions."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.sessionId}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      Session #{session.sessionId.slice(-8)}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Date & Time:</span>
                      <p>{formatDate(session.sessionDateTime)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>
                      <p>{formatDuration(session.duration)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span>
                      <p className="font-semibold text-blue-600">{session.amount} XRP</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Client:</span>
                      <p className="font-mono text-xs">{session.clientAddress}</p>
                    </div>
                    <div>
                      <span className="font-medium">Coach:</span>
                      <p className="font-mono text-xs">{session.coachAddress}</p>
                    </div>
                  </div>

                  {session.txHash && (
                    <div className="mt-3 text-sm text-gray-600">
                      <span className="font-medium">Transaction Hash:</span>
                      <p className="font-mono text-xs break-all bg-gray-50 p-2 rounded mt-1">
                        {session.txHash}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {session.status === 'pending' && isConnected && (
                <div className="flex space-x-3 mt-4 pt-4 border-t">
                  {(userType === 'coach' && canCompleteSession(session)) && (
                    <button
                      onClick={() => handleCompleteSession(session)}
                      disabled={processingSession === session.sessionId}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {processingSession === session.sessionId ? 'Processing...' : 'Complete Session'}
                    </button>
                  )}
                  
                  {canCancelSession(session) && (
                    <button
                      onClick={() => handleCancelSession(session)}
                      disabled={processingSession === session.sessionId}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {processingSession === session.sessionId ? 'Processing...' : 'Cancel Session'}
                    </button>
                  )}
                  
                  {!canCompleteSession(session) && userType === 'coach' && (
                    <div className="text-sm text-gray-500 py-2">
                      Session can be completed after {formatDate(new Date(session.sessionDateTime.getTime() + session.duration * 60000))}
                    </div>
                  )}
                </div>
              )}
              
              {session.status === 'pending' && (
                <div className="mt-4 pt-4 border-t bg-blue-50 rounded-lg p-3">
                  <h4 className="font-medium text-blue-800 mb-2">🔒 Escrow Protection Active</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Payment is secured in XRPL escrow</li>
                    <li>• Funds will be released to coach after session completion</li>
                    <li>• Automatic release 24 hours after session end if not disputed</li>
                    <li>• 7-day dispute window for cancellations</li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
