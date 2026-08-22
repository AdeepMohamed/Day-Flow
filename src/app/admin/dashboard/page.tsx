// src/app/admin/dashboard/page.tsx
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { AdminDashboardClient } from "./client";

export const metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (session.role === "EMPLOYEE") redirect("/employee/dashboard");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [
    totalEmployees,
    todayAttendance,
    pendingLeaves,
    recentLeaveRequests,
    recentAuditLogs,
    attendanceTrend,
  ] = await withDbRetry(() => Promise.all([
    db.employee.count(),
    db.attendance.findMany({
      where: { date: today },
      select: { status: true },
    }),
    db.leaveRequest.count({ where: { status: "PENDING" } }),
    db.leaveRequest.findMany({
      where: { status: "PENDING" },
      include: {
        employee: {
          select: {
            firstName: true, lastName: true,
            department: true, profilePicture: true,
          },
        },
        leaveType: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: {
          select: {
            employee: { select: { firstName: true, lastName: true } },
            email: true,
          },
        },
      },
    }),
    // 7-day attendance trend
    db.attendance.findMany({
      where: {
        date: {
          gte: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
          lte: today,
        },
      },
      select: { date: true, status: true },
    }),
  ]));

  const todayStats = {
    present: todayAttendance.filter((a) => a.status === "PRESENT").length,
    absent: todayAttendance.filter((a) => a.status === "ABSENT").length,
    halfDay: todayAttendance.filter((a) => a.status === "HALF_DAY").length,
    leave: todayAttendance.filter((a) => a.status === "LEAVE").length,
    total: todayAttendance.length,
  };

  // Build daily trend
  const trend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().split("T")[0];
    const dayRecords = attendanceTrend.filter(
      (a) => a.date.toISOString().split("T")[0] === dayStr
    );
    return {
      date: dayStr,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      present: dayRecords.filter((r) => r.status === "PRESENT").length,
      absent: dayRecords.filter((r) => r.status === "ABSENT").length,
      leave: dayRecords.filter((r) => r.status === "LEAVE").length,
    };
  });

  return (
    <div>
      <Topbar title="HR Command Center" subtitle="Real-time workforce overview" />
      <div className="page-body">
        <AdminDashboardClient
          totalEmployees={totalEmployees}
          todayStats={todayStats}
          pendingLeaves={pendingLeaves}
          recentLeaveRequests={JSON.parse(JSON.stringify(recentLeaveRequests))}
          recentAuditLogs={JSON.parse(JSON.stringify(recentAuditLogs))}
          trend={trend}
        />
      </div>
    </div>
  );
}
