// src/lib/db.ts
// Prisma v7 with Neon-optimized connection pool

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function getOrCreatePool(): Pool {
  if (globalForPrisma.pool) {
    return globalForPrisma.pool;
  }

  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://placeholder:placeholder@localhost:5432/placeholder";

  const pool = new Pool({
    connectionString,
    max: 5,
    min: 1,                          // keep at least 1 connection alive
    idleTimeoutMillis: 60000,        // 60s — keep idle connections longer
    connectionTimeoutMillis: 15000,  // 15s timeout — enough for Neon cold-start
    keepAlive: true,                 // TCP keep-alive prevents silent drops
    keepAliveInitialDelayMillis: 0,
  });

  // Log pool errors silently — don't crash the app
  pool.on("error", (err) => {
    console.error("[DB Pool] Unexpected error:", err.message);
  });

  globalForPrisma.pool = pool;
  return pool;
}

function createPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const pool = getOrCreatePool();
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  globalForPrisma.prisma = client;
  return client;
}

export const db = createPrismaClient();
