import { AxiosError } from 'axios';
import { PROVIDER_ERROR_CODES } from '../providers/base/ProviderResult';

export interface NormalizedError {
  code: string;
  message: string;
  retryable: boolean;
  httpStatus?: number;
}

export function normalizeProviderError(err: unknown): NormalizedError {
  if ((err as AxiosError).isAxiosError) {
    const axErr = err as AxiosError;
    if (axErr.code === 'ECONNABORTED' || axErr.code === 'ETIMEDOUT') {
      return { code: PROVIDER_ERROR_CODES.TIMEOUT, message: 'Provider request timed out', retryable: true };
    }
    if (!axErr.response) {
      return { code: PROVIDER_ERROR_CODES.NETWORK, message: 'Network error', retryable: true };
    }
    const status = axErr.response.status;
    if (status === 402) {
      return { code: PROVIDER_ERROR_CODES.INSUFFICIENT_FUNDS, message: 'Insufficient funds', retryable: false };
    }
    if (status === 409) {
      return { code: PROVIDER_ERROR_CODES.DUPLICATE, message: 'Duplicate transaction', retryable: false };
    }
    return { code: PROVIDER_ERROR_CODES.UNKNOWN, message: axErr.message, retryable: false, httpStatus: status };
  }
  const message = err instanceof Error ? err.message : String(err);
  return { code: PROVIDER_ERROR_CODES.UNKNOWN, message, retryable: false };
}
