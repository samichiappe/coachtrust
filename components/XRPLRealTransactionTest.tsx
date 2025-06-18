'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createEscrow } from '@/lib/services/escrowService'
import { EscrowRequest } from '@/lib/types/escrow'

interface TestResult {
  success: boolean
  mode: 'MOCK' | 'REAL'
  txHash?: string
  error?: string
  payloadUuid?: string
  escrowId?: string
}

export default function XRPLRealTransactionTest() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Ensure this component only runs on the client to avoid SSR issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Test addresses (testnet)
  const testAddresses = {
    client: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH', // Client wallet
    coach: 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy'   // Coach wallet
  }
  const testEscrowCreation = async () => {
    if (!isClient) {
      console.warn('Test can only run on client side')
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      console.log('🧪 Testing escrow creation...')
      console.log('Environment ENABLE_REAL_XRPL:', process.env.ENABLE_REAL_XRPL)
      
      const escrowRequest: EscrowRequest = {
        fromAddress: testAddresses.client,
        toAddress: testAddresses.coach,
        destination: testAddresses.coach,
        amount: '25.00', // 25 XRP for coach session
        memo: 'Test coach booking escrow - Real XRPL integration',
        bookingId: `test_booking_${Date.now()}`
      }

      const result = await createEscrow(escrowRequest)

      if (result.success) {
        const mode = result.requiresSignature ? 'REAL' : 'REAL'
        setTestResult({
          success: true,
          mode: result.txHash?.startsWith('escrow_create_') ? 'MOCK' : 'REAL',
          txHash: result.txHash,
          payloadUuid: result.payloadUuid,
          escrowId: result.escrow?.id
        })
        
        console.log('✅ Escrow test result:', {
          success: result.success,
          mode: result.txHash?.startsWith('escrow_create_') ? 'MOCK' : 'REAL',
          txHash: result.txHash,
          requiresSignature: result.requiresSignature,
          escrowId: result.escrow?.id
        })
      } else {
        setTestResult({
          success: false,
          mode: 'MOCK',
          error: result.error
        })
        console.error('❌ Escrow test failed:', result.error)
      }

    } catch (error) {
      setTestResult({
        success: false,
        mode: 'MOCK',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      console.error('❌ Test error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔗 Test Real XRPL Transactions
          <Badge variant="outline">
            {process.env.ENABLE_REAL_XRPL === 'true' ? 'REAL MODE' : 'MOCK MODE'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Test real XRPL escrow transactions following xrpl-playground patterns
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isClient ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-500">Loading client-side components...</span>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Configuration</h4>
              <div className="text-sm space-y-1">
                <div>Environment: <strong>{process.env.NODE_ENV}</strong></div>
                <div>ENABLE_REAL_XRPL: <strong>{process.env.ENABLE_REAL_XRPL || 'undefined'}</strong></div>
                <div>Test Client: <code className="text-xs">{testAddresses.client}</code></div>
                <div>Test Coach: <code className="text-xs">{testAddresses.coach}</code></div>
              </div>
            </div>

            <Button 
              onClick={testEscrowCreation} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Escrow Creation'}
            </Button>
          </>
        )}

        {testResult && (
          <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={testResult.success ? 'text-green-600' : 'text-red-600'}>
                {testResult.success ? '✅' : '❌'}
              </span>
              <strong>Test Result</strong>
              <Badge variant={testResult.mode === 'REAL' ? 'default' : 'secondary'}>
                {testResult.mode} MODE
              </Badge>
            </div>
            
            {testResult.success ? (
              <div className="space-y-2 text-sm">
                {testResult.txHash && (
                  <div>
                    <strong>Transaction Hash:</strong>
                    <code className="block bg-gray-100 p-1 rounded text-xs break-all">
                      {testResult.txHash}
                    </code>
                  </div>
                )}
                {testResult.payloadUuid && (
                  <div>
                    <strong>Xaman Payload:</strong>
                    <code className="block bg-gray-100 p-1 rounded text-xs">
                      {testResult.payloadUuid}
                    </code>
                  </div>
                )}
                {testResult.escrowId && (
                  <div>
                    <strong>Escrow ID:</strong>
                    <code className="block bg-gray-100 p-1 rounded text-xs">
                      {testResult.escrowId}
                    </code>
                  </div>
                )}
                
                {testResult.mode === 'REAL' && (
                  <div className="mt-3 p-2 bg-green-100 rounded">
                    🎉 <strong>Success!</strong> Real XRPL transactions are working!
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600 text-sm">
                <strong>Error:</strong> {testResult.error}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 border-t pt-3">
          <strong>Expected behavior:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>MOCK MODE: Generates mock transaction hash starting with "escrow_create_"</li>
            <li>REAL MODE: Creates actual XRPL transaction and returns Xaman payload for signing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
