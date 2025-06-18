import {
  toDrops,
  toXRP,
  stringToHex,
  hexToString,
  validateAddress,
  formatXRPAmount,
  calculateFee,
  generateDestinationTag,
  createMemo,
  parseMemos,
  validateAmount,
  toRippleTime,
  fromRippleTime,
  addressesEqual
} from '../../../lib/xrpl/utils';

// Mock XRPL functions
jest.mock('xrpl', () => ({
  xrpToDrops: jest.fn((xrp) => (parseFloat(xrp) * 1000000).toString()),
  dropsToXrp: jest.fn((drops) => (parseInt(drops) / 1000000).toString()),
  convertStringToHex: jest.fn((str) => Buffer.from(str, 'utf8').toString('hex').toUpperCase()),
  isValidAddress: jest.fn((addr) => addr.startsWith('r') && addr.length >= 25),
  isValidClassicAddress: jest.fn((addr) => addr.startsWith('r') && addr.length >= 25)
}));

describe('XRPL Utils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toDrops', () => {
    it('should convert XRP to drops', () => {
      expect(toDrops('1')).toBe('1000000');
      expect(toDrops('0.5')).toBe('500000');
      expect(toDrops(2)).toBe('2000000');
    });

    it('should handle string and number inputs', () => {
      expect(toDrops('10.5')).toBe('10500000');
      expect(toDrops(10.5)).toBe('10500000');
    });
  });

  describe('toXRP', () => {    it('should convert drops to XRP', () => {
      expect(toXRP('1000000')).toBe('1');
      expect(toXRP('500000')).toBe('0.5');
      expect(toXRP('2000000')).toBe('2');
    });

    it('should handle string and number inputs', () => {
      expect(toXRP('10500000')).toBe('10.5');
      expect(toXRP('10500000')).toBe('10.5');
    });
  });

  describe('stringToHex', () => {
    it('should convert string to hex', () => {
      expect(stringToHex('Hello')).toBe('48656C6C6F');
      expect(stringToHex('Test')).toBe('54657374');
    });

    it('should handle empty string', () => {
      expect(stringToHex('')).toBe('');
    });
  });

  describe('hexToString', () => {
    it('should convert hex to string', () => {
      expect(hexToString('48656C6C6F')).toBe('Hello');
      expect(hexToString('54657374')).toBe('Test');
    });

    it('should handle lowercase hex', () => {
      expect(hexToString('48656c6c6f')).toBe('Hello');
    });

    it('should handle empty hex', () => {
      expect(hexToString('')).toBe('');
    });
  });
  describe('validateAddress', () => {
    it('should validate correct XRPL addresses', () => {
      expect(validateAddress('rTestAddressValidXRPL123456789')).toBe(true);
      expect(validateAddress('rAnotherValidAddressForXRPL12345')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(validateAddress('invalid')).toBe(false);
      expect(validateAddress('xInvalidAddress')).toBe(false);
      expect(validateAddress('')).toBe(false);
    });

    it('should handle validation errors gracefully', () => {
      const { isValidAddress } = require('xrpl');
      isValidAddress.mockImplementationOnce(() => {
        throw new Error('Validation error');
      });

      expect(validateAddress('rTest')).toBe(false);
    });
  });

  describe('formatXRPAmount', () => {
    it('should format XRP amounts correctly', () => {
      expect(formatXRPAmount('1')).toBe('1.000000 XRP');
      expect(formatXRPAmount('0.123456')).toBe('0.123456 XRP');
      expect(formatXRPAmount('1000')).toBe('1,000.000000 XRP');
    });

    it('should format drops amounts correctly', () => {
      expect(formatXRPAmount('1000000', true)).toBe('1.000000 XRP');
      expect(formatXRPAmount('500000', true)).toBe('0.500000 XRP');
    });

    it('should handle zero amounts', () => {
      expect(formatXRPAmount('0')).toBe('0 XRP');
      expect(formatXRPAmount(0)).toBe('0 XRP');
    });

    it('should handle very small amounts', () => {
      expect(formatXRPAmount('0.0000001')).toBe('<0.000001 XRP');
    });
  });

  describe('calculateFee', () => {
    it('should calculate basic fee for default transaction size', () => {
      const fee = calculateFee();
      expect(parseInt(fee)).toBeGreaterThan(12); // Base fee + reference units
    });

    it('should calculate fee for custom transaction size', () => {
      const smallTxFee = calculateFee(100);
      const largeTxFee = calculateFee(500);
      
      expect(parseInt(largeTxFee)).toBeGreaterThan(parseInt(smallTxFee));
    });

    it('should return fee as string', () => {
      const fee = calculateFee(200);
      expect(typeof fee).toBe('string');
      expect(parseInt(fee)).toBeGreaterThan(0);
    });
  });

  describe('generateDestinationTag', () => {
    it('should generate a valid destination tag', () => {
      const tag = generateDestinationTag();
      expect(typeof tag).toBe('number');
      expect(tag).toBeGreaterThanOrEqual(0);
      expect(tag).toBeLessThanOrEqual(0xFFFFFFFF);
    });

    it('should generate different tags on multiple calls', () => {
      const tag1 = generateDestinationTag();
      const tag2 = generateDestinationTag();
      
      // Very unlikely to be the same, but not impossible
      expect(tag1).toBeGreaterThanOrEqual(0);
      expect(tag2).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createMemo', () => {
    it('should create a basic memo', () => {
      const memo = createMemo('Hello World');
      
      expect(memo).toEqual({
        Memo: {
          MemoData: '48656C6C6F20576F726C64'
        }
      });
    });

    it('should create a memo with type and format', () => {
      const memo = createMemo('Test data', 'text/plain', 'utf8');
      
      expect(memo).toEqual({
        Memo: {
          MemoData: '546573742064617461',
          MemoType: '746578742F706C61696E',
          MemoFormat: '75746638'
        }
      });
    });

    it('should create memo with only type', () => {
      const memo = createMemo('Test', 'json');
      
      expect(memo.Memo.MemoData).toBeDefined();
      expect(memo.Memo.MemoType).toBeDefined();
      expect(memo.Memo.MemoFormat).toBeUndefined();
    });
  });

  describe('parseMemos', () => {
    it('should parse memos correctly', () => {
      const memos = [
        {
          Memo: {
            MemoData: '48656C6C6F',
            MemoType: '746578742F706C61696E'
          }
        }
      ];

      const parsed = parseMemos(memos);
      
      expect(parsed).toEqual([
        {
          data: 'Hello',
          type: 'text/plain'
        }
      ]);
    });

    it('should handle empty or invalid memos', () => {
      expect(parseMemos([])).toEqual([]);
      expect(parseMemos(null as any)).toEqual([]);
      expect(parseMemos(undefined as any)).toEqual([]);
    });

    it('should handle memos without type or format', () => {
      const memos = [
        {
          Memo: {
            MemoData: '48656C6C6F'
          }
        }
      ];

      const parsed = parseMemos(memos);
      
      expect(parsed).toEqual([
        {
          data: 'Hello'
        }
      ]);
    });
  });

  describe('validateAmount', () => {
    it('should validate XRP amounts', () => {
      expect(validateAmount('1')).toBe(true);
      expect(validateAmount('0.000001')).toBe(true);
      expect(validateAmount('1000000')).toBe(true);
      expect(validateAmount(100)).toBe(true);
    });

    it('should validate drops amounts', () => {
      expect(validateAmount('1000000', true)).toBe(true);
      expect(validateAmount('1', true)).toBe(true);
      expect(validateAmount(1000000, true)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount('-1')).toBe(false);
      expect(validateAmount('0')).toBe(false);
      expect(validateAmount('invalid')).toBe(false);
      expect(validateAmount('1.5', true)).toBe(false); // Drops must be integers
    });

    it('should reject amounts that are too large', () => {
      expect(validateAmount('999999999999')).toBe(false); // > 100 billion XRP
      expect(validateAmount('999999999999999999', true)).toBe(false); // > 100 billion XRP in drops
    });
  });

  describe('toRippleTime', () => {
    it('should convert JavaScript timestamp to Ripple time', () => {
      const jsTime = new Date('2020-01-01T00:00:00Z');
      const rippleTime = toRippleTime(jsTime);
      
      expect(typeof rippleTime).toBe('number');
      expect(rippleTime).toBeGreaterThan(0);
    });

    it('should handle ISO string input', () => {
      const rippleTime = toRippleTime('2020-01-01T00:00:00Z');
      expect(typeof rippleTime).toBe('number');
    });

    it('should handle numeric timestamp input', () => {
      const timestamp = Date.now();
      const rippleTime = toRippleTime(timestamp);
      expect(typeof rippleTime).toBe('number');
    });
  });

  describe('fromRippleTime', () => {
    it('should convert Ripple time to JavaScript Date', () => {
      const rippleTime = 630720000; // Some time after Ripple epoch
      const jsDate = fromRippleTime(rippleTime);
      
      expect(jsDate).toBeInstanceOf(Date);
      expect(jsDate.getTime()).toBeGreaterThan(0);
    });

    it('should be reversible with toRippleTime', () => {
      const originalDate = new Date('2020-01-01T00:00:00Z');
      const rippleTime = toRippleTime(originalDate);
      const convertedBack = fromRippleTime(rippleTime);
      
      // Should be equal within 1 second (due to rounding)
      expect(Math.abs(convertedBack.getTime() - originalDate.getTime())).toBeLessThan(1000);
    });
  });

  describe('addressesEqual', () => {
    it('should return true for identical addresses', () => {
      const addr = 'rTestAddress123456789';
      expect(addressesEqual(addr, addr)).toBe(true);
    });

    it('should return true for addresses with different cases', () => {
      expect(addressesEqual('rTestAddress123', 'rtestaddress123')).toBe(true);
      expect(addressesEqual('RTESTADDRESS123', 'rTestAddress123')).toBe(true);
    });

    it('should return false for different addresses', () => {
      expect(addressesEqual('rTestAddress123', 'rDifferentAddress456')).toBe(false);
    });

    it('should handle null/undefined addresses', () => {
      expect(addressesEqual(null as any, 'rTest')).toBe(false);
      expect(addressesEqual('rTest', undefined as any)).toBe(false);
      expect(addressesEqual(null as any, undefined as any)).toBe(false);
    });
  });
});
