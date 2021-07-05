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
 * Already in E.164: returned as-is.
 * Starts with 00: 00 → +
 * Otherwise: assumed local (no prefix); kept unchanged (caller should add calling code).
 */
export function normalizePhone(phone: string): string {
  const stripped = phone.replace(/[\s\-().]/g, '');
  if (stripped.startsWith('+')) return stripped;
  if (stripped.startsWith('00')) return '+' + stripped.slice(2);
  return stripped;
}

export function getCallingCode(countryCode: string): string | undefined {
  return CALLING_CODES[countryCode.toUpperCase()];
}

export function getCountryFromCallingCode(code: string): string | undefined {
  return COUNTRY_FROM_CODE[code];
}
