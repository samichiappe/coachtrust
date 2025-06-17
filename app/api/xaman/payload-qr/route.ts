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

    console.log('🔍 Getting Xaman QR code for payload:', payloadUuid);

    const result = await xamanAPIService.getPayloadDetails(payloadUuid);

    if (result.success && result.payload) {
      // Extract QR code and deep link from payload
      const qrCode = result.payload.refs?.qr_png;
      const deepLink = result.payload.next?.always;

      return NextResponse.json({
        success: true,
        qrCode,
        deepLink,
        payload: result.payload
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to get QR code' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Error getting Xaman QR code:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
