import { getConnection } from '../connection';
import { ProviderMetricEntity } from '../entities/providerMetric.entity';

type Outcome = 'SUCCESS' | 'FAILURE';

export async function upsertMetricWindow(
  providerName: string,
  operator: string,
  country: string,
  windowStart: Date,
  outcome: Outcome,
  latencyMs?: number,
): Promise<void> {
  const conn = getConnection();

  // Use raw query for atomic increment (no lost-update race condition)
  if (outcome === 'SUCCESS') {
    await conn.query(
      `INSERT INTO provider_metrics
         ("providerName", "operator", "country", "windowStart", "successCount", "totalLatencyMs", "sampleCount", "updatedAt")
       VALUES ($1, $2, $3, $4, 1, $5, 1, now())
       ON CONFLICT ("providerName", "operator", "country", "windowStart")
       DO UPDATE SET
         "successCount"   = provider_metrics."successCount" + 1,
         "totalLatencyMs" = provider_metrics."totalLatencyMs" + $5,
         "sampleCount"    = provider_metrics."sampleCount" + 1,
         "updatedAt"      = now()`,
      [providerName, operator, country, windowStart, latencyMs ?? 0],
    );
  } else {
    await conn.query(
      `INSERT INTO provider_metrics
         ("providerName", "operator", "country", "windowStart", "failureCount", "sampleCount", "updatedAt")
       VALUES ($1, $2, $3, $4, 1, 1, now())
       ON CONFLICT ("providerName", "operator", "country", "windowStart")
       DO UPDATE SET
         "failureCount" = provider_metrics."failureCount" + 1,
         "sampleCount"  = provider_metrics."sampleCount" + 1,
         "updatedAt"    = now()`,
      [providerName, operator, country, windowStart],
    );
  }
}

export async function getRecentMetrics(
  providerName: string,
  operator: string,
  country: string,
  hoursBack: number,
): Promise<ProviderMetricEntity[]> {
  const cutoff = new Date(Date.now() - hoursBack * 3600 * 1000);
  return getConnection()
    .getRepository(ProviderMetricEntity)
    .createQueryBuilder('m')
    .where('m.providerName = :providerName', { providerName })
    .andWhere('m.operator = :operator', { operator })
    .andWhere('m.country = :country', { country })
    .andWhere('m.windowStart >= :cutoff', { cutoff })
    .orderBy('m.windowStart', 'DESC')
    .getMany();
}

export async function getAllProviderCombinations(): Promise<Array<{ providerName: string; operator: string; country: string }>> {
  return getConnection()
    .getRepository(ProviderMetricEntity)
    .createQueryBuilder('m')
    .select(['m.providerName', 'm.operator', 'm.country'])
    .distinct(true)
    .getRawMany()
    .then(rows => rows.map(r => ({
      providerName: r.m_providerName,
      operator: r.m_operator,
      country: r.m_country,
    })));
}
