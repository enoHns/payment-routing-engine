import { getEligibleProviders, getProviderByName, getAllActiveProviders } from '../../src/core/providerRegistry';

describe('getEligibleProviders', () => {
  it('returns providers for BJ / MTN', () => {
    const providers = getEligibleProviders('BJ', 'MTN');
    const names = providers.map(p => p.name);
    expect(names).toContain('kkiapay');
    expect(names).toContain('fedapay');
    expect(names).toContain('feexpay');
  });

  it('returns providers for CI / Orange', () => {
    const providers = getEligibleProviders('CI', 'Orange');
    const names = providers.map(p => p.name);
    expect(names).toContain('cinetpay');
    expect(names).toContain('feexpay');
  });

  it('returns no providers for unsupported combination', () => {
    const providers = getEligibleProviders('BJ', 'Wave');
    expect(providers).toHaveLength(0);
  });

  it('sorts by priority ascending', () => {
    const providers = getEligibleProviders('BJ', 'MTN');
    for (let i = 1; i < providers.length; i++) {
      expect(providers[i].priority).toBeGreaterThanOrEqual(providers[i - 1].priority);
    }
  });

  it('excludes inactive providers', () => {
    // All current providers are active — verify none is filtered with wrong data
    const providers = getEligibleProviders('SN', 'Orange');
    providers.forEach(p => expect(p.active).toBe(true));
  });
});

describe('getProviderByName', () => {
  it('finds kkiapay', () => {
    const p = getProviderByName('kkiapay');
    expect(p).toBeDefined();
    expect(p!.displayName).toBe('Kkiapay');
  });

  it('returns undefined for unknown provider', () => {
    expect(getProviderByName('unknown')).toBeUndefined();
  });
});

describe('getAllActiveProviders', () => {
  it('returns all 5 active providers', () => {
    expect(getAllActiveProviders()).toHaveLength(5);
  });
});
