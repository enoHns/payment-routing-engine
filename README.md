# payment-routing-engine

Score-based payment routing across multiple mobile money aggregators — West Africa.

Clone, plug in your aggregator adapters under `src/providers/`, and deploy.

---

Integrating mobile money ([GSMA, 2021](https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/wp-content/uploads/2021/03/GSMA_State-of-the-Industry-Report-on-Mobile-Money-2021_Full-report.pdf))

Cases
 in West Africa typically goes through aggregators. No single aggregator covers all operators across all countries, and when an incident hits — an operator-side interconnection issue, an aggregator outage, a specific corridor timing out — you have no fallback if you hardcoded one. Beyond availability, aggregators are not equivalent: success rates and latency differ by operator and shift over time.

This service applies a [weighted scoring model](https://en.wikipedia.org/wiki/Weighted_sum_model) per aggregator per operator corridor and routes each payment to the best available option. On retryable failure it falls back automatically down the ranked chain — the [circuit breaker](https://martinfowler.com/bliki/CircuitBreaker.html) logic is built in.

```
score = 0.5 × successRate + 0.3 × latencyScore + 0.2 × priorityScore
```

Scores derive from a 24h sliding window, cached 5 min in Redis, invalidated on each webhook. Cold start defaults to `0.5` across all components.

## Design decisions

**Async dispatch.** `POST /payment` returns `202` immediately; the aggregator call runs in a [BullMQ](https://docs.bullmq.io/) worker. Aggregator latency on West Africa corridors can reach several seconds — blocking the HTTP response for retries is not viable under load.

**Local operator registry.** Carrier detection uses longest-prefix match against `src/data/operatorRegistry.json`. No external DNS or API call per request — tradeoff is a manual update when operators add prefixes (a few times a year).

**Per-attempt traceability.** Each aggregator call is its own DB row with provider response, latency, and error code. Transaction and attempt records are decoupled, which keeps reconciliation clean regardless of how many fallbacks occurred.

## Getting started

```bash
cp .env.example .env
docker-compose up -d postgres redis
npm install
npx prisma migrate dev
npm run dev
```

## API

| Method | Path                    | Description                             |
|--------|-------------------------|-----------------------------------------|
| GET    | /health                 | DB + Redis liveness                     |
| POST   | /payment                | Initiate payment → `202 INITIATED`      |
| GET    | /transactions/:id       | Status + attempt history                |
| GET    | /transactions?phone=    | Lookup by phone                         |
| POST   | /webhook/:provider      | Aggregator callback (HMAC verified)     |
| GET    | /admin/metrics          | Live scores per aggregator/corridor     |

```jsonc
// POST /payment
{ "phone": "+22997000001", "amount": 5000, "currency": "XOF", "idempotencyKey": "uuid" }
// 202 → { "transactionId": "uuid", "status": "INITIATED" }
```

Final status via `webhookUrl` (request body) or poll `GET /transactions/:id`.

## License

MIT

## License

MIT
