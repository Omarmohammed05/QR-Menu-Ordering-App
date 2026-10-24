import {randomBytes, randomUUID} from 'node:crypto';

/**
 * Unguessable public order id (spec §6): 16 chars of base62. Never expose the
 * uuid — `publicId` is what the customer status URL carries.
 */
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function publicOrderId(length = 16): string {
  const bytes = randomBytes(length);
  let id = '';
  for (let i = 0; i < length; i++) {
    id += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return id;
}

/** Fallback for callers outside a crypto context — always available. */
export function newIdempotencyKey(): string {
  return randomUUID();
}
