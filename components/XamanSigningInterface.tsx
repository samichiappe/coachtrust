import React from 'react';
import { useXamanTransactionStatus } from '@/lib/hooks/useXamanTransactionStatus';

interface XamanSigningInterfaceProps {
  payloadUuid: string;
  onTransactionSigned?: (txHash: string) => void;
  onTransactionRejected?: () => void;
  onError?: (error: string) => void;
}

export default function XamanSigningInterface({
  payloadUuid,
  onTransactionSigned,
  onTransactionRejected,
  onError
}: XamanSigningInterfaceProps) {
  const { status, isLoading, error } = useXamanTransactionStatus(payloadUuid);

  React.useEffect(() => {
    if (status?.status === 'signed' && status.txHash) {
      onTransactionSigned?.(status.txHash);
    } else if (status?.status === 'rejected') {
      onTransactionRejected?.();
    } else if (status?.status === 'error' && status.error) {
      onError?.(status.error);
    }
  }, [status, onTransactionSigned, onTransactionRejected, onError]);

  if (isLoading && !status) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Préparation de la transaction Xaman...</span>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erreur Xaman</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const { status: transactionStatus, qrCode, deepLink } = status;

  if (transactionStatus === 'signed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Transaction signée ✅</h3>
            <p className="text-sm text-green-700 mt-1">
              La transaction a été signée avec succès dans Xaman !
            </p>
            {status.txHash && (
              <p className="text-xs text-green-600 mt-1 font-mono">
                TX: {status.txHash}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (transactionStatus === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Transaction rejetée</h3>
            <p className="text-sm text-red-700 mt-1">
              La transaction a été annulée dans Xaman.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (transactionStatus === 'expired') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Transaction expirée</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Le délai pour signer cette transaction a expiré.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for signature
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="animate-pulse">
            <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-blue-900 ml-3">
            Signature requise dans Xaman
          </h3>
        </div>
        
        <p className="text-sm text-blue-700 mb-4">
          Scannez le QR code avec l'application Xaman ou cliquez sur le lien pour signer la transaction.
        </p>

        {qrCode && (
          <div className="flex flex-col items-center mb-4">
            <div className="bg-white p-4 rounded-lg border-2 border-blue-200 mb-3">
              <img 
                src={qrCode} 
                alt="QR Code Xaman" 
                className="w-48 h-48"
              />
            </div>
            <p className="text-xs text-blue-600">
              Scannez ce QR code avec Xaman
            </p>
          </div>
        )}

        {deepLink && (
          <div className="space-y-3">
            <button
              onClick={() => window.open(deepLink, '_blank')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Ouvrir dans Xaman 📱
            </button>
            
            <p className="text-xs text-blue-600">
              Ou copiez ce lien : 
              <br />
              <code className="bg-blue-100 px-2 py-1 rounded text-xs break-all">
                {deepLink}
              </code>
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-blue-700">
            En attente de signature...
          </span>
        </div>
      </div>
    </div>
  );
}
