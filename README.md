# payment-routing-engine

Score-based payment routing across multiple mobile money aggregators — West Africa.

Clone, plug in your aggregator adapters under `src/providers/`, and deploy.

---

Integrating mobile money payments in your app ([GSMA, 2026](https://www.gsma.com/sotir/wp-content/plugins/plugin_gsma_sotir/reports/The-State-of-the-Industry-Report-2026_English.pdf)) often means picking one aggregator and integrating it. That works until it doesn't:

- some aggregators don't support all the operators your users are on
- when a corridor degrades or an aggregator has issues, you have no routing alternative on your side
- with multiple aggregators integrated, there's no standard way to decide which one to use at a given time

This service adds a routing layer on top of your aggregators: it scores them per operator corridor using a [weighted scoring model](https://en.wikipedia.org/wiki/Weighted_sum_model), routes to the best available option, and falls back automatically on retryable failure — [circuit breaker](https://martinfowler.com/bliki/CircuitBreaker.html) built in.

---

Scores derive from a 24h sliding window, cached 5 min in Redis, invalidated on each webhook. Cold start defaults to `0.5` across all components.

## Provider integration model

Payment aggregators in West Africa differ in how they expose payment collection to merchants.

### DIRECT providers — server-initiated collection

These aggregators expose a server-to-server REST API. The backend sends a collection request with the customer's phone number and amount; the aggregator forwards it to the operator, which delivers a confirmation prompt to the customer (USSD push for MTN MoMo/Moov/Orange Money, in-app notification for Wave and similar app-based wallets). The result comes back via webhook.

| Provider  | Countries                   |
|-----------|-----------------------------|
| FedaPay   | BJ                          |
| CinetPay  | CI, SN, TG, BF, CM         |
| FeexPay   | BJ, CI, TG, SN             |
| PayDunya  | SN, CI, BF, ML, NE         |

### REDIRECT providers — hosted checkout

Some aggregators do not publish a server-side collection API. KKiaPay is an example: there is no endpoint to initiate a payment programmatically. Instead, the engine generates a signed URL pointing to KKiaPay's hosted checkout page; the merchant's frontend opens it so the customer can complete the payment there.

When a REDIRECT provider is selected, `POST /payment` returns a `checkoutUrl` alongside the transaction ID:

```jsonc
// DIRECT provider selected
{ "transactionId": "uuid", "status": "INITIATED" }

// REDIRECT provider selected (e.g. KKiaPay)
{ "transactionId": "uuid", "status": "REQUIRES_REDIRECT", "checkoutUrl": "https://app.kkiapay.me?..." }
```

Pass `"redirectAllowed": false` to exclude REDIRECT providers from the fallback chain (useful for server-to-server flows that cannot handle a browser redirect).

---

## Design decisions

**Async dispatch.** `POST /payment` returns `202` immediately; the aggregator call runs in a [BullMQ](https://docs.bullmq.io/) worker. This decouples the HTTP response from the actual processing time and retry logic — the caller gets a predictable response regardless of what happens downstream.

**Local operator registry.** Carrier detection uses longest-prefix match against `src/data/operatorRegistry.json`. No external DNS or API call per request — tradeoff is a manual update when operators add prefixes (a few times a year). The registry covers both the old 8-digit Benin format and the new 10-digit format introduced by ARCEP on September 12, 2022 (prepend `01` to all local numbers).

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

| Method | Path                    | Description                                          |
|--------|-------------------------|------------------------------------------------------|
| GET    | /health                 | DB + Redis liveness                                  |
| POST   | /payment                | Initiate payment → `202 INITIATED` or `REQUIRES_REDIRECT` |
| GET    | /transactions/:id       | Status + attempt history                             |
| GET    | /transactions?phone=    | Lookup by phone                                      |
| POST   | /webhook/:provider      | Aggregator callback (HMAC verified)                  |
| GET    | /admin/metrics          | Live scores per aggregator/corridor                  |

```jsonc
// POST /payment
{
  "phone": "+22997000001",
  "amount": 5000,
  "currency": "XOF",
  "idempotencyKey": "uuid",      // optional — deduplication
  "redirectAllowed": true        // optional — set false to exclude REDIRECT providers
}

// 202 — DIRECT provider (FedaPay, CinetPay, FeexPay, PayDunya)
{ "transactionId": "uuid", "status": "INITIATED" }

// 202 — REDIRECT provider (KKiaPay)
{ "transactionId": "uuid", "status": "REQUIRES_REDIRECT", "checkoutUrl": "https://app.kkiapay.me?..." }
```

Final status via `webhookUrl` (request body) or poll `GET /transactions/:id`.

## License

[MIT](LICENSE)
