// Basic test to verify Jest configuration
describe('Jest Configuration', () => {
  it('should be working correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have TextEncoder available', () => {
    expect(typeof TextEncoder).toBe('function');
  });

  it('should have TextDecoder available', () => {
    expect(typeof TextDecoder).toBe('function');
  });
});

// Test global test helpers
describe('Test Helpers', () => {
  it('should have global test config', () => {
    expect(global.testConfig).toBeDefined();
    expect(global.testConfig.xrplTestnet).toBe('wss://s.altnet.rippletest.net:51233/');
  });

  it('should have global test helpers', () => {
    expect(global.testHelpers).toBeDefined();
    expect(typeof global.testHelpers.createMockWallet).toBe('function');
    expect(typeof global.testHelpers.createMockTransaction).toBe('function');
  });

  it('should create mock wallet correctly', () => {
    const wallet = global.testHelpers.createMockWallet();
    expect(wallet.classicAddress).toMatch(/^r/);
    expect(wallet.address).toBe(wallet.classicAddress);
    expect(wallet.publicKey).toBeDefined();
    expect(wallet.privateKey).toBeDefined();
    expect(wallet.seed).toBeDefined();
  });

  it('should create mock transaction correctly', () => {
    const tx = global.testHelpers.createMockTransaction();
    expect(tx.TransactionType).toBe('Payment');
    expect(tx.Account).toBe(global.testConfig.mockWalletAddress);
    expect(tx.Destination).toBe(global.testConfig.mockDestinationAddress);
    expect(tx.Amount).toBe(global.testConfig.defaultTestAmount);
  });
});
