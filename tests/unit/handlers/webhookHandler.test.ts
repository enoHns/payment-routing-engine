import { vi } from 'vitest';

vi.mock('../../../src/providers/adapterFactory');
vi.mock('../../../src/db/repositories/attemptRepo');
vi.mock('../../../src/db/repositories/transactionRepo');
vi.mock('../../../src/db/repositories/auditLogRepo');
vi.mock('../../../src/core/metricsUpdater');

import { processWebhook } from '../../../src/handlers/webhookHandler';
import { getAdapter } from '../../../src/providers/adapterFactory';
import { findAttemptByProviderTxId, updateAttempt } from '../../../src/db/repositories/attemptRepo';
import { updateTransactionStatus, findTransactionById } from '../../../src/db/repositories/transactionRepo';
import { createAuditLog } from '../../../src/db/repositories/auditLogRepo';

const mockGetAdapter    = getAdapter as ReturnType<typeof vi.fn>;
const mockFindAttempt   = findAttemptByProviderTxId as ReturnType<typeof vi.fn>;
const mockFindTx        = findTransactionById as ReturnType<typeof vi.fn>;
const mockUpdateAttempt = updateAttempt as ReturnType<typeof vi.fn>;
const mockUpdateTx      = updateTransactionStatus as ReturnType<typeof vi.fn>;
const mockAuditLog      = createAuditLog as ReturnType<typeof vi.fn>;

const mockAdapter = { name: 'kkiapay', verifyWebhook: vi.fn(), initiatePayment: vi.fn() };
const ATTEMPT = { id: 'attempt-1', transactionId: 'tx-1', providerName: 'kkiapay', createdAt: new Date() } as any;
const TX = { id: 'tx-1', operator: 'MTN', country: 'BJ' } as any;

describe('processWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdapter.mockReturnValue(mockAdapter as any);
    mockFindAttempt.mockResolvedValue(ATTEMPT);
    mockFindTx.mockResolvedValue(TX);
    mockUpdateAttempt.mockResolvedValue(undefined);
    mockUpdateTx.mockResolvedValue(undefined);
    mockAuditLog.mockResolvedValue({} as any);
  });

  it('returns IGNORED when signature invalid', async () => {
    mockAdapter.verifyWebhook.mockReturnValue(false);
    const result = await processWebhook('kkiapay', { transactionId: 'p1', status: 'SUCCESS' });
    expect(result.status).toBe('IGNORED');
  });

  it('returns IGNORED when no providerTxId in payload', async () => {
    mockAdapter.verifyWebhook.mockReturnValue(true);
    const result = await processWebhook('kkiapay', { event: 'unknown' });
    expect(result.status).toBe('IGNORED');
  });

  it('processes SUCCESS webhook', async () => {
    mockAdapter.verifyWebhook.mockReturnValue(true);
    const result = await processWebhook('kkiapay', { transactionId: 'ptx-1', status: 'SUCCESS' });
    expect(result.status).toBe('SUCCESS');
    expect(result.transactionId).toBe('tx-1');
  });

  it('processes FAILURE webhook', async () => {
    mockAdapter.verifyWebhook.mockReturnValue(true);
    const result = await processWebhook('kkiapay', { transactionId: 'ptx-1', status: 'FAILED' });
    expect(result.status).toBe('FAILED');
  });

  it('handles missing attempt gracefully', async () => {
    mockAdapter.verifyWebhook.mockReturnValue(true);
    mockFindAttempt.mockResolvedValue(null);
    const result = await processWebhook('kkiapay', { transactionId: 'unknown', status: 'SUCCESS' });
    expect(result.status).toBe('IGNORED');
  });
});
