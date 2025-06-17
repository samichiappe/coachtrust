import { useState, useEffect, useCallback } from 'react';

interface XamanTransactionStatus {
  payloadUuid: string;
  status: 'waiting' | 'signed' | 'rejected' | 'expired' | 'error';
  txHash?: string;
  qrCode?: string;
  deepLink?: string;
  error?: string;
}

interface UseXamanTransactionStatusResult {
  status: XamanTransactionStatus | null;
  isLoading: boolean;
  error: string | null;
  checkStatus: () => Promise<void>;
  getQRCode: () => Promise<void>;
}

export function useXamanTransactionStatus(payloadUuid?: string): UseXamanTransactionStatusResult {
  const [status, setStatus] = useState<XamanTransactionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!payloadUuid) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Checking Xaman payload status:', payloadUuid);

      const response = await fetch(`/api/xaman/payload-status?payloadUuid=${payloadUuid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStatus({
          payloadUuid,
          status: data.payload.meta.signed ? 'signed' : 
                  data.payload.meta.expired ? 'expired' :
                  data.payload.meta.cancelled ? 'rejected' : 'waiting',
          txHash: data.payload.response?.txid,
          error: data.payload.meta.cancelled ? 'Transaction was cancelled by user' : undefined
        });
      } else {
        throw new Error(data.error || 'Failed to get payload status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error checking status';
      console.error('❌ Error checking Xaman payload status:', errorMessage);
      setError(errorMessage);
      setStatus(prev => prev ? { ...prev, status: 'error', error: errorMessage } : null);
    } finally {
      setIsLoading(false);
    }
  }, [payloadUuid]);

  const getQRCode = useCallback(async () => {
    if (!payloadUuid) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Getting Xaman QR code for payload:', payloadUuid);

      const response = await fetch(`/api/xaman/payload-qr?payloadUuid=${payloadUuid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStatus(prev => prev ? {
          ...prev,
          qrCode: data.qrCode,
          deepLink: data.deepLink
        } : {
          payloadUuid,
          status: 'waiting',
          qrCode: data.qrCode,
          deepLink: data.deepLink
        });
      } else {
        throw new Error(data.error || 'Failed to get QR code');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error getting QR code';
      console.error('❌ Error getting Xaman QR code:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [payloadUuid]);

  // Auto-check status when payloadUuid changes
  useEffect(() => {
    if (payloadUuid) {
      checkStatus();
      getQRCode();
    }
  }, [payloadUuid, checkStatus, getQRCode]);

  // Poll for status updates every 5 seconds when waiting
  useEffect(() => {
    if (!payloadUuid || !status || status.status !== 'waiting') return;

    const interval = setInterval(() => {
      checkStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [payloadUuid, status?.status, checkStatus]);

  return {
    status,
    isLoading,
    error,
    checkStatus,
    getQRCode
  };
}
