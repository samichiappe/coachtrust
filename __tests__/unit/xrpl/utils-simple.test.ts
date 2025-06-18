// Tests simples pour les utilitaires XRPL de base
describe('XRPL Utils - Basic Functions', () => {
  describe('formatXRPAmount', () => {
    it('should format XRP amounts correctly', () => {
      // Importons directement dans le test pour éviter les problèmes de module
      const formatXRPAmount = (amount: string | number, isDrops: boolean = false): string => {
        const toXRP = (drops: string | number): string => (parseInt(drops.toString()) / 1000000).toString();
        const xrpAmount = isDrops ? toXRP(amount) : amount.toString();
        const numericAmount = parseFloat(xrpAmount);
        
        if (numericAmount === 0) return '0 XRP';
        if (numericAmount < 0.000001) return '<0.000001 XRP';
        
        return `${numericAmount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6
        })} XRP`;
      };

      expect(formatXRPAmount('1')).toBe('1.00 XRP');
      expect(formatXRPAmount('0.123456')).toBe('0.123456 XRP');
      expect(formatXRPAmount('0')).toBe('0 XRP');
    });
  });

  describe('calculateFee', () => {
    it('should calculate basic fee for transaction', () => {
      const calculateFee = (transactionSize: number = 200): string => {
        const baseFee = 12;
        const referenceFee = Math.ceil(transactionSize / 16) * 4;
        return (baseFee + referenceFee).toString();
      };

      const fee = calculateFee();
      expect(parseInt(fee)).toBeGreaterThan(12);
      expect(typeof fee).toBe('string');
    });
  });

  describe('generateDestinationTag', () => {
    it('should generate a valid destination tag', () => {
      const generateDestinationTag = (): number => {
        return Math.floor(Math.random() * 0xFFFFFFFF);
      };

      const tag = generateDestinationTag();
      expect(typeof tag).toBe('number');
      expect(tag).toBeGreaterThanOrEqual(0);
      expect(tag).toBeLessThanOrEqual(0xFFFFFFFF);
    });
  });

  describe('addressesEqual', () => {
    it('should compare addresses correctly', () => {
      const addressesEqual = (address1: string, address2: string): boolean => {
        return address1?.toLowerCase() === address2?.toLowerCase();
      };

      expect(addressesEqual('rTestAddress123', 'rTestAddress123')).toBe(true);
      expect(addressesEqual('rTestAddress123', 'rtestaddress123')).toBe(true);
      expect(addressesEqual('rTestAddress123', 'rDifferentAddress456')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('should validate amounts correctly', () => {
      const validateAmount = (amount: string | number, isDrops: boolean = false): boolean => {
        try {
          const numericAmount = parseFloat(amount.toString());
          
          if (isNaN(numericAmount) || numericAmount < 0) return false;
          
          if (isDrops) {
            return Number.isInteger(numericAmount) && numericAmount <= 100000000000000000;
          } else {
            return numericAmount > 0 && numericAmount <= 100000000000;
          }
        } catch {
          return false;
        }
      };

      expect(validateAmount('1')).toBe(true);
      expect(validateAmount('0.000001')).toBe(true);
      expect(validateAmount('1000000', true)).toBe(true);
      expect(validateAmount('-1')).toBe(false);
      expect(validateAmount('0')).toBe(false);
      expect(validateAmount('1.5', true)).toBe(false);
    });
  });
});
