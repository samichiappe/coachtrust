// API route for finishing escrow payments
import { NextRequest, NextResponse } from 'next/server'
import { createPaymentRequest } from '@/lib/services/xaman-backend'
import { buildXRPLEscrowFinish, isValidXRPAddress } from '@/lib/services/escrowService'

export async function POST(request: NextRequest) {
  try {
    console.log('=== ESCROW FINISH API ===')
    
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const {
      owner,
      condition,
      fulfillment,
      offerSequence,
      escrowId
    } = body
    
    // Validate required fields
    if (!owner || !condition || !fulfillment || !offerSequence) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: owner, condition, fulfillment, offerSequence'
      }, { status: 400 })
    }
    
    // Validate owner address
    if (!isValidXRPAddress(owner)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid owner address format'
      }, { status: 400 })
    }
    
    // Create EscrowFinish transaction payload for Xaman
    const escrowFinishPayload = {
      txjson: {
        TransactionType: 'EscrowFinish',
        Owner: owner,
        Condition: condition,
        Fulfillment: fulfillment,
        OfferSequence: parseInt(offerSequence.toString())
      } as any,
      options: {
        submit: true,
        expire: 10 // 10 minutes to complete escrow finish
      },
      custom_meta: {
        identifier: `escrow-finish-${escrowId || Date.now()}`,
        instruction: 'Complete the escrow payment by providing the fulfillment',
        blob: {
          purpose: 'escrow_finish',
          escrow_id: escrowId,
          owner,
          condition,
          offer_sequence: offerSequence
        }
      }
    }
    
    console.log('EscrowFinish payload structure:', JSON.stringify(escrowFinishPayload, null, 2))
    
    // Call Xaman backend service to create the payload
    const result = await createPaymentRequest(escrowFinishPayload)
    console.log('Xaman escrow finish payload result:', JSON.stringify(result, null, 2))
    
    if (!result) {
      throw new Error('Failed to create escrow finish payload')
    }
    
    return NextResponse.json({
      success: true,
      payload: result,
      message: 'Escrow finish payload created successfully'
    })
    
  } catch (error) {
    console.error('Escrow finish API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create escrow finish request'
    }, { status: 500 })
  }
}
