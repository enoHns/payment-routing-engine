import { getRedisClient } from '../cache/redis';
import logger from '../config/logger';

const CACHE_TTL_SECONDS = 300;

function cacheKey(provider: string, operator: string, country: string): string {
  return `score:${provider}:${operator}:${country}`;
}

export async function getCachedScore(
  provider: string, operator: string, country: string,
): Promise<number | null> {
  try {
    const raw = await getRedisClient().get(cacheKey(provider, operator, country));
    if (raw === null) return null;
    const score = parseFloat(raw);
    return isNaN(score) ? null : score;
  } catch (err) {
    logger.warn({ err, provider, operator, country }, 'Score cache read failed — using DB');
    return null;
  }
}

// TODO: consider using a Lua script for atomic read-increment-set
export async function setCachedScore(
  provider: string, operator: string, country: string, score: number,
): Promise<void> {
  try {
    await getRedisClient().set(cacheKey(provider, operator, country), score.toFixed(6), 'EX', CACHE_TTL_SECONDS);
  } catch (err) {
    logger.warn({ err }, 'Score cache write failed — continuing without cache');
  }
}

export async function invalidateScore(
  provider: string, operator: string, country: string,
): Promise<void> {
  try {
    await getRedisClient().del(cacheKey(provider, operator, country));
  } catch { /* non-critical */ }
}
