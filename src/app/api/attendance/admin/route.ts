// src/app/api/attendance/admin/route.ts
// Admin view of all employees' attendance

import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrHR();

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const employeeId = searchParams.get("employeeId");
    const department = searchParams.get("department");
    const status = searchParams.get("status");
    const view = searchParams.get("view") || "daily";

    const refDate = dateParam ? new Date(dateParam) : new Date();

    let startDate: Date;
    let endDate: Date;

    if (view === "weekly") {
      const day = refDate.getDay();
      const diff = refDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(refDate);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(refDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(refDate);
      endDate.setHours(23, 59, 59, 999);
    }

    const where: Record<string, unknown> = {
      date: { gte: startDate, lte: endDate },
    };

    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    if (department) {
      where.employee = { department: { equals: department, mode: "insensitive" } };
    }

    const attendance = await db.attendance.findMany({
      where,
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
      orderBy: [{ date: "asc" }, { employee: { firstName: "asc" } }],
    });

    const stats = {
      present: attendance.filter((a) => a.status === "PRESENT").length,
      absent: attendance.filter((a) => a.status === "ABSENT").length,
      halfDay: attendance.filter((a) => a.status === "HALF_DAY").length,
      leave: attendance.filter((a) => a.status === "LEAVE").length,
      total: attendance.length,
    };

    return NextResponse.json({ attendance, stats, startDate, endDate });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    console.error("Admin attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}
