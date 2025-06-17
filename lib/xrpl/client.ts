import { Client } from 'xrpl';

/**
 * Configuration for XRPL connections
 */
export const XRPL_CONFIG = {
  TESTNET: 'wss://s.altnet.rippletest.net:51233/',
  MAINNET: 'wss://xrplcluster.com/',
  DEVNET: 'wss://s.devnet.rippletest.net:51233/',
} as const;

/**
 * Current environment - defaults to testnet for development
 */
export const CURRENT_NETWORK = process.env.NODE_ENV === 'production' 
  ? XRPL_CONFIG.MAINNET 
  : XRPL_CONFIG.TESTNET;

/**
 * Create and configure an XRPL client
 * @param network - The XRPL network to connect to (defaults to current environment)
 * @returns Configured XRPL client instance
 */
export function createXRPLClient(network: string = CURRENT_NETWORK): Client {
  const client = new Client(network);
  
  // Add error handling
  client.on('error', (error) => {
    console.error('XRPL Client Error:', error);
  });
  
  client.on('connected', () => {
    console.log(`Connected to XRPL network: ${network}`);
  });
  
  client.on('disconnected', () => {
    console.log('Disconnected from XRPL network');
  });
  
  return client;
}

/**
 * Connect to XRPL network with retry logic
 * @param client - XRPL client instance
 * @param maxRetries - Maximum number of connection attempts
 * @param retryDelay - Delay between retry attempts in milliseconds
 * @returns Promise that resolves when connected
 */
export async function connectWithRetry(
  client: Client, 
  maxRetries: number = 3, 
  retryDelay: number = 2000
): Promise<void> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await client.connect();
      return;
    } catch (error) {
      retries++;
      console.error(`Connection attempt ${retries}/${maxRetries} failed:`, error);
      
      if (retries >= maxRetries) {
        throw new Error(`Failed to connect to XRPL after ${maxRetries} attempts`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

/**
 * Safely disconnect from XRPL network
 * @param client - XRPL client instance
 */
export async function safeDisconnect(client: Client): Promise<void> {
  try {
    if (client.isConnected()) {
      await client.disconnect();
    }
  } catch (error) {
    console.error('Error during disconnect:', error);
  }
}

/**
 * Check if client is connected and ready
 * @param client - XRPL client instance
 * @returns boolean indicating connection status
 */
export function isClientReady(client: Client): boolean {
  return client.isConnected();
}

/**
 * Get network information from the client
 * @param client - XRPL client instance
 * @returns Network information
 */
export async function getNetworkInfo(client: Client) {
  if (!client.isConnected()) {
    throw new Error('Client is not connected');
  }
  
  try {
    const serverInfo = await client.request({
      command: 'server_info'
    });
    
    const ledgerInfo = await client.request({
      command: 'ledger',
      ledger_index: 'validated'
    });
    
    return {
      network: client.url,
      serverInfo: serverInfo.result,
      currentLedger: ledgerInfo.result.ledger_index,
      validated: ledgerInfo.result.validated
    };
  } catch (error) {
    console.error('Failed to get network info:', error);
    throw error;
  }
}
