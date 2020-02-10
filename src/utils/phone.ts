const CALLING_CODES: Record<string, string> = {
  BJ: '229',
  CI: '225',
  SN: '221',
  TG: '228',
  NE: '227',
  GN: '224',
  ML: '223',
  BF: '226',
  CM: '237',
  SL: '232',
};

/**
 * Normalize a phone number to local format (no country code, no separators).
 * E.g. "+22996123456" (BJ) → "96123456"
 */
export function normalizePhone(phone: string, country: string): string {
  let p = phone.replace(/[\s\-\.]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  const cc = CALLING_CODES[country];
  if (cc && p.startsWith(cc)) p = p.slice(cc.length);
  return p;
}

export function getCallingCode(country: string): string | undefined {
  return CALLING_CODES[country];
}
