import providerConfig from '../data/providerConfig.json';

export interface ProviderConfig {
  name: string;
  displayName: string;
  supportedCountries: string[];
  supportedOperators: Record<string, string[]>;
  priority: number;
  active: boolean;
}

export function getEligibleProviders(country: string, operator: string): ProviderConfig[] {
  return (providerConfig.providers as unknown as ProviderConfig[])
    .filter(p => {
      if (!p.active) return false;
      if (!p.supportedCountries.includes(country)) return false;
      const ops = p.supportedOperators[country];
      return ops && ops.includes(operator);
    })
    .sort((a, b) => a.priority - b.priority);
}

export function getProviderByName(name: string): ProviderConfig | undefined {
  return (providerConfig.providers as unknown as ProviderConfig[]).find(p => p.name === name);
}

export function getAllActiveProviders(): ProviderConfig[] {
  return (providerConfig.providers as unknown as ProviderConfig[]).filter(p => p.active);
}
