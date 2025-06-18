'use client';

import { useState } from 'react';
import { useXamanWallet } from '@/lib/hooks/useXamanWallet';
import { PaymentResult } from '@/lib/xrpl/payment';

export interface Coach {
  id: string;
  name: string;
  hourlyRate: number;
  walletAddress: string;
}

interface PaymentComponentProps {
  coach: Coach;
  sessionDateTime: Date;
  duration: number; // in minutes
  amount: number;
  onPaymentComplete?: (result: PaymentResult) => void;
}

export default function PaymentComponent({
  coach,
  sessionDateTime,
  duration,
  amount,
  onPaymentComplete
}: PaymentComponentProps) {
  const { isConnected, address, signTransaction } = useXamanWallet();
  const [paymentType, setPaymentType] = useState<'direct' | 'escrow'>('escrow');
  const [memo, setMemo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const formatSessionTime = () => {
    return sessionDateTime.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = () => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  const handlePayment = async () => {
    if (!isConnected || !address) {
      alert('Please connect your Xaman wallet first');
      return;
    }

    setIsProcessing(true);
    try {
      // TODO: Implement proper payment through Xaman signature flow
      // This needs to use the signTransaction method with proper XRPL transaction JSON
      
      const errorResult: PaymentResult = {
        success: false,
        paymentType: paymentType as 'direct' | 'escrow',
        amount: amount.toString(),
        error: 'Payment functionality requires proper Xaman integration - feature coming soon'
      };
      setPaymentResult(errorResult);
      onPaymentComplete?.(errorResult);
      
      /*
      const paymentMemo = memo || `Coaching session with ${coach.name}`;
      
      // This would need to be implemented with proper XRPL transaction creation
      const txJson = {
        TransactionType: 'Payment',
        Destination: coach.walletAddress,
        Amount: (amount * 1000000).toString(), // Convert XRP to drops
        Memos: [{
          Memo: {
            MemoType: Buffer.from('coaching-payment', 'utf8').toString('hex'),
            MemoData: Buffer.from(paymentMemo, 'utf8').toString('hex')
          }
        }]
      };

      const result = await signTransaction(txJson);

      const paymentResult: PaymentResult = {
        success: result.success,
        paymentType: paymentType as 'direct' | 'escrow',
        amount: amount.toString(),
        txHash: result.txHash,
        error: result.error
      };

      setPaymentResult(paymentResult);
      onPaymentComplete?.(paymentResult);
      */
    } catch (error) {
      const errorResult: PaymentResult = {
        success: false,
        paymentType: paymentType as 'direct' | 'escrow',
        amount: amount.toString(),
        error: error instanceof Error ? error.message : 'Payment failed'
      };
      setPaymentResult(errorResult);
      onPaymentComplete?.(errorResult);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Payment Details</h2>
        <p className="text-blue-100">Secure XRPL Payment</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Session Information */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Coach:</span>
            <span className="font-semibold">{coach.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Date & Time:</span>
            <span className="font-semibold text-sm">{formatSessionTime()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Duration:</span>
            <span className="font-semibold">{formatDuration()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Rate:</span>
            <span className="font-semibold">{coach.hourlyRate} XRP/hour</span>
          </div>
          <div className="flex justify-between items-center text-lg border-t pt-3">
            <span className="text-gray-800 font-semibold">Total Amount:</span>
            <span className="font-bold text-blue-600">{amount} XRP</span>
          </div>
        </div>

        {/* Payment Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Payment Method
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentType"
                value="escrow"
                checked={paymentType === 'escrow'}
                onChange={(e) => setPaymentType(e.target.value as 'escrow')}
                className="text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Secure Escrow (Recommended)</div>
                <div className="text-sm text-gray-500">
                  Payment held in escrow and released after session completion
                </div>
              </div>
              <div className="text-green-600 font-semibold">🔒 Safe</div>
            </label>

            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentType"
                value="direct"
                checked={paymentType === 'direct'}
                onChange={(e) => setPaymentType(e.target.value as 'direct')}
                className="text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Direct Payment</div>
                <div className="text-sm text-gray-500">
                  Immediate transfer to coach (no refund protection)
                </div>
              </div>
              <div className="text-yellow-600 font-semibold">⚡ Instant</div>
            </label>
          </div>
        </div>

        {/* Payment Type Description */}
        {paymentType === 'escrow' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">How Escrow Works:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your payment is secured in an XRPL escrow</li>
              <li>• Funds are released to the coach after session completion</li>
              <li>• Automatic release 24 hours after session end</li>
              <li>• 7-day dispute window for cancellations</li>
            </ul>
          </div>
        )}

        {paymentType === 'direct' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Direct Payment Notice:</h4>
            <p className="text-sm text-yellow-700">
              Direct payments are sent immediately to the coach with no automatic refund protection.
              Only use this option if you fully trust the coach.
            </p>
          </div>
        )}

        {/* Memo Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Payment Memo (Optional)
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={`Coaching session with ${coach.name}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            maxLength={200}
          />
          <p className="text-xs text-gray-500">{memo.length}/200 characters</p>
        </div>

        {/* Wallet Connection Status */}
        {!isConnected && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">
              Please connect your Xaman wallet to proceed with payment.
            </p>
          </div>
        )}

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={!isConnected || isProcessing}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
            isProcessing || !isConnected
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing Payment...</span>
            </div>
          ) : !isConnected ? (
            'Connect Wallet First'
          ) : (
            `Pay ${amount} XRP ${paymentType === 'escrow' ? '(Escrow)' : '(Direct)'}`
          )}
        </button>

        {/* Payment Result */}
        {paymentResult && (
          <div className={`rounded-lg p-4 ${
            paymentResult.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {paymentResult.success ? (
              <div className="space-y-2">
                <h4 className="font-semibold text-green-800">✅ Payment Successful!</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Transaction Hash:</strong></p>
                  <p className="font-mono text-xs break-all bg-green-100 p-2 rounded">
                    {paymentResult.txHash}
                  </p>
                  {paymentResult.paymentType === 'escrow' && paymentResult.escrowDetails && (
                    <div className="mt-3 space-y-1">
                      <p><strong>Escrow Details:</strong></p>
                      <p>Sequence: {paymentResult.escrowDetails.sequence}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h4 className="font-semibold text-red-800">❌ Payment Failed</h4>
                <p className="text-sm text-red-700 mt-1">{paymentResult.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Security Notice */}
        <div className="text-xs text-gray-500 border-t pt-4">
          🔒 All payments are processed securely through the XRP Ledger blockchain.
          Your wallet private keys never leave your device.
        </div>
      </div>
    </div>
  );
}
