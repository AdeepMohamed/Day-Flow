// src/app/employee/attendance/page.tsx
// Ultra-fast Attendance Page Server Component — Single Batched Database Query

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { AttendanceClient } from "./client";

export const metadata = { title: "My Attendance" };

export default async function EmployeeAttendancePage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  let empProfileId = session.employeeProfileId;

  // If employeeProfileId is missing from token, resolve it fast
  if (!empProfileId) {
    const emp = await db.employee.findUnique({
      where: { userId: session.id },
      select: { id: true },
    });
    if (emp) {
      empProfileId = emp.id;
    } else {
      const newEmp = await db.employee.create({
        data: {
          userId: session.id,
          firstName: session.email.split("@")[0],
          lastName: "User",
          department: "General",
          position: "Employee",
        },
        select: { id: true },
      });
      empProfileId = newEmp.id;
    }
  }

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Single database query for all attendance records in the last 30 days
  const monthAttendance = await db.attendance.findMany({
    where: {
      employeeId: empProfileId,
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: "asc" },
  });

  // Derive today's record and 7-day week records in memory (0ms overhead)
  const todayAttendance =
    monthAttendance.find(
      (a) => new Date(a.date).toISOString().split("T")[0] === todayStr
    ) || null;

  const weekAttendance = monthAttendance.filter(
    (a) => new Date(a.date) >= sevenDaysAgo
  );

  const monthStats = {
    present: monthAttendance.filter((a) => a.status === "PRESENT").length,
    absent: monthAttendance.filter((a) => a.status === "ABSENT").length,
    halfDay: monthAttendance.filter((a) => a.status === "HALF_DAY").length,
    leave: monthAttendance.filter((a) => a.status === "LEAVE").length,
    total: monthAttendance.length,
  };

  return (
    <div>
      <Topbar title="My Attendance" subtitle="Track your daily work hours" />
      <div className="page-body">
        <AttendanceClient
          todayAttendance={JSON.parse(JSON.stringify(todayAttendance))}
          weekAttendance={JSON.parse(JSON.stringify(weekAttendance))}
          monthAttendance={JSON.parse(JSON.stringify(monthAttendance))}
          monthStats={monthStats}
        />
      </div>
    </div>
  );
}
