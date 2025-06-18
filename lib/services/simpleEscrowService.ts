/**
 * Simple Escrow Service
 * Based on Example/xrpl-playground/src/index.ts patterns
 * Uses native crypto instead of five-bells-condition for Next.js compatibility
 */

import { Client, EscrowCreate, EscrowFinish, xrpToDrops } from 'xrpl';
import crypto from 'crypto';
import { simpleXamanService } from './simpleXamanService';

interface EscrowCondition {
  condition: string;
  fulfillment: string;
  preimage: string;
}

interface EscrowCreateResult {
  success: boolean;
  uuid?: string; // Xaman payload UUID
  qr?: string;
  deepLink?: string;
  escrowData?: {
    condition: string;
    fulfillment: string;
    sequence?: number;
  };
  error?: string;
}

interface EscrowFinishResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Generate crypto condition and fulfillment
 * Based on xrpl-playground pattern but using native Node.js crypto
 */
export function generateConditionAndFulfillment(): EscrowCondition {
  console.log('🔐 Generating crypto condition and fulfillment...');
  
  // Generate cryptographically secure random bytes
  const preimage = crypto.randomBytes(32);
  
  // Create SHA-256 hash of the preimage
  const conditionHash = crypto.createHash('sha256').update(preimage).digest();
  
  // Format condition (hex, uppercase)
  const condition = conditionHash.toString('hex').toUpperCase();
  
  // Format fulfillment (hex, uppercase) 
  const fulfillment = preimage.toString('hex').toUpperCase();
  
  console.log('✅ Generated condition:', condition.substring(0, 16) + '...');
  console.log('✅ Generated fulfillment (keep secret!):', fulfillment.substring(0, 16) + '...');
  
  return {
    condition,
    fulfillment,
    preimage: preimage.toString('hex')
  };
}

class SimpleEscrowService {
  private client: Client;
  private isConnected: boolean = false;

  constructor() {
    // Use testnet for development
    this.client = new Client('wss://s.altnet.rippletest.net:51233/');
  }

  private async ensureConnected() {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
      console.log('🔗 Connected to XRPL testnet');
    }
  }

  private async disconnect() {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log('🔌 Disconnected from XRPL');
    }
  }

  /**
   * Create an escrow transaction using Xaman for signing
   * Based on xrpl-playground escrow pattern
   */
  async createEscrow(
    ownerAddress: string,    // Client/customer address (who pays)
    destinationAddress: string,  // Coach address (who receives)
    amountXRP: string        // Amount in XRP (e.g., "25")
  ): Promise<EscrowCreateResult> {
    try {
      await this.ensureConnected();

      console.log('🏗️ Creating escrow transaction:', {
        from: ownerAddress,
        to: destinationAddress,
        amount: amountXRP + ' XRP'
      });

      // Generate condition and fulfillment
      const { condition, fulfillment } = generateConditionAndFulfillment();

      // Create escrow transaction (following xrpl-playground pattern)
      const escrowTx: EscrowCreate = {
        TransactionType: 'EscrowCreate',
        Account: ownerAddress,
        Destination: destinationAddress,
        Amount: xrpToDrops(amountXRP),
        Condition: condition,
        // Optional: set finish time (e.g., 24 hours from now)
        FinishAfter: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      };

      console.log('📝 Escrow transaction prepared:', escrowTx.TransactionType);

      // Send to Xaman for signing
      const xamanResult = await simpleXamanService.createPayload(escrowTx);

      if (xamanResult.success && xamanResult.uuid) {
        console.log('✅ Escrow sent to Xaman for signing:', xamanResult.uuid);
        
        return {
          success: true,
          uuid: xamanResult.uuid,
          qr: xamanResult.qr,
          deepLink: xamanResult.deepLink,
          escrowData: {
            condition,
            fulfillment // Store securely for later finish
          }
        };
      } else {
        console.error('❌ Failed to create Xaman payload:', xamanResult.error);
        return {
          success: false,
          error: xamanResult.error || 'Failed to create Xaman payload'
        };
      }

    } catch (error) {
      console.error('❌ Error creating escrow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Finish an escrow (release funds to destination)
   * Based on xrpl-playground pattern
   */
  async finishEscrow(
    finisherAddress: string,  // Who finishes (usually the destination/coach)
    ownerAddress: string,     // Original creator (client)
    condition: string,
    fulfillment: string,
    offerSequence: number
  ): Promise<EscrowFinishResult> {
    try {
      await this.ensureConnected();

      console.log('🏁 Finishing escrow:', {
        finisher: finisherAddress,
        owner: ownerAddress,
        sequence: offerSequence
      });

      // Create escrow finish transaction (following xrpl-playground pattern)
      const escrowFinishTx: EscrowFinish = {
        TransactionType: 'EscrowFinish',
        Account: finisherAddress,
        Owner: ownerAddress,
        Condition: condition,
        Fulfillment: fulfillment,
        OfferSequence: offerSequence
      };

      console.log('📝 Escrow finish transaction prepared');

      // Send to Xaman for signing
      const xamanResult = await simpleXamanService.createPayload(escrowFinishTx);

      if (xamanResult.success && xamanResult.uuid) {
        console.log('✅ Escrow finish sent to Xaman:', xamanResult.uuid);
        
        // Wait for signature
        const signResult = await simpleXamanService.waitForSignature(xamanResult.uuid);
        
        if (signResult.success && signResult.txHash) {
          console.log('✅ Escrow finished successfully:', signResult.txHash);
          return {
            success: true,
            txHash: signResult.txHash
          };
        } else {
          return {
            success: false,
            error: signResult.error || 'Failed to finish escrow'
          };
        }
      } else {
        return {
          success: false,
          error: xamanResult.error || 'Failed to create finish payload'
        };
      }

    } catch (error) {
      console.error('❌ Error finishing escrow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get escrow info from XRPL ledger
   */
  async getEscrowInfo(ownerAddress: string, sequence: number) {
    try {
      await this.ensureConnected();
      
      const escrows = await this.client.request({
        command: 'account_objects',
        account: ownerAddress,
        type: 'escrow'
      });

      return escrows.result.account_objects.find(
        (obj: any) => obj.PreviousTxnLgrSeq === sequence
      );
    } catch (error) {
      console.error('❌ Error getting escrow info:', error);
      return null;
    }
  }
}

export const simpleEscrowService = new SimpleEscrowService();
