// Mock for five-bells-condition library
const mockCondition = {
  fulfillmentUri: 'cc:0:3:',
  conditionUri: 'cc:0:3:47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU:0',
  generateConditionUri: jest.fn().mockReturnValue('cc:0:3:47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU:0'),
  generateFulfillmentUri: jest.fn().mockReturnValue('cc:0:3:'),
  parseFulfillmentUri: jest.fn().mockReturnValue({
    getConditionUri: () => 'cc:0:3:47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU:0'
  })
};

let callCounter = 0;
function uniqueHex(prefix = '') {
  callCounter++;
  return (prefix + callCounter.toString(16).padStart(8, '0')).padEnd(64, '0');
}

const mockPreimageInstance = {
  setPreimage: jest.fn().mockReturnThis(),
  getConditionUri: jest.fn().mockImplementation(() => 'cc:0:3:' + uniqueHex()),
  serializeUri: jest.fn().mockImplementation(() => 'cc:0:3:' + uniqueHex()),
  generateFulfillment: jest.fn().mockImplementation(() => 'cf:0:' + uniqueHex()),
  serialize: jest.fn().mockImplementation(() => Buffer.from(uniqueHex(), 'hex')),
  serializeBinary: jest.fn().mockImplementation(() => Buffer.from(uniqueHex(), 'hex')),
  getCondition: jest.fn().mockImplementation(() => uniqueHex()),
  getConditionBinary: jest.fn().mockImplementation(() => Buffer.from(uniqueHex(), 'hex')),
  getFulfillment: jest.fn().mockReturnValue({
    serialize: jest.fn().mockImplementation(() => Buffer.from(uniqueHex(), 'hex')),
    serializeBinary: jest.fn().mockImplementation(() => Buffer.from(uniqueHex(), 'hex')),
    getConditionBinary: jest.fn().mockImplementation(() => Buffer.from(uniqueHex(), 'hex'))
  })
};

const cc = {
  PreimageSha256: jest.fn().mockImplementation(() => mockPreimageInstance),
  fulfillCondition: jest.fn().mockReturnValue(mockCondition),
  validateFulfillment: jest.fn().mockReturnValue(true),
  fulfillmentFromJson: jest.fn().mockReturnValue({
    getCondition: jest.fn().mockReturnValue('mock-condition-hash'),
    serialize: jest.fn().mockReturnValue('mock-serialized-fulfillment'),
    serializeBinary: jest.fn().mockReturnValue(Buffer.from('mock-fulfillment-binary', 'hex')),
    getConditionBinary: jest.fn().mockReturnValue(Buffer.from('mock-condition-binary', 'hex'))
  }),
  conditionFromJson: jest.fn().mockReturnValue({
    getCondition: jest.fn().mockReturnValue('mock-condition-hash'),
    getFulfillment: jest.fn().mockReturnValue('mock-fulfillment-data'),
    getConditionBinary: jest.fn().mockReturnValue(Buffer.from('mock-condition-binary', 'hex')),
    serializeBinary: jest.fn().mockReturnValue(Buffer.from('mock-condition-binary', 'hex'))
  })
};

module.exports = cc;
