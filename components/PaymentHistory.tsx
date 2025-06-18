/**
 * Payment History Component
 * 
 * Displays transaction history with filtering and search capabilities
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useXamanWallet } from '@/lib/hooks/useXamanWallet';
import { paymentService } from '@/lib/xrpl/payment';
import { escrowService, EscrowSession } from '@/lib/xrpl/escrow';

interface PaymentTransaction {
  id: string;
  type: 'direct' | 'escrow';
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  amount: string;
  fromAddress: string;
  toAddress: string;
  txHash?: string;
  sessionId?: string;
  timestamp: Date;
  memo?: string;
}

interface PaymentHistoryProps {
  userAddress?: string;
  limit?: number;
}

export function PaymentHistory({ userAddress, limit = 50 }: PaymentHistoryProps) {
  const { address, isConnected } = useXamanWallet();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'direct' | 'escrow'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactionHistory();
  }, [address, userAddress]);

  const loadTransactionHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const walletAddress = address || userAddress;
      if (!walletAddress) {
        setLoading(false);
        return;
      }

      // Load direct payments from XRPL
      // TODO: Implement getPaymentHistory method in payment service
      const directTransactions: PaymentTransaction[] = [];
      // const directTransactions = await paymentService.getPaymentHistory(walletAddress, limit);
      
      // Load escrow sessions      // TODO: Implement getUserSessions method in escrow service
      const escrowSessions: any[] = [];
      // const escrowSessions = escrowService.getUserSessions(walletAddress);

      // Convert escrow sessions to payment transactions
      const escrowTransactions: PaymentTransaction[] = escrowSessions.map((session: any) => ({
        id: session.sessionId,
        type: 'escrow' as const,
        status: session.status as any,
        amount: session.amount.toString(),
        fromAddress: session.clientAddress,
        toAddress: session.coachAddress,
        txHash: session.txHash,
        sessionId: session.sessionId,
        timestamp: session.sessionDateTime,
        memo: `Session: ${session.sessionId.slice(-8)}`
      }));

      // Combine and sort by timestamp
      const allTransactions = [...directTransactions, ...escrowTransactions]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

      setTransactions(allTransactions);
    } catch (err) {
      console.error('Error loading transaction history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on selected filters
  const filteredTransactions = transactions.filter(tx => {
    const matchesTypeFilter = filter === 'all' || tx.type === filter;
    const matchesStatusFilter = statusFilter === 'all' || tx.status === statusFilter;
    const matchesSearch = !searchTerm || 
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.txHash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.memo?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTypeFilter && matchesStatusFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'failed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'direct':
        return 'text-blue-600 bg-blue-100';
      case 'escrow':
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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTotalAmount = () => {
    return filteredTransactions
      .filter(tx => tx.status === 'completed')
      .reduce((total, tx) => total + parseFloat(tx.amount), 0)
      .toFixed(2);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment History</h2>
        <button
          onClick={loadTransactionHistory}
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

      {!isConnected && !userAddress && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-700">
            Please connect your Xaman wallet to view your payment history.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600">Total Transactions</div>
          <div className="text-2xl font-bold text-gray-800">{filteredTransactions.length}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600">Completed Volume</div>
          <div className="text-2xl font-bold text-green-600">{getTotalAmount()} XRP</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {filteredTransactions.filter(tx => tx.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600">Escrow Protected</div>
          <div className="text-2xl font-bold text-purple-600">
            {filteredTransactions.filter(tx => tx.type === 'escrow').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="direct">Direct Payments</option>
              <option value="escrow">Escrow Payments</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by ID, hash, or memo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <button
              onClick={() => {
                setFilter('all');
                setStatusFilter('all');
                setSearchTerm('');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Transactions Found</h3>
          <p className="text-gray-500">
            {transactions.length === 0
              ? "You haven't made any payments yet."
              : "No transactions match your current filters."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{tx.id.slice(-8)}
                        </div>
                        {tx.txHash && (
                          <div className="text-xs text-gray-500 font-mono">
                            {formatAddress(tx.txHash)}
                          </div>
                        )}
                        {tx.memo && (
                          <div className="text-xs text-gray-400 mt-1">
                            {tx.memo}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(tx.type)}`}>
                        {tx.type === 'escrow' ? '🔒 Escrow' : '⚡ Direct'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-600">
                        {tx.amount} XRP
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium">From: {formatAddress(tx.fromAddress)}</div>
                        <div>To: {formatAddress(tx.toAddress)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(tx.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
