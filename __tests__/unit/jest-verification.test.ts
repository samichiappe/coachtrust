// Simple working test file to verify Jest setup
describe('Jest Setup Verification', () => {
  test('basic math operations', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 3).toBe(6);
  });

  test('string operations', () => {
    expect('hello' + ' world').toBe('hello world');
  });

  test('array operations', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.includes(2)).toBe(true);
  });
});

describe('Environment Check', () => {
  test('node environment is available', () => {
    expect(typeof process).toBe('object');
    expect(process.env).toBeDefined();
  });

  test('jest globals are available', () => {
    expect(typeof describe).toBe('function');
    expect(typeof test).toBe('function');
    expect(typeof expect).toBe('function');
  });
});
