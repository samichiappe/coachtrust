import { NextRequest, NextResponse } from 'next/server';
import { simpleXamanService } from '@/lib/services/simpleXamanService';

export async function POST(request: NextRequest) {
  try {
    const { txjson } = await request.json();

    if (!txjson) {
      return NextResponse.json(
        { success: false, error: 'txjson is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Creating Xaman payload via API for:', txjson.TransactionType);

    const result = await simpleXamanService.createPayload(txjson);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error in Xaman create API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json(
        { success: false, error: 'uuid parameter is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking Xaman payload status via API:', uuid);

    const result = await simpleXamanService.getPayloadStatus(uuid);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error in Xaman status API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
