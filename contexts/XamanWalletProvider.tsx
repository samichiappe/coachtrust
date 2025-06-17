'use client'

/**
 * Xaman Wallet Provider Context
 * Phase 2.2: Tests de gestion d'état utilisateur
 * 
 * Provides global state management for Xaman Wallet authentication
 */

import React, { createContext, useContext, useEffect } from 'react';
import { useXamanWallet, XamanWalletState } from '@/lib/hooks/useXamanWallet';

// Create the context
const XamanWalletContext = createContext<XamanWalletState | undefined>(undefined);

interface XamanWalletProviderProps {
  children: React.ReactNode;
}

/**
 * XamanWalletProvider - Provides global wallet state to the entire app
 */
export const XamanWalletProvider: React.FC<XamanWalletProviderProps> = ({ children }) => {
  const walletState = useXamanWallet();
  // Auto-reconnect on app load if there's a saved session
  useEffect(() => {
    const savedAddress = localStorage.getItem('xaman_wallet_address');
    if (savedAddress && !walletState.isConnected && !walletState.isLoading) {
      // Auto-reconnect logic could be added here if needed
      console.log('Found saved wallet address, auto-reconnect could be implemented');
    }
  }, [walletState.isConnected, walletState.isLoading]);

  return (
    <XamanWalletContext.Provider value={walletState}>
      {children}
    </XamanWalletContext.Provider>
  );
};

/**
 * useWalletState - Hook to access wallet state from any component
 */
export const useWalletState = (): XamanWalletState => {
  const context = useContext(XamanWalletContext);
  
  if (context === undefined) {
    throw new Error('useWalletState must be used within a XamanWalletProvider');
  }
  
  return context;
};

// Export types for convenience
export type { XamanWalletState };
