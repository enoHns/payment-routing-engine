import { getCountryDef } from './registryLoader';
import { normalizePhone } from '../utils/phone';
import logger from '../config/logger';

export { normalizePhone } from '../utils/phone';

export interface ResolveResult {
  operator: string;
  country: string;
  normalized: string;
}

function buildCandidates(operators: Array<{ name: string; prefixes: string[] }>) {
  const candidates: Array<{ operator: string; prefix: string }> = [];
  for (const op of operators) {
    for (const prefix of op.prefixes) {
      candidates.push({ operator: op.name, prefix });
    }
  }
  return candidates.sort((a, b) => b.prefix.length - a.prefix.length);
}

export function resolveOperator(phone: string, country: string): ResolveResult {
  const countryDef = getCountryDef(country);
  if (!countryDef) throw new Error(`Unsupported country: ${country}`);

  const normalized = normalizePhone(phone, country);
  // Prefix matching uses digits only (no leading '+')
  const forMatch = normalized.startsWith('+') ? normalized.slice(1) : normalized;
  const candidates = buildCandidates(countryDef.operators);

  for (const { operator, prefix } of candidates) {
    if (forMatch.startsWith(prefix)) {
      logger.debug({ normalized, operator, country }, 'Operator resolved');
      return { operator, country, normalized };
    }
  }

  throw new Error(`Unknown operator for phone ${normalized} in ${country}`);
}

export function tryResolveOperator(phone: string, country: string): ResolveResult | null {
  try {
    return resolveOperator(phone, country);
  } catch {
    logger.warn({ phone, country }, 'Could not resolve operator');
    return null;
  }
}

export function isSupportedCountry(country: string): boolean {
  return getCountryDef(country) !== undefined;
}
