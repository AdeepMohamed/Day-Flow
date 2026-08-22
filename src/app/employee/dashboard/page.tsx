// src/app/employee/dashboard/page.tsx
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { EmployeeDashboardClient } from "./client";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "My Dashboard" };

export default async function EmployeeDashboardPage() {
  const session = await getSession();
  if (!session || !session.employeeProfileId) redirect("/auth/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  const [employee, todayAttendance, weekAttendance, recentLeaves, unreadNotifs] =
    await Promise.all([
      db.employee.findUnique({
        where: { id: session.employeeProfileId },
        include: { salary: true },
      }),
      db.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: session.employeeProfileId,
            date: today,
          },
        },
      }),
      db.attendance.findMany({
        where: {
          employeeId: session.employeeProfileId,
          date: { gte: sevenDaysAgo, lte: today },
        },
        orderBy: { date: "asc" },
      }),
      db.leaveRequest.findMany({
        where: { employeeId: session.employeeProfileId },
        include: { leaveType: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      db.notification.findMany({
        where: { receiverId: session.id, isRead: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const weekStats = {
    present: weekAttendance.filter((a) => a.status === "PRESENT").length,
    absent: weekAttendance.filter((a) => a.status === "ABSENT").length,
    halfDay: weekAttendance.filter((a) => a.status === "HALF_DAY").length,
    leave: weekAttendance.filter((a) => a.status === "LEAVE").length,
  };

  return (
    <div>
      <Topbar
        title={`Good ${getGreeting()}, ${employee?.firstName || "there"}! 👋`}
        subtitle={`Today is ${formatDate(new Date())}`}
      />
      <div className="page-body">
        <EmployeeDashboardClient
          employee={JSON.parse(JSON.stringify(employee))}
          todayAttendance={JSON.parse(JSON.stringify(todayAttendance))}
          weekAttendance={JSON.parse(JSON.stringify(weekAttendance))}
          weekStats={weekStats}
          recentLeaves={JSON.parse(JSON.stringify(recentLeaves))}
          unreadNotifs={JSON.parse(JSON.stringify(unreadNotifs))}
        />
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
