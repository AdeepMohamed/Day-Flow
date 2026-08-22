// src/app/api/attendance/today/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    if (!session.employeeProfileId) {
      return NextResponse.json({ error: "Employee not found" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await db.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: session.employeeProfileId,
          date: today,
        },
      },
    });

    return NextResponse.json({ attendance });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("Today attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}
