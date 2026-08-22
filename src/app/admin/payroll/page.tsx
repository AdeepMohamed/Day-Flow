// src/app/admin/payroll/page.tsx
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { AdminPayrollClient } from "./client";

export const metadata = { title: "Payroll Management — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPayrollPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "HR")) {
    redirect("/auth/login");
  }

  const [employees, salaryStructures] = await withDbRetry(() => Promise.all([
    db.employee.findMany({
      include: {
        user: { select: { email: true, employeeId: true } },
        salary: true,
      },
      orderBy: { firstName: "asc" },
    }),
    db.salaryStructure.findMany({
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            department: true,
            position: true,
            user: { select: { employeeId: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]));

  return (
    <div>
      <Topbar title="Payroll & Compensation" subtitle="Manage employee salary structures and monthly wages" />
      <div className="page-body">
        <AdminPayrollClient
          employees={JSON.parse(JSON.stringify(employees))}
          salaryStructures={JSON.parse(JSON.stringify(salaryStructures))}
        />
      </div>
    </div>
  );
}
