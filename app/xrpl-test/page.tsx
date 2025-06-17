import XRPLTransactionTest from '@/components/XRPLTransactionTest'
import XRPLRealTransactionTest from '@/components/XRPLRealTransactionTest'

export default function XRPLTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">XRPL Integration Tests</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Real Transaction Test</h2>
            <XRPLRealTransactionTest />
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Legacy Transaction Test</h2>
            <XRPLTransactionTest />
          </div>
        </div>
      </div>
    </div>
  )
}
