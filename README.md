# payment-routing-engine

Score-based mobile money payment routing engine for West Africa.

## Stack

| Component  | Library                   | Version |
|------------|---------------------------|---------|
| Runtime    | Node.js                   | 20 LTS  |
| Language   | TypeScript                | 5.3     |
| HTTP       | Fastify                   | 4.x     |
| ORM        | Prisma                    | 5.x     |
| Database   | PostgreSQL                | 11+     |
| Queue      | BullMQ                    | 5.x     |
| Cache      | Redis / ioredis           | 5.x     |
| Validation | Zod                       | 3.x     |
| Tests      | Vitest                    | 1.x     |
| Logging    | Pino                      | 8.x     |

## Quick start

```bash
cp .env.example .env
docker-compose up -d postgres redis
npm install
npx prisma migrate dev
npm run dev
```

## API reference

| Method | Path                  | Description                             |
|--------|-----------------------|-----------------------------------------|
| GET    | /health               | DB + Redis liveness check               |
| POST   | /payment              | Initiate mobile money payment           |
| GET    | /transactions/:id     | Transaction detail + attempts           |
| GET    | /transactions?phone=  | Transactions by phone number            |
| POST   | /webhook/:provider    | Provider payment callback (HMAC signed) |
| GET    | /admin/metrics        | Provider scores and success rates       |

### POST /payment

```json
{
  "phone":          "+22997000001",
  "amount":         5000,
  "currency":       "XOF",
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
  "webhookUrl":     "https://your-app.com/notify"
}
```

Response `202`:
```json
{ "transactionId": "uuid", "status": "INITIATED" }
```

## Architecture

```
POST /payment
  → Zod validate
  → Phone → country + operator (longest prefix match)
  → Idempotency check
  → createTransaction (INITIATED)
  → enqueueRoutingJob → BullMQ

BullMQ Worker (×3)
  → buildFallbackChain
      getEligibleProviders(country, operator)
      computeProviderScore (success + latency + priority)
      sort descending, exclude already-tried
  → adapter.initiatePayment
  → on retryable error → enqueue next provider

POST /webhook/:provider
  → adapter.verifyWebhook (HMAC or IP whitelist)
  → findAttemptByProviderTxId
  → updateAttempt + updateTransactionStatus
  → recordAttemptOutcome → invalidate score cache
```

## Scoring formula

```
score = 0.5 × successRate + 0.3 × latencyScore + 0.2 × priorityScore
```

- `successRate`: successes / total attempts over last 24h windows
- `latencyScore`: 1 - avg_ms / 5000, clamped to [0, 1]
- `priorityScore`: normalized inverse of provider priority (1 = best)
- Cold start defaults: 0.5 per component
- Scores cached in Redis (5min TTL), invalidated on each webhook

## Supported countries

| Country       | Code | Operators          |
|---------------|------|--------------------|
| Bénin         | BJ   | MTN, Moov, Celtiis |
| Côte d'Ivoire | CI   | Orange, MTN, Moov  |
| Sénégal       | SN   | Orange, Free, Wave |
| Togo          | TG   | Togocel, Moov      |
| Niger         | NE   | Airtel, Moov       |

## Supported providers

| Provider | Countries      | Webhook auth   |
|----------|----------------|----------------|
| Kkiapay  | BJ             | HMAC-SHA256    |
| Fedapay  | BJ             | HMAC-SHA512    |
| Cinetpay | CI, SN, TG     | IP whitelist   |
| Feexpay  | BJ, CI, TG, SN | HMAC-SHA256    |
| Paydunya | SN, CI, NE     | HMAC-SHA256    |
