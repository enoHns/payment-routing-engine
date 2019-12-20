# payment-routing-engine

Server-side payment routing engine for West Africa mobile money.

Receives payment intents, detects the mobile operator from the phone prefix,
selects the best payment provider (Kkiapay, FedaPay, CinetPay, FeexPay, PayDunya)
using a real-time scoring algorithm, and handles async webhook resolution with
automatic fallback.

## Stack

- **Runtime**: Node.js 12, TypeScript 3.7
- **Framework**: Fastify 2
- **ORM**: TypeORM 0.2 + PostgreSQL 11
- **Queue**: Bull 3 + Redis 5
- **Tests**: Jest 24

## Quick start

```bash
cp .env.example .env
# Fill in credentials

docker-compose up -d postgres redis
npm install
npm run migration:run
npm run dev
```

## Running tests

```bash
# Start test database
docker-compose up -d postgres_test

# Set test DB URL
export TEST_DATABASE_URL=postgresql://routing_test:routing_secret@localhost:5433/routing_engine_test

npm test
```

## Supported operators

| Country            | Operators             |
|--------------------|-----------------------|
| Benin (BJ)         | MTN, Moov, Celtiis    |
| Côte d'Ivoire (CI) | Orange, MTN, Moov     |
| Sénégal (SN)       | Orange, Free, Wave    |
| Togo (TG)          | Togocel, Moov         |
| Niger (NE)         | Airtel, Moov          |

## Database

4 tables : `transactions`, `attempts`, `provider_metrics`, `audit_logs`

Run migrations:
```bash
npm run migration:run
```

---

*Work in progress — phone resolver and provider adapters coming next.*
