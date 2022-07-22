import { vi } from 'vitest';
import crypto from 'crypto';
import { KkiapayAdapter } from '../../../src/providers/kkiapay/KkiapayAdapter';

// Inject test env before loading config
process.env.KKIAPAY_PRIVATE_KEY = 'test-private-key';
process.env.KKIAPAY_PUBLIC_KEY  = 'test-public-key';
process.env.KKIAPAY_HMAC_KEY    = 'test-hmac-key-32bytes-padding____';

vi.mock('../../../src/providers/kkiapay/kkiapay.config', () => ({
  kkiapayConfig: {
    privateKey: 'test-private-key',
    publicKey:  'test-public-key',
    hmacKey:    'test-hmac-key-32bytes-padding____',
    baseUrl:    'https://api.kkiapay.me',
    timeout:    5000,
  },
}));

const adapter = new KkiapayAdapter();

describe('KkiapayAdapter.verifyWebhook', () => {
  function makeSignature(payload: object): string {
    return crypto
      .createHmac('sha256', 'test-hmac-key-32bytes-padding____')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  it('returns true for valid signature', () => {
    const payload = { event: 'payment.success', transactionId: 'tx123' };
    const sig = makeSignature(payload);
    expect(adapter.verifyWebhook(payload, sig)).toBe(true);
  });

  it('returns false for tampered payload', () => {
    const payload = { event: 'payment.success', transactionId: 'tx123' };
    const sig = makeSignature(payload);
    const tampered = { event: 'payment.success', transactionId: 'tx456' };
    expect(adapter.verifyWebhook(tampered, sig)).toBe(false);
  });

  it('returns false when signature is missing', () => {
    expect(adapter.verifyWebhook({ event: 'test' })).toBe(false);
  });

  it('accepts string payload', () => {
    const body = '{"event":"payment.success"}';
    const sig = crypto
      .createHmac('sha256', 'test-hmac-key-32bytes-padding____')
      .update(body)
      .digest('hex');
    expect(adapter.verifyWebhook(body, sig)).toBe(true);
  });
});
