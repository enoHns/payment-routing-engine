# payment-routing-engine

Server-side payment routing engine for West Africa mobile money.

Receives payment intents, detects the mobile operator from the phone prefix,
selects the best payment provider using a real-time scoring algorithm,
and handles async webhook resolution with automatic fallback.

## Stack

- **Runtime**: Node.js 12, TypeScript 3.8
- **Framework**: Fastify 2
- **ORM**: TypeORM 0.2 + PostgreSQL 11
- **Queue**: Bull 3 + Redis 5
- **Tests**: Jest 25

## Quick start

```bash
cp .env.example .env
docker-compose up -d postgres redis
npm install
npm run migration:run
npm run dev
```

## Phone resolver

Parses and normalizes phone numbers, detects the mobile operator from prefix tables.

```ts
import { resolveOperator } from './src/core/phoneResolver';
const result = resolveOperator('+22996123456', 'BJ');
// → { operator: 'MTN', country: 'BJ', normalized: '96123456' }
```

Operator registry `v1.3.0` covers:

| Country            | Operators                |
|--------------------|--------------------------|
| Benin (BJ)         | MTN, Moov, Celtiis       |
| Côte d'Ivoire (CI) | Orange, MTN, Moov        |
| Sénégal (SN)       | Orange, Free, Wave       |
| Togo (TG)          | Togocel, Moov            |
| Niger (NE)         | Airtel, Moov             |

## Providers

| Provider  | Countries           |
|-----------|---------------------|
| Kkiapay   | BJ                  |
| FedaPay   | BJ                  |
| CinetPay  | CI, SN, TG          |
| FeexPay   | BJ, CI, TG, SN      |
| PayDunya   | SN, CI, NE          |

---

*Work in progress — provider adapters coming next.*
