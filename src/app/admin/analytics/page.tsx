// src/app/admin/analytics/page.tsx
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { AdminAnalyticsClient } from "./client";

export const metadata = { title: "HR Analytics — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "HR")) {
    redirect("/auth/login");
  }

  const [totalEmployees, departmentCounts, leaveStats, attendanceCount] = await withDbRetry(() => Promise.all([
    db.employee.count(),
    db.employee.groupBy({
      by: ["department"],
      _count: { id: true },
    }),
    db.leaveRequest.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    db.attendance.count(),
  ]));

  const departmentData = departmentCounts.map((d) => ({
    name: d.department || "Unassigned",
    count: d._count.id,
  }));

  const leaveData = leaveStats.map((l) => ({
    status: l.status,
    count: l._count.id,
  }));

  return (
    <div>
      <Topbar title="Workforce Analytics" subtitle="Deep insights into attendance, leave trends, and headcount" />
      <div className="page-body">
        <AdminAnalyticsClient
          totalEmployees={totalEmployees}
          attendanceCount={attendanceCount}
          departmentData={departmentData}
          leaveData={leaveData}
        />
      </div>
    </div>
  );
}
