export {
  resolveOperator,
  tryResolveOperator,
  normalizePhone,
  isSupportedCountry,
} from './phoneResolver';
export type { ResolveResult } from './phoneResolver';

export {
  getEligibleProviders,
  getProviderByName,
  getAllActiveProviders,
} from './providerRegistry';
export type { ProviderConfig } from './providerRegistry';
