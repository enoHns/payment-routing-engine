export interface InitiatePaymentBody {
  phone:          string;
  country:        string;
  amount:         number;
  currency:       string;
  idempotencyKey?: string;
  webhookUrl?:    string;
}

export interface InitiatePaymentResponse {
  transactionId: string;
  status:        'INITIATED';
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
