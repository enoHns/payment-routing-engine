import registry from '../data/operatorRegistry.json';
import { normalizePhone } from '../utils/phone';
import logger from '../config/logger';

export { normalizePhone } from '../utils/phone';

export interface ResolveResult {
  operator: string;
  country: string;
  normalized: string;
}

function buildCandidates(countryData: any): Array<{ operator: string; prefix: string }> {
  const candidates: Array<{ operator: string; prefix: string }> = [];
  for (const op of countryData.operators) {
    for (const prefix of op.prefixes as string[]) {
      candidates.push({ operator: op.name, prefix });
    }
  }
  return candidates.sort((a, b) => b.prefix.length - a.prefix.length);
}

export function resolveOperator(phone: string, country: string): ResolveResult {
  const countryData = (registry.countries as Record<string, any>)[country];
  if (!countryData) throw new Error(`Unsupported country: ${country}`);

  const normalized = normalizePhone(phone, country);
  const candidates = buildCandidates(countryData);

  for (const { operator, prefix } of candidates) {
    if (normalized.startsWith(prefix)) {
      logger.debug({ normalized, operator, country }, 'Operator resolved');
      return { operator, country, normalized };
    }
  }

  throw new Error(`Unknown operator for phone ${normalized} in ${country}`);
}

/**
 * Safe variant — returns null instead of throwing.
 * Useful for logging unrecognised numbers without crashing the pipeline.
 */
export function tryResolveOperator(phone: string, country: string): ResolveResult | null {
  try {
    return resolveOperator(phone, country);
  } catch {
    logger.warn({ phone, country }, 'Could not resolve operator');
    return null;
  }
}

export function isSupportedCountry(country: string): boolean {
  return Object.prototype.hasOwnProperty.call(registry.countries, country);
}
