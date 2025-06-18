import { NextRequest, NextResponse } from 'next/server';
import { simpleEscrowService } from '@/lib/services/simpleEscrowService';

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    console.log('🚀 Escrow API request:', action);

    if (action === 'create') {
      const { ownerAddress, destinationAddress, amountXRP } = params;

      if (!ownerAddress || !destinationAddress || !amountXRP) {
        return NextResponse.json(
          { success: false, error: 'ownerAddress, destinationAddress, and amountXRP are required' },
          { status: 400 }
        );
      }

      const result = await simpleEscrowService.createEscrow(
        ownerAddress,
        destinationAddress,
        amountXRP
      );

      return NextResponse.json(result);
    }

    if (action === 'finish') {
      const { finisherAddress, ownerAddress, condition, fulfillment, offerSequence } = params;

      if (!finisherAddress || !ownerAddress || !condition || !fulfillment || !offerSequence) {
        return NextResponse.json(
          { success: false, error: 'All escrow finish parameters are required' },
          { status: 400 }
        );
      }

      const result = await simpleEscrowService.finishEscrow(
        finisherAddress,
        ownerAddress,
        condition,
        fulfillment,
        offerSequence
      );

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "create" or "finish"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error in Escrow API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
