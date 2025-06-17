'use client'

import React from 'react'
import { useXamanWallet } from '@/lib/hooks/useXamanWallet'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Wallet, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export function XamanDebugStatus() {
  const { isConnected, address, isLoading, error, userToken, connect, disconnect } = useXamanWallet()

  const getStatusIcon = () => {
    if (isLoading) return <Clock className="w-4 h-4 text-orange-500" />
    if (error) return <AlertCircle className="w-4 h-4 text-red-500" />
    if (isConnected) return <CheckCircle className="w-4 h-4 text-green-500" />
    return <Wallet className="w-4 h-4 text-gray-500" />
  }

  const getStatusText = () => {
    if (isLoading) return 'En cours de connexion...'
    if (error) return `Erreur: ${error}`
    if (isConnected) return 'Connecté avec succès'
    return 'Déconnecté'
  }

  const getStatusColor = () => {
    if (isLoading) return 'orange'
    if (error) return 'red'
    if (isConnected) return 'green'
    return 'gray'
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Statut de la connexion Xaman
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Statut:</span>
          <Badge variant={getStatusColor() === 'green' ? 'default' : 'secondary'}>
            {getStatusText()}
          </Badge>
        </div>

        {address && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Adresse:</span>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
              {address.slice(0, 10)}...{address.slice(-8)}
            </code>
          </div>
        )}

        {userToken && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Token utilisateur:</span>
            <Badge variant="outline">
              {userToken === 'signin_completed' ? 'SignIn complété' : 'Token présent'}
            </Badge>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
            <p className="text-orange-700 text-sm">
              🔄 En attente de la signature dans l'application Xaman...
            </p>
            <p className="text-orange-600 text-xs mt-1">
              Veuillez scanner le QR code avec votre application Xaman et approuver la demande de connexion.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {!isConnected && !isLoading && (
            <Button onClick={connect} className="flex-1">
              <Wallet className="w-4 h-4 mr-2" />
              Connecter Xaman
            </Button>
          )}
          
          {isConnected && (
            <Button onClick={disconnect} variant="outline" className="flex-1">
              Déconnecter
            </Button>
          )}
          
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
