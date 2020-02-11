import { normalizePhone, getCallingCode } from '../../src/utils/phone';

describe('normalizePhone', () => {
  it('strips leading + and country code', () => {
    expect(normalizePhone('+22996123456', 'BJ')).toBe('96123456');
  });

  it('strips country code without +', () => {
    expect(normalizePhone('22997001122', 'BJ')).toBe('97001122');
  });

  it('removes spaces', () => {
    expect(normalizePhone('96 12 34 56', 'BJ')).toBe('96123456');
  });

  it('removes dashes', () => {
    expect(normalizePhone('96-12-34-56', 'BJ')).toBe('96123456');
  });

  it('removes dots', () => {
    expect(normalizePhone('96.12.34.56', 'BJ')).toBe('96123456');
  });

  it('handles CI country code', () => {
    expect(normalizePhone('+2250712345678', 'CI')).toBe('0712345678');
  });

  it('does not strip if no country code present', () => {
    expect(normalizePhone('96123456', 'BJ')).toBe('96123456');
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
