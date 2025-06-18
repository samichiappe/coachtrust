// TypeScript global types for tests
declare global {
  var testConfig: {
    xrplTestnet: string;
    mockWalletAddress: string;
    mockDestinationAddress: string;
    defaultTestAmount: string;
  };

  var testHelpers: {
    createMockWallet: () => {
      classicAddress: string;
      address: string;
      publicKey: string;
      privateKey: string;
      seed: string;
    };
    createMockTransaction: (type?: string) => {
      TransactionType: string;
      Account: string;
      Destination: string;
      Amount: string;
      Sequence: number;
      Fee: string;
      LastLedgerSequence: number;
    };
    createMockEscrow: () => {
      TransactionType: string;
      Account: string;
      Destination: string;
      Amount: string;
      FinishAfter: number;
      Condition: string;
    };
    createMockXRPLAddress: () => string;
  };
}

export {};
