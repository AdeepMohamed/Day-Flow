// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { generateVerifyToken } from "@/lib/auth";
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

    // Check for duplicates
    const [existingEmail, existingEmpId] = await Promise.all([
      db.user.findUnique({ where: { email } }),
      db.user.findUnique({ where: { employeeId } }),
    ]);

    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    if (existingEmpId) {
      return NextResponse.json(
        { error: "An account with this Employee ID already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verifyToken = generateVerifyToken();
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await db.user.create({
      data: {
        employeeId,
        email,
        passwordHash,
        role,
        verifyToken,
        verifyExpiry,
        employee: {
          create: {
            firstName,
            lastName,
          },
        },
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      changes: { after: { email, employeeId, role } },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    });

    // In production, send verification email via Resend
    // For hackathon demo, auto-verify if RESEND_API_KEY is not set
    if (!process.env.RESEND_API_KEY) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: true, verifyToken: null },
      });
    } else {
      // TODO: Send email via Resend
      // await sendVerificationEmail(email, verifyToken);
    }

    return NextResponse.json(
      {
        success: true,
        message: process.env.RESEND_API_KEY
          ? "Account created! Please check your email to verify your account."
          : "Account created successfully! You can now sign in.",
        requiresVerification: !!process.env.RESEND_API_KEY,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
