// src/lib/audit.ts
// Audit trail service — logs sensitive HR actions

import { db } from "./db";
import { AuditAction } from "@prisma/client";

interface AuditParams {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  changes?: { before?: unknown; after?: unknown };
  ipAddress?: string;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        changes: params.changes
          ? JSON.parse(JSON.stringify(params.changes))
          : undefined,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    // Never crash the main flow due to audit failure
    console.error("Failed to write audit log:", error);
  }
}
