jest.mock('../../../src/config/env', () => ({
  env: { CINETPAY_API_KEY: 'test-api', CINETPAY_SITE_ID: '123', NODE_ENV: 'test' },
}));
import { CinetpayAdapter } from '../../../src/providers/cinetpay/CinetpayAdapter';

const adapter = new CinetpayAdapter();

describe('CinetpayAdapter.verifyWebhook', () => {
  it('accepts valid structure', () => {
    expect(adapter.verifyWebhook({ cpm_trans_id: 'tx1', cpm_result: '00' })).toBe(true);
  });
  it('rejects missing fields', () => {
    expect(adapter.verifyWebhook({ event: 'x' })).toBe(false);
  });
  it('rejects non-object', () => {
    expect(adapter.verifyWebhook('string')).toBe(false);
  });
});
