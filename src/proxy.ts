// src/proxy.ts
// Route protection proxy — Next.js 16 server-enforced RBAC

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/verify",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get("peopleos_session")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
