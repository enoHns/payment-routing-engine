# payment-routing-engine

Server-side payment routing engine for West Africa mobile money.

## Stack

- **Runtime**: Node.js 12, TypeScript 4.0
- **Framework**: Fastify 3
- **ORM**: Prisma 2 + PostgreSQL 11
- **Queue**: BullMQ 1 + Redis 5
- **Tests**: Jest 26

## Quick start

```bash
cp .env.example .env
docker-compose up -d postgres redis
npm install
npx prisma migrate dev
npm run dev
```

## Routing pipeline

```
POST /payment
  → phone resolver   (operator detection from prefix)
  → eligibility      (getEligibleProviders by country/operator)
  → scoring          (success rate + latency + priority — 24h window)
  → BullMQ job       (enqueueRoutingJob)

Worker picks up job:
  → buildFallbackChain (ordered providers by score)
  → adapter.initiatePayment
  → on retryable error → enqueue next provider

POST /webhook/:provider
  → verifyWebhook signature (HMAC or IP whitelist)
  → resolve attempt
  → update transaction status
  → recordAttemptOutcome → invalidate score cache
```

## Scoring formula

```
score = 0.5 × successRate + 0.3 × latencyScore + 0.2 × priorityScore
```

- **successRate**: success / (success + failure) over last 24h windows
- **latencyScore**: 1 - avgLatency / 5000ms, clamped to [0,1]
- **priorityScore**: normalized inverse of provider priority
- Cold start: each component defaults to 0.5

## API

| Method | Path    | Description          |
|--------|---------|----------------------|
| GET    | /health | Liveness + readiness |

---

*Work in progress — API routes and webhook endpoint coming next.*
