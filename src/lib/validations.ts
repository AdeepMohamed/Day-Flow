// src/lib/validations.ts
// Zod schemas for all forms and API inputs

import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  employeeId: z
    .string()
    .min(3, "Employee ID must be at least 3 characters")
    .max(20, "Employee ID too long")
    .regex(/^[A-Z0-9-]+$/i, "Employee ID can only contain letters, numbers, and hyphens"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  role: z.enum(["EMPLOYEE", "HR", "ADMIN"]).default("EMPLOYEE"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Employee Profile ─────────────────────────────────────────────────────────

export const employeeEditSelfSchema = z.object({
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  profilePicture: z.string().url().optional().nullable(),
});

export const employeeEditAdminSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  profilePicture: z.string().url().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  startDate: z.string().optional().nullable(),
  employmentType: z.string().max(50).optional().nullable(),
  managerId: z.string().optional().nullable(),
});

// ─── Attendance ───────────────────────────────────────────────────────────────

export const checkInSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const checkOutSchema = z.object({
  notes: z.string().max(500).optional(),
});

// ─── Leave ────────────────────────────────────────────────────────────────────

export const leaveRequestSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Please select a leave type"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    remarks: z.string().max(500).optional(),
  })
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    {
      message: "End date must be on or after start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => new Date(data.startDate) >= new Date(new Date().toDateString()),
    {
      message: "Start date cannot be in the past",
      path: ["startDate"],
    }
  );

export const leaveReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().max(500).optional(),
});

// ─── Payroll ──────────────────────────────────────────────────────────────────

export const salaryUpdateSchema = z.object({
  baseSalary: z
    .number()
    .positive("Base salary must be positive")
    .max(10_000_000, "Salary too large"),
  allowances: z.number().min(0).max(10_000_000).default(0),
  deductions: z.number().min(0).max(10_000_000).default(0),
  currency: z.string().length(3).default("USD"),
  effectiveFrom: z.string().min(1, "Effective date is required"),
});

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(500, "Message too long (max 500 characters)"),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(1000),
      })
    )
    .max(20)
    .default([]),
});
