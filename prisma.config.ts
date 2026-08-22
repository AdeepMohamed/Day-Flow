// prisma.config.ts
// Prisma v7 configuration — connection URLs moved here from schema.prisma

import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    async adapter() {
      const { PrismaNeon } = await import("@prisma/adapter-neon");
      const { neon } = await import("@neondatabase/serverless");
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) throw new Error("DATABASE_URL is not set");
      const sql = neon(connectionString);
      return new PrismaNeon(sql);
    },
  },
});
