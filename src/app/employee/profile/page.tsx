// src/app/employee/profile/page.tsx
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ProfileClient } from "./client";

export const metadata = { title: "My Profile" };

export default async function EmployeeProfilePage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  let employee = session.employeeProfileId
    ? await db.employee.findUnique({
        where: { id: session.employeeProfileId },
        include: {
          user: { select: { email: true, employeeId: true, role: true, createdAt: true } },
          manager: { select: { firstName: true, lastName: true } },
          documents: true,
          salary: true,
        },
      })
    : await db.employee.findUnique({
        where: { userId: session.id },
        include: {
          user: { select: { email: true, employeeId: true, role: true, createdAt: true } },
          manager: { select: { firstName: true, lastName: true } },
          documents: true,
          salary: true,
        },
      });

  if (!employee) {
    employee = await db.employee.create({
      data: {
        userId: session.id,
        firstName: session.email.split("@")[0],
        lastName: "User",
        department: "General",
        position: "Employee",
      },
      include: {
        user: { select: { email: true, employeeId: true, role: true, createdAt: true } },
        manager: { select: { firstName: true, lastName: true } },
        documents: true,
        salary: true,
      },
    });
  }

  return (
    <div>
      <Topbar title="My Profile" subtitle="View and update your personal information" />
      <div className="page-body">
        <ProfileClient employee={JSON.parse(JSON.stringify(employee))} isAdmin={false} />
      </div>
    </div>
  );
}
