// src/app/employee/payroll/page.tsx
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { PayrollClient } from "./client";

export const metadata = { title: "My Payroll" };

export default async function EmployeePayrollPage() {
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

  const salary = await db.salaryStructure.findUnique({
    where: { employeeId: empProfileId },
    include: {
      updatedBy: { select: { employee: { select: { firstName: true, lastName: true } } } },
    },
  });

  const payrollHistory = await db.payrollRecord.findMany({
    where: { employeeId: empProfileId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 12,
  });

  const employee = await db.employee.findUnique({
    where: { id: empProfileId },
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
