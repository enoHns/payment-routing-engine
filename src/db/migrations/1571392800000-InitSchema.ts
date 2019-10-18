import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1571392800000 implements MigrationInterface {
  name = 'InitSchema1571392800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "tx_status_enum" AS ENUM(
        'INITIATED', 'OPERATOR_DETECTED', 'PROVIDER_SELECTED',
        'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "attempt_status_enum" AS ENUM(
        'PENDING', 'SUCCESS', 'FAILED', 'TIMEOUT'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id"               UUID NOT NULL DEFAULT uuid_generate_v4(),
        "idempotencyKey"   VARCHAR NOT NULL,
        "phone"            VARCHAR NOT NULL,
        "amount"           INTEGER NOT NULL,
        "currency"         VARCHAR NOT NULL DEFAULT 'XOF',
        "country"          VARCHAR NOT NULL,
        "operator"         VARCHAR,
        "status"           "tx_status_enum" NOT NULL DEFAULT 'INITIATED',
        "clientCallbackUrl" VARCHAR,
        "metadata"         JSONB,
        "settledAt"        TIMESTAMPTZ,
        "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_transactions_idempotency" UNIQUE ("idempotencyKey")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_transactions_phone" ON "transactions" ("phone")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_status" ON "transactions" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_createdAt" ON "transactions" ("createdAt")`);

    await queryRunner.query(`
      CREATE TABLE "attempts" (
        "id"             UUID NOT NULL DEFAULT uuid_generate_v4(),
        "transactionId"  UUID NOT NULL,
        "providerName"   VARCHAR NOT NULL,
        "providerTxId"   VARCHAR,
        "status"         "attempt_status_enum" NOT NULL DEFAULT 'PENDING',
        "score"          FLOAT NOT NULL,
        "latencyMs"      INTEGER,
        "errorCode"      VARCHAR,
        "errorMessage"   VARCHAR,
        "webhookPayload" JSONB,
        "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        "resolvedAt"     TIMESTAMPTZ,
        CONSTRAINT "PK_attempts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_attempts_transaction"
          FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_attempts_transactionId" ON "attempts" ("transactionId")`);
    await queryRunner.query(`CREATE INDEX "IDX_attempts_provider_status" ON "attempts" ("providerName", "status")`);

    await queryRunner.query(`
      CREATE TABLE "provider_metrics" (
        "id"             UUID NOT NULL DEFAULT uuid_generate_v4(),
        "providerName"   VARCHAR NOT NULL,
        "operator"       VARCHAR NOT NULL,
        "country"        VARCHAR NOT NULL,
        "windowStart"    TIMESTAMPTZ NOT NULL,
        "successCount"   INTEGER NOT NULL DEFAULT 0,
        "failureCount"   INTEGER NOT NULL DEFAULT 0,
        "totalLatencyMs" BIGINT NOT NULL DEFAULT 0,
        "sampleCount"    INTEGER NOT NULL DEFAULT 0,
        "score"          FLOAT NOT NULL DEFAULT 0.5,
        "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_provider_metrics" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_provider_metrics_window"
          UNIQUE ("providerName", "operator", "country", "windowStart")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_provider_metrics_lookup" ON "provider_metrics" ("providerName", "operator", "country")`);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"            UUID NOT NULL DEFAULT uuid_generate_v4(),
        "transactionId" UUID NOT NULL,
        "event"         VARCHAR NOT NULL,
        "payload"       JSONB,
        "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_transaction"
          FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_transactionId" ON "audit_logs" ("transactionId")`);

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "provider_metrics"`);
    await queryRunner.query(`DROP TABLE "attempts"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "attempt_status_enum"`);
    await queryRunner.query(`DROP TYPE "tx_status_enum"`);
  }
}
