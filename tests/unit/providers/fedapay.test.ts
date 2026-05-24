import { vi } from 'vitest';
import crypto from 'crypto';

vi.mock('../../../src/config/env', () => ({
  env: {
    FEDAPAY_PRIVATE_KEY:    'test-fedapay-key',
    FEDAPAY_WEBHOOK_SECRET: 'test-fedapay-secret',
    NODE_ENV: 'test',
  },
}));

import { FedapayAdapter } from '../../../src/providers/fedapay/FedapayAdapter';

const adapter = new FedapayAdapter();

describe('FedapayAdapter.verifyWebhook', () => {
  it('validates correct HMAC-SHA512 signature', () => {
    const payload = { event: 'transaction.approved', id: '123' };
    const body = JSON.stringify(payload);
    const sig = crypto.createHmac('sha512', 'test-fedapay-secret').update(body).digest('hex');
    expect(adapter.verifyWebhook(payload, sig)).toBe(true);
  });

  it('rejects wrong signature', () => {
    const payload = { event: 'transaction.approved', id: '123' };
    expect(adapter.verifyWebhook(payload, 'bad-sig')).toBe(false);
  });

  it('returns false when no signature', () => {
    expect(adapter.verifyWebhook({ event: 'x' })).toBe(false);
  });
});
