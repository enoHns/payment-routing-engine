import crypto from 'crypto';

jest.mock('../../../src/config/env', () => ({
  env: {
    PAYDUNYA_MASTER_KEY:  'test-master-key',
    PAYDUNYA_PRIVATE_KEY: 'test-private-key',
    PAYDUNYA_TOKEN:       'test-token',
    NODE_ENV: 'test',
  },
}));
import { PaydunyaAdapter } from '../../../src/providers/paydunya/PaydunyaAdapter';

const adapter = new PaydunyaAdapter();

describe('PaydunyaAdapter.verifyWebhook', () => {
  it('validates HMAC-SHA256 with master key', () => {
    const payload = { status: 'completed', hash: 'abc' };
    const sig = crypto.createHmac('sha256', 'test-master-key').update(JSON.stringify(payload)).digest('hex');
    expect(adapter.verifyWebhook(payload, sig)).toBe(true);
  });
  it('rejects wrong key', () => {
    expect(adapter.verifyWebhook({ a: 1 }, 'bad')).toBe(false);
  });
});
