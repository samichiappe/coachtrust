/**
 * Payment Dashboard Page
 * 
 * Central dashboard for managing payments and sessions
 */

'use client';

import { useState } from 'react';
import { useXamanWallet } from '@/lib/hooks/useXamanWallet';
import { PaymentSessionManager } from '@/components/PaymentSessionManager';
import { PaymentHistory } from '@/components/PaymentHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XamanConnectButton } from '@/components/XamanConnectButton';

export default function PaymentDashboardPage() {
  const { isConnected, address } = useXamanWallet();
  const [userType, setUserType] = useState<'client' | 'coach'>('client');

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Dashboard</h1>
            <p className="text-gray-600 mb-8">
              Connect your Xaman wallet to view and manage your payment sessions.
            </p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Connect Your Wallet</CardTitle>
              <CardDescription className="text-center">
                Access your payment history and manage escrow sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <XamanConnectButton />
              <div className="mt-4 text-sm text-gray-500">
                🔒 Your wallet keys never leave your device
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">🔒</div>
                <h3 className="font-semibold mb-2">Secure Escrow</h3>
                <p className="text-sm text-gray-600">
                  Your payments are protected with XRPL escrow smart contracts
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-semibold mb-2">Fast Transactions</h3>
                <p className="text-sm text-gray-600">
                  XRP Ledger provides fast and low-cost transactions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-semibold mb-2">Complete History</h3>
                <p className="text-sm text-gray-600">
                  Track all your payments and session details
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Dashboard</h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Manage your coaching sessions and payments
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Connected as:</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {address?.slice(0, 8)}...{address?.slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* User Type Selector */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">View as:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setUserType('client')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    userType === 'client'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Client
                </button>
                <button
                  onClick={() => setUserType('coach')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    userType === 'coach'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Coach
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>          <TabsContent value="sessions" className="space-y-6">            <PaymentSessionManager 
              userType={userType}
              userAddress={address || undefined}
            />
          </TabsContent>          <TabsContent value="history" className="space-y-6">
            <PaymentHistory 
              userAddress={address || undefined}
              limit={100}
            />
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Active Sessions</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">0.00</div>
              <div className="text-sm text-gray-600">Total Volume (XRP)</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">0</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
