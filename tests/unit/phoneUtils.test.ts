import { normalizePhone, getCallingCode } from '../../src/utils/phone';

describe('normalizePhone', () => {
  it('returns E.164 unchanged if already in E.164 format', () => {
    expect(normalizePhone('+22996700001', 'BJ')).toBe('+22996700001');
  });

  it('converts local number to E.164 when country provided', () => {
    expect(normalizePhone('96700001', 'BJ')).toBe('+22996700001');
  });

  it('removes spaces before converting to E.164', () => {
    expect(normalizePhone('96 70 00 01', 'BJ')).toBe('+22996700001');
  });

  it('removes dashes before converting to E.164', () => {
    expect(normalizePhone('96-70-00-01', 'BJ')).toBe('+22996700001');
  });

  it('removes dots before converting to E.164', () => {
    expect(normalizePhone('96.70.00.01', 'BJ')).toBe('+22996700001');
  });

  it('handles CI country code', () => {
    expect(normalizePhone('0712345678', 'CI')).toBe('+2250712345678');
  });

  it('returns stripped number as-is when no country and no prefix', () => {
    expect(normalizePhone('96700001')).toBe('96700001');
  });
});

describe('getCallingCode', () => {
  it('returns 229 for BJ', () => {
    expect(getCallingCode('BJ')).toBe('229');
  });

  it('returns undefined for unknown country', () => {
    expect(getCallingCode('XX')).toBeUndefined();
  });
});
