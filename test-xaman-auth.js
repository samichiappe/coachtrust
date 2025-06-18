// Test script to verify XUMM authentication payload format
const { createAuthPayload, createAuthRequest, getXummClient } = require('./lib/services/xaman-backend.ts');

async function testXamanAuth() {
  try {
    console.log('Testing XUMM authentication...');
    
    // Create the authentication payload
    const authPayload = createAuthPayload('Test Authentication');
    console.log('Created auth payload:', JSON.stringify(authPayload, null, 2));
    
    // Try to create the auth request
    const result = await createAuthRequest(authPayload);
    console.log('✅ SUCCESS: Auth request created successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ FAILED: Error testing XUMM auth:', error.message);
    console.error('Full error:', error);
  }
}

testXamanAuth();
