// Secure Xaman Connect Button Component
// Uses secure backend API architecture
'use client'

import React from 'react'
import { useXamanWallet } from '@/lib/hooks/useXamanWallet'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, Loader2 } from 'lucide-react'

interface XamanConnectButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onConnect?: (address: string) => void
  onError?: (error: string) => void
}

export function XamanConnectButton({ 
  className, 
  variant = 'default', 
  size = 'default',
  onConnect,
  onError
}: XamanConnectButtonProps) {
  const { isConnected, address, isLoading, error, connect, disconnect } = useXamanWallet()

  // Handle connection success
  React.useEffect(() => {
    if (isConnected && address && onConnect) {
      onConnect(address)
    }
  }, [isConnected, address, onConnect])

  // Handle connection errors
  React.useEffect(() => {
    if (error && onError) {
      onError(error)
    }
  }, [error, onError])

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
          <Wallet className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <Button 
          onClick={disconnect}
          variant="outline"
          size="sm"
          className={className}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Button 
        onClick={handleConnect}
        disabled={isLoading}
        variant={variant}
        size={size}
        className={className}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4 mr-2" />
            Connect Xaman
          </>
        )}
      </Button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      
      {isLoading && (        <p className="mt-2 text-sm text-blue-600">
          Please check your Xaman app to complete the connection...
        </p>
      )}
    </div>
  )
}

export default XamanConnectButton
