// src/app/api/attendance/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isAdminOrHR = session.role === "ADMIN" || session.role === "HR";

    // For admin/HR, they can query any employee
    const employeeId = isAdminOrHR
      ? searchParams.get("employeeId") || session.employeeProfileId
      : session.employeeProfileId;

    if (!employeeId) {
      return NextResponse.json({ error: "Employee not found" }, { status: 400 });
    }

    const view = searchParams.get("view") || "weekly"; // daily | weekly | monthly
    const dateParam = searchParams.get("date");
    const refDate = dateParam ? new Date(dateParam) : new Date();

    let startDate: Date;
    let endDate: Date;

    if (view === "daily") {
      startDate = new Date(refDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(refDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (view === "monthly") {
      startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
    } else {
      // Weekly — Mon to Sun
      const day = refDate.getDay();
      const diff = refDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(refDate);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    const attendance = await db.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Calculate stats
    const stats = {
      present: attendance.filter((a) => a.status === "PRESENT").length,
      absent: attendance.filter((a) => a.status === "ABSENT").length,
      halfDay: attendance.filter((a) => a.status === "HALF_DAY").length,
      leave: attendance.filter((a) => a.status === "LEAVE").length,
      total: attendance.length,
    };

    return NextResponse.json({ attendance, stats, startDate, endDate });
  } catch (error) {
    console.error("Attendance history error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}
