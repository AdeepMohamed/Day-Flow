// src/lib/db.ts
// Prisma v7 with optimized connection pool for Neon serverless

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
    max: 20,                          // High connection limit to support Promise.all batching
    min: 2,                          // Keep 2 connections warm
    idleTimeoutMillis: 30000,        // Keep idle connections for 30s
    connectionTimeoutMillis: 10000,  // 10s connection timeout
    keepAlive: true,                 // Enable TCP keep-alive
  });

  pool.on("error", (err) => {
    console.error("[DB Pool] Client error, resetting pool:", err.message);
    try { pool.end().catch(() => {}); } catch (_) {}
    g.pool = undefined;
    g.prisma = undefined;
  });

  return pool;
}

function getDb(): PrismaClient {
  if (g.prisma && g.pool) return g.prisma;

  const pool = createPool();
  g.pool = pool;

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });

  g.prisma = client;
  return client;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
