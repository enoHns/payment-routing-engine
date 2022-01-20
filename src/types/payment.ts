export interface InitiatePaymentBody {
  phone:           string;
  country:         string;
  amount:          number;
  currency:        string;
  idempotencyKey?: string;
  webhookUrl?:     string;
  /**
   * Set to false to exclude REDIRECT-type providers (hosted checkout) from
   * the fallback chain.  Useful for server-to-server integrations that cannot
   * handle a browser redirect.  Defaults to true.
   */
  redirectAllowed?: boolean;
}

export interface InitiatePaymentResponse {
  transactionId: string;
  status:        'INITIATED' | 'REQUIRES_REDIRECT';
  /**
   * Only present when the selected provider is of REDIRECT type.
   * The merchant's frontend must open this URL so the customer can complete
   * payment through the provider's hosted checkout widget.
   */
  checkoutUrl?:  string;
}

export interface TransactionResponse {
  id:             string;
  phone:          string;
  country:        string;
  operator:       string;
  amount:         number;
  currency:       string;
  status:         string;
  createdAt:      string;
  updatedAt:      string;
  attempts?:      AttemptResponse[];
}

export interface AttemptResponse {
  id:           string;
  providerName: string;
  status:       string;
  latencyMs?:   number | null;
  createdAt:    string;
}
