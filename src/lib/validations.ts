// src/lib/validations.ts
// Zod schemas for all forms and API inputs

import { z } from "zod";

const optionalEmail = z.union([z.string().email(), z.literal(""), z.null()]).optional();
const optionalUrl = z.union([z.string().url(), z.literal(""), z.null()]).optional();
const optionalString = z.union([z.string(), z.null()]).optional();

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
  phone: optionalString,
  address: optionalString,
  profilePicture: optionalUrl,
  personalEmail: optionalEmail,
  nationality: optionalString,
  maritalStatus: optionalString,
  bankName: optionalString,
  bankAccountNo: optionalString,
  ifscCode: optionalString,
  panNumber: optionalString,
  uanNumber: optionalString,
  skills: z.array(z.string()).optional(),
});

export const employeeEditAdminSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: optionalString,
  address: optionalString,
  profilePicture: optionalUrl,
  dateOfBirth: optionalString,
  gender: optionalString,
  department: optionalString,
  position: optionalString,
  startDate: optionalString,
  dateOfJoining: optionalString,
  company: optionalString,
  location: optionalString,
  employmentType: optionalString,
  managerId: optionalString,
  // Personal (Excalidraw)
  nationality: optionalString,
  maritalStatus: optionalString,
  personalEmail: optionalEmail,
  // Bank & Govt IDs (Excalidraw)
  bankName: optionalString,
  bankAccountNo: optionalString,
  ifscCode: optionalString,
  panNumber: optionalString,
  uanNumber: optionalString,
  // Skills & Certifications
  skills: z.array(z.string()).optional(),
  certifications: z.any().optional(),
});

// ─── Attendance ──────────────────────────────────────────────────────────────

export const checkInSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const checkOutSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const attendanceAdminUpdateSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"]),
  notes: z.string().max(500).optional().nullable(),
});

// ─── Leave ───────────────────────────────────────────────────────────────────

export const leaveRequestSchema = z.object({
  leaveTypeId: z.string().min(1, "Please select a leave type"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  remarks: z.string().max(500).optional(),
  attachmentUrl: optionalUrl,
});

export const leaveReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().max(500).optional(),
});

// ─── Payroll ─────────────────────────────────────────────────────────────────

export const salaryStructureSchema = z.object({
  employeeId: z.string(),
  baseSalary: z.number().min(0, "Base salary must be positive"),
  allowances: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  // Dynamic Salary Engine Fields
  monthlyWage: z.number().min(0).optional().nullable(),
  yearlyWage: z.number().min(0).optional().nullable(),
  basicSalary: z.number().min(0).optional().nullable(),
  hra: z.number().min(0).optional().nullable(),
  standardAllowance: z.number().min(0).optional().nullable(),
  performanceBonus: z.number().min(0).optional().nullable(),
  lta: z.number().min(0).optional().nullable(),
  fixedAllowance: z.number().min(0).optional().nullable(),
  pfEmployee: z.number().min(0).optional().nullable(),
  pfEmployer: z.number().min(0).optional().nullable(),
  professionalTax: z.number().min(0).optional().nullable(),
  workingDaysPerWeek: z.number().min(1).max(7).optional().nullable(),
  breakTimeMinutes: z.number().min(0).max(300).optional().nullable(),
  currency: z.string().default("USD"),
  effectiveFrom: z.string().min(1, "Effective date is required"),
});

export const salaryUpdateSchema = salaryStructureSchema;

// ─── AI Chat ─────────────────────────────────────────────────────────────────

export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(1000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .default([]),
});
