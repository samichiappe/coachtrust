// Escrow Test Component - Phase 3.2 Validation
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useXamanWallet } from '@/lib/hooks/useXamanWallet'
import { useEscrow } from '@/lib/hooks/useEscrow'
import { Shield, Lock, Unlock, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react'

export function EscrowTestComponent() {
  const { isConnected, address } = useXamanWallet()
  const { 
    isLoading, 
    error, 
    currentEscrow, 
    createEscrow, 
    finishEscrow, 
    cancelEscrow, 
    clearError 
  } = useEscrow()
    const [destinationAddress, setDestinationAddress] = useState('rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH')
  const [amount, setAmount] = useState('25')
  const [purpose, setPurpose] = useState('Cours de tennis avec Marc Dubois')
  const [bookingId, setBookingId] = useState(`booking_${Date.now()}`)

  const handleCreateEscrow = async () => {
    if (!isConnected || !address) {
      alert('Veuillez vous connecter avec Xaman d\'abord')
      return
    }

    try {
      await createEscrow({
        destination: destinationAddress,
        amount: parseFloat(amount),
        purpose: purpose || 'Coach booking payment',
        bookingId: bookingId || undefined,
        memo: `Escrow payment for ${purpose}`
      })
    } catch (error) {
      console.error('Escrow creation failed:', error)
    }
  }

  const handleFinishEscrow = async () => {
    if (!currentEscrow) return

    try {
      await finishEscrow({
        escrowId: currentEscrow.id,
        fulfillment: currentEscrow.fulfillment || ''
      })
    } catch (error) {
      console.error('Escrow finish failed:', error)
    }
  }

  const handleCancelEscrow = async () => {
    if (!currentEscrow) return

    try {
      await cancelEscrow(currentEscrow.id)
    } catch (error) {
      console.error('Escrow cancel failed:', error)
    }
  }

  const getStatusIcon = () => {
    if (isLoading) return <Clock className="w-4 h-4 text-orange-500" />
    if (error) return <AlertCircle className="w-4 h-4 text-red-500" />
    if (currentEscrow?.status.state === 'completed') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (currentEscrow?.status.state === 'cancelled') return <AlertCircle className="w-4 h-4 text-red-500" />
    if (currentEscrow) return <Lock className="w-4 h-4 text-blue-500" />
    return <Shield className="w-4 h-4 text-gray-500" />
  }

  const getStatusText = () => {
    if (isLoading) return 'En cours...'
    if (error) return `Erreur: ${error}`
    if (currentEscrow?.status.state === 'completed') return 'Escrow terminé'
    if (currentEscrow?.status.state === 'cancelled') return 'Escrow annulé'
    if (currentEscrow?.status.state === 'pending_completion') return 'En attente de signature'
    if (currentEscrow) return 'Escrow actif'
    return 'Prêt à créer un escrow'
  }

  const getStatusColor = () => {
    if (isLoading) return 'orange'
    if (error) return 'red'
    if (currentEscrow?.status.state === 'completed') return 'green'
    if (currentEscrow?.status.state === 'cancelled') return 'red'
    if (currentEscrow) return 'blue'
    return 'gray'
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Test d'Escrow XRPL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">
                Connectez-vous avec Xaman pour tester les escrows XRPL
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium">Statut:</span>
                <Badge variant={getStatusColor() === 'green' ? 'default' : 'secondary'}>
                  {getStatusIcon()}
                  <span className="ml-1">{getStatusText()}</span>
                </Badge>
              </div>

              {!currentEscrow && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Adresse du coach (destination)
                    </label>
                    <Input
                      value={destinationAddress}
                      onChange={(e) => setDestinationAddress(e.target.value)}
                      placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Montant (XRP)
                    </label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="50"
                      min="0.000001"
                      step="0.000001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Objet du paiement
                    </label>
                    <Input
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Coach tennis lesson payment"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      ID de réservation
                    </label>
                    <Input
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value)}
                      placeholder="booking_123"
                    />
                  </div>
                </div>
              )}

              {currentEscrow && (
                <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Escrow Actuel
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Montant:</span>
                      <span className="font-medium ml-2">{currentEscrow.amount} XRP</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Destination:</span>
                      <span className="font-mono text-xs ml-2">
                        {currentEscrow.destination.slice(0, 8)}...{currentEscrow.destination.slice(-6)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Objet:</span>
                      <span className="ml-2">{currentEscrow.purpose}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Booking ID:</span>
                      <span className="ml-2">{currentEscrow.bookingId}</span>
                    </div>
                  </div>                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Condition:</span>
                    <div className="font-mono bg-gray-100 p-1 rounded mt-1 break-all">
                      {currentEscrow.condition.slice(0, 40)}...
                    </div>
                    {currentEscrow.fulfillment && (
                      <>
                        <span className="font-medium mt-2 block">Fulfillment (Secret):</span>
                        <div className="font-mono bg-green-50 p-1 rounded mt-1 break-all text-green-700">
                          {currentEscrow.fulfillment.slice(0, 40)}...
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

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
                      Effacer
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {!currentEscrow ? (
                  <Button
                    onClick={handleCreateEscrow}
                    disabled={isLoading || !destinationAddress || !amount}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Créer Escrow
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    {currentEscrow.status.state === 'pending_completion' && (
                      <>
                        <Button
                          onClick={handleFinishEscrow}
                          disabled={isLoading}
                          className="flex-1"
                          variant="default"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Unlock className="w-4 h-4 mr-2" />
                          )}
                          Finaliser
                        </Button>
                        <Button
                          onClick={handleCancelEscrow}
                          disabled={isLoading}
                          variant="outline"
                        >
                          Annuler
                        </Button>
                      </>
                    )}
                    
                    {(currentEscrow.status.state === 'completed' || currentEscrow.status.state === 'cancelled') && (
                      <Button
                        onClick={() => window.location.reload()}
                        className="flex-1"
                        variant="outline"
                      >
                        Nouveau Test
                      </Button>
                    )}
                  </>
                )}
              </div>              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>💡 Test d'escrow sécurisé sur le testnet XRPL avec crypto-conditions</p>
                <p>🔒 L'escrow protège le paiement jusqu'à la finalisation du service</p>
                <p>✅ Basé sur l'exemple xrpl-playground avec five-bells-condition</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">Phase 3.2 - Détails d'Implémentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>✅ Crypto-Conditions:</strong> Génération sécurisée avec five-bells-condition
          </div>
          <div>
            <strong>✅ EscrowCreate:</strong> Transaction XRPL conforme aux patterns xrpl-playground
          </div>
          <div>
            <strong>✅ Xaman Integration:</strong> Signature sécurisée via backend API
          </div>
          <div>
            <strong>✅ Validation:</strong> Validation complète des adresses et montants
          </div>
          <div>
            <strong>✅ Workflow:</strong> Création → Condition → Signature → Finalisation
          </div>
          <div>
            <strong>✅ Error Handling:</strong> Gestion robuste des erreurs et annulations
          </div>
          <div className="pt-2 border-t">
            <strong>Next:</strong> Phase 3.3 - Intégration complète avec système de réservation
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
