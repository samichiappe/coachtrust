import React, { useEffect, useState } from 'react';

interface SimpleXamanSigningProps {
  uuid: string;
  qrCode?: string;
  deepLink?: string;
  onSigned?: (txHash: string) => void;
  onCancelled?: () => void;
  onExpired?: () => void;
  onError?: (error: string) => void;
}

export default function SimpleXamanSigning({
  uuid,
  qrCode,
  deepLink,
  onSigned,
  onCancelled,
  onExpired,
  onError
}: SimpleXamanSigningProps) {
  const [status, setStatus] = useState<'waiting' | 'signed' | 'cancelled' | 'expired' | 'error'>('waiting');
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Poll for status updates
  useEffect(() => {
    if (!uuid) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/xaman-simple?uuid=${uuid}`);
        const result = await response.json();

        if (result.success) {
          if (result.signed && result.txHash) {
            setStatus('signed');
            setTxHash(result.txHash);
            onSigned?.(result.txHash);
          } else if (result.cancelled) {
            setStatus('cancelled');
            onCancelled?.();
          } else if (result.expired) {
            setStatus('expired');
            onExpired?.();
          }
        } else {
          setStatus('error');
          setError(result.error || 'Unknown error');
          onError?.(result.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error checking status:', err);
        setStatus('error');
        setError('Network error');
        onError?.('Network error');
      }
    };

    // Check immediately
    checkStatus();

    // Poll every 3 seconds while waiting
    const interval = setInterval(() => {
      if (status === 'waiting') {
        checkStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [uuid, status, onSigned, onCancelled, onExpired, onError]);

  if (status === 'signed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-green-600 text-4xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Transaction signée avec succès !
          </h3>
          <p className="text-sm text-green-700 mb-4">
            Votre réservation a été confirmée sur le XRPL.
          </p>
          <p className="text-xs text-green-600 font-mono bg-green-100 p-2 rounded">
            TX: {txHash}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Transaction annulée
          </h3>
          <p className="text-sm text-red-700">
            Vous avez annulé la transaction dans Xaman.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-yellow-600 text-4xl mb-4">⏰</div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Transaction expirée
          </h3>
          <p className="text-sm text-yellow-700">
            Le délai pour signer cette transaction a expiré.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Erreur
          </h3>
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // Waiting for signature
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="text-center">
        <div className="text-blue-600 text-4xl mb-4 animate-pulse">📱</div>
        <h3 className="text-lg font-semibold text-blue-800 mb-4">
          Signature requise dans Xaman
        </h3>
        
        <p className="text-sm text-blue-700 mb-6">
          Scannez le QR code avec l'application Xaman ou utilisez le lien direct.
        </p>

        {qrCode && (
          <div className="mb-6">
            <div className="inline-block bg-white p-4 rounded-lg border-2 border-blue-200">
              <img 
                src={qrCode} 
                alt="QR Code Xaman" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Scannez avec Xaman
            </p>
          </div>
        )}

        {deepLink && (
          <div className="space-y-4">
            <button
              onClick={() => window.open(deepLink, '_blank')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Ouvrir dans Xaman 📱
            </button>
            
            <details className="text-left">
              <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                Afficher le lien direct
              </summary>
              <div className="mt-2 p-2 bg-blue-100 rounded text-xs font-mono break-all">
                {deepLink}
              </div>
            </details>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-blue-700">
            En attente de signature...
          </span>
        </div>
      </div>
    </div>
  );
}
