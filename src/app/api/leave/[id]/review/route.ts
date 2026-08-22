// src/app/api/leave/[id]/review/route.ts
// Admin/HR: approve or reject a leave request

import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrHR } from "@/lib/auth";
import { db } from "@/lib/db";
import { leaveReviewSchema } from "@/lib/validations";
import { notifyLeaveApproved, notifyLeaveRejected } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { formatDate } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminOrHR();
    const { id } = await params;

    const body = await req.json();
    const result = leaveReviewSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { status, reviewNote } = result.data;

    const leaveRequest = await db.leaveRequest.findUnique({
      where: { id },
      include: {
        leaveType: true,
        employee: {
          include: { user: { select: { id: true } } },
        },
      },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    // Prevent reviewing already-processed requests
    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json(
        {
          error: `This request has already been ${leaveRequest.status.toLowerCase()}`,
        },
        { status: 409 }
      );
    }

    // Prevent standard HR from approving their own leave (Admins can approve any leave)
    if (leaveRequest.employee.user.id === session.id && session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You cannot approve or reject your own leave request" },
        { status: 403 }
      );
    }

    const updated = await db.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewedById: session.id,
        reviewedAt: new Date(),
        reviewNote,
      },
      include: { leaveType: true },
    });

    // If approved, update attendance records to LEAVE for the date range
    if (status === "APPROVED") {
      const start = new Date(leaveRequest.startDate);
      const end = new Date(leaveRequest.endDate);
      const dates: Date[] = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        // Skip weekends (Saturday=6, Sunday=0)
        if (d.getDay() !== 0 && d.getDay() !== 6) {
          dates.push(new Date(d));
        }
      }

      // Upsert attendance records for each day
      for (const date of dates) {
        await db.attendance.upsert({
          where: {
            employeeId_date: {
              employeeId: leaveRequest.employeeId,
              date,
            },
          },
          update: { status: "LEAVE" },
          create: {
            employeeId: leaveRequest.employeeId,
            date,
            status: "LEAVE",
            notes: `Approved ${leaveRequest.leaveType.name}`,
          },
        });
      }
    }

    await logAudit({
      userId: session.id,
      action: status === "APPROVED" ? "APPROVE" : "REJECT",
      entity: "LeaveRequest",
      entityId: id,
      changes: {
        before: { status: "PENDING" },
        after: { status, reviewNote },
      },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    });

    // Notify the employee
    const employeeUserId = leaveRequest.employee.user.id;
    const startStr = formatDate(leaveRequest.startDate);
    const endStr = formatDate(leaveRequest.endDate);
    const leaveTypeName = leaveRequest.leaveType.name;

    if (status === "APPROVED") {
      await notifyLeaveApproved(
        employeeUserId,
        session.id,
        leaveTypeName,
        startStr,
        endStr,
        reviewNote,
        id
      );
    } else {
      await notifyLeaveRejected(
        employeeUserId,
        session.id,
        leaveTypeName,
        startStr,
        endStr,
        reviewNote,
        id
      );
    }

    return NextResponse.json({
      leaveRequest: updated,
      message: `Leave request ${status.toLowerCase()} successfully`,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    console.error("Leave review error:", error);
    return NextResponse.json({ error: "Failed to review leave request" }, { status: 500 });
  }
}
