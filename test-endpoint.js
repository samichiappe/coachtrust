// Test the Xaman authentication endpoint
const fetch = require('node-fetch');

async function testXamanAuth() {
  try {
    console.log('Testing Xaman authentication endpoint...');
    
    const response = await fetch('http://localhost:3000/api/auth/xaman', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create'
      }),
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ SUCCESS: Xaman authentication payload created successfully!');
      console.log('UUID:', result.payload.uuid);
      console.log('Next URL:', result.payload.next.always);
    } else {
      console.log('❌ FAILED:', result.error);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testXamanAuth();
