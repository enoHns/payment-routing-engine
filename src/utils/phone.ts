export const CALLING_CODES: Record<string, string> = {
  BJ: '229', CI: '225', SN: '221', TG: '228',
  NE: '227', BF: '226', ML: '223', GN: '224',
  CM: '237', GH: '233',
};

const COUNTRY_FROM_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(CALLING_CODES).map(([c, code]) => [code, c]),
);

/**
 * Normalize to E.164 format (+<calling_code><number>).
 * - Already in E.164 (+...): returned as-is.
 * - Starts with 00: 00 replaced by +.
 * - If country is provided and phone looks local (no prefix): calling code prepended.
 * - Otherwise: returned as-is (caller responsible for further normalisation).
 */
export function normalizePhone(phone: string, country?: string): string {
  const stripped = phone.replace(/[\s\-().]/g, '');
  if (stripped.startsWith('+')) return stripped;
  if (stripped.startsWith('00')) return '+' + stripped.slice(2);
  if (country) {
    const callingCode = getCallingCode(country);
    if (callingCode) return `+${callingCode}${stripped}`;
  }
  return stripped;
}

export function getCallingCode(countryCode: string): string | undefined {
  return CALLING_CODES[countryCode.toUpperCase()];
}

export function getCountryFromCallingCode(code: string): string | undefined {
  return COUNTRY_FROM_CODE[code];
}
