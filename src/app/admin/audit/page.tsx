// src/app/admin/audit/page.tsx
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { AdminAuditClient } from "./client";

export const metadata = { title: "Audit Trail — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "HR")) {
    redirect("/auth/login");
  }

  const auditLogs = await withDbRetry(() =>
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            email: true,
            employeeId: true,
            role: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })
  );

  return (
    <div>
      <Topbar title="Audit Trail Log" subtitle="Comprehensive security audit log of all system mutations" />
      <div className="page-body">
        <AdminAuditClient initialLogs={JSON.parse(JSON.stringify(auditLogs))} />
      </div>
    </div>
  );
}
