// src/app/api/leave/all/route.ts
// Admin/HR: view all leave requests
import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrHR();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");
    const leaveTypeId = searchParams.get("leaveTypeId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;

    const [leaveRequests, total] = await Promise.all([
      db.leaveRequest.findMany({
        where,
        include: {
          leaveType: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              department: true,
              position: true,
              profilePicture: true,
              user: { select: { employeeId: true, email: true } },
            },
          },
          reviewedBy: {
            select: {
              employee: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.leaveRequest.count({ where }),
    ]);

    return NextResponse.json({
      leaveRequests,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    console.error("All leaves error:", error);
    return NextResponse.json({ error: "Failed to fetch leaves" }, { status: 500 });
  }
}
