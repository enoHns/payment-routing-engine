/*
  Warnings:

  - A unique constraint covering the columns `[providerName,providerTxId]` on the table `attempts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "attempts_providerTxId_idx";

-- DropIndex
DROP INDEX "provider_metrics_providerName_operator_country_idx";

-- CreateIndex
CREATE UNIQUE INDEX "attempts_providerName_providerTxId_key" ON "attempts"("providerName", "providerTxId");

-- CreateIndex
CREATE INDEX "provider_metrics_providerName_operator_country_windowStart_idx" ON "provider_metrics"("providerName", "operator", "country", "windowStart");
