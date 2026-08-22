// src/app/employee/profile/page.tsx
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ProfileClient } from "./client";

export const metadata = { title: "My Profile" };

export default async function EmployeeProfilePage() {
  const session = await getSession();
  if (!session || !session.employeeProfileId) redirect("/auth/login");

  const employee = await db.employee.findUnique({
    where: { id: session.employeeProfileId },
    include: {
      user: { select: { email: true, employeeId: true, role: true, createdAt: true } },
      manager: { select: { firstName: true, lastName: true } },
      documents: true,
    },
  });

  if (!employee) redirect("/auth/login");

  return (
    <div>
      <Topbar title="My Profile" subtitle="View and update your personal information" />
      <div className="page-body">
        <ProfileClient employee={JSON.parse(JSON.stringify(employee))} isAdmin={false} />
      </div>
    </div>
  );
}
