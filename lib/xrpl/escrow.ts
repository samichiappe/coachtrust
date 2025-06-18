/**
 * XRPL Escrow Service for Coach Platform
 * Handles secure payments between clients and coaches
 */

import { Client, EscrowCreate, EscrowFinish, EscrowCancel, xrpToDrops } from 'xrpl';
import { Wallet } from 'xrpl';
import { generatePreimage, preimageToCondition, preimageToFulfillment, getXrplTimestamp } from './utils';
import { createXRPLClient, connectWithRetry } from './client';

export interface EscrowSession {
  sessionId: string;
  clientAddress: string;
  coachAddress: string;
  amount: string; // in XRP
  sessionDateTime: Date;
  duration: number; // in minutes
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed';
  escrowSequence?: number;
  condition?: string;
  fulfillment?: string;
  preimage?: string;
  finishAfter?: number;
  cancelAfter?: number;
  txHash?: string;
}

export interface CreateEscrowParams {
  sessionId: string;
  clientAddress: string;
  coachAddress: string;
  amount: string; // in XRP
  sessionDateTime: Date;
  duration: number; // in minutes
}

export interface EscrowResult {
  success: boolean;
  txHash?: string;
  sequence?: number;
  condition?: string;
  fulfillment?: string;
  preimage?: string;
  error?: string;
}

export class XRPLEscrowService {
  private client: Client;
  
  constructor() {
    this.client = createXRPLClient();
  }

  /**
   * Create an escrow for a coaching session
   * The escrow will automatically release 24 hours after session end if not disputed
   */
  async createSessionEscrow(params: CreateEscrowParams, clientWallet: Wallet): Promise<EscrowResult> {
    try {
      await connectWithRetry(this.client);

      // Generate crypto-condition for escrow security
      const preimage = generatePreimage();
      const condition = preimageToCondition(preimage);
      const fulfillment = preimageToFulfillment(preimage);

      // Calculate escrow timing
      const sessionEndTime = new Date(params.sessionDateTime);
      sessionEndTime.setMinutes(sessionEndTime.getMinutes() + params.duration);
      
      // Escrow auto-releases 24 hours after session ends (if not disputed)
      const autoReleaseTime = new Date(sessionEndTime);
      autoReleaseTime.setHours(autoReleaseTime.getHours() + 24);
      
      // Escrow can be cancelled 7 days after creation (dispute window)
      const cancelAfterTime = new Date();
      cancelAfterTime.setDate(cancelAfterTime.getDate() + 7);

      const escrowTx: EscrowCreate = {
        TransactionType: 'EscrowCreate',
        Account: params.clientAddress,
        Destination: params.coachAddress,
        Amount: xrpToDrops(params.amount),
        Condition: condition,
        FinishAfter: getXrplTimestamp(autoReleaseTime),
        CancelAfter: getXrplTimestamp(cancelAfterTime),
        Memos: [
          {
            Memo: {
              MemoType: Buffer.from('session-id', 'utf8').toString('hex'),
              MemoData: Buffer.from(params.sessionId, 'utf8').toString('hex'),
              MemoFormat: Buffer.from('text/plain', 'utf8').toString('hex')
            }
          },
          {
            Memo: {
              MemoType: Buffer.from('session-info', 'utf8').toString('hex'),
              MemoData: Buffer.from(JSON.stringify({
                sessionDateTime: params.sessionDateTime.toISOString(),
                duration: params.duration
              }), 'utf8').toString('hex'),
              MemoFormat: Buffer.from('application/json', 'utf8').toString('hex')
            }
          }
        ]
      };

      const result = await this.client.submitAndWait(escrowTx, {
        autofill: true,
        wallet: clientWallet
      });

      if (result.result.validated) {
        return {
          success: true,
          txHash: result.result.hash,
          sequence: result.result.tx_json.Sequence,
          condition,
          fulfillment,
          preimage
        };
      } else {
        return {
          success: false,
          error: `Transaction failed: ${JSON.stringify(result.result.meta)}`
        };
      }
    } catch (error) {
      console.error('Error creating escrow:', error);
      return {
        success: false,
        error: `Failed to create escrow: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Complete session escrow (coach can claim payment after session)
   * Can be called by either party with the fulfillment
   */
  async completeSessionEscrow(
    clientAddress: string,
    coachAddress: string,
    sequence: number,
    condition: string,
    fulfillment: string,
    executorWallet: Wallet
  ): Promise<EscrowResult> {
    try {
      await connectWithRetry(this.client);

      const escrowFinishTx: EscrowFinish = {
        TransactionType: 'EscrowFinish',
        Account: executorWallet.classicAddress,
        Owner: clientAddress,
        OfferSequence: sequence,
        Condition: condition,
        Fulfillment: fulfillment
      };

      const result = await this.client.submitAndWait(escrowFinishTx, {
        autofill: true,
        wallet: executorWallet
      });

      if (result.result.validated) {
        return {
          success: true,
          txHash: result.result.hash
        };
      } else {
        return {
          success: false,
          error: `Transaction failed: ${JSON.stringify(result.result.meta)}`
        };
      }
    } catch (error) {
      console.error('Error completing escrow:', error);
      return {
        success: false,
        error: `Failed to complete escrow: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Cancel session escrow (can be used for disputes or cancellations)
   * Can only be called after CancelAfter time
   */
  async cancelSessionEscrow(
    clientAddress: string,
    sequence: number,
    executorWallet: Wallet
  ): Promise<EscrowResult> {
    try {
      await connectWithRetry(this.client);

      const escrowCancelTx: EscrowCancel = {
        TransactionType: 'EscrowCancel',
        Account: executorWallet.classicAddress,
        Owner: clientAddress,
        OfferSequence: sequence
      };

      const result = await this.client.submitAndWait(escrowCancelTx, {
        autofill: true,
        wallet: executorWallet
      });

      if (result.result.validated) {
        return {
          success: true,
          txHash: result.result.hash
        };
      } else {
        return {
          success: false,
          error: `Transaction failed: ${JSON.stringify(result.result.meta)}`
        };
      }
    } catch (error) {
      console.error('Error cancelling escrow:', error);
      return {
        success: false,
        error: `Failed to cancel escrow: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get escrow details from the ledger
   */
  async getEscrowDetails(ownerAddress: string, sequence: number) {
    try {
      await connectWithRetry(this.client);

      const escrowObjects = await this.client.request({
        command: 'account_objects',
        account: ownerAddress,
        type: 'escrow'
      });

      const escrow = escrowObjects.result.account_objects.find(
        (obj: any) => obj.PreviousTxnID && obj.Sequence === sequence
      );

      return escrow;
    } catch (error) {
      console.error('Error getting escrow details:', error);
      return null;
    }
  }

  /**
   * Disconnect from XRPL
   */
  async disconnect() {
    if (this.client.isConnected()) {
      await this.client.disconnect();
    }
  }
}

export const escrowService = new XRPLEscrowService();
