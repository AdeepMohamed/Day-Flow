// src/app/api/payroll/my/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    if (!session.employeeProfileId) {
      return NextResponse.json({ error: "Employee not found" }, { status: 400 });
    }

    const salary = await db.salaryStructure.findUnique({
      where: { employeeId: session.employeeProfileId },
      include: {
        updatedBy: {
          select: {
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const payrollHistory = await db.payrollRecord.findMany({
      where: { employeeId: session.employeeProfileId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 12,
    });

    return NextResponse.json({ salary, payrollHistory });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("My payroll error:", error);
    return NextResponse.json({ error: "Failed to fetch payroll" }, { status: 500 });
  }
}
