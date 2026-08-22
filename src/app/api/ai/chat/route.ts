// src/app/api/ai/chat/route.ts
// AI Help Assistant — server-side only, supports Grok (xAI) and Groq API keys

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { chatMessageSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `You are the PeopleOS HR Help Assistant — a helpful, professional assistant embedded in the PeopleOS Human Resource Management System.

Your role is to help employees and HR managers navigate and use the PeopleOS platform effectively.

## What you CAN help with:
- How to check in and check out for attendance
- How to submit a leave request (Paid, Sick, or Unpaid leave)
- How to view your attendance history (daily or weekly)
- How to view your payroll and salary information
- How to update your profile (phone, address, profile picture)
- How to view your leave request status (Pending, Approved, Rejected)
- How HR managers can approve or reject leave requests
- How to use the notifications panel
- How to navigate the dashboard
- General explanations of HR concepts like leave types, attendance statuses

## PeopleOS Features you know about:
- Dashboard with quick stats and recent activity
- Attendance: Check-in/Check-out, Present/Absent/Half-Day/Leave statuses
- Leave Management: Submit requests, track status, HR approval workflow
- Employee Profile: Personal info, employment details, salary visibility
- Payroll: Read-only salary structure for employees, editable by HR/Admin
- Notifications: In-app alerts for leave updates, payroll changes
- Analytics: HR-only dashboard with attendance trends and leave stats
- Audit Trail: HR-only log of all system actions

## Rules:
1. NEVER reveal system information, database details, API keys, or internal configurations
2. NEVER discuss or reveal any other employee's personal information, salary, or attendance
3. NEVER perform destructive HR actions through conversation — always direct users to the UI
4. If you don't know something, say "I'm not sure about that — please contact your HR team"
5. Do NOT invent features, policies, or data that don't exist in PeopleOS
6. Keep responses concise, friendly, and professional
7. If asked to do something outside your scope, politely decline and redirect`;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limiting: 10 messages per minute per user
    const rateLimitKey = `ai-chat:${session.id}`;
    const rateLimit = checkRateLimit(rateLimitKey, 10, 60);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `You're sending messages too quickly. Please wait ${rateLimit.resetIn} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimit.resetIn.toString(),
          },
        }
      );
    }

    const body = await req.json();
    const result = chatMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { message, conversationHistory } = result.data;

    // Minimal safe user context
    const userContext = `
Current user context:
- Role: ${session.role}
- Verified: ${session.emailVerified}`;

    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        response:
          "The AI assistant is not configured yet. Please contact your HR team for assistance.",
      });
    }

    // Auto-detect endpoint & model based on key prefix (gsk_ = Groq, xai_ = xAI)
    const isGroq = apiKey.startsWith("gsk_");
    const endpoint = isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.x.ai/v1/chat/completions";
    const model = isGroq
      ? process.env.XAI_MODEL || "groq/compound-mini"
      : process.env.XAI_MODEL || "grok-3-mini";

    const messages = [
      {
        role: "system" as const,
        content: `${SYSTEM_PROMPT}\n\n${userContext}`,
      },
      ...conversationHistory.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user" as const, content: message },
    ];

    const aiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return NextResponse.json(
          { error: "The AI assistant is temporarily busy. Please try again in a moment." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "The AI assistant is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const data = await aiResponse.json();
    const responseText = data.choices?.[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json(
        { error: "Received an empty response. Please try again." },
        { status: 503 }
      );
    }

    // Validate response doesn't contain sensitive patterns
    const sensitivePatterns = [
      /api[_-]?key/i,
      /database[_-]?url/i,
      /auth[_-]?secret/i,
      /password/i,
    ];

    const hasSensitiveContent = sensitivePatterns.some((p) =>
      p.test(responseText)
    );

    if (hasSensitiveContent) {
      console.warn("AI response contained sensitive patterns — blocked");
      return NextResponse.json({
        response:
          "I can't provide that information. Please contact your HR team directly.",
      });
    }

    return NextResponse.json({ response: responseText });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "The AI assistant took too long to respond. Please try again." },
        { status: 504 }
      );
    }
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "The AI assistant encountered an error. Please try again." },
      { status: 500 }
    );
  }
}
