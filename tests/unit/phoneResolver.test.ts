import { resolveOperator, normalizePhone } from '../../src/core/phoneResolver';

describe('phoneResolver — Bénin', () => {
  it('resolves MTN prefix 961', () => {
    expect(resolveOperator('96100001', 'BJ').operator).toBe('MTN');
  });

  it('resolves MTN prefix 967', () => {
    expect(resolveOperator('96700001', 'BJ').operator).toBe('MTN');
  });

  it('resolves Moov prefix 994', () => {
    expect(resolveOperator('99400001', 'BJ').operator).toBe('Moov');
  });

  it('resolves Moov prefix 998', () => {
    expect(resolveOperator('99800001', 'BJ').operator).toBe('Moov');
  });

  it('resolves Celtiis prefix 910', () => {
    expect(resolveOperator('91000001', 'BJ').operator).toBe('Celtiis');
  });

  it('normalizes local number to E.164', () => {
    const result = resolveOperator('96700001', 'BJ');
    expect(result.operator).toBe('MTN');
    expect(result.normalized).toBe('+22996700001');
  });

  it('accepts E.164 input (+229...)', () => {
    const result = resolveOperator('+22996700001', 'BJ');
    expect(result.operator).toBe('MTN');
    expect(result.normalized).toBe('+22996700001');
  });

  it('strips spaces from phone', () => {
    expect(resolveOperator('96 70 00 01', 'BJ').operator).toBe('MTN');
  });

  it('throws for unknown prefix in known country', () => {
    expect(() => resolveOperator('70000000', 'BJ')).toThrow('Unknown operator');
  });

  it('throws for unsupported country', () => {
    expect(() => resolveOperator('96700001', 'XX')).toThrow('Unsupported country');
  });
});

describe('phoneResolver — Côte d\'Ivoire', () => {
  it('resolves Orange CI prefix 225 07', () => {
    expect(resolveOperator('0712345678', 'CI').operator).toBe('Orange');
  });

  it('resolves MTN CI prefix 225 05', () => {
    expect(resolveOperator('0512345678', 'CI').operator).toBe('MTN');
  });

  it('resolves Moov CI prefix 225 01', () => {
    expect(resolveOperator('0112345678', 'CI').operator).toBe('Moov');
  });

  it('accepts E.164 CI input (+2250712345678)', () => {
    const result = resolveOperator('+2250712345678', 'CI');
    expect(result.operator).toBe('Orange');
    expect(result.normalized).toBe('+2250712345678');
  });
});

describe('normalizePhone', () => {
  it('strips separators, returns E.164 with country', () => {
    expect(normalizePhone('96-70-00-01', 'BJ')).toBe('+22996700001');
  });

  it('strips dots, returns E.164 with country', () => {
    expect(normalizePhone('96.70.00.01', 'BJ')).toBe('+22996700001');
  });
});

import { tryResolveOperator, isSupportedCountry } from '../../src/core/phoneResolver';

describe('tryResolveOperator', () => {
  it('returns result for valid phone', () => {
    expect(tryResolveOperator('96123456', 'BJ')).not.toBeNull();
  });

  it('returns null for unknown prefix', () => {
    expect(tryResolveOperator('70000000', 'BJ')).toBeNull();
  });

  it('returns null for unsupported country', () => {
    expect(tryResolveOperator('96123456', 'XX')).toBeNull();
  });
});

describe('isSupportedCountry', () => {
  it('returns true for BJ', () => {
    expect(isSupportedCountry('BJ')).toBe(true);
  });

  it('returns false for unknown', () => {
    expect(isSupportedCountry('XX')).toBe(false);
  });
});
