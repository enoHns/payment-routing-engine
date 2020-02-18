import { resolveOperator, normalizePhone } from '../../src/core/phoneResolver';

describe('phoneResolver — Bénin', () => {
  it('resolves MTN prefix 96', () => {
    expect(resolveOperator('96123456', 'BJ').operator).toBe('MTN');
  });

  it('resolves MTN prefix 97', () => {
    expect(resolveOperator('97456789', 'BJ').operator).toBe('MTN');
  });

  it('resolves Moov prefix 98', () => {
    expect(resolveOperator('98001234', 'BJ').operator).toBe('Moov');
  });

  it('resolves Moov prefix 64', () => {
    expect(resolveOperator('64112233', 'BJ').operator).toBe('Moov');
  });

  it('resolves Celtiis prefix 68', () => {
    expect(resolveOperator('68001122', 'BJ').operator).toBe('Celtiis');
  });

  it('strips country code +229', () => {
    const result = resolveOperator('+22996123456', 'BJ');
    expect(result.operator).toBe('MTN');
    expect(result.normalized).toBe('96123456');
  });

  it('strips country code without +', () => {
    expect(resolveOperator('22997001122', 'BJ').normalized).toBe('97001122');
  });

  it('strips spaces from phone', () => {
    expect(resolveOperator('96 12 34 56', 'BJ').operator).toBe('MTN');
  });

  it('throws for unknown prefix in known country', () => {
    expect(() => resolveOperator('70000000', 'BJ')).toThrow('Unknown operator');
  });

  it('throws for unsupported country', () => {
    expect(() => resolveOperator('96123456', 'XX')).toThrow('Unsupported country');
  });
});

describe('phoneResolver — Côte d\'Ivoire', () => {
  it('resolves Orange CI prefix 07', () => {
    expect(resolveOperator('0712345678', 'CI').operator).toBe('Orange');
  });

  it('resolves MTN CI prefix 05', () => {
    expect(resolveOperator('0512345678', 'CI').operator).toBe('MTN');
  });

  it('resolves Moov CI prefix 01', () => {
    expect(resolveOperator('0112345678', 'CI').operator).toBe('Moov');
  });

  it('strips CI country code +225', () => {
    const result = resolveOperator('+2250712345678', 'CI');
    expect(result.operator).toBe('Orange');
    expect(result.normalized).toBe('0712345678');
  });
});

describe('normalizePhone', () => {
  it('removes dashes', () => {
    expect(normalizePhone('96-12-34-56', 'BJ')).toBe('96123456');
  });

  it('removes dots', () => {
    expect(normalizePhone('96.12.34.56', 'BJ')).toBe('96123456');
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
