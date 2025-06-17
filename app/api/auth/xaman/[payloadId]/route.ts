// API route to check payload status - FIXED for Next.js 15
import { NextRequest, NextResponse } from 'next/server'
import { getPayloadStatus } from '@/lib/services/xaman-backend'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payloadId: string }> }
) {
  try {
    const { payloadId } = await params

    console.log('=== PAYLOAD STATUS CHECK ===')
    console.log('Checking payload status for:', payloadId)

    if (!payloadId) {
      return NextResponse.json({
        success: false,
        error: 'Payload ID is required'
      }, { status: 400 })
    }

    const status = await getPayloadStatus(payloadId)
    
    console.log('=== FULL PAYLOAD STATUS RESPONSE ===')
    console.log('Status object keys:', status ? Object.keys(status) : 'null')
    console.log('Full status:', JSON.stringify(status, null, 2))
    
    if (status) {
      console.log('Meta object:', JSON.stringify(status.meta, null, 2))
      console.log('Response object:', JSON.stringify(status.response, null, 2))
      console.log('Signed status:', status.meta?.signed)
      
      // Check for both user_token and account in response
      if (status.response) {
        console.log('User token in response:', status.response.user_token)
        console.log('Account in response:', status.response.account)
        console.log('Signer in response:', status.response.signer)
      }
    }
    console.log('=== END PAYLOAD STATUS RESPONSE ===')
    
    if (!status) {
      return NextResponse.json({
        success: false,
        error: 'Payload not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      payload: {
        meta: status.meta,
        response: status.response
      }
    })

  } catch (error) {
    console.error('Payload status API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get payload status'
    }, { status: 500 })
  }
}
