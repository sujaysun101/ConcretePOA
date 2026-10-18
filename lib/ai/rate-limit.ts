const CAPACITY = 10;
const WINDOW_MS = 60_000;

type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: true; remaining: number } | { ok: false; retryAfter: number };

export function resetRateLimitMemory() {
  buckets.clear();
}

function consumeMemory(userId: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(userId) ?? { tokens: CAPACITY, updatedAt: now };
  const refill = ((now - bucket.updatedAt) / WINDOW_MS) * CAPACITY;
  bucket.tokens = Math.min(CAPACITY, bucket.tokens + refill);
  bucket.updatedAt = now;
  if (bucket.tokens < 1) {
    const retryAfter = Math.ceil(((1 - bucket.tokens) / CAPACITY) * (WINDOW_MS / 1000));
    buckets.set(userId, bucket);
    return { ok: false, retryAfter: Math.max(retryAfter, 1) };
  }
  bucket.tokens -= 1;
  buckets.set(userId, bucket);
  return { ok: true, remaining: Math.floor(bucket.tokens) };
}

async function consumeUpstash(userId: string): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  const key = `concretepoa:rate:${userId}`;
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, "60", "NX"],
        ["TTL", key],
      ]),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { result?: unknown }[];
    const count = Number(payload?.[0]?.result ?? 0);
    const ttl = Number(payload?.[2]?.result ?? 60);
    if (!Number.isFinite(count)) return null;
    if (count > CAPACITY) {
      return { ok: false, retryAfter: Math.max(Number.isFinite(ttl) ? ttl : 60, 1) };
    }
    return { ok: true, remaining: Math.max(CAPACITY - count, 0) };
  } catch {
    return null;
  }
}

export async function consumeRateLimit(userId: string): Promise<RateLimitResult> {
  const remote = await consumeUpstash(userId);
  if (remote) return remote;
  return consumeMemory(userId);
}
