// src/app/api/leave/types/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const leaveTypes = await db.leaveType.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ leaveTypes });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("Leave types error:", error);
    return NextResponse.json({ error: "Failed to fetch leave types" }, { status: 500 });
  }
}
