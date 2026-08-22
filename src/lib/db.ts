// src/lib/db.ts
// Prisma v7 with self-healing connection pool for Neon serverless

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const g = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPool(): Pool {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://placeholder:placeholder@localhost:5432/placeholder";

  const pool = new Pool({
    connectionString,
    max: 3,
    min: 0,                          // Don't keep idle connections — Neon closes them anyway
    idleTimeoutMillis: 10000,        // Release idle connections after 10s
    connectionTimeoutMillis: 20000,  // 20s — enough for Neon cold-start
    keepAlive: false,                // Disable TCP keepalive — Neon drops them regardless
  });

  pool.on("error", (err) => {
    console.error("[DB Pool] Client error, resetting pool:", err.message);
    // On any pool error, clear cached instances so they get recreated fresh
    try { pool.end().catch(() => {}); } catch (_) {}
    g.pool = undefined;
    g.prisma = undefined;
  });

  return pool;
}

function getDb(): PrismaClient {
  // Always return cached client if healthy
  if (g.prisma && g.pool) return g.prisma;

  const pool = createPool();
  g.pool = pool;

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  g.prisma = client;
  return client;
}

// Proxy that auto-recreates the client if the pool was reset
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
