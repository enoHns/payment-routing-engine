jest.mock('../../../src/providers/adapterFactory');
jest.mock('../../../src/db/repositories/attemptRepo');
jest.mock('../../../src/db/repositories/transactionRepo');
jest.mock('../../../src/db/repositories/auditLogRepo');
jest.mock('../../../src/core/metricsUpdater');

import { processWebhook } from '../../../src/handlers/webhookHandler';
import { getAdapter } from '../../../src/providers/adapterFactory';
import { findAttemptByProviderTxId, updateAttempt } from '../../../src/db/repositories/attemptRepo';
import { updateTransactionStatus, findTransactionById } from '../../../src/db/repositories/transactionRepo';
import { createAuditLog } from '../../../src/db/repositories/auditLogRepo';

const mockGetAdapter    = getAdapter as jest.MockedFunction<typeof getAdapter>;
const mockFindAttempt   = findAttemptByProviderTxId as jest.MockedFunction<typeof findAttemptByProviderTxId>;
const mockFindTx        = findTransactionById as jest.MockedFunction<typeof findTransactionById>;
const mockUpdateAttempt = updateAttempt as jest.MockedFunction<typeof updateAttempt>;
const mockUpdateTx      = updateTransactionStatus as jest.MockedFunction<typeof updateTransactionStatus>;
const mockAuditLog      = createAuditLog as jest.MockedFunction<typeof createAuditLog>;

const mockAdapter = { name: 'kkiapay', verifyWebhook: jest.fn(), initiatePayment: jest.fn() };
const ATTEMPT = { id: 'attempt-1', transactionId: 'tx-1', providerName: 'kkiapay', createdAt: new Date() } as any;
const TX = { id: 'tx-1', operator: 'MTN', country: 'BJ' } as any;

describe('processWebhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
