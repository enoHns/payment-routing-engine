import { prisma } from '../prismaClient';

interface ProviderCombination {
  providerName: string;
  operator:     string;
  country:      string;
}

export async function upsertMetricWindow(
  providerName:  string,
  operator:      string,
  country:       string,
  windowStart:   Date,
  outcome:       'SUCCESS' | 'FAILURE',
  latencyMs?:    number,
): Promise<void> {
  const successIncrement = outcome === 'SUCCESS' ? 1 : 0;
  const failureIncrement = outcome === 'FAILURE' ? 1 : 0;
  const latencyIncrement = latencyMs ?? 0;
  const sampleIncrement  = latencyMs != null ? 1 : 0;

  await prisma.$executeRaw`
    INSERT INTO provider_metrics
      (id, provider_name, operator, country, window_start,
       success_count, failure_count, total_latency_ms, sample_count, updated_at)
    VALUES
      (gen_random_uuid(), ${providerName}, ${operator}, ${country}, ${windowStart},
       ${successIncrement}, ${failureIncrement}, ${latencyIncrement}, ${sampleIncrement}, NOW())
    ON CONFLICT (provider_name, operator, country, window_start)
    DO UPDATE SET
      success_count    = provider_metrics.success_count    + ${successIncrement},
      failure_count    = provider_metrics.failure_count    + ${failureIncrement},
      total_latency_ms = provider_metrics.total_latency_ms + ${latencyIncrement},
      sample_count     = provider_metrics.sample_count     + ${sampleIncrement},
      updated_at       = NOW()
  `;
}

export async function getRecentMetrics(
  providerName: string,
  operator:     string,
  country:      string,
  hoursBack = 24,
) {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  return prisma.providerMetric.findMany({
    where:   { providerName, operator, country, windowStart: { gte: since } },
    orderBy: { windowStart: 'desc' },
  });
}

export async function getAllProviderCombinations(): Promise<ProviderCombination[]> {
  const rows = await prisma.providerMetric.groupBy({
    by:      ['providerName', 'operator', 'country'],
    orderBy: { providerName: 'asc' },
  });
  return rows.map(r => ({ providerName: r.providerName, operator: r.operator, country: r.country }));
}
