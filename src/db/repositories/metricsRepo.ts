import { ProviderMetric } from '@prisma/client';
import { getPrismaClient } from '../prismaClient';

type Outcome = 'SUCCESS' | 'FAILURE';

export async function upsertMetricWindow(
  providerName: string,
  operator: string,
  country: string,
  windowStart: Date,
  outcome: Outcome,
  latencyMs?: number,
): Promise<void> {
  const prisma = getPrismaClient();
  const lat = BigInt(latencyMs ?? 0);

  if (outcome === 'SUCCESS') {
    await prisma.$executeRaw`
      INSERT INTO provider_metrics
        (id, "providerName", operator, country, "windowStart", "successCount", "totalLatencyMs", "sampleCount", "updatedAt")
      VALUES (gen_random_uuid(), ${providerName}, ${operator}, ${country}, ${windowStart}, 1, ${lat}, 1, now())
      ON CONFLICT ("providerName", operator, country, "windowStart")
      DO UPDATE SET
        "successCount"   = provider_metrics."successCount" + 1,
        "totalLatencyMs" = provider_metrics."totalLatencyMs" + ${lat},
        "sampleCount"    = provider_metrics."sampleCount" + 1,
        "updatedAt"      = now()
    `;
  } else {
    await prisma.$executeRaw`
      INSERT INTO provider_metrics
        (id, "providerName", operator, country, "windowStart", "failureCount", "sampleCount", "updatedAt")
      VALUES (gen_random_uuid(), ${providerName}, ${operator}, ${country}, ${windowStart}, 1, 1, now())
      ON CONFLICT ("providerName", operator, country, "windowStart")
      DO UPDATE SET
        "failureCount" = provider_metrics."failureCount" + 1,
        "sampleCount"  = provider_metrics."sampleCount" + 1,
        "updatedAt"    = now()
    `;
  }
}

export async function getRecentMetrics(
  providerName: string,
  operator: string,
  country: string,
  hoursBack: number,
): Promise<ProviderMetric[]> {
  const cutoff = new Date(Date.now() - hoursBack * 3600 * 1000);
  return getPrismaClient().providerMetric.findMany({
    where: { providerName, operator, country, windowStart: { gte: cutoff } },
    orderBy: { windowStart: 'desc' },
  });
}

export async function getAllProviderCombinations(): Promise<
  Array<{ providerName: string; operator: string; country: string }>
> {
  const rows = await getPrismaClient().$queryRaw<Array<{ providerName: string; operator: string; country: string }>>`
    SELECT DISTINCT "providerName", operator, country FROM provider_metrics
  `;
  return rows;
}
