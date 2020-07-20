# payment-routing-engine

Server-side payment routing engine for West Africa mobile money.

## Stack

- **Runtime**: Node.js 12, TypeScript 3.9
- **Framework**: Fastify 3
- **ORM**: Prisma 2 + PostgreSQL 11
- **Queue**: Bull 3 + Redis 5
- **Tests**: Jest 26

## Quick start

```bash
cp .env.example .env
docker-compose up -d postgres redis
npm install
npx prisma migrate dev
npm run dev
```

## Architecture

```
src/
  config/         env validation (joi), pino logger
  core/           phoneResolver, providerRegistry, registryLoader
  data/           operatorRegistry.json (v1.3.0), providerConfig.json
  db/             Prisma client + 4 repositories
  cache/          ioredis client
  providers/      5 payment adapters + adapterFactory
  routes/         /health
  plugins/        errorHandler
  utils/          phone, crypto, httpError
```

## Supported providers

| Provider  | Countries       | Webhook     |
|-----------|-----------------|-------------|
| Kkiapay   | BJ              | HMAC-SHA256 |
| FedaPay   | BJ              | HMAC-SHA512 |
| CinetPay  | CI, SN, TG      | IP whitelist|
| FeexPay   | BJ, CI, TG, SN  | HMAC-SHA256 |
| PayDunya   | SN, CI, NE      | HMAC-SHA256 |

## API

- `GET /health` — liveness + readiness (postgres + redis)

---

*Work in progress — scoring engine and routing pipeline coming next.*
