// src/app/api/leave/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leaveRequestSchema } from "@/lib/validations";
import { notifyLeaveSubmitted } from "@/lib/notifications";
import { formatDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    if (!session.employeeProfileId) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 400 });
    }

    const body = await req.json();
    const result = leaveRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { leaveTypeId, startDate, endDate, remarks } = result.data;

    // Verify leave type exists
    const leaveType = await db.leaveType.findUnique({
      where: { id: leaveTypeId },
    });

    if (!leaveType) {
      return NextResponse.json({ error: "Invalid leave type" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // Check for overlapping leave requests (PENDING or APPROVED)
    const overlap = await db.leaveRequest.findFirst({
      where: {
        employeeId: session.employeeProfileId,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (overlap) {
      return NextResponse.json(
        {
          error: `You already have a ${overlap.status.toLowerCase()} leave request that overlaps with these dates`,
        },
        { status: 409 }
      );
    }

    const leaveRequest = await db.leaveRequest.create({
      data: {
        employeeId: session.employeeProfileId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        remarks,
        status: "PENDING",
      },
      include: {
        leaveType: true,
        employee: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Get all HR/Admin users to notify
    const hrAdminUsers = await db.user.findMany({
      where: { role: { in: ["HR", "ADMIN"] } },
      select: { id: true },
    });

    const employeeName = `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`;

    await notifyLeaveSubmitted(
      session.id,
      hrAdminUsers.map((u) => u.id),
      employeeName,
      leaveType.name,
      formatDate(start),
      formatDate(end),
      leaveRequest.id
    );

    return NextResponse.json({
      leaveRequest,
      message: "Leave request submitted successfully",
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("Leave request error:", error);
    return NextResponse.json({ error: "Failed to submit leave request" }, { status: 500 });
  }
}
