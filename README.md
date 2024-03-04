# payment-routing-engine

A boilerplate for routing mobile money payments across multiple aggregators in West Africa.

## The problem

After integrating several mobile money aggregators for different clients, a recurring pattern became obvious: depending on a single aggregator is a fragility you will eventually pay for in production.

The failures are rarely your own. An operator can have a degraded interconnection with a specific aggregator — payments go through for customers on one network, not for others. An aggregator can have an incident on their infrastructure. API timeouts can spike on a specific corridor for no clear reason. When this happens, the integration that worked fine yesterday starts silently failing, and there is nothing to do on your side except wait or manually switch to another aggregator.

The deeper issue is that even without incidents, aggregators are not equivalent. Success rates differ by operator, latency varies, and the best option at 9am is not necessarily the best at 9pm.

## The solution

This project is a standalone routing service you deploy alongside your application. It exposes a single endpoint to initiate a payment, resolves the operator from the phone number, and decides which aggregator to use based on recent performance data. If the selected aggregator fails with a retryable error, it automatically falls back to the next best option — transparently, without the caller retrying.

The routing decision is based on a score computed per aggregator per operator corridor:

```
score = 0.5 × successRate + 0.3 × latencyScore + 0.2 × priorityScore
```

Scores are derived from a sliding 24-hour window of attempt outcomes, cached in Redis for 5 minutes, and invalidated on each webhook callback. On cold start, every aggregator defaults to 0.5 so none is penalised before it has had a chance to process requests.

## Design decisions

**Async by default.** `POST /payment` responds `202 INITIATED` immediately and delegates the actual aggregator call to a background worker (BullMQ). This decouples your API response time from aggregator latency and retry logic. The final outcome is communicated via webhook or available at `GET /transactions/:id`.

The alternative — doing the aggregator call synchronously and blocking the HTTP response — was considered but ruled out. Aggregator latency on the West Africa corridor can range from 300ms to several seconds, and holding the connection open for retries would make the endpoint unpredictable under load.

**Local operator registry.** Carrier detection is done by longest-prefix match against a JSON file embedded in the service (`src/data/operatorRegistry.json`). No external lookup on every payment request. The tradeoff is that the file needs to be kept current when operators add new number ranges — but in practice that happens a few times a year and is a one-line change.

**Full traceability.** Every routing decision, aggregator attempt, fallback, and webhook callback is persisted separately. A transaction record holds the final status; each attempt against an aggregator is its own row with its provider response, latency, and error code if any. This makes reconciliation straightforward and keeps audit trails clean even when multiple aggregators were tried for the same payment.

## What this is

This is a **boilerplate**, not an npm package. You clone it, add your aggregator adapters under `src/providers/`, register them in `src/data/providerConfig.json`, and deploy it. The routing logic, scoring, fallback chain, and traceability infrastructure are already wired up.

## Getting started

```bash
cp .env.example .env
# fill in DATABASE_URL, REDIS_URL, and your aggregator credentials

docker-compose up -d postgres redis
npm install
npx prisma migrate dev
npm run dev
```

## API

| Method | Path                     | Description                              |
|--------|--------------------------|------------------------------------------|
| GET    | /health                  | DB + Redis liveness check                |
| POST   | /payment                 | Initiate a payment                       |
| GET    | /transactions/:id        | Transaction status + attempt history     |
| GET    | /transactions?phone=     | Transaction list by phone number         |
| POST   | /webhook/:provider       | Aggregator callback (HMAC verified)      |
| GET    | /admin/metrics           | Per-aggregator scores and success rates  |

```json
// POST /payment
{
  "phone":          "+22997000001",
  "amount":         5000,
  "currency":       "XOF",
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
}
// 202 → { "transactionId": "uuid", "status": "INITIATED" }
```

Final status is delivered to the `webhookUrl` you pass in the request body, or you can poll `GET /transactions/:id`.
