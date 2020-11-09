jest.mock('../../../src/db/repositories/metricsRepo', () => ({
  upsertMetricWindow: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../src/core/scoreCache', () => ({
  invalidateScore: jest.fn().mockResolvedValue(undefined),
}));

import { recordAttemptOutcome, getCurrentWindowStart } from '../../../src/core/metricsUpdater';
import { upsertMetricWindow } from '../../../src/db/repositories/metricsRepo';
import { invalidateScore } from '../../../src/core/scoreCache';

describe('getCurrentWindowStart', () => {
  it('returns a date with 0 minutes and seconds', () => {
    const w = getCurrentWindowStart();
    expect(w.getMinutes()).toBe(0);
    expect(w.getSeconds()).toBe(0);
    expect(w.getMilliseconds()).toBe(0);
  });
});

describe('recordAttemptOutcome', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls upsertMetricWindow with SUCCESS', async () => {
    await recordAttemptOutcome('kkiapay', 'MTN', 'BJ', true, 2500);
    expect(upsertMetricWindow).toHaveBeenCalledWith(
      'kkiapay', 'MTN', 'BJ', expect.any(Date), 'SUCCESS', 2500,
    );
  });

  it('calls upsertMetricWindow with FAILURE', async () => {
    await recordAttemptOutcome('fedapay', 'Moov', 'BJ', false);
    expect(upsertMetricWindow).toHaveBeenCalledWith(
      'fedapay', 'Moov', 'BJ', expect.any(Date), 'FAILURE', undefined,
    );
  });

  it('invalidates score cache after recording', async () => {
    await recordAttemptOutcome('kkiapay', 'MTN', 'BJ', true, 3000);
    expect(invalidateScore).toHaveBeenCalledWith('kkiapay', 'MTN', 'BJ');
  });
});
