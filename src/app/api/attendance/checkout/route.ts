// src/app/api/attendance/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkOutSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    if (!session.employeeProfileId) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 400 });
    }

    const body = await req.json();
    const result = checkOutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await db.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: session.employeeProfileId,
          date: today,
        },
      },
    });

    if (!existingAttendance || !existingAttendance.checkIn) {
      return NextResponse.json(
        { error: "You have not checked in today" },
        { status: 409 }
      );
    }

    if (existingAttendance.checkOut) {
      return NextResponse.json(
        { error: "You have already checked out today" },
        { status: 409 }
      );
    }

    const checkOutTime = new Date();
    const checkInTime = existingAttendance.checkIn;
    const hoursWorked =
      (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    // Auto-set half-day if worked < 4 hours
    const status =
      hoursWorked < 4 ? "HALF_DAY" : existingAttendance.status;

    const updated = await db.attendance.update({
      where: { id: existingAttendance.id },
      data: {
        checkOut: checkOutTime,
        status,
        notes: result.data.notes ?? existingAttendance.notes,
      },
    });

    return NextResponse.json({
      attendance: updated,
      hoursWorked: Math.round(hoursWorked * 10) / 10,
      message: "Checked out successfully",
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("Check-out error:", error);
    return NextResponse.json({ error: "Check-out failed" }, { status: 500 });
  }
}
