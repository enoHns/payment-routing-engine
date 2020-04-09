import crypto from 'crypto';

jest.mock('../../../src/config/env', () => ({
  env: { FEEXPAY_API_KEY: 'test-feexpay-key', FEEXPAY_SHOP_ID: 'shop1', NODE_ENV: 'test' },
}));
import { FeexpayAdapter } from '../../../src/providers/feexpay/FeexpayAdapter';

const adapter = new FeexpayAdapter();

describe('FeexpayAdapter.verifyWebhook', () => {
  it('validates HMAC-SHA256', () => {
    const payload = { reference: 'ref1', status: 'SUCCESSFUL' };
    const sig = crypto.createHmac('sha256', 'test-feexpay-key').update(JSON.stringify(payload)).digest('hex');
    expect(adapter.verifyWebhook(payload, sig)).toBe(true);
  });
  it('rejects bad signature', () => {
    expect(adapter.verifyWebhook({ ref: '1' }, 'badsig')).toBe(false);
  });
  it('returns false without signature', () => {
    expect(adapter.verifyWebhook({ ref: '1' })).toBe(false);
  });
});
