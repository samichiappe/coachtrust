/**
 * API Route: Xaman Transaction Handler
 * Handles Xaman payload creation and result checking
 * Uses modern Xaman REST API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getXamanService } from '@/lib/services/xamanAPIService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, transaction, payloadUuid, userAddress } = body

    console.log('🔗 Xaman API request:', { action, userAddress })

    const xamanService = getXamanService()

    switch (action) {
      case 'create_payload': {
        if (!transaction) {
          return NextResponse.json(
            { success: false, error: 'Transaction is required' },
            { status: 400 }
          )
        }

        const result = await xamanService.createPayload({
          txjson: transaction,
          options: {
            submit: true,
            instruction: `Sign this ${transaction.TransactionType} transaction`
          }
        })

        if (result.success && result.payload) {
          return NextResponse.json({
            success: true,
            payload: {
              uuid: result.payload.uuid,
              qrCode: result.payload.refs.qr_png,
              websocket: result.payload.refs.websocket_status,
              deeplink: result.payload.next.always
            }
          })
        } else {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          )
        }
      }

      case 'get_result': {
        if (!payloadUuid) {
          return NextResponse.json(
            { success: false, error: 'Payload UUID is required' },
            { status: 400 }
          )
        }

        const result = await xamanService.getPayloadResult(payloadUuid)

        if (result.success && result.result) {
          return NextResponse.json({
            success: true,
            signed: !!result.result.response?.txid,
            txHash: result.result.response?.txid,
            account: result.result.response?.account,
            result: result.result
          })
        } else {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          )
        }
      }      case 'sign_transaction': {
        if (!transaction || !userAddress) {
          return NextResponse.json(
            { success: false, error: 'Transaction and user address are required' },
            { status: 400 }
          )
        }

        // Create payload directly (avoid infinite loop)
        const payloadResult = await xamanService.createPayload({
          txjson: transaction,
          options: {
            submit: true,
            instruction: `Sign this ${transaction.TransactionType} transaction`
          }
        })

        if (payloadResult.success && payloadResult.payload) {
          // For now, return payload info for user to scan QR code
          // In production, you might want to implement polling
          return NextResponse.json({
            success: true,
            txHash: null, // Will be available after user signs
            payloadUuid: payloadResult.payload.uuid,
            qrCode: payloadResult.payload.refs.qr_png,
            deeplink: payloadResult.payload.next.always,
            message: 'Payload created. User needs to sign via Xaman app.'
          })
        } else {
          return NextResponse.json({
            success: false,
            error: payloadResult.error || 'Failed to create payload'
          })
        }
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Xaman API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const payloadUuid = searchParams.get('uuid')

    if (!payloadUuid) {
      return NextResponse.json(
        { success: false, error: 'Payload UUID is required' },
        { status: 400 }
      )
    }

    const xamanService = getXamanService()
    const result = await xamanService.getPayloadResult(payloadUuid)

    if (result.success && result.result) {
      return NextResponse.json({
        success: true,
        signed: !!result.result.response?.txid,
        txHash: result.result.response?.txid,
        account: result.result.response?.account,
        payload: result.result
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('❌ Xaman API GET error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
