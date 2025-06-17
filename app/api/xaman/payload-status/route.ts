import { NextRequest, NextResponse } from 'next/server';
import { xamanAPIService } from '@/lib/services/xamanAPIService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const payloadUuid = searchParams.get('payloadUuid');

    if (!payloadUuid) {
      return NextResponse.json(
        { success: false, error: 'payloadUuid is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Getting Xaman payload status for:', payloadUuid);

    const result = await xamanAPIService.getPayloadResult(payloadUuid);

    if (result.success && result.result) {
      return NextResponse.json({
        success: true,
        payload: result.result
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to get payload status' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Error getting Xaman payload status:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
