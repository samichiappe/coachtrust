🧠 Project Overview
This repository powers a decentralized Uber for coaches, built on XRPL (XRP Ledger).

Users can book a coach via a frontend interface (already implemented and under active improvement).

Each coach has a personal page with a calendar showing available time slots depending on the selected day.

No backend or database is used – data is mocked client-side for now.

Wallet connection is handled through Xaman Wallet.

XRPL smart contracts (e.g., for payments and escrows) are being developed separately by the smart contract lead.

A working smart contract example is located at:
Example/xrpl-playground/src/index.ts – review this file before writing any XRPL-related logic.

🛠️ Tech Stack
Frontend: React (already implemented)

XRPL: for payments, escrows, and possibly other decentralized features

Xaman Wallet: used for authentication and transaction signing

No database: all data is mocked

🤖 Goal for Copilot / Claude Sonnet 4
Your tasks may include:

Calling XRPL APIs to handle:

Simulated bookings (data is mocked)

User-to-coach payments

Escrow flows for securing payments until session completion

Integrating with Xaman Wallet to sign XRPL transactions.

Optionally, help create React components or logic to support XRPL calls – but the UI is already built.

📂 Must Review Before Coding
The following file contains a working example of XRPL interaction:

Example/xrpl-playground/src/index.ts
This file serves as a reference template for any XRPL-related functionality.

✅ Target Features (all mocked)
Coach availability calendar with dynamic time slots

Slot selection and booking by user

XRPL-based payment flow (either direct or escrowed)

Session confirmation or cancellation (mocked; no backend)

🚫 Do Not
Do not implement or rely on a backend

Do not use a database – data must remain mocked

Do not redesign or rewrite the existing frontend unless explicitly instructed

Do not modify Example/xrpl-playground/src/index.ts unless reusing it properly elsewhere

❓Need Help?
If you need:

The structure of mocked data

A breakdown of the booking flow

TypeScript types used on the frontend

Integration details for Xaman Wallet

Go fetch internet as soon as you need it it's really compulsory when you're not sure because there are a lot of updates on XRPL

Just ask! The goal is to assist you in generating code that fits the architecture and avoids unnecessary complexity.

