// Transaction validation utilities based on XRPL playground examples
import { 
  XRPLTransaction, 
  PaymentTransaction, 
  EscrowCreateTransaction,
  TransactionValidationResult,
  XamanErrorType 
} from '@/lib/types/xaman'
import { isValidAddress, dropsToXrp, xrpToDrops } from 'xrpl'

/**
 * Validates XRPL transaction structure based on playground examples
 */
export function validateTransaction(txJson: XRPLTransaction): TransactionValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic validation
  if (!txJson) {
    errors.push('Transaction is required')
    return { isValid: false, errors, warnings }
  }

  if (!txJson.TransactionType) {
    errors.push('TransactionType is required')
  }

  // Validate Account if provided
  if (txJson.Account && !isValidAddress(txJson.Account)) {
    errors.push('Invalid Account address')
  }

  // Type-specific validation
  switch (txJson.TransactionType) {
    case 'Payment':
      validatePaymentTransaction(txJson as PaymentTransaction, errors, warnings)
      break
    case 'EscrowCreate':
      validateEscrowCreateTransaction(txJson as EscrowCreateTransaction, errors, warnings)
      break
    case 'TrustSet':
      validateTrustSetTransaction(txJson, errors, warnings)
      break
    case 'NFTokenMint':
      validateNFTokenMintTransaction(txJson, errors, warnings)
      break
    case 'PaymentChannelCreate':
      validatePaymentChannelCreateTransaction(txJson, errors, warnings)
      break
    case 'SignIn':
      // SignIn transactions don't need additional validation
      break
    default:
      warnings.push(`Transaction type ${txJson.TransactionType} is not fully validated`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

function validatePaymentTransaction(
  tx: PaymentTransaction, 
  errors: string[], 
  warnings: string[]
): void {
  // Destination validation
  if (!tx.Destination) {
    errors.push('Payment requires Destination')
  } else if (!isValidAddress(tx.Destination)) {
    errors.push('Invalid Destination address')
  }

  // Amount validation
  if (!tx.Amount) {
    errors.push('Payment requires Amount')
  } else {
    if (typeof tx.Amount === 'string') {
      // XRP amount in drops
      try {
        const amount = parseInt(tx.Amount)
        if (amount <= 0) {
          errors.push('Amount must be positive')
        }
        if (amount < 10) {
          warnings.push('Amount is very small (less than 10 drops)')
        }
      } catch {
        errors.push('Invalid XRP amount format')
      }
    } else if (typeof tx.Amount === 'object') {
      // Token amount
      if (!tx.Amount.currency || !tx.Amount.issuer || !tx.Amount.value) {
        errors.push('Token amount requires currency, issuer, and value')
      }
      if (tx.Amount.issuer && !isValidAddress(tx.Amount.issuer)) {
        errors.push('Invalid token issuer address')
      }
      try {
        const value = parseFloat(tx.Amount.value)
        if (value <= 0) {
          errors.push('Token amount must be positive')
        }
      } catch {
        errors.push('Invalid token amount value')
      }
    }
  }

  // DestinationTag validation
  if (tx.DestinationTag !== undefined) {
    if (!Number.isInteger(tx.DestinationTag) || tx.DestinationTag < 0 || tx.DestinationTag > 4294967295) {
      errors.push('DestinationTag must be a valid 32-bit unsigned integer')
    }
  }

  // SendMax validation (if provided)
  if (tx.SendMax) {
    if (typeof tx.SendMax === 'string') {
      try {
        const amount = parseInt(tx.SendMax)
        if (amount <= 0) {
          errors.push('SendMax must be positive')
        }
      } catch {
        errors.push('Invalid SendMax amount format')
      }
    }
  }
}

function validateEscrowCreateTransaction(
  tx: EscrowCreateTransaction, 
  errors: string[], 
  warnings: string[]
): void {
  // Destination validation
  if (!tx.Destination) {
    errors.push('EscrowCreate requires Destination')
  } else if (!isValidAddress(tx.Destination)) {
    errors.push('Invalid Destination address')
  }

  // Amount validation
  if (!tx.Amount) {
    errors.push('EscrowCreate requires Amount')
  } else {
    try {
      const amount = parseInt(tx.Amount)
      if (amount <= 0) {
        errors.push('Escrow amount must be positive')
      }
    } catch {
      errors.push('Invalid escrow amount format')
    }
  }

  // Time validation
  const currentTime = Math.floor(Date.now() / 1000)
  
  if (tx.FinishAfter !== undefined) {
    if (tx.FinishAfter <= currentTime) {
      warnings.push('FinishAfter is in the past')
    }
  }

  if (tx.CancelAfter !== undefined) {
    if (tx.CancelAfter <= currentTime) {
      warnings.push('CancelAfter is in the past')
    }
    if (tx.FinishAfter && tx.CancelAfter <= tx.FinishAfter) {
      errors.push('CancelAfter must be after FinishAfter')
    }
  }

  // Condition validation
  if (tx.Condition) {
    if (typeof tx.Condition !== 'string' || tx.Condition.length === 0) {
      errors.push('Condition must be a non-empty string')
    }
  } else {
    if (!tx.FinishAfter && !tx.CancelAfter) {
      errors.push('EscrowCreate requires either Condition or FinishAfter/CancelAfter')
    }
  }
}

function validateTrustSetTransaction(
  tx: any, 
  errors: string[], 
  warnings: string[]
): void {
  if (!tx.LimitAmount) {
    errors.push('TrustSet requires LimitAmount')
    return
  }

  const { currency, issuer, value } = tx.LimitAmount

  if (!currency || !issuer || value === undefined) {
    errors.push('LimitAmount requires currency, issuer, and value')
  }

  if (issuer && !isValidAddress(issuer)) {
    errors.push('Invalid LimitAmount issuer address')
  }

  if (currency === 'XRP') {
    errors.push('Cannot create trust line for XRP')
  }

  try {
    const amount = parseFloat(value)
    if (amount < 0) {
      errors.push('Trust limit cannot be negative')
    }
  } catch {
    errors.push('Invalid trust limit value')
  }
}

function validateNFTokenMintTransaction(
  tx: any, 
  errors: string[], 
  warnings: string[]
): void {
  if (tx.NFTokenTaxon === undefined) {
    errors.push('NFTokenMint requires NFTokenTaxon')
  } else if (!Number.isInteger(tx.NFTokenTaxon) || tx.NFTokenTaxon < 0) {
    errors.push('NFTokenTaxon must be a non-negative integer')
  }

  if (tx.TransferFee !== undefined) {
    if (!Number.isInteger(tx.TransferFee) || tx.TransferFee < 0 || tx.TransferFee > 50000) {
      errors.push('TransferFee must be between 0 and 50000 (0% to 50%)')
    }
  }

  if (tx.Issuer && !isValidAddress(tx.Issuer)) {
    errors.push('Invalid Issuer address')
  }

  if (tx.URI) {
    try {
      // Validate that URI is properly hex encoded
      const decoded = Buffer.from(tx.URI, 'hex').toString('utf8')
      if (!decoded) {
        warnings.push('URI may not be properly encoded')
      }
    } catch {
      errors.push('Invalid URI hex encoding')
    }
  }
}

function validatePaymentChannelCreateTransaction(
  tx: any, 
  errors: string[], 
  warnings: string[]
): void {
  if (!tx.Destination) {
    errors.push('PaymentChannelCreate requires Destination')
  } else if (!isValidAddress(tx.Destination)) {
    errors.push('Invalid Destination address')
  }

  if (!tx.Amount) {
    errors.push('PaymentChannelCreate requires Amount')
  } else {
    try {
      const amount = parseInt(tx.Amount)
      if (amount <= 0) {
        errors.push('Channel amount must be positive')
      }
    } catch {
      errors.push('Invalid channel amount format')
    }
  }

  if (tx.SettleDelay === undefined) {
    errors.push('PaymentChannelCreate requires SettleDelay')
  } else if (!Number.isInteger(tx.SettleDelay) || tx.SettleDelay < 0) {
    errors.push('SettleDelay must be a non-negative integer')
  }

  if (!tx.PublicKey) {
    errors.push('PaymentChannelCreate requires PublicKey')
  } else if (typeof tx.PublicKey !== 'string' || tx.PublicKey.length !== 66) {
    errors.push('PublicKey must be a 66-character hex string')
  }
}

/**
 * Validates memo structure following XRPL standards
 */
export function validateMemos(memos: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!Array.isArray(memos)) {
    errors.push('Memos must be an array')
    return { isValid: false, errors }
  }

  for (let i = 0; i < memos.length; i++) {
    const memo = memos[i]
    if (!memo.Memo) {
      errors.push(`Memo at index ${i} is missing Memo object`)
      continue
    }

    const { MemoType, MemoData, MemoFormat } = memo.Memo

    // Validate hex encoding if present
    if (MemoType && !isValidHex(MemoType)) {
      errors.push(`MemoType at index ${i} is not valid hex`)
    }

    if (MemoData && !isValidHex(MemoData)) {
      errors.push(`MemoData at index ${i} is not valid hex`)
    }

    if (MemoFormat && !isValidHex(MemoFormat)) {
      errors.push(`MemoFormat at index ${i} is not valid hex`)
    }
  }

  return { isValid: errors.length === 0, errors }
}

function isValidHex(str: string): boolean {
  return /^[0-9A-Fa-f]*$/.test(str) && str.length % 2 === 0
}

/**
 * Helper function to convert string to hex (used in playground examples)
 */
export function convertStringToHex(str: string): string {
  return Buffer.from(str, 'utf8').toString('hex').toUpperCase()
}

/**
 * Helper function to convert hex to string
 */
export function convertHexToString(hex: string): string {
  return Buffer.from(hex, 'hex').toString('utf8')
}

/**
 * Validates an XRPL address
 */
export function validateXRPLAddress(address: string): boolean {
  return isValidAddress(address)
}

/**
 * Converts XRP to drops (following playground pattern)
 */
export function convertXrpToDrops(xrp: string | number): string {
  return xrpToDrops(xrp)
}

/**
 * Converts drops to XRP
 */
export function convertDropsToXrp(drops: string | number): string {
  return dropsToXrp(drops)
}
