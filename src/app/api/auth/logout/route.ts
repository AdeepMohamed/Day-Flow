// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("peopleos_session")?.value;

    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("peopleos_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
