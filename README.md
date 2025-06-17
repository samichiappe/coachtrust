# 🏆 Coach Booking Platform with XRPL Escrow

A Next.js application for booking sports coaches with secure XRPL escrow payments.

## 🔧 Current Status: Development Mode

**What works:**
- ✅ Complete booking workflow (reservation → escrow → finalization)
- ✅ XRPL transaction building following playground patterns  
- ✅ Crypto-condition generation (five-bells-condition)
- ✅ Xaman wallet integration for authentication
- ✅ Full TypeScript implementation with comprehensive testing

**What's simulated:**
- ⚠️ Transactions use mock hashes (`escrow_create_123...`) 
- ⚠️ No real XRPL ledger interaction
- ⚠️ Funds are not actually locked in escrow

**To enable real transactions:**
- 🔗 Integrate Xaman SDK for transaction signing
- 🔗 Set `ENABLE_REAL_XRPL=true` in environment
- 🔗 Configure Xaman API credentials

## 🚀 Quick Start

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧪 Testing XRPL Transactions

Visit `/xrpl-test` to compare mock vs real XRPL transactions and understand the current implementation.

## 📖 Documentation

- [XRPL Transaction Solution](./docs/XRPL_TRANSACTION_SOLUTION.md) - Detailed explanation of mock vs real transactions
- [Xaman Integration Guide](./docs/XAMAN_INTEGRATION.md) - How to integrate with Xaman for real transactions

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
