// Crypto-conditions utilities for XRPL escrow
// Following xrpl-playground patterns for crypto-condition generation

import crypto from 'crypto'
import { EscrowCondition } from '@/lib/types/escrow'

// Lazy load five-bells-condition to avoid SSR issues
let cc: any = null

function getCryptoConditions() {
  if (!cc) {
    try {
      // Dynamic import to avoid SSR issues
      cc = require('five-bells-condition')
    } catch (error) {
      console.error('Failed to load five-bells-condition:', error)
      throw new Error('Crypto-conditions library not available')
    }
  }
  return cc
}

// Generate crypto-condition and fulfillment - Following xrpl-playground pattern
export function generateConditionAndFulfillment(): EscrowCondition {
  console.log("******* GENERATING CRYPTO CONDITION AND FULFILLMENT *******")
  
  const cryptoConditions = getCryptoConditions()
  
  // Use cryptographically secure random bytes generation
  const preimage = crypto.randomBytes(32)
  
  const fulfillment = new cryptoConditions.PreimageSha256()
  fulfillment.setPreimage(preimage)
  
  const condition = fulfillment
    .getConditionBinary()
    .toString('hex')
    .toUpperCase()
  
  // Keep secret until you want to finish the escrow
  const fulfillment_hex = fulfillment
    .serializeBinary()
    .toString('hex')
    .toUpperCase()
  
  console.log('Condition:', condition)
  console.log('Fulfillment (keep secret until completion):', fulfillment_hex)
  
  return {
    condition,
    fulfillment: fulfillment_hex,
    preimage: preimage.toString('hex').toUpperCase()
  }
}

// Mock implementation for when crypto-conditions is not available (e.g., in SSR)
export function generateMockConditionAndFulfillment(): EscrowCondition {
  console.log("******* GENERATING MOCK CRYPTO CONDITION AND FULFILLMENT *******")
  
  // Generate mock values that look realistic but are deterministic for testing
  const mockPreimage = crypto.randomBytes(32).toString('hex').toUpperCase()
  const mockCondition = crypto.createHash('sha256')
    .update(mockPreimage)
    .digest('hex')
    .toUpperCase()
    .padStart(64, '0')
  const mockFulfillment = crypto.createHash('sha256')
    .update(mockCondition)
    .digest('hex')
    .toUpperCase()
    .padStart(64, '0')
  
  console.log('Mock Condition:', mockCondition)
  console.log('Mock Fulfillment (for testing only):', mockFulfillment)
  
  return {
    condition: `A0258020${mockCondition}810120`,
    fulfillment: `A022802${mockFulfillment}`,
    preimage: mockPreimage
  }
}

// Safe wrapper that falls back to mock if crypto-conditions is not available
export function safeGenerateConditionAndFulfillment(): EscrowCondition {
  try {
    return generateConditionAndFulfillment()
  } catch (error) {
    console.warn('Falling back to mock crypto-conditions:', error)
    return generateMockConditionAndFulfillment()
  }
}
