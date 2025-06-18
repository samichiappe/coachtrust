# Xaman (XUMM) Integration

This document describes the secure Xaman integration implementation for the CoachTrust platform.

## Security Implementation

✅ **SECURE**: All API credentials are stored server-side only
✅ **SECURE**: No sensitive data exposed to the client
✅ **SECURE**: Proper authentication flow using backend API routes

## Architecture

### Backend Service (`lib/services/xaman-backend.ts`)
- **Purpose**: Secure server-side Xaman SDK wrapper
- **Environment Variables**: `XUMM_APIKEY`, `XUMM_APISECRET`
- **Key Functions**:
  - `createSignRequest()` - Create authentication/payment requests
  - `getPayloadStatus()` - Check request status
  - `verifyUserTokens()` - Verify user authentication
  - `createAuthPayload()` - Generate authentication payloads
  - `createEscrowPayload()` - Generate escrow payment payloads

### API Routes (`app/api/auth/xaman/route.ts`)
- **Purpose**: Secure backend API endpoints for Xaman operations
- **Endpoints**:
  - `POST /api/auth/xaman` - Handle authentication requests
  - `GET /api/auth/xaman` - Health check

### Frontend Integration
- **Context**: `XamanWalletProvider.tsx` - React context for wallet state
- **Hook**: `useXamanWallet.ts` - React hook for wallet operations

## API Usage

### 1. Create Authentication Request
```typescript
const response = await fetch('/api/auth/xaman', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'create' })
})
const { data } = await response.json()
// Use data.refs.qr_png for QR code
```

### 2. Check Authentication Status
```typescript
const response = await fetch('/api/auth/xaman', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    action: 'status', 
    payloadId: 'uuid-from-create-response' 
  })
})
const { data } = await response.json()
// Check data.meta.signed for completion
```

### 3. Verify User Tokens
```typescript
const response = await fetch('/api/auth/xaman', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    action: 'verify', 
    userTokens: ['token1', 'token2'] 
  })
})
const { data } = await response.json()
// Use verification result
```

## Configuration

1. **Get Xaman Developer Credentials**:
   - Visit https://apps.xaman.dev/
   - Create a new application
   - Copy API Key and API Secret

2. **Environment Variables**:
   ```bash
   XUMM_APIKEY=your_api_key_here
   XUMM_APISECRET=your_api_secret_here
   ```

3. **Test Configuration**:
   ```bash
   curl http://localhost:3000/api/auth/xaman
   ```

## Error Handling

The API includes comprehensive error handling:
- Configuration errors (missing credentials)
- Service availability errors
- Network/timeout errors
- Invalid request format errors

## Security Notes

🔒 **IMPORTANT**: Never expose `XUMM_APISECRET` to the client-side code
🔒 **IMPORTANT**: All Xaman SDK operations must happen server-side
🔒 **IMPORTANT**: Validate all user inputs before processing

## Transaction Types Supported

- **SignIn**: User authentication
- **EscrowCreate**: Escrow payments for bookings
- **Payment**: Standard XRPL payments

## Integration Flow

1. User initiates authentication/payment from frontend
2. Frontend calls backend API route
3. Backend creates Xaman payload using server-side SDK
4. Backend returns QR code and payload UUID to frontend
5. User scans QR code in Xaman app
6. Frontend polls backend for payload status
7. Backend verifies completion and returns result

This architecture ensures maximum security while providing a smooth user experience.
