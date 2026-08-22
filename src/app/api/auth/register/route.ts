// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { registerSchema } from "@/lib/validations";
import { createSessionToken, generateVerifyToken } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { employeeId, email, password, firstName, lastName, role } = result.data;

    // Check for existing user or employee ID
    const [existingEmail, existingEmpId] = await withDbRetry(() =>
      Promise.all([
        db.user.findUnique({ where: { email } }),
        db.user.findUnique({ where: { employeeId } }),
      ])
    );

    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    if (existingEmpId) {
      return NextResponse.json(
        { error: "An account with this Employee ID already exists." },
        { status: 409 }
      );
    }

    // Fast bcrypt hashing (cost 10)
    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = generateVerifyToken();
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await withDbRetry(() =>
      db.user.create({
        data: {
          employeeId,
          email,
          passwordHash,
          role,
          emailVerified: true,
          verifyToken,
          verifyExpiry,
          employee: {
            create: {
              firstName,
              lastName,
              startDate: new Date(),
            },
          },
        },
        include: {
          employee: { select: { id: true } },
        },
      })
    );

    // Auto-create salary structure for new employee (background non-blocking)
    if (user.employee?.id) {
      const defaultSalary = role === "ADMIN" ? 90000 : role === "HR" ? 70000 : 65000;
      const monthly = Math.round(defaultSalary / 12);
      const basic = Math.round(monthly * 0.5);

      db.salaryStructure.create({
        data: {
          employeeId: user.employee.id,
          baseSalary: defaultSalary,
          monthlyWage: monthly,
          yearlyWage: defaultSalary,
          basicSalary: basic,
          hra: Math.round(basic * 0.5),
          fixedAllowance: Math.round(monthly - basic - Math.round(basic * 0.5)),
          pfEmployee: Math.round(basic * 0.12),
          allowances: Math.round(defaultSalary * 0.1),
          deductions: Math.round(defaultSalary * 0.05),
          currency: "USD",
          effectiveFrom: new Date(),
        },
      }).catch((e) => console.error("Auto-salary error:", e));
    }

    // Non-blocking background audit log
    logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      changes: { after: { email, employeeId, role } },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    }).catch((e) => console.error("Audit log error:", e));

    // 0ms HMAC Token Generation (no database write/lookup latency!)
    const sessionToken = createSessionToken({
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      employeeProfileId: user.employee?.id ?? null,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully! Redirecting...",
        requiresVerification: false,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          employeeProfileId: user.employee?.id ?? null,
        },
      },
      { status: 201 }
    );

    response.cookies.set("peopleos_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
