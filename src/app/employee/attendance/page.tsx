// src/app/employee/attendance/page.tsx
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

  if (!empProfileId) {
    const emp = await db.employee.findUnique({ where: { userId: session.id } });
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
      });
      empProfileId = newEmp.id;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);

  const [todayAttendance, weekAttendance, monthAttendance] = await Promise.all([
    db.attendance.findUnique({
      where: { employeeId_date: { employeeId: empProfileId, date: today } },
    }),
    db.attendance.findMany({
      where: { employeeId: empProfileId, date: { gte: sevenDaysAgo } },
      orderBy: { date: "asc" },
    }),
    db.attendance.findMany({
      where: { employeeId: empProfileId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: "desc" },
    }),
  ]);

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
