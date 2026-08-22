// src/app/api/payroll/[id]/salary/route.ts
// Admin/HR: update an employee's salary structure
import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR } from "@/lib/auth";
import { db } from "@/lib/db";
import { salaryUpdateSchema } from "@/lib/validations";
import { notifyPayrollUpdated } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminOrHR();
    const { id: employeeId } = await params;

    const body = await req.json();
    const result = salaryUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: { user: { select: { id: true } } },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const existingSalary = await db.salaryStructure.findUnique({
      where: { employeeId },
    });

    const { baseSalary, allowances, deductions, currency, effectiveFrom } =
      result.data;
    const netPay = baseSalary + allowances - deductions;

    const salary = await db.salaryStructure.upsert({
      where: { employeeId },
      update: {
        baseSalary,
        allowances,
        deductions,
        currency,
        effectiveFrom: new Date(effectiveFrom),
        updatedById: session.id,
      },
      create: {
        employeeId,
        baseSalary,
        allowances,
        deductions,
        currency,
        effectiveFrom: new Date(effectiveFrom),
        updatedById: session.id,
      },
    });

    // Create a payroll record for the current month
    const now = new Date();
    await db.payrollRecord.upsert({
      where: {
        employeeId_month_year: {
          employeeId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
      update: { baseSalary, allowances, deductions, netPay, status: "DRAFT" },
      create: {
        employeeId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        baseSalary,
        allowances,
        deductions,
        netPay,
        status: "DRAFT",
      },
    });

    await logAudit({
      userId: session.id,
      action: "UPDATE",
      entity: "SalaryStructure",
      entityId: salary.id,
      changes: {
        before: existingSalary
          ? {
              baseSalary: existingSalary.baseSalary,
              allowances: existingSalary.allowances,
              deductions: existingSalary.deductions,
            }
          : null,
        after: { baseSalary, allowances, deductions, currency },
      },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    });

    await notifyPayrollUpdated(
      employee.user.id,
      session.id,
      now.getMonth() + 1,
      now.getFullYear()
    );

    return NextResponse.json({ salary, message: "Salary updated successfully" });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    console.error("Salary update error:", error);
    return NextResponse.json({ error: "Failed to update salary" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrHR();
    const { id: employeeId } = await params;

    const salary = await db.salaryStructure.findUnique({
      where: { employeeId },
      include: {
        updatedBy: {
          select: {
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const payrollHistory = await db.payrollRecord.findMany({
      where: { employeeId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 12,
    });

    return NextResponse.json({ salary, payrollHistory });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    console.error("Admin payroll GET error:", error);
    return NextResponse.json({ error: "Failed to fetch payroll" }, { status: 500 });
  }
}
