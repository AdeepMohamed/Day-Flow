// src/app/api/leave/my/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    if (!session.employeeProfileId) {
      return NextResponse.json({ error: "Employee not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      employeeId: session.employeeProfileId,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    const leaveRequests = await db.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        reviewedBy: {
          select: { employee: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leaveRequests });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("My leaves error:", error);
    return NextResponse.json({ error: "Failed to fetch leave requests" }, { status: 500 });
  }
}
