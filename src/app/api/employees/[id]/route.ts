// src/app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { employeeEditSelfSchema, employeeEditAdminSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const isAdminOrHR = session.role === "ADMIN" || session.role === "HR";

    // Employees can only view their own profile
    if (!isAdminOrHR && session.employeeProfileId !== id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            employeeId: true,
            role: true,
            createdAt: true,
          },
        },
        salary: true,
        documents: true,
        leaveRequests: {
          include: { leaveType: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        attendance: {
          orderBy: { date: "desc" },
          take: 7,
        },
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Employee GET error:", error);
    return NextResponse.json({ error: "Failed to fetch employee" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const isAdminOrHR = session.role === "ADMIN" || session.role === "HR";

    // Employees can only update their own profile
    if (!isAdminOrHR && session.employeeProfileId !== id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();

    // Use appropriate schema based on role
    const schema = isAdminOrHR ? employeeEditAdminSchema : employeeEditSelfSchema;
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await db.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...result.data };

    // Convert date strings to Date objects
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth as string);
    }
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate as string);
    }
    if (updateData.dateOfJoining) {
      updateData.dateOfJoining = new Date(updateData.dateOfJoining as string);
    }

    const updated = await db.employee.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: session.id,
      action: "UPDATE",
      entity: "Employee",
      entityId: id,
      changes: { before: existing, after: updated },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({ employee: updated });
  } catch (error) {
    console.error("Employee PATCH error:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}
