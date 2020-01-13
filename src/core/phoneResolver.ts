import registry from '../data/operatorRegistry.json';
import logger from '../config/logger';

export interface ResolveResult {
  operator: string;
  country: string;
  normalized: string;
}

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

export function normalizePhone(phone: string, country: string): string {
  let p = phone.replace(/[\s\-\.]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  const cc = CALLING_CODES[country];
  if (cc && p.startsWith(cc)) p = p.slice(cc.length);
  return p;
}

export function resolveOperator(phone: string, country: string): ResolveResult {
  const countryData = (registry.countries as Record<string, any>)[country];
  if (!countryData) throw new Error(`Unsupported country: ${country}`);

  const normalized = normalizePhone(phone, country);

  // Sort prefixes by length descending — longest match wins
  const candidates: Array<{ operator: string; prefix: string }> = [];
  for (const op of countryData.operators) {
    for (const prefix of op.prefixes as string[]) {
      candidates.push({ operator: op.name, prefix });
    }
  }
  candidates.sort((a, b) => b.prefix.length - a.prefix.length);

  for (const { operator, prefix } of candidates) {
    if (normalized.startsWith(prefix)) {
      logger.debug({ normalized, operator, country }, 'Operator resolved');
      return { operator, country, normalized };
    }
  }

  throw new Error(`Unknown operator for phone ${normalized} in ${country}`);
}
