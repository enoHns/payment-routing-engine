# payment-routing-engine

Server-side payment routing engine for West Africa mobile money.

Receives payment intents, detects the mobile operator from the phone prefix,
selects the best payment provider (Kkiapay, FedaPay, CinetPay, FeexPay, PayDunya)
using a real-time scoring algorithm, and handles async webhook resolution with
automatic fallback.

## Stack

- **Runtime**: Node.js 12, TypeScript 3.7
- **Framework**: Fastify 2
- **ORM**: TypeORM + PostgreSQL 11
- **Queue**: Bull + Redis 5
- **Tests**: Jest 24

## Quick start

```bash
cp .env.example .env
# Fill in required credentials
docker-compose up -d
npm install
npm run dev
```

## Supported operators

| Country          | Operators             |
|------------------|-----------------------|
| Benin (BJ)       | MTN, Moov, Celtiis    |
| Côte d'Ivoire (CI)| Orange, MTN, Moov    |
| Sénégal (SN)     | Orange, Free, Wave    |
| Togo (TG)        | Togocel, Moov         |
| Niger (NE)       | Airtel, Moov          |

---

*Work in progress — DB layer and phone resolver coming next.*
