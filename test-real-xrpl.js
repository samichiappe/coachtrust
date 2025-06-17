const { createEscrow } = require('./lib/services/escrowService.js')

async function testRealXRPLTransactions() {
  console.log('🧪 Testing Real XRPL Transactions...')
  console.log('Environment variables:')
  console.log('- ENABLE_REAL_XRPL:', process.env.ENABLE_REAL_XRPL)
  console.log('- NODE_ENV:', process.env.NODE_ENV)
  console.log('- XUMM_APIKEY:', process.env.XUMM_APIKEY ? '✅ Set' : '❌ Not set')
  console.log('- XUMM_APISECRET:', process.env.XUMM_APISECRET ? '✅ Set' : '❌ Not set')
  
  const escrowRequest = {
    fromAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
    toAddress: 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy',
    destination: 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy',
    amount: '25.00',
    memo: 'Test real XRPL escrow from CLI',
    bookingId: `cli_test_${Date.now()}`
  }

  try {
    console.log('\n🚀 Creating escrow with request:', escrowRequest)
    const result = await createEscrow(escrowRequest)
    
    console.log('\n📋 Result:')
    console.log('- Success:', result.success)
    console.log('- TX Hash:', result.txHash)
    console.log('- Mode:', result.txHash?.startsWith('escrow_create_') ? 'MOCK' : 'REAL')
    console.log('- Requires Signature:', result.requiresSignature)
    console.log('- Payload UUID:', result.payloadUuid)
    console.log('- Error:', result.error)
    
    if (result.success && result.txHash && !result.txHash.startsWith('escrow_create_')) {
      console.log('\n🎉 SUCCESS! Real XRPL transactions are working!')
    } else if (result.success && result.txHash?.startsWith('escrow_create_')) {
      console.log('\n⚠️  MOCK MODE: Check ENABLE_REAL_XRPL configuration')
    } else {
      console.log('\n❌ FAILED:', result.error)
    }
    
  } catch (error) {
    console.error('\n💥 Error during test:', error.message)
  }
}

// Load environment variables from .env
require('dotenv').config()

testRealXRPLTransactions()
  .then(() => {
    console.log('\n✅ Test completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error)
    process.exit(1)
  })
