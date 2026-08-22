// src/app/admin/attendance/page.tsx
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { AdminAttendanceClient } from "./client";

export const metadata = { title: "Attendance Management — Admin" };

export default async function AdminAttendancePage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "HR")) {
    redirect("/auth/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [employees, todayAttendance] = await Promise.all([
    db.employee.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        department: true,
        position: true,
        profilePicture: true,
        user: { select: { employeeId: true } },
      },
      orderBy: { firstName: "asc" },
    }),
    db.attendance.findMany({
      where: { date: today },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
            profilePicture: true,
            user: { select: { employeeId: true } },
          },
        },
      },
      orderBy: { employee: { firstName: "asc" } },
    }),
  ]);

  return (
    <div>
      <Topbar title="Attendance Management" subtitle="Monitor and manage workforce daily attendance" />
      <div className="page-body">
        <AdminAttendanceClient
          employees={JSON.parse(JSON.stringify(employees))}
          initialAttendance={JSON.parse(JSON.stringify(todayAttendance))}
        />
      </div>
    </div>
  );
}
