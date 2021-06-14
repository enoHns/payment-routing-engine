# payment-routing-engine

West Africa mobile money payment routing engine.

## Stack

- **Runtime**: Node.js 12, TypeScript 4.3
- **Framework**: Fastify 3
- **ORM**: Prisma 2 + PostgreSQL 11
- **Queue**: BullMQ 1 + Redis 5
- **Validation**: Zod 3
- **Tests**: Jest 27

## Quick start

```bash
cp .env.example .env
docker-compose up -d postgres redis
npm install
npx prisma migrate dev
npm run dev
```

## API

| Method | Path                   | Description                          |
|--------|------------------------|--------------------------------------|
| GET    | /health                | Liveness + readiness                 |
| POST   | /payment               | Initiate a mobile money payment      |
| GET    | /transactions/:id      | Get transaction with attempts        |
| GET    | /transactions?phone=   | List transactions for a phone number |
| POST   | /webhook/:provider     | Receive provider payment callback    |
| GET    | /admin/metrics         | Provider scores summary              |

### POST /payment

```json
{
  "phone": "+22997000001",
  "amount": 5000,
  "currency": "XOF",
  "idempotencyKey": "uuid-optional",
  "webhookUrl": "https://your-app.com/payment-callback"
}
```

Response `202`:
```json
{ "transactionId": "uuid", "status": "INITIATED" }
```

### Routing pipeline

```
POST /payment
  → Zod validate
  → phone resolver   (operator detection from prefix)
  → idempotency check (findByIdempotencyKey)
  → createTransaction (status=INITIATED)
  → BullMQ job       (enqueueRoutingJob)

Worker picks up job:
  → buildFallbackChain (ordered providers by score)
  → adapter.initiatePayment
  → on retryable error → enqueue next provider

POST /webhook/:provider
  → adapter.verifyWebhook (HMAC or IP whitelist)
  → resolve attempt
  → update transaction status
  → recordAttemptOutcome → invalidate score cache
```

### Scoring formula

```
score = 0.5 × successRate + 0.3 × latencyScore + 0.2 × priorityScore
```

All components in [0, 1]. Cold start defaults to 0.5 per component.
Scores are cached in Redis with a 5-minute TTL and invalidated on each webhook.

### Supported countries & operators

| Country      | Code | Operators              |
|--------------|------|------------------------|
| Bénin        | BJ   | MTN, Moov, Celtiis     |
| Côte d'Ivoire| CI   | Orange, MTN, Moov      |
| Sénégal      | SN   | Orange, Free, Wave     |
| Togo         | TG   | Togocel, Moov          |
| Niger        | NE   | Airtel, Moov           |
