import { getRedisClient } from '../cache/redis';
import logger from '../config/logger';

const CACHE_TTL_SECONDS = 300; // 5 minutes

function cacheKey(provider: string, operator: string, country: string): string {
  return `score:${provider}:${operator}:${country}`;
}

export async function getCachedScore(
  provider: string,
  operator: string,
  country: string,
): Promise<number | null> {
  const key = cacheKey(provider, operator, country);
  const raw = await getRedisClient().get(key);
  if (raw === null) return null;
  return parseFloat(raw);
}

export async function setCachedScore(
  provider: string,
  operator: string,
  country: string,
  score: number,
): Promise<void> {
  const key = cacheKey(provider, operator, country);
  await getRedisClient().set(key, score.toFixed(6), 'EX', CACHE_TTL_SECONDS);
  logger.debug({ provider, operator, country, score }, 'Score cached');
}

export async function invalidateScore(
  provider: string,
  operator: string,
  country: string,
): Promise<void> {
  const key = cacheKey(provider, operator, country);
  await getRedisClient().del(key);
}
