// src/app/api/notifications/read-all/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();

    await db.notification.updateMany({
      where: { receiverId: session.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("Mark all read error:", error);
    return NextResponse.json({ error: "Failed to mark notifications" }, { status: 500 });
  }
}
