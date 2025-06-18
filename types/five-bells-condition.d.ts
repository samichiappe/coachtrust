// Type declarations for five-bells-condition
declare module 'five-bells-condition' {
  export class PreimageSha256 {
    constructor()
    setPreimage(preimage: Buffer): void
    getCondition(): Condition
    toString(): string
  }

  export class Condition {
    toString(): string
  }

  export function fulfillmentToCondition(fulfillment: string): string
  export function validateFulfillment(fulfillment: string, condition: string): boolean
}
