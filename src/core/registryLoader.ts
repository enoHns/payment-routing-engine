/**
 * Thin wrapper around the static JSON registry.
 * In a future version this could pull live updates from a config service.
 */
import registry from '../data/operatorRegistry.json';

export interface OperatorDef {
  name: string;
  prefixes: string[];
}

export interface CountryDef {
  name: string;
  currency: string;
  operators: OperatorDef[];
}

export function getCountryDef(country: string): CountryDef | undefined {
  return (registry.countries as Record<string, CountryDef>)[country];
}

export function getSupportedCountries(): string[] {
  return Object.keys(registry.countries);
}

export function getRegistryVersion(): string {
  return registry.version;
}
