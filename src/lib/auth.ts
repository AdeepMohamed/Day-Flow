// src/lib/auth.ts
// Fast, Zero-Database-Latency Session Management (HMAC Signed Tokens)

import { cookies } from "next/headers";
import { cache } from "react";
import crypto from "crypto";
import { db } from "./db";
import { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  employeeId: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  employeeProfileId: string | null;
};

type SessionTokenPayload = SessionUser & {
  exp: number;
};

const AUTH_SECRET =
  process.env.AUTH_SECRET || "peopleos-super-secret-key-32-chars-min-hackathon";

/**
 * Fast HMAC SHA-256 token signing
 */
function signToken(payload: SessionTokenPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Fast HMAC SHA-256 token verification (0ms database calls)
 */
function verifyToken(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [data, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(data)
      .digest("base64url");

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf-8")
    ) as SessionTokenPayload;

    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }

    return {
      id: payload.id,
      employeeId: payload.employeeId,
      email: payload.email,
      role: payload.role,
      emailVerified: payload.emailVerified,
      employeeProfileId: payload.employeeProfileId,
    };
  } catch {
    return null;
  }
}

/**
 * Get the currently authenticated user from the session cookie.
 * Wrapped in React cache() to run max ONCE per request with 0ms DB latency.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("peopleos_session")?.value;

    if (!sessionToken) return null;

    // Fast path: verify HMAC token in 0ms (no database lookup)
    const session = verifyToken(sessionToken);
    if (session) return session;

    // Fallback: check database for legacy sessions
    const dbSession = await db.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          include: {
            employee: { select: { id: true } },
          },
        },
      },
    });

    if (!dbSession || dbSession.expiresAt < new Date()) {
      return null;
    }

    return {
      id: dbSession.user.id,
      employeeId: dbSession.user.employeeId,
      email: dbSession.user.email,
      role: dbSession.user.role,
      emailVerified: dbSession.user.emailVerified,
      employeeProfileId: dbSession.user.employee?.id ?? null,
    };
  } catch {
    return null;
  }
});

/**
 * Require authentication — throws error if not logged in.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/**
 * Require a specific role or roles.
 */
export async function requireRole(
  roles: Role | Role[]
): Promise<SessionUser> {
  const session = await requireAuth();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

/**
 * Check if the current user is an admin or HR.
 */
export async function requireAdminOrHR(): Promise<SessionUser> {
  return requireRole(["ADMIN", "HR"]);
}

/**
 * Create a signed HMAC session token instantly from user object (0ms DB latency).
 */
export function createSessionToken(user: SessionUser): string {
  const payload: SessionTokenPayload = {
    id: user.id,
    employeeId: user.employeeId,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    employeeProfileId: user.employeeProfileId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  return signToken(payload);
}

/**
 * Legacy helper for backwards compatibility.
 */
export async function createSession(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { employee: { select: { id: true } } },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return createSessionToken({
    id: user.id,
    employeeId: user.employeeId,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    employeeProfileId: user.employee?.id ?? null,
  });
}

/**
 * Delete a session (logout).
 */
export async function deleteSession(token: string): Promise<void> {
  await db.session.delete({ where: { token } }).catch(() => {});
}

/**
 * Generate an email verification token.
 */
export function generateVerifyToken(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString("hex");
}
