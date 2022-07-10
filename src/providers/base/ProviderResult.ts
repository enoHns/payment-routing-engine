export interface ProviderError {
  code: string;
  message: string;
  retryable: boolean;
}

export const PROVIDER_ERROR_CODES = {
  TIMEOUT:           'PROVIDER_TIMEOUT',
  NETWORK:           'PROVIDER_NETWORK_ERROR',
  INVALID_ACCOUNT:   'PROVIDER_INVALID_ACCOUNT',
  INSUFFICIENT_FUNDS:'PROVIDER_INSUFFICIENT_FUNDS',
  LIMIT_EXCEEDED:    'PROVIDER_LIMIT_EXCEEDED',
  DUPLICATE:         'PROVIDER_DUPLICATE_TRANSACTION',
  UNKNOWN:           'PROVIDER_UNKNOWN_ERROR',
} as const;

export type ProviderErrorCode = typeof PROVIDER_ERROR_CODES[keyof typeof PROVIDER_ERROR_CODES];

export function isRetryable(code: string): boolean {
  return (
    code === PROVIDER_ERROR_CODES.TIMEOUT ||
    code === PROVIDER_ERROR_CODES.NETWORK
  );
}
