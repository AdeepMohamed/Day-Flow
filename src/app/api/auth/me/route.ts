// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ user: session });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
