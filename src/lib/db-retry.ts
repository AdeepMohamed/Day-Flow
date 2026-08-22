// src/lib/db-retry.ts
// Shared retry utility for Neon serverless cold-start connection errors

export async function withDbRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      const isConnErr =
        msg.includes("timeout") ||
        msg.includes("Connection terminated") ||
        msg.includes("ECONNRESET") ||
        msg.includes("connect ETIMEDOUT");
      if (i < retries && isConnErr) {
        // Exponential backoff: 300ms, 600ms, 900ms
        await new Promise((r) => setTimeout(r, 300 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("DB retry limit exceeded");
}
