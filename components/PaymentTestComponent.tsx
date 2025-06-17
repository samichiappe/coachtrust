// Payment Test Component - Phase 3.1 Validation
'use client'

import React, { useState } from 'react'
import { usePayment } from '@/lib/hooks/usePayment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Wallet, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export function PaymentTestComponent() {
  const {
    isLoading,
    error,
    currentTransaction,
    history,
    sendPayment,
    clearError
  } = usePayment()

  const [toAddress, setToAddress] = useState('rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH')
  const [amount, setAmount] = useState('1')
  const [memo, setMemo] = useState('Test payment from CoachTrust')

  const handleSendPayment = async () => {
    try {
      const result = await sendPayment({
        toAddress,
        amount,
        purpose: 'Test payment',
        memo
      })

      if (result.success) {
        console.log('Payment initiated successfully:', result)
      } else {
        console.error('Payment failed:', result.error)
      }
    } catch (error) {
      console.error('Payment error:', error)
    }
  }

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    if (error) return <AlertCircle className="w-4 h-4 text-red-500" />
    if (currentTransaction?.status.state === 'validated') return <CheckCircle className="w-4 h-4 text-green-500" />
    return <Wallet className="w-4 h-4 text-gray-500" />
  }

  const getStatusColor = () => {
    if (isLoading) return 'blue'
    if (error) return 'red' 
    if (currentTransaction?.status.state === 'validated') return 'green'
    return 'gray'
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Phase 3.1 - XRPL Payment Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Destination Address
              </label>
              <Input
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="rAddress..."
                className="font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Amount (XRP)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1.0"
                min="0.000001"
                step="0.000001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Memo (Optional)
              </label>
              <Input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Payment description..."
              />
            </div>

            <Button 
              onClick={handleSendPayment}
              disabled={isLoading || !toAddress || !amount}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Payment...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Payment
                </>
              )}
            </Button>
          </div>

          {/* Status Display */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Payment Status:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <Badge variant={getStatusColor() === 'green' ? 'default' : 'secondary'}>
                  {currentTransaction?.status.state || 'Ready'}
                </Badge>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center justify-between">
                  <p className="text-red-700 text-sm">{error}</p>
                  <Button 
                    onClick={clearError} 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 border-red-300"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {currentTransaction && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <code className="text-xs bg-gray-100 px-1 rounded">
                    {currentTransaction.id}
                  </code>
                </div>
                
                {currentTransaction.txid && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">XRPL Hash:</span>
                    <code className="text-xs bg-gray-100 px-1 rounded">
                      {currentTransaction.txid.slice(0, 8)}...{currentTransaction.txid.slice(-8)}
                    </code>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{currentTransaction.amount} XRP</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Status Message:</span>
                  <span className="text-sm">{currentTransaction.status.message}</span>
                </div>
              </div>
            )}

            {isLoading && !error && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-700 text-sm">
                  🔄 Payment request created. Please check your Xaman app to sign the transaction.
                </p>
              </div>
            )}
          </div>

          {/* Transaction History */}
          {history.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Recent Payments</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {history.slice(0, 3).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{tx.amount} XRP</span>
                      <span className="text-gray-500 ml-2">
                        to {tx.toAddress.slice(0, 8)}...{tx.toAddress.slice(-6)}
                      </span>
                    </div>
                    <Badge 
                      variant={tx.status.state === 'validated' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {tx.status.state}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">Phase 3.1 - Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>✅ XRPL Payment Structure:</strong> Following xrpl-playground patterns
          </div>
          <div>
            <strong>✅ Xaman Integration:</strong> Secure backend API for payload creation
          </div>
          <div>
            <strong>✅ Address Validation:</strong> XRP address format verification
          </div>
          <div>
            <strong>✅ Amount Conversion:</strong> XRP ↔ drops conversion
          </div>
          <div>
            <strong>✅ Transaction Polling:</strong> Real-time status updates
          </div>
          <div>
            <strong>✅ Error Handling:</strong> Comprehensive validation and error management
          </div>
          <div className="pt-2 border-t">
            <strong>Next:</strong> Phase 3.2 - Escrow System with crypto-conditions
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
