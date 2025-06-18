import { Client } from 'xrpl';
import {
  createXRPLClient,
  connectWithRetry,
  safeDisconnect,
  isClientReady,
  getNetworkInfo,
  XRPL_CONFIG,
  CURRENT_NETWORK
} from '../../../lib/xrpl/client';

// Mock XRPL Client
jest.mock('xrpl');

describe('XRPL Client Utils', () => {
  let mockClient: jest.Mocked<Client>;
  beforeEach(() => {
    mockClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
      on: jest.fn(),
      request: jest.fn()
    } as any;

    // Use Object.defineProperty to set url as writable
    Object.defineProperty(mockClient, 'url', {
      value: XRPL_CONFIG.TESTNET,
      writable: true,
      configurable: true
    });

    (Client as jest.MockedClass<typeof Client>).mockImplementation(() => mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createXRPLClient', () => {
    it('should create a client with default testnet configuration', () => {
      const client = createXRPLClient();

      expect(Client).toHaveBeenCalledWith(CURRENT_NETWORK);
      expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
    });

    it('should create a client with custom network', () => {
      const customNetwork = 'wss://custom.network.com';
      createXRPLClient(customNetwork);

      expect(Client).toHaveBeenCalledWith(customNetwork);
    });    it('should use mainnet when explicitly specified', () => {
      createXRPLClient(XRPL_CONFIG.MAINNET);

      expect(Client).toHaveBeenCalledWith(XRPL_CONFIG.MAINNET);
    });
  });

  describe('connectWithRetry', () => {
    it('should connect successfully on first attempt', async () => {
      mockClient.connect.mockResolvedValueOnce(undefined);

      await connectWithRetry(mockClient);

      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should retry connection on failure', async () => {
      mockClient.connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);

      await connectWithRetry(mockClient, 3, 100);

      expect(mockClient.connect).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(connectWithRetry(mockClient, 2, 100))
        .rejects.toThrow('Failed to connect to XRPL after 2 attempts');

      expect(mockClient.connect).toHaveBeenCalledTimes(2);
    });

    it('should use custom retry parameters', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));

      const startTime = Date.now();
      
      try {
        await connectWithRetry(mockClient, 1, 100);
      } catch (error) {
        // Expected to fail
      }

      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('safeDisconnect', () => {
    it('should disconnect when client is connected', async () => {
      mockClient.isConnected.mockReturnValue(true);
      mockClient.disconnect.mockResolvedValue(undefined);

      await safeDisconnect(mockClient);

      expect(mockClient.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should not disconnect when client is not connected', async () => {
      mockClient.isConnected.mockReturnValue(false);

      await safeDisconnect(mockClient);

      expect(mockClient.disconnect).not.toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      mockClient.isConnected.mockReturnValue(true);
      mockClient.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      // Should not throw
      await expect(safeDisconnect(mockClient)).resolves.toBeUndefined();
    });
  });

  describe('isClientReady', () => {
    it('should return true when client is connected', () => {
      mockClient.isConnected.mockReturnValue(true);

      expect(isClientReady(mockClient)).toBe(true);
    });

    it('should return false when client is not connected', () => {
      mockClient.isConnected.mockReturnValue(false);

      expect(isClientReady(mockClient)).toBe(false);
    });
  });

  describe('getNetworkInfo', () => {    it('should return network information when connected', async () => {
      mockClient.isConnected.mockReturnValue(true);
      
      // Use Object.defineProperty to set url properly
      Object.defineProperty(mockClient, 'url', {
        value: XRPL_CONFIG.TESTNET,
        writable: true,
        configurable: true
      });
      
      const mockServerInfo = {
        result: {
          info: {
            build_version: '1.7.0',
            complete_ledgers: '1-1000'
          }
        }
      };
      
      const mockLedgerInfo = {
        result: {
          ledger_index: 1000,
          validated: true
        }
      };

      mockClient.request
        .mockResolvedValueOnce(mockServerInfo)
        .mockResolvedValueOnce(mockLedgerInfo);

      const networkInfo = await getNetworkInfo(mockClient);

      expect(networkInfo).toEqual({
        network: XRPL_CONFIG.TESTNET,
        serverInfo: mockServerInfo.result,
        currentLedger: 1000,
        validated: true
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        command: 'server_info'
      });
      
      expect(mockClient.request).toHaveBeenCalledWith({
        command: 'ledger',
        ledger_index: 'validated'
      });
    });

    it('should throw error when not connected', async () => {
      mockClient.isConnected.mockReturnValue(false);      await expect(getNetworkInfo(mockClient))
        .rejects.toThrow('Client is not connected');
    });

    it('should handle request errors', async () => {
      mockClient.isConnected.mockReturnValue(true);
      mockClient.request.mockRejectedValue(new Error('Request failed'));

      await expect(getNetworkInfo(mockClient))
        .rejects.toThrow('Request failed');
    });
  });

  describe('XRPL_CONFIG', () => {
    it('should contain valid network URLs', () => {
      expect(XRPL_CONFIG.TESTNET).toBe('wss://s.altnet.rippletest.net:51233/');
      expect(XRPL_CONFIG.MAINNET).toBe('wss://xrplcluster.com/');
      expect(XRPL_CONFIG.DEVNET).toBe('wss://s.devnet.rippletest.net:51233/');
    });

    it('should use testnet as default in development', () => {
      expect(CURRENT_NETWORK).toBe(XRPL_CONFIG.TESTNET);
    });
  });
});
