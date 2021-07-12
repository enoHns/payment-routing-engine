import { normalizePhone, getCallingCode, getCountryFromCallingCode } from '../../../src/utils/phone';

describe('normalizePhone', () => {
  it('returns E.164 unchanged', () => {
    expect(normalizePhone('+22997000001')).toBe('+22997000001');
  });
  it('replaces 00 prefix with +', () => {
    expect(normalizePhone('0022997000001')).toBe('+22997000001');
  });
  it('strips spaces and hyphens', () => {
    expect(normalizePhone('+229 97 00 00 01')).toBe('+22997000001');
    expect(normalizePhone('+229-97-000-001')).toBe('+22997000001');
  });
  it('strips parentheses and dots', () => {
    expect(normalizePhone('+229(97)000.001')).toBe('+22997000001');
  });
  it('returns local number unchanged when no prefix', () => {
    expect(normalizePhone('97000001')).toBe('97000001');
  });
});

describe('getCallingCode', () => {
  it('returns BJ code', () => { expect(getCallingCode('BJ')).toBe('229'); });
  it('returns CI code', () => { expect(getCallingCode('CI')).toBe('225'); });
  it('is case-insensitive', () => { expect(getCallingCode('sn')).toBe('221'); });
  it('returns undefined for unknown', () => { expect(getCallingCode('ZZ')).toBeUndefined(); });
});

describe('getCountryFromCallingCode', () => {
  it('resolves 229 to BJ', () => { expect(getCountryFromCallingCode('229')).toBe('BJ'); });
  it('resolves 225 to CI', () => { expect(getCountryFromCallingCode('225')).toBe('CI'); });
  it('returns undefined for unknown', () => { expect(getCountryFromCallingCode('000')).toBeUndefined(); });
});
