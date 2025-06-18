import { useState, useCallback } from 'react';
import { useXamanWallet } from './useXamanWallet';

interface SimpleBookingState {
  isLoading: boolean;
  success: boolean;
  error: string | null;
  xamanUuid: string | null;
  qrCode: string | null;
  deepLink: string | null;
  txHash: string | null;
  escrowData: any | null;
}

interface SimpleBookingResult {
  success: boolean;
  error?: string;
  xamanUuid?: string;
  qrCode?: string;
  deepLink?: string;
  txHash?: string;
}

export function useSimpleBookingPayment() {
  const { userAddress, isConnected } = useXamanWallet();
  
  const [state, setState] = useState<SimpleBookingState>({
    isLoading: false,
    success: false,
    error: null,
    xamanUuid: null,
    qrCode: null,
    deepLink: null,
    txHash: null,
    escrowData: null
  });

  const createEscrowBooking = useCallback(async (
    coachAddress: string,
    amountXRP: string,
    sessionDetails: string
  ): Promise<SimpleBookingResult> => {
    if (!isConnected || !userAddress) {
      const error = 'Please connect your Xaman wallet first';
      setState(prev => ({ ...prev, error }));
      return { success: false, error };
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      success: false 
    }));

    try {
      console.log('🚀 Creating escrow booking:', {
        client: userAddress,
        coach: coachAddress,
        amount: amountXRP + ' XRP',
        session: sessionDetails
      });

      // Call our simplified escrow API
      const response = await fetch('/api/escrow-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          ownerAddress: userAddress,
          destinationAddress: coachAddress,
          amountXRP
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Escrow created, waiting for Xaman signature:', result.uuid);
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          success: true,
          xamanUuid: result.uuid,
          qrCode: result.qr,
          deepLink: result.deepLink,
          escrowData: result.escrowData
        }));

        return {
          success: true,
          xamanUuid: result.uuid,
          qrCode: result.qr,
          deepLink: result.deepLink
        };
      } else {
        console.error('❌ Escrow creation failed:', result.error);
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to create escrow'
        }));

        return {
          success: false,
          error: result.error || 'Failed to create escrow'
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error creating escrow booking:', errorMessage);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      return {
        success: false,
        error: errorMessage
      };
    }
  }, [userAddress, isConnected]);

  const checkTransactionStatus = useCallback(async (uuid: string) => {
    if (!uuid) return;

    try {
      console.log('🔍 Checking Xaman transaction status:', uuid);

      const response = await fetch(`/api/xaman-simple?uuid=${uuid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          txHash: result.txHash || prev.txHash,
          success: result.signed || prev.success,
          error: result.cancelled ? 'Transaction cancelled by user' :
                  result.expired ? 'Transaction expired' : 
                  prev.error
        }));

        if (result.signed && result.txHash) {
          console.log('✅ Transaction signed successfully:', result.txHash);
          return { signed: true, txHash: result.txHash };
        }

        if (result.cancelled) {
          console.log('❌ Transaction cancelled by user');
          return { cancelled: true };
        }

        if (result.expired) {
          console.log('⏰ Transaction expired');
          return { expired: true };
        }

        return { waiting: true };
      } else {
        console.error('❌ Error checking status:', result.error);
        setState(prev => ({ ...prev, error: result.error }));
        return { error: result.error };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error checking transaction status:', errorMessage);
      setState(prev => ({ ...prev, error: errorMessage }));
      return { error: errorMessage };
    }
  }, []);

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      success: false,
      error: null,
      xamanUuid: null,
      qrCode: null,
      deepLink: null,
      txHash: null,
      escrowData: null
    });
  }, []);

  return {
    ...state,
    createEscrowBooking,
    checkTransactionStatus,
    resetState
  };
}
