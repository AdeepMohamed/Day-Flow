// src/app/api/analytics/route.ts
// Admin/HR analytics data

import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR } from "@/lib/auth";
import { db } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrHR();

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [
      totalEmployees,
      attendanceThisMonth,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      todayAttendance,
      recentAuditLogs,
    ] = await withDbRetry(() => Promise.all([
      db.employee.count(),
      db.attendance.findMany({
        where: { date: { gte: thirtyDaysAgo } },
        select: { status: true, date: true },
      }),
      db.leaveRequest.count({ where: { status: "PENDING" } }),
      db.leaveRequest.count({
        where: { status: "APPROVED", updatedAt: { gte: thirtyDaysAgo } },
      }),
      db.leaveRequest.count({
        where: { status: "REJECTED", updatedAt: { gte: thirtyDaysAgo } },
      }),
      db.attendance.findMany({
        where: {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
        },
        select: { status: true },
      }),
      db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              employee: { select: { firstName: true, lastName: true } },
              email: true,
            },
          },
        },
      }),
    ]));

    // Attendance breakdown
    const attendanceStats = {
      present: attendanceThisMonth.filter((a) => a.status === "PRESENT").length,
      absent: attendanceThisMonth.filter((a) => a.status === "ABSENT").length,
      halfDay: attendanceThisMonth.filter((a) => a.status === "HALF_DAY").length,
      leave: attendanceThisMonth.filter((a) => a.status === "LEAVE").length,
      total: attendanceThisMonth.length,
    };

    // Today stats
    const todayStats = {
      present: todayAttendance.filter((a) => a.status === "PRESENT").length,
      absent: todayAttendance.filter((a) => a.status === "ABSENT").length,
      halfDay: todayAttendance.filter((a) => a.status === "HALF_DAY").length,
      leave: todayAttendance.filter((a) => a.status === "LEAVE").length,
      total: todayAttendance.length,
    };

    // Daily attendance trend for last 7 days
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayRecords = attendanceThisMonth.filter((a) => {
        const aDate = new Date(a.date);
        return aDate.toDateString() === date.toDateString();
      });

      dailyTrend.push({
        date: date.toISOString().split("T")[0],
        present: dayRecords.filter((r) => r.status === "PRESENT").length,
        absent: dayRecords.filter((r) => r.status === "ABSENT").length,
        halfDay: dayRecords.filter((r) => r.status === "HALF_DAY").length,
        leave: dayRecords.filter((r) => r.status === "LEAVE").length,
      });
    }

    return NextResponse.json({
      overview: {
        totalEmployees,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
      },
      today: todayStats,
      attendance: {
        stats: attendanceStats,
        trend: dailyTrend,
      },
      recentActivity: recentAuditLogs,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
