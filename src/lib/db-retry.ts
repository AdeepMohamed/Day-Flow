// src/lib/db-retry.ts
// Robust, high-speed DB retry helper for Neon serverless queries

export async function withDbRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const strErr = err instanceof Error ? `${err.message} ${err.stack}` : String(err);
      const isTransient =
        strErr.includes("timeout") ||
        strErr.includes("Connection terminated") ||
        strErr.includes("ECONNRESET") ||
        strErr.includes("ETIMEDOUT") ||
        strErr.includes("closed") ||
        strErr.includes("pool");

      if (i < retries && isTransient) {
        // Fast retry: 100ms, 250ms, 500ms
        await new Promise((r) => setTimeout(r, 100 * Math.pow(2, i)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
