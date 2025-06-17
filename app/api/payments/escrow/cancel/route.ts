// API route for cancelling escrow payments
import { NextRequest, NextResponse } from 'next/server'
import { createPaymentRequest } from '@/lib/services/xaman-backend'
import { buildXRPLEscrowCancel, isValidXRPAddress } from '@/lib/services/escrowService'

export async function POST(request: NextRequest) {
  try {
    console.log('=== ESCROW CANCEL API ===')
    
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const {
      owner,
      offerSequence,
      escrowId,
      reason
    } = body
    
    // Validate required fields
    if (!owner || !offerSequence) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: owner, offerSequence'
      }, { status: 400 })
    }
    
    // Validate owner address
    if (!isValidXRPAddress(owner)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid owner address format'
      }, { status: 400 })
    }
    
    // Create EscrowCancel transaction payload for Xaman
    const escrowCancelPayload = {
      txjson: {
        TransactionType: 'EscrowCancel',
        Owner: owner,
        OfferSequence: parseInt(offerSequence.toString())
      } as any,
      options: {
        submit: true,
        expire: 10 // 10 minutes to complete escrow cancel
      },
      custom_meta: {
        identifier: `escrow-cancel-${escrowId || Date.now()}`,
        instruction: 'Cancel the escrow payment',
        blob: {
          purpose: 'escrow_cancel',
          escrow_id: escrowId,
          owner,
          offer_sequence: offerSequence,
          reason: reason || 'User cancelled'
        }
      }
    }
    
    console.log('EscrowCancel payload structure:', JSON.stringify(escrowCancelPayload, null, 2))
    
    // Call Xaman backend service to create the payload
    const result = await createPaymentRequest(escrowCancelPayload)
    console.log('Xaman escrow cancel payload result:', JSON.stringify(result, null, 2))
    
    if (!result) {
      throw new Error('Failed to create escrow cancel payload')
    }
    
    return NextResponse.json({
      success: true,
      payload: result,
      message: 'Escrow cancel payload created successfully'
    })
    
  } catch (error) {
    console.error('Escrow cancel API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create escrow cancel request'
    }, { status: 500 })
  }
}
