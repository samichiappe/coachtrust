// API route for escrow payments - Secure backend implementation
import { NextRequest, NextResponse } from 'next/server'
import { createPaymentRequest } from '@/lib/services/xaman-backend'
import { validateEscrowRequest, generateConditionAndFulfillment, buildXRPLEscrowCreate, createEscrowContract } from '@/lib/services/escrowService'
import { EscrowRequest } from '@/lib/types/escrow'

export async function POST(request: NextRequest) {
  try {
    console.log('=== ESCROW CREATION API ===')
    
    // Parse request body
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const escrowRequest: EscrowRequest = {
      destination: body.destination,
      amount: parseFloat(body.amount),
      purpose: body.purpose || 'Coach booking payment',
      bookingId: body.bookingId,
      memo: body.memo
    }
    
    // Validate escrow request
    const validationErrors = validateEscrowRequest(escrowRequest)
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Validation failed: ${validationErrors.join(', ')}`
      }, { status: 400 })
    }
    
    // Generate crypto-condition and fulfillment
    const { condition, fulfillment } = generateConditionAndFulfillment()
    console.log('Generated condition:', condition)
    
    // For Xaman integration, we need to create an EscrowCreate payload
    // The account will be filled by Xaman from the signed-in user
    const escrowPayload = {
      txjson: {
        TransactionType: 'EscrowCreate',
        Destination: escrowRequest.destination,
        Amount: (escrowRequest.amount * 1000000).toString(), // Convert XRP to drops
        Condition: condition,
        Memos: []
      } as any,
      options: {
        submit: true,
        expire: 10 // 10 minutes to complete escrow creation
      },
      custom_meta: {
        identifier: `escrow-${escrowRequest.bookingId || Date.now()}`,
        instruction: `Create escrow payment for ${escrowRequest.purpose}`,
        blob: {
          purpose: 'escrow_creation',
          booking_id: escrowRequest.bookingId,
          amount: escrowRequest.amount,
          destination: escrowRequest.destination,
          condition,
          fulfillment // Store securely for later use
        }
      }
    }
    
    // Add memos
    if (escrowRequest.memo) {
      escrowPayload.txjson.Memos.push({
        Memo: {
          MemoType: Buffer.from('escrow_memo', 'utf8').toString('hex').toUpperCase(),
          MemoData: Buffer.from(escrowRequest.memo, 'utf8').toString('hex').toUpperCase()
        }
      })
    }
    
    if (escrowRequest.bookingId) {
      escrowPayload.txjson.Memos.push({
        Memo: {
          MemoType: Buffer.from('booking_id', 'utf8').toString('hex').toUpperCase(),
          MemoData: Buffer.from(escrowRequest.bookingId, 'utf8').toString('hex').toUpperCase()
        }
      })
    }
    
    console.log('Escrow payload structure:', JSON.stringify(escrowPayload, null, 2))
    
    // Call Xaman backend service to create the payload
    const result = await createPaymentRequest(escrowPayload)
    console.log('Xaman escrow payload result:', JSON.stringify(result, null, 2))
    
    if (!result) {
      throw new Error('Failed to create escrow payload')
    }
    
    // Store the fulfillment securely (in a real app, this would be in a database)
    // For now, we'll include it in the response for testing
    const escrowData = {
      condition,
      fulfillment, // In production, store this securely server-side
      amount: escrowRequest.amount,
      destination: escrowRequest.destination,
      purpose: escrowRequest.purpose,
      bookingId: escrowRequest.bookingId
    }
    
    return NextResponse.json({
      success: true,
      payload: result,
      escrowData // Include escrow data for client-side tracking
    })
    
  } catch (error) {
    console.error('Escrow creation API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create escrow payment request'
    }, { status: 500 })
  }
}
