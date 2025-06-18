'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  createEscrowWithSigning, 
  submitEscrowViaXaman,
  testEscrowCreation 
} from '@/lib/services/escrowService'
import { useXamanWallet } from '@/lib/hooks/useXamanWallet'

interface TestResult {
  type: 'mock' | 'xaman' | 'test'
  success: boolean
  txHash?: string
  transaction?: any
  escrow?: any
  error?: string
  message?: string
  requiresSignature?: boolean
}

export default function XRPLTransactionTest() {
  const { address: userAddress, isConnected } = useXamanWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const addResult = (result: TestResult) => {
    setResults(prev => [result, ...prev])
  }

  // Test 1: Mock Transaction (Current Behavior)
  const testMockTransaction = async () => {
    setIsLoading(true)
    try {
      console.log('🧪 Testing mock transaction...')
      
      const escrowRequest = {
        fromAddress: userAddress || 'rMockClientAddress123',
        toAddress: 'rMockCoachAddress456',
        destination: 'rMockCoachAddress456',
        amount: '25.00',
        bookingId: 'test_booking_123',
        memo: 'Test escrow - Mock transaction'
      }

      const result = await createEscrowWithSigning(escrowRequest, false)
      
      addResult({
        type: 'mock',
        success: result.success,
        txHash: result.txHash,
        transaction: result.transaction,
        escrow: result.escrow,
        error: result.error,
        message: result.message,
        requiresSignature: result.requiresSignature
      })

      console.log('✅ Mock transaction test completed:', result)
      
    } catch (error) {
      console.error('❌ Mock transaction test failed:', error)
      addResult({
        type: 'mock',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Test 2: Xaman Integration Simulation
  const testXamanIntegration = async () => {
    if (!isConnected || !userAddress) {
      addResult({
        type: 'xaman',
        success: false,
        error: 'Wallet not connected. Please connect your Xaman wallet first.'
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('🔗 Testing Xaman integration simulation...')
      
      const escrowRequest = {
        fromAddress: userAddress,
        toAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH', // Mock coach address
        destination: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        amount: '25.00',
        bookingId: 'test_booking_xaman_123',
        memo: 'Test escrow - Xaman integration'
      }

      // This will simulate submitting via Xaman
      const result = await createEscrowWithSigning(escrowRequest, true)
      
      addResult({
        type: 'xaman',
        success: result.success,
        txHash: result.txHash,
        transaction: result.transaction,
        escrow: result.escrow,
        error: result.error,
        message: result.message,
        requiresSignature: result.requiresSignature
      })

      console.log('✅ Xaman integration test completed:', result)
      
    } catch (error) {
      console.error('❌ Xaman integration test failed:', error)
      addResult({
        type: 'xaman',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Test 3: Full XRPL Playground Test
  const testXRPLPlayground = async () => {
    setIsLoading(true)
    try {
      console.log('🏗️ Testing XRPL playground pattern...')
      
      // This will connect to XRPL testnet and create real funded wallets
      await testEscrowCreation()
      
      addResult({
        type: 'test',
        success: true,
        message: 'XRPL playground test completed. Check console for details.',
        txHash: 'playground_test_completed'
      })

      console.log('✅ XRPL playground test completed')
      
    } catch (error) {
      console.error('❌ XRPL playground test failed:', error)
      addResult({
        type: 'test',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  const getResultBadgeColor = (result: TestResult) => {
    if (result.success) return 'bg-green-500'
    return 'bg-red-500'
  }

  const getTestTypeLabel = (type: string) => {
    switch (type) {
      case 'mock': return '🧪 Mock Transaction'
      case 'xaman': return '🔗 Xaman Integration'
      case 'test': return '🏗️ XRPL Playground'
      default: return '❓ Unknown'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">🧪 Test XRPL Real Transactions</h1>
        <p className="text-gray-600">
          Comparez les transactions mockées vs. vraies transactions XRPL
        </p>
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              ⚠️ Connectez votre wallet Xaman pour tester les vraies transactions
            </p>
          </div>
        )}
      </div>

      {/* Test Controls */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Tests Disponibles</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Button 
              onClick={testMockTransaction}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              🧪 Test Mock Transaction
            </Button>
            <p className="text-xs text-gray-500">
              Comportement actuel (transaction simulée)
            </p>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={testXamanIntegration}
              disabled={isLoading || !isConnected}
              className="w-full"
              variant="default"
            >
              🔗 Test Xaman Integration
            </Button>
            <p className="text-xs text-gray-500">
              Simulation d'intégration avec Xaman
            </p>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={testXRPLPlayground}
              disabled={isLoading}
              className="w-full"
              variant="secondary"
            >
              🏗️ Test XRPL Playground
            </Button>
            <p className="text-xs text-gray-500">
              Test avec de vrais wallets XRPL testnet
            </p>
          </div>
        </div>
        
        {results.length > 0 && (
          <div className="mt-4">
            <Button 
              onClick={clearResults}
              variant="outline"
              size="sm"
            >
              🗑️ Clear Results
            </Button>
          </div>
        )}
      </Card>

      {/* Current Problem Explanation */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          🔍 Problème Actuel - Pourquoi vous voyez "Escrow créé" sans vraie transaction
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>Ce qui se passe actuellement :</strong> Le code génère correctement une transaction XRPL,
            mais utilise des <code>mockTxHash</code> au lieu de vraiment soumettre à XRPL.
          </p>
          <p>
            <strong>Logs que vous voyez :</strong> La condition crypto et la transaction sont créées,
            mais jamais envoyées au réseau XRPL pour signature et validation.
          </p>
          <p>
            <strong>Solution :</strong> Intégrer Xaman pour que l'utilisateur puisse signer
            et soumettre la transaction au réseau XRPL.
          </p>
        </div>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Résultats des Tests</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{getTestTypeLabel(result.type)}</span>
                  <Badge className={getResultBadgeColor(result)}>
                    {result.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                </div>
                
                {result.message && (
                  <p className="text-sm text-blue-600">{result.message}</p>
                )}
                
                {result.error && (
                  <p className="text-sm text-red-600">{result.error}</p>
                )}
                
                {result.txHash && (
                  <p className="text-xs text-gray-500">
                    TX Hash: <code>{result.txHash}</code>
                  </p>
                )}
                
                {result.requiresSignature && (
                  <p className="text-xs text-yellow-600">
                    ⚠️ Requires signature via Xaman
                  </p>
                )}
                
                {result.transaction && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600">
                      View Transaction Details
                    </summary>
                    <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.transaction, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h3 className="font-semibold text-green-900 mb-2">
          🚀 Pour activer les vraies transactions XRPL
        </h3>
        <div className="space-y-2 text-sm text-green-800">
          <p>
            <strong>1. Testez d'abord :</strong> Utilisez les boutons ci-dessus pour voir la différence
            entre transactions mockées et vraies transactions.
          </p>
          <p>
            <strong>2. Intégration Xaman :</strong> Le code est prêt, il faut juste remplacer
            <code>submitEscrowViaXaman</code> par une vraie intégration Xaman SDK.
          </p>
          <p>
            <strong>3. Activation :</strong> Dans <code>createEscrowWithSigning</code>,
            passez <code>submitViaXaman: true</code> pour utiliser les vraies transactions.
          </p>
        </div>
      </Card>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-center">Testing XRPL transaction...</p>
          </div>
        </div>
      )}
    </div>
  )
}
