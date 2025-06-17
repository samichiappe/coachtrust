// Test manual de l'API escrow
const testEscrowAPI = async () => {
  try {
    console.log('Testing Escrow API...')
    
    // Test création d'escrow
    const createResponse = await fetch('http://localhost:3000/api/payments/escrow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromAddress: 'rwBKcaYHodhSU1DDrCWWAVXoZAAEmy511Z',
        toAddress: 'rDNvpMYhsS8A7RPe1jHaAzKzxK8TvLR3VQ',
        amount: 25,
        purpose: 'Test coach booking payment',
        bookingId: 'booking_test_456'
      })
    })
    
    const createResult = await createResponse.json()
    console.log('Create escrow response:', createResult)
    
    if (createResult.success) {
      console.log('✅ Escrow creation API works!')
      console.log('Escrow ID:', createResult.escrowContract.id)
      console.log('Payload UUID:', createResult.payload.uuid)
    } else {
      console.log('❌ Escrow creation failed:', createResult.error)
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error)
  }
}

testEscrowAPI()
