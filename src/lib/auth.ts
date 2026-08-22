// src/lib/auth.ts
// Session management utilities

import { cookies } from "next/headers";
import { db } from "./db";
import { User, Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  employeeId: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  employeeProfileId: string | null;
};

/**
 * Get the currently authenticated user from the session cookie.
 * Returns null if not authenticated or session expired.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("peopleos_session")?.value;

    if (!sessionToken) return null;

    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          include: {
            employee: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      // Clean up expired session
      if (session) {
        await db.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      return null;
    }

    const { user } = session;

    return {
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      employeeProfileId: user.employee?.id ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Require authentication — throws redirect if not logged in.
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
 * Generate a secure session token.
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString("hex");
}

/**
 * Create a session for a user.
 */
export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
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
