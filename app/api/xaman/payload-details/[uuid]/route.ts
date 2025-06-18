import { NextRequest, NextResponse } from 'next/server'
import { getXamanService } from '@/lib/services/xamanAPIService'

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const payloadUuid = params.uuid

    if (!payloadUuid) {
      return NextResponse.json(
        { success: false, error: 'Payload UUID is required' },
        { status: 400 }
      )
    }

    const xamanService = getXamanService()
    const result = await xamanService.getPayloadDetails(payloadUuid)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Payload details API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}