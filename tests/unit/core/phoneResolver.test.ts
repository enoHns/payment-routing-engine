import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/core/registryLoader', () => ({
  getCountryDef: vi.fn().mockReturnValue({
    name: 'Bénin', callingCode: '229',
    operators: [
      { name: 'MTN',  prefixes: ['229967', '229968'] },
      { name: 'Moov', prefixes: ['229994', '229995'] },
    ],
  }),
  getSupportedCountries: vi.fn().mockReturnValue(['BJ', 'CI', 'SN', 'TG', 'NE']),
  getRegistryVersion:    vi.fn().mockReturnValue('1.3.1'),
}));

import {
  resolveOperator,
  tryResolveOperator,
  isSupportedCountry,
} from '../../../src/core/phoneResolver';

describe('resolveOperator', () => {
  it('resolves MTN BJ', () => {
    const r = resolveOperator('+22996700001');
    expect(r.operator).toBe('MTN');
    expect(r.country).toBe('BJ');
  });
  it('resolves Moov BJ', () => {
    const r = resolveOperator('+22999400001');
    expect(r.operator).toBe('Moov');
  });
  it('throws for unknown prefix', () => {
    expect(() => resolveOperator('+22999900001')).toThrow();
  });
});

describe('tryResolveOperator', () => {
  it('returns null for unresolvable', () => {
    expect(tryResolveOperator('+33600000000')).toBeNull();
  });
  it('returns result for known prefix', () => {
    const r = tryResolveOperator('+22996700001');
    expect(r).not.toBeNull();
    expect(r?.operator).toBe('MTN');
  });
});

describe('isSupportedCountry', () => {
  it('returns true for BJ', () => { expect(isSupportedCountry('BJ')).toBe(true); });
  it('returns false for FR', () => { expect(isSupportedCountry('FR')).toBe(false); });
});
