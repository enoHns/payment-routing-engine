import { ProviderAdapter } from './base/ProviderAdapter';
import { KkiapayAdapter }  from './kkiapay/KkiapayAdapter';
import { FedapayAdapter }  from './fedapay/FedapayAdapter';
import { CinetpayAdapter } from './cinetpay/CinetpayAdapter';
import { FeexpayAdapter }  from './feexpay/FeexpayAdapter';
import { PaydunyaAdapter } from './paydunya/PaydunyaAdapter';

const registry: Record<string, ProviderAdapter> = {
  kkiapay:  new KkiapayAdapter(),
  fedapay:  new FedapayAdapter(),
  cinetpay: new CinetpayAdapter(),
  feexpay:  new FeexpayAdapter(),
  paydunya: new PaydunyaAdapter(),
};

export function getAdapter(providerName: string): ProviderAdapter {
  const adapter = registry[providerName];
  if (!adapter) throw new Error(`No adapter registered for provider: ${providerName}`);
  return adapter;
}

export function listAdapters(): string[] {
  return Object.keys(registry);
}
