// src/app/api/attendance/checkin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkInSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    if (!session.employeeProfileId) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 400 });
    }

    const body = await req.json();
    const result = checkInSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await db.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: session.employeeProfileId,
          date: today,
        },
      },
    });

    if (existingAttendance) {
      if (existingAttendance.checkIn) {
        return NextResponse.json(
          { error: "You have already checked in today" },
          { status: 409 }
        );
      }

      // Update existing record (e.g., if created as ABSENT, now marking as PRESENT)
      const updated = await db.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkIn: new Date(),
          status: "PRESENT",
          notes: result.data.notes,
        },
      });

      return NextResponse.json({ attendance: updated, message: "Checked in successfully" });
    }

    // Create new attendance record
    const attendance = await db.attendance.create({
      data: {
        employeeId: session.employeeProfileId,
        date: today,
        checkIn: new Date(),
        status: "PRESENT",
        notes: result.data.notes,
      },
    });

    return NextResponse.json({
      attendance,
      message: "Checked in successfully",
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}
