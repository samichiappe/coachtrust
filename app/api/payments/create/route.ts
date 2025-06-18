// API route for creating payment payloads via Xaman
import { NextRequest, NextResponse } from 'next/server'
import { createPaymentRequest } from '@/lib/services/xaman-backend'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    console.log('=== PAYMENT CREATION REQUEST ===')
    console.log('Payload:', JSON.stringify(payload, null, 2))

    if (!payload.txjson) {
      return NextResponse.json({
        success: false,
        error: 'Missing transaction JSON'
      }, { status: 400 })
    }

    // Validate required fields
    const { Account, Destination, Amount } = payload.txjson
    if (!Account || !Destination || !Amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required payment fields (Account, Destination, Amount)'
      }, { status: 400 })
    }

    const result = await createPaymentRequest(payload)
    
    console.log('=== PAYMENT CREATION RESPONSE ===')
    console.log('Result:', JSON.stringify(result, null, 2))
    
    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create payment request'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      payload: result
    })

  } catch (error) {
    console.error('Payment creation API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create payment request'
    }, { status: 500 })
  }
}
