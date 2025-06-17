'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function TransactionStatusExplainer() {
  return (
    <Card className="p-6 bg-blue-50 border-blue-200 max-w-2xl mx-auto my-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-yellow-500">🔧 MODE DÉVELOPPEMENT</Badge>
          <h3 className="font-semibold text-blue-900">
            Statut des Transactions XRPL
          </h3>
        </div>

        <div className="space-y-3 text-sm text-blue-800">
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <p className="font-medium">✅ Ce qui fonctionne actuellement :</p>
            <ul className="mt-1 space-y-1 text-xs list-disc list-inside">
              <li>Génération des conditions crypto (five-bells-condition)</li>
              <li>Construction des transactions XRPL (EscrowCreate/Finish)</li>
              <li>Validation des adresses et montants</li>
              <li>Workflow complet de réservation</li>
            </ul>
          </div>

          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-300">
            <p className="font-medium text-yellow-800">⚠️ Ce qui est simulé :</p>
            <ul className="mt-1 space-y-1 text-xs list-disc list-inside text-yellow-700">
              <li>Les transactions utilisent des hash mockés (<code>escrow_create_123...</code>)</li>
              <li>Aucune transaction n'est envoyée au réseau XRPL</li>
              <li>Les fonds ne sont pas réellement bloqués en escrow</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-lg p-3 border border-green-300">
            <p className="font-medium text-green-800">🚀 Pour activer les vraies transactions :</p>
            <ul className="mt-1 space-y-1 text-xs list-disc list-inside text-green-700">
              <li>Intégrer le SDK Xaman pour la signature</li>
              <li>Configurer <code>ENABLE_REAL_XRPL=true</code></li>
              <li>Les utilisateurs signeront via leur wallet Xaman</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/xrpl-test">
            <Button size="sm" variant="outline">
              🧪 Tester les Transactions
            </Button>
          </Link>
          <Link href="/docs/XRPL_TRANSACTION_SOLUTION.md">
            <Button size="sm" variant="secondary">
              📖 Documentation
            </Button>
          </Link>
        </div>

        <p className="text-xs text-blue-600">
          💡 Le système d'escrow est architecturalement complet et suit les patterns XRPL playground.
          Il ne manque que l'intégration finale avec Xaman pour les transactions réelles.
        </p>
      </div>
    </Card>
  )
}
