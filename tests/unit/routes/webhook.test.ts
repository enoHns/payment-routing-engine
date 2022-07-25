import { vi } from 'vitest';

vi.mock('../../../src/handlers/webhookHandler', () => ({
  processWebhook: vi.fn(),
}));

import Fastify from 'fastify';
import { webhookRoutes } from '../../../src/routes/webhook';
import { processWebhook } from '../../../src/handlers/webhookHandler';

const mockProcess = vi.mocked(processWebhook);

const buildApp = async () => {
  const app = Fastify();
  await app.register(webhookRoutes);
  return app;
};

describe('POST /webhook/:provider', () => {
  let app: ReturnType<typeof Fastify>;
  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 on SUCCESS webhook', async () => {
    mockProcess.mockResolvedValue({ transactionId: 'tx-1', status: 'SUCCESS' });
    const res = await app.inject({
      method:  'POST',
      url:     '/webhook/kkiapay',
      payload: { transactionId: 'ptx-1', status: 'SUCCESS' },
      headers: { 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).status).toBe('SUCCESS');
  });

  it('returns 200 even on processWebhook error (idempotent webhook response)', async () => {
    mockProcess.mockRejectedValue(new Error('DB error'));
    const res = await app.inject({
      method:  'POST',
      url:     '/webhook/cinetpay',
      payload: { cpm_trans_id: 'ptx-2', cpm_result: '00' },
      headers: { 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).status).toBe('ERROR');
  });

  it('passes signature header to processWebhook', async () => {
    mockProcess.mockResolvedValue({ transactionId: '', status: 'IGNORED' });
    await app.inject({
      method:  'POST',
      url:     '/webhook/kkiapay',
      payload: { transactionId: 'ptx-1', status: 'SUCCESS' },
      headers: { 'content-type': 'application/json', 'x-kkiapay-signature': 'sha256=abc' },
    });
    expect(mockProcess).toHaveBeenCalledWith('kkiapay', expect.any(Object), 'sha256=abc');
  });
});
