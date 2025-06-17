// API Routes for Xaman authentication - Updated
import { NextRequest, NextResponse } from 'next/server'
import { 
  createAuthRequest, 
  createAuthPayload, 
  getPayloadStatus, 
  verifyUserTokens 
} from '@/lib/services/xaman-backend'

// POST /api/auth/xaman - Create authentication request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, payloadId, userTokens } = body

    switch (action) {
      case 'create':
        // Create new authentication payload
        console.log('Creating Xaman authentication request...')
        const authPayload = createAuthPayload('Authentication for CoachTrust Platform')
        console.log('Auth payload created:', JSON.stringify(authPayload, null, 2))
        
        const result = await createAuthRequest(authPayload)
        console.log('Xaman response:', JSON.stringify(result, null, 2))
        
        return NextResponse.json({
          success: true,
          payload: {
            uuid: result.uuid,
            next: result.next,
            refs: result.refs,
            pushed: result.pushed
          }
        })

      case 'status':
        // Check payload status
        if (!payloadId) {
          return NextResponse.json({
            success: false,
            error: 'Payload ID is required for status check'
          }, { status: 400 })
        }

        const status = await getPayloadStatus(payloadId)
        
        if (!status) {
          return NextResponse.json({
            success: false,
            error: 'Payload not found'
          }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          data: {
            meta: status.meta,
            response: status.response,
            payload: status.payload
          }
        })

      case 'verify':
        // Verify user tokens
        if (!userTokens || !Array.isArray(userTokens)) {
          return NextResponse.json({
            success: false,
            error: 'User tokens array is required for verification'
          }, { status: 400 })
        }

        const verification = await verifyUserTokens(userTokens)
        
        return NextResponse.json({
          success: true,
          data: verification
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: create, status, verify'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Xaman auth API error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('XUMM credentials not configured')) {
        return NextResponse.json({
          success: false,
          error: 'Server configuration error. Please contact support.'
        }, { status: 500 })
      }

      if (error.message.includes('not available')) {
        return NextResponse.json({
          success: false,
          error: 'Service temporarily unavailable. Please try again later.'
        }, { status: 503 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Authentication request failed. Please try again.'
    }, { status: 500 })
  }
}

// GET /api/auth/xaman - Health check for Xaman service
export async function GET() {
  try {
    // Simple health check
    return NextResponse.json({
      success: true,
      message: 'Xaman authentication service is running',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Xaman service health check failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Service health check failed'
    }, { status: 500 })
  }
}
