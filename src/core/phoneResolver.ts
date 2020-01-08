import registry from '../data/operatorRegistry.json';
import logger from '../config/logger';

export interface ResolveResult {
  operator: string;
  country: string;
  normalized: string;
}

// Normalize to E.164-ish local format: strip leading +, country code
function normalize(phone: string, countryCode: string): string {
  // Remove spaces, dashes, dots
  let p = phone.replace(/[\s\-\.]/g, '');

  // Strip leading +
  if (p.startsWith('+')) {
    p = p.slice(1);
  }

  // Strip country calling code if present
  const callingCodes: Record<string, string> = {
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

  const cc = callingCodes[countryCode];
  if (cc && p.startsWith(cc)) {
    p = p.slice(cc.length);
  }

  return p;
}

export function resolveOperator(phone: string, country: string): ResolveResult {
  const countryData = (registry.countries as Record<string, any>)[country];
  if (!countryData) {
    throw new Error(`Unsupported country: ${country}`);
  }

  const normalized = normalize(phone, country);

  for (const op of countryData.operators) {
    for (const prefix of op.prefixes) {
      if (normalized.startsWith(prefix)) {
        logger.debug({ phone: normalized, operator: op.name, country }, 'Operator resolved');
        return { operator: op.name, country, normalized };
      }
    }
  }

  throw new Error(`Unknown operator for phone ${normalized} in ${country}`);
}
