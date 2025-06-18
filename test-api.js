// Simple Node.js test for Xaman API
const fetch = require('node-fetch');

async function testXamanAPI() {
  try {
    console.log('Testing Xaman API...');
    
    const response = await fetch('http://localhost:3000/api/auth/xaman', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const text = await response.text();
    console.log('Response text:', text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('✅ SUCCESS:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ FAILED:', text);
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testXamanAPI();
