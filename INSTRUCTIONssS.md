We're building a decentralized Uber for coaches on XRPL.

The user can book a coach, the coach has a page with a calendar and time slots depending on the day selected.

The frontend is already done and continues to be improved by my co-founder.

We'll be using xaman for the wallet connection
We won't be using a database (we're mocking up the data that should be stored in the database).

I'll take care of the smart contracts

As XRPL Features that could be applied to this project, I thought of : Payment, Escrow, DiD (and maybe tunnel?)
What do you think? Can you suggest any other features?

You have an example for the contract with code that works in Example\xrpl-playground\src\index.ts (you'll have to look at this code before you start coding)


index.ts : import chalk from "chalk";
import { AccountSet, AccountSetAsfFlags, AMMCreate, AMMDeposit, Client, convertStringToHex, EscrowCreate, EscrowFinish, isoTimeToRippleTime, multisign, NFTokenBurn, NFTokenCancelOffer, NFTokenCreateOffer, NFTokenCreateOfferFlags, NFTokenMint, Payment, PaymentChannelClaim, PaymentChannelCreate, PaymentChannelFund, SignerListSet, signPaymentChannelClaim, TicketCreate, TrustSet, TrustSetFlags, xrpToDrops } from "xrpl";
import { NFTokenCreateOfferMetadata } from "xrpl/dist/npm/models/transactions/NFTokenCreateOffer";
import { NFTokenMintFlags, NFTokenMintMetadata } from "xrpl/dist/npm/models/transactions/NFTokenMint";

import crypto from 'crypto';

// @ts-expect-error no types available
import cc from 'five-bells-condition';
import { validatePayment } from "xrpl/dist/npm/models/transactions/payment";
import { PaymentChannelClaimFlags, validatePaymentChannelClaim } from "xrpl/dist/npm/models/transactions/paymentChannelClaim";

// async function payment() {
//     console.log(chalk.bgWhite("-- PAYMENT + MEMO --"));
//     const client = new Client("wss://s.altnet.rippletest.net:51233/");

//     await client.connect();

//     const { wallet, balance } = await client.fundWallet();
//     console.log(`Wallet address: ${wallet.classicAddress} - Balance: ${balance}`);

//     const paymentTx: Payment = {
//         TransactionType: "Payment",
//         Account: wallet.classicAddress,
//         Destination: "r91KtCG8sNTZDf4ncYcRTzXjt6qWYVgh3p",
//         Amount: xrpToDrops(1),
//         Memos: [
//             {
//                 Memo: {
//                     MemoData: convertStringToHex("https://www.xrpl-commons.org/community-magazine/defi-expectations"),
//                 }
//             }
//         ],
//     }

//     const tx = await client.submitAndWait(paymentTx, { autofill: true, wallet });

//     if (tx.result.validated) {
//         console.log(`✅ Transaction successful! Transaction hash: ${tx.result.hash}`);
//     } else {
//         console.log(`❌ Transaction failed! Error: ${tx.result.meta}`);
//     }

//     await client.disconnect();
// }

// async function multisig() {
//     console.log(chalk.bgWhite("-- MULTISIG --"));
//     const client = new Client("wss://s.altnet.rippletest.net:51233/");

//     await client.connect();

//     const { wallet: multisig } = await client.fundWallet();
//     console.log(`Multisig wallet address: ${multisig.classicAddress}`);
//     const { wallet: wallet1 } = await client.fundWallet();
//     console.log(`Wallet 1 address: ${wallet1.classicAddress}`);
//     const { wallet: wallet2 } = await client.fundWallet();
//     console.log(`Wallet 2 address: ${wallet2.classicAddress}`);

//     const signerListTx: SignerListSet = {
//         TransactionType: "SignerListSet",
//         Account: multisig.classicAddress,
//         SignerQuorum: 2,
//         SignerEntries: [
//             { SignerEntry: { Account: wallet1.classicAddress, SignerWeight: 1},},
//             { SignerEntry: { Account: wallet2.classicAddress, SignerWeight: 1}, }
//         ],
//     }

//     const tx = await client.submitAndWait(signerListTx, { autofill: true, wallet: multisig });

//     if( tx.result.validated) {
//         console.log(`✅ SignerListSet successful! Transaction hash: ${tx.result.hash}`);
//     } else {
//         console.log(`❌ Transaction failed! Error: ${tx.result.meta}`);
//     }

//     // Create ticket
//     console.log(chalk.bgWhite("-- CREATE TICKET --"));

//     const ticketTx: TicketCreate = {
//         TransactionType: "TicketCreate",
//         Account: multisig.classicAddress,
//         TicketCount: 5
//     }
//     const ticket = await client.submitAndWait(ticketTx, { autofill: true, wallet: multisig });
//     if( ticket.result.validated) {
//         console.log(`✅ TicketCreate successful! Transaction hash: ${ticket.result.hash}`);
//     } else {
//         console.log(`❌ Transaction failed! Error: ${ticket.result.meta}`);
//     }

//     // Get ticket
//     console.log(chalk.bgWhite("-- RETRIEVE TICKETS --"));

//     const accountTickets = await client.request({
//         command: 'account_objects' as const,
//         account: multisig.classicAddress,
//         type: 'ticket' as const,
//     });

//     console.log(`Active tickets: ${JSON.stringify(accountTickets.result.account_objects, null, 2)}\n`);

//     // Multisig payment
//     console.log(chalk.bgWhite("-- MULTISIG PAYMENT --"));
//     const paymentTx: Payment = await client.autofill({
//         TransactionType: "Payment",
//         Account: multisig.classicAddress,
//         Destination: wallet1.classicAddress,
//         Amount: xrpToDrops(10)
//     }, 2);

//     const wallet1Signature = wallet1.sign(paymentTx, true);
//     const wallet2Signature = wallet2.sign(paymentTx, true);

//     const multisigSignature = multisign([wallet1Signature.tx_blob, wallet2Signature.tx_blob]);
//     const result = await client.submitAndWait(multisigSignature);


//     if( result.result.validated) {
//         console.log(`✅ Multisig payment successful! Transaction hash: ${result.result.hash}`);
//     } else {
//         console.log(`❌ Transaction failed! Error: ${result.result.meta}`);
//     }

//     await client.disconnect();
// }

// async function amm() {
//     console.log(chalk.bgWhite("-- ACCOUNT SET RIPPLING  --"));
//     const client = new Client("wss://s.altnet.rippletest.net:51233/");

//     await client.connect();

//     const { wallet: issuer } = await client.fundWallet();
//     console.log(`Issuer: ${issuer.classicAddress}`);

//     const { wallet: receiver } = await client.fundWallet();
//     console.log(`Receiver: ${receiver.classicAddress}`);

//     // ALLOW RIPPLING FOR ISSUER
//     const accountSetTx: AccountSet = {
//         TransactionType: "AccountSet",
//         Account: issuer.classicAddress,
//         SetFlag: AccountSetAsfFlags.asfDefaultRipple,
//     }

//     const result = await client.submitAndWait(accountSetTx, { autofill: true, wallet: issuer });

//     if (result.result.validated)
//         console.log(`✅ AccountSet successful! Transaction hash: ${result.result.hash}`);
//     else
//         console.log(`❌ AccountSet failed! Error: ${result.result.meta}`);

//     // SET TRUSTLINE
//     function convertStringToHexPadded(str: string): string {
//         // Convert string to hexadecimal
//         let hex: string = "";
//         for (let i = 0; i < str.length; i++) {
//             const hexChar: string = str.charCodeAt(i).toString(16);
//             hex += hexChar;
//         }

//         // Pad with zeros to ensure it's 40 characters long
//         const paddedHex: string = hex.padEnd(40, "0");
//         return paddedHex.toUpperCase(); // Typically, hex is handled in uppercase
//     }

//     console.log(chalk.bgWhite("-- CREATE TRUSTLINE --"));

//     const tokenCode = convertStringToHexPadded("USDM")

//     const trustSetTx: TrustSet = {
//         TransactionType: "TrustSet",
//         Account: receiver.address,
//         LimitAmount: {
//             currency: tokenCode,
//             issuer: issuer.address,
//             value: "500000000",
//         },
//         Flags: TrustSetFlags.tfClearNoRipple
//     }

//     const trustSetTxResult = await client.submitAndWait(trustSetTx, { autofill: true, wallet: receiver });

//     if (trustSetTxResult.result.validated)
//         console.log(`✅ TrustSet successful! Transaction hash: ${trustSetTxResult.result.hash}`);
//     else
//         console.log(`❌ TrustSet failed! Error: ${trustSetTxResult.result.meta}`);

//     // Send the token
//     console.log(chalk.bgWhite("-- SEND PAYMENT --"));
//     const sendPayment: Payment = {
//         TransactionType: "Payment",
//         Account: issuer.address,
//         Destination: receiver.address,
//         Amount: {
//             currency: tokenCode,
//             issuer: issuer.classicAddress,
//             value: "10000",
//         }
//     };

//     const preparedPaymentTx = await client.autofill(sendPayment);
//     const resultPaymentTx = await client.submitAndWait(preparedPaymentTx, {
//         wallet: issuer,
//     });

//     if (resultPaymentTx.result.validated)
//         console.log(`✅➡️ Payment sent from ${issuer.address} to ${receiver.address}. Tx: ${resultPaymentTx.result.hash}`);
//     else
//         console.log(`❌ Payment failed! Error: ${resultPaymentTx.result.meta}`);

//     // Create a pool on the AMM
//     console.log(chalk.bgWhite("-- CREATE POOL --"));

//     const createPoolTx: AMMCreate = {
//         TransactionType: "AMMCreate",
//         Account: issuer.classicAddress,
//         Amount:
//             {
//                 currency: tokenCode,
//                 issuer: issuer.classicAddress,
//                 value: "20",
//             },
//         Amount2: xrpToDrops("10"),
//         TradingFee: 1000
//     }

//     const createPoolTxResult = await client.submitAndWait(createPoolTx, { autofill: true, wallet: issuer });

//     if (createPoolTxResult.result.validated)
//         console.log(`✅ AMMCreate successful! Transaction hash: ${createPoolTxResult.result.hash}`);
//     else
//         console.log(`❌ AMMCreate failed! Error: ${createPoolTxResult.result.meta}`);

//     // Deposit on the AMM
//     console.log(chalk.bgWhite("-- DEPOSIT POOL --"));

//     // TO DO: TO BE FIXED
//     const depositAmmTx: AMMDeposit = {
//         TransactionType: "AMMDeposit",
//         Account: receiver.classicAddress,
//         Asset:
//             {
//                 currency: tokenCode,
//                 issuer: issuer.classicAddress,
//             },
//         Amount: { 
//             currency: tokenCode,
//             issuer: issuer.classicAddress,
//             value: "10"
//         },
//         Asset2: { currency: "XRP" }

//     }

//     const depositAmmResult = await client.submitAndWait(depositAmmTx, { autofill: true, wallet: receiver });

//     if(depositAmmResult.result.validated)
//         console.log(`✅ AMMDeposit successful! Transaction hash: ${depositAmmResult.result.hash}`);
//     else
//         console.log(`❌ AMMCreate failed! Error: ${depositAmmResult.result.meta}`);

//     await client.disconnect();
// }

// async function nft() {
//     console.log(chalk.bgWhite("-- NFT --"));
//     const client = new Client("wss://s.altnet.rippletest.net:51233/");

//     await client.connect();

//     const { wallet } = await client.fundWallet();
//     console.log(`Wallet address: ${wallet.classicAddress}`);

//     // Create an NFT
//     const mintNftTx: NFTokenMint = {
//         TransactionType: "NFTokenMint",
//         Account: wallet.classicAddress,
//         URI: convertStringToHex("https://www.esgi.fr/"),
//         NFTokenTaxon: 0,
//     }

//     const mintNftTxResult = await client.submitAndWait(mintNftTx, { autofill: true, wallet });

//     if (mintNftTxResult.result.validated)
//         console.log(`✅ NFTokenMint successful! Transaction hash: ${mintNftTxResult.result.hash}`);
//     else
//         console.log(`❌ NFTokenMint failed! Error: ${mintNftTxResult.result.meta}`);

//     // Create an NFT offer
//     const nftId = (mintNftTxResult.result.meta as NFTokenMintMetadata).nftoken_id as string;

//     const nftOfferTx: NFTokenCreateOffer = {
//         TransactionType: "NFTokenCreateOffer",
//         Account: wallet.classicAddress,
//         // Destination: "", // Replace with the address of the recipient, only claimable by the recipient
//         NFTokenID: nftId,
//         Amount: xrpToDrops("1"), // Amount in drops
//         Flags: NFTokenCreateOfferFlags.tfSellNFToken,
//     }

//     const nftOfferTxResult = await client.submitAndWait(nftOfferTx, { autofill: true, wallet });

//     if (nftOfferTxResult.result.validated)
//         console.log(`✅ NFTokenCreateOffer successful! Transaction hash: ${nftOfferTxResult.result.hash}`);
//     else
//         console.log(`❌ NFTokenCreateOffer failed! Error: ${nftOfferTxResult.result.meta}`);

//     // Cancel the offer
//     console.log(chalk.bgWhite("-- CANCEL NFT OFFER --"));
//     const offerId = (nftOfferTxResult.result.meta as NFTokenCreateOfferMetadata)?.offer_id as string;

//     const nftCancelOfferTx: NFTokenCancelOffer = {
//         TransactionType: "NFTokenCancelOffer",
//         Account: wallet.address,
//         NFTokenOffers: [offerId]
//     }

//     const preparedCancelOfferTx = await client.autofill(nftCancelOfferTx);
//     const resultCancelOfferTx = await client.submitAndWait(preparedCancelOfferTx, {
//         wallet: wallet
//     });

//     if (resultCancelOfferTx.result.validated)
//         console.log(`✅↩️ Offer canceled for NFT #${nftId}. Tx: ${resultCancelOfferTx.result.hash}\n`);
//     else
//         console.log(chalk.red(`❌ Error canceling offer: ${resultCancelOfferTx}\n`));

//     // Burn the NFT
//     console.log(chalk.bgWhite("-- BURN NFT --"));
//     const nftBurnTx: NFTokenBurn = {
//         TransactionType: "NFTokenBurn",
//         Account: wallet.address,
//         NFTokenID: nftId
//     }

//     const preparedBurnTx = await client.autofill(nftBurnTx);
//     const resultBurnTx = await client.submitAndWait(preparedBurnTx, {
//         wallet: wallet
//     });

//     if (resultBurnTx.result.validated)
//         console.log(`✅🔥 NFT #${nftId} burned. Tx: ${resultBurnTx.result.hash}\n`);
//     else
//         console.log(chalk.red(`❌ Error burning the nft: ${resultBurnTx}\n`));

//     await client.disconnect();
// }

// async function escrow() {
//     console.log(chalk.bgWhite("-- ESCROW --"));
//     const client = new Client("wss://s.altnet.rippletest.net:51233/");

//     await client.connect();

//     const { wallet: wallet1 } = await client.fundWallet();
//     console.log(`Wallet 1: ${wallet1.classicAddress}`);

//     const { wallet: wallet2 } = await client.fundWallet();
//     console.log(`Wallet 2: ${wallet2.classicAddress}`);

//     function generateConditionAndFulfillment() {
//         console.log(
//             "******* LET'S GENERATE A CRYPTO CONDITION AND FULFILLMENT *******"
//         );
//         console.log();

//         // use cryptographically secure random bytes generation
//         const preimage = crypto.randomBytes(32);

//         const fulfillment = new cc.PreimageSha256();
//         fulfillment.setPreimage(preimage);

//         const condition = fulfillment
//             .getConditionBinary()
//             .toString('hex')
//             .toUpperCase();
//         console.log('Condition:', condition);

//         // Keep secret until you want to finish the escrow
//         const fulfillment_hex = fulfillment
//             .serializeBinary()
//             .toString('hex')
//             .toUpperCase();

//         console.log(
//             'Fulfillment (keep secret until you want to finish the escrow):',
//             fulfillment_hex
//         );

//         return { condition, fulfillment_hex };
//     }

//     const { condition, fulfillment_hex } = generateConditionAndFulfillment();

//     // Create a time based escrow
//     const escrowCreateTx: EscrowCreate = {
//         TransactionType: "EscrowCreate",
//         Account: wallet1.classicAddress,
//         Destination: wallet2.classicAddress,
//         Amount: xrpToDrops("1"),
//         Condition: condition
//     }

//     const escrowCreateTxResult = await client.submitAndWait(escrowCreateTx, { autofill: true, wallet: wallet1 });
//     if (escrowCreateTxResult.result.validated)
//         console.log(`✅ EscrowCreate successful! Transaction hash: ${escrowCreateTxResult.result.hash}`);
//     else
//         console.log(`❌ EscrowCreate failed! Error: ${escrowCreateTxResult.result.meta}`);

//     console.log(fulfillment_hex);

//     // Finish the time based escrow
//     const escrowFinishTx: EscrowFinish = {
//         TransactionType: "EscrowFinish",
//         Account: wallet2.classicAddress,
//         Owner: wallet1.classicAddress,
//         Condition: condition,
//         Fulfillment: fulfillment_hex,
//         OfferSequence: escrowCreateTxResult.result.tx_json.Sequence ?? 0
//     }

//     const escrowFinishTxResult = await client.submitAndWait(escrowFinishTx, { autofill: true, wallet: wallet2 });

//     if (escrowFinishTxResult.result.validated)
//         console.log(`✅ EscrowFinish successful! Transaction hash: ${escrowFinishTxResult.result.hash}`);
//     else
//         console.log(`❌ EscrowFinish failed! Error: ${escrowFinishTxResult.result.meta}`);

//     await client.disconnect();
// }

async function channel() {
    console.log(chalk.bgWhite("-- CHANNEL --"));
    const client = new Client("wss://s.devnet.rippletest.net:51233/");

    await client.connect();

    const { wallet: sender } = await client.fundWallet();
    console.log(`Sender: ${sender.classicAddress}`);

    const { wallet: receiver } = await client.fundWallet();
    console.log(`Receiver: ${receiver.classicAddress}`);

    // Create the channel
    
    // Example: 
    // Day 1: I paid for 1 something... (10 XRP)
    let amountToClaimXrp = "10";

    const channelCreateTx: PaymentChannelCreate = {
        TransactionType: "PaymentChannelCreate",
        Account: sender.classicAddress,
        Destination: receiver.classicAddress,
        Amount: xrpToDrops(amountToClaimXrp),
        SettleDelay: 60, // Time to wait before the channel can be closed by the receiver
        PublicKey: sender.publicKey
    }

    const channelCreateTxResult = await client.submitAndWait(channelCreateTx, { autofill: true, wallet: sender });

    if (channelCreateTxResult.result.validated)
        console.log(`✅ ChannelCreate successful! Transaction hash: ${channelCreateTxResult.result.hash}`);
    else
        console.log(`❌ ChannelCreate failed! Error: ${channelCreateTxResult.result.meta}`);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Retrieve the channel ID in "account_channels"
    const channelInfo = await client.request({
        command: "account_channels",
        account: sender.classicAddress,
        destination_account: receiver.classicAddress
    });

    const channelId = channelInfo.result.channels[0]?.channel_id;

    if (!channelId) {
        console.error("❌ Could not retrieve channel_id");
        return;
    }

    console.log(`🔑 Channel ID: ${channelId}`);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    let signedClaim = signPaymentChannelClaim(channelId, amountToClaimXrp, sender.privateKey);

    const verifyDay1 = await client.request({
        command: "channel_verify",
        channel_id: channelId,
        amount: xrpToDrops(amountToClaimXrp),
        signature: signedClaim,
        public_key: sender.publicKey
    })

    console.log(`🌤️ Day 1 - Signature verified: ${verifyDay1.result.signature_verified ? '✅' : '❌'}`);

    // Day 2: I bought another one
    amountToClaimXrp = "20"; // 10 + 10
    const channelFundingTx: PaymentChannelFund = {
        TransactionType: "PaymentChannelFund",
        Account: sender.classicAddress,
        Channel: channelId,
        Amount: xrpToDrops("10") // Amount to add to the channel
    }

    const channelFundingTxResult = await client.submitAndWait(channelFundingTx, { autofill: true, wallet: sender });

    if (channelFundingTxResult.result.validated)
        console.log(`✅ ChannelFund successful! Transaction hash: ${channelFundingTxResult.result.hash}`);
    else
        console.log(`❌ ChannelFund failed! Error: ${channelFundingTxResult.result.meta}`);

    
    signedClaim = signPaymentChannelClaim(channelId, amountToClaimXrp, sender.privateKey);

    const verifyDay2 = await client.request({
        command: "channel_verify",
        channel_id: channelId,
        amount: xrpToDrops(amountToClaimXrp),
        signature: signedClaim,
        public_key: sender.publicKey
    })

    console.log(`🌤️ Day 2 - Signature verified: ${verifyDay2.result.signature_verified ? '✅' : '❌'}`);

    // Claim the channel amount
    const claimTx: PaymentChannelClaim = {
        TransactionType: "PaymentChannelClaim",
        Account: receiver.classicAddress,
        Channel: channelId,
        Balance: xrpToDrops(amountToClaimXrp),
        Signature: signedClaim,
        PublicKey: sender.publicKey
    };

    const claimResult = await client.submitAndWait(claimTx, { autofill: true, wallet: receiver });

    if (claimResult.result.validated) {
        console.log("✅ Claim settled on-chain: ", claimResult.result.hash);
    } else {
        console.log("❌ Failed to settle claim: ", claimResult.result.meta);
    }

    // Close the channel
    const closePaymentChannelTx: PaymentChannelClaim = {
        TransactionType: "PaymentChannelClaim",
        Account: receiver.classicAddress,
        Channel: channelId,
        Flags: PaymentChannelClaimFlags.tfClose,
    }

    const closePaymentChannelTxResult = await client.submitAndWait(closePaymentChannelTx, { autofill: true, wallet: receiver });

    if (closePaymentChannelTxResult.result.validated)
        console.log(`✅ Channel closed! Transaction hash: ${closePaymentChannelTxResult.result.hash}`);
    else
        console.log(`❌ Channel close failed! Error: ${closePaymentChannelTxResult.result.meta}`);

    await client.disconnect();
}

channel();