// src/app/employee/payroll/page.tsx
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { PayrollClient } from "./client";

export const metadata = { title: "My Payroll" };

export default async function EmployeePayrollPage() {
  const session = await getSession();
  if (!session || !session.employeeProfileId) redirect("/auth/login");

  const salary = await db.salaryStructure.findUnique({
    where: { employeeId: session.employeeProfileId },
    include: {
      updatedBy: { select: { employee: { select: { firstName: true, lastName: true } } } },
    },
  });

  const payrollHistory = await db.payrollRecord.findMany({
    where: { employeeId: session.employeeProfileId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 12,
  });

  const employee = await db.employee.findUnique({
    where: { id: session.employeeProfileId },
    select: { firstName: true, lastName: true, position: true, department: true },
  });

  return (
    <div>
      <Topbar title="Payroll" subtitle="Your salary information (read-only)" />
      <div className="page-body">
        <PayrollClient
          salary={salary ? JSON.parse(JSON.stringify(salary)) : null}
          payrollHistory={JSON.parse(JSON.stringify(payrollHistory))}
          employee={employee ? JSON.parse(JSON.stringify(employee)) : null}
        />
      </div>
    </div>
  );
}
