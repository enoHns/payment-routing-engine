import crypto from 'crypto';

/**
 * Constant-time HMAC comparison.
 * Handles different-length digests safely (returns false instead of throwing).
 */
export function safeHmacCompare(
  algorithm: string,
  key: string,
  body: string,
  signature: string,
): boolean {
  const expected = crypto.createHmac(algorithm, key).update(body).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
