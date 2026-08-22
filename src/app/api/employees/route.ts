// src/app/api/employees/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrHR();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { employeeId: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (department) {
      where.department = { equals: department, mode: "insensitive" };
    }

    const [employees, total] = await Promise.all([
      db.employee.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              employeeId: true,
              role: true,
              emailVerified: true,
              createdAt: true,
            },
          },
          salary: true,
          attendance: {
            where: {
              date: new Date(new Date().setHours(0, 0, 0, 0)),
            },
            select: { status: true, date: true },
          },
          leaveRequests: {
            where: {
              status: "APPROVED",
            },
            select: { startDate: true, endDate: true, status: true },
            take: 5,
          },
        },
        skip,
        take: limit,
        orderBy: { firstName: "asc" },
      }),
      db.employee.count({ where }),
    ]);

    return NextResponse.json({
      employees,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    console.error("Employees GET error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}
