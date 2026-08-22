// src/lib/rate-limit.ts
// Simple in-memory rate limiter for AI chat endpoint

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number; // seconds
}

/**
 * Check and update rate limit for a given key.
 * @param key - Usually userId or IP address
 * @param limit - Max requests per window
 * @param windowSeconds - Time window in seconds
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const existing = rateLimitMap.get(key);

  if (!existing || existing.resetAt < now) {
    // Start new window
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return { success: true, remaining: limit - 1, resetIn: windowSeconds };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count++;
  return {
    success: true,
    remaining: limit - existing.count,
    resetIn: Math.ceil((existing.resetAt - now) / 1000),
  };
}

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);
