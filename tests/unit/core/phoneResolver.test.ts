import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/core/registryLoader', () => {
  const BJ_DEF = {
    name: 'Bénin', callingCode: '229',
    operators: [
      // 7-char prefixes = new 10-digit format (since Sept 12, 2022: +229 01XXXXXXXX)
      // 5-char prefixes = old 8-digit format (+229 XXXXXXXX)
      { name: 'MTN',  prefixes: ['2290161', '2290196', '2290197', '22961', '22967', '22996', '22997'] },
      { name: 'Moov', prefixes: ['2290164', '2290168', '22964', '22994', '22999'] },
    ],
  };
  const KNOWN = ['BJ', 'CI', 'SN', 'TG', 'NE'];
  return {
    getCountryDef:         vi.fn().mockImplementation((c: string) => KNOWN.includes(c) ? BJ_DEF : undefined),
    getSupportedCountries: vi.fn().mockReturnValue(KNOWN),
    getRegistryVersion:    vi.fn().mockReturnValue('1.3.2'),
  };
});

import {
  resolveOperator,
  tryResolveOperator,
  isSupportedCountry,
} from '../../../src/core/phoneResolver';

describe('resolveOperator', () => {
  it('resolves MTN BJ (old 8-digit format)', () => {
    const r = resolveOperator('+22996700001', 'BJ');
    expect(r.operator).toBe('MTN');
    expect(r.country).toBe('BJ');
  });
  it('resolves MTN BJ (new 10-digit format, since Sept 2022)', () => {
    const r = resolveOperator('+2290161000000', 'BJ');
    expect(r.operator).toBe('MTN');
  });
  it('resolves Moov BJ', () => {
    const r = resolveOperator('+22999400001', 'BJ');
    expect(r.operator).toBe('Moov');
  });
  it('throws for unknown prefix', () => {
    // +22970XXXXXXX — prefix 22970 is not assigned to any BJ operator
    expect(() => resolveOperator('+22970000001', 'BJ')).toThrow();
  });
});

describe('tryResolveOperator', () => {
  it('returns null for unresolvable', () => {
    expect(tryResolveOperator('+33600000000', 'FR')).toBeNull();
  });
  it('returns result for known prefix', () => {
    const r = tryResolveOperator('+22996700001', 'BJ');
    expect(r).not.toBeNull();
    expect(r?.operator).toBe('MTN');
  });
});

describe('isSupportedCountry', () => {
  it('returns true for BJ', () => { expect(isSupportedCountry('BJ')).toBe(true); });
  it('returns false for FR', () => { expect(isSupportedCountry('FR')).toBe(false); });
});
