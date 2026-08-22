// prisma/seed.ts
import "dotenv/config";
import { db as prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";

// Retry wrapper for Neon serverless cold-start connection timeouts
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (i < retries - 1 && msg.includes("Connection terminated")) {
        console.log(`⚠️  Connection timeout — retrying in ${delayMs}ms... (attempt ${i + 2}/${retries})`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

async function main() {
  // Warm up connection with a ping first
  console.log("🔌 Warming up Neon DB connection...");
  await withRetry(() => prisma.$queryRaw`SELECT 1`);
  console.log("✅ Connected!");
  console.log("🌱 Seeding PeopleOS database on Neon PostgreSQL...");

  // Seed leave types
  const leaveTypes = await Promise.all([
    prisma.leaveType.upsert({
      where: { name: "Paid Leave" },
      update: {},
      create: { name: "Paid Leave", type: "PAID", daysAllowed: 20, description: "Annual paid time off" },
    }),
    prisma.leaveType.upsert({
      where: { name: "Sick Leave" },
      update: {},
      create: { name: "Sick Leave", type: "SICK", daysAllowed: 10, description: "Medical and illness leave" },
    }),
    prisma.leaveType.upsert({
      where: { name: "Unpaid Leave" },
      update: {},
      create: { name: "Unpaid Leave", type: "UNPAID", daysAllowed: null, description: "Leave without pay" },
    }),
  ]);
  console.log("✅ Leave types seeded:", leaveTypes.map((l) => l.name));

  // ─── Admin ─────────────────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@peopleos.com" },
    update: {},
    create: {
      employeeId: "EMP-ADMIN-001",
      email: "admin@peopleos.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      emailVerified: true,
      employee: {
        create: {
          firstName: "Alex",
          lastName: "Admin",
          department: "Human Resources",
          position: "HR Director",
          employmentType: "Full-time",
          startDate: new Date("2020-01-01"),
        },
      },
    },
    include: { employee: true },
  });
  console.log("✅ Admin seeded:", admin.email);

  // ─── HR ────────────────────────────────────────────────────────────────────
  const hrPasswordHash = await bcrypt.hash("Hr@123456", 12);
  const hr = await prisma.user.upsert({
    where: { email: "hr@peopleos.com" },
    update: {},
    create: {
      employeeId: "EMP-HR-001",
      email: "hr@peopleos.com",
      passwordHash: hrPasswordHash,
      role: "HR",
      emailVerified: true,
      employee: {
        create: {
          firstName: "Sam",
          lastName: "HR",
          department: "Human Resources",
          position: "HR Officer",
          employmentType: "Full-time",
          startDate: new Date("2021-03-15"),
        },
      },
    },
    include: { employee: true },
  });
  console.log("✅ HR user seeded:", hr.email);

  // ─── Employees ─────────────────────────────────────────────────────────────
  const empPasswordHash = await bcrypt.hash("Employee@123456", 12);

  const empData = [
    {
      employeeId: "EMP-001",
      email: "john.doe@peopleos.com",
      firstName: "John",
      lastName: "Doe",
      department: "Engineering",
      position: "Software Engineer",
      baseSalary: 85000,
      startDate: "2022-01-01",
      // Attendance pattern: mostly PRESENT, 2 ABSENT, 3 HALF_DAY, 2 LEAVE days
      absents: [3, 17],
      halfDays: [6, 12, 22],
      leaves: [9, 25],
    },
    {
      employeeId: "EMP-002",
      email: "jane.smith@peopleos.com",
      firstName: "Jane",
      lastName: "Smith",
      department: "Marketing",
      position: "Marketing Manager",
      baseSalary: 75000,
      startDate: "2022-03-10",
      // Jane has good attendance - 1 ABSENT, 2 HALF_DAY
      absents: [14],
      halfDays: [5, 20],
      leaves: [10, 27],
    },
    {
      employeeId: "EMP-003",
      email: "mike.johnson@peopleos.com",
      firstName: "Mike",
      lastName: "Johnson",
      department: "Engineering",
      position: "Senior Engineer",
      baseSalary: 105000,
      startDate: "2021-06-15",
      // Mike does heavy overtime, 1 ABSENT
      absents: [21],
      halfDays: [8],
      leaves: [15],
    },
    // ── NEW EMPLOYEES ─────────────────────────────────────────────────────────
    {
      employeeId: "EMP-004",
      email: "priya.patel@peopleos.com",
      firstName: "Priya",
      lastName: "Patel",
      department: "Finance",
      position: "Financial Analyst",
      baseSalary: 72000,
      startDate: "2023-02-01",
      // Priya is a new joiner — 3 ABSENT early, 2 HALF_DAY
      absents: [28, 27, 2],
      halfDays: [18, 7],
      leaves: [],
    },
    {
      employeeId: "EMP-005",
      email: "carlos.mendez@peopleos.com",
      firstName: "Carlos",
      lastName: "Mendez",
      department: "Sales",
      position: "Sales Executive",
      baseSalary: 65000,
      startDate: "2023-07-15",
      absents: [11, 24],
      halfDays: [4, 16],
      leaves: [20],
    },
    {
      employeeId: "EMP-006",
      email: "aisha.khan@peopleos.com",
      firstName: "Aisha",
      lastName: "Khan",
      department: "Design",
      position: "UI/UX Designer",
      baseSalary: 78000,
      startDate: "2022-09-01",
      absents: [13],
      halfDays: [6, 19, 26],
      leaves: [5],
    },
  ];

  const allEmployees: { id: string; name: string; pattern: typeof empData[0] }[] = [];

  if (admin.employee) {
    allEmployees.push({ id: admin.employee.id, name: "admin", pattern: { employeeId: "EMP-ADMIN-001", email: "admin@peopleos.com", firstName: "Alex", lastName: "Admin", department: "Human Resources", position: "HR Director", baseSalary: 90000, startDate: "2020-01-01", absents: [12], halfDays: [7], leaves: [] } });
  }
  if (hr.employee) {
    allEmployees.push({ id: hr.employee.id, name: "hr", pattern: { employeeId: "EMP-HR-001", email: "hr@peopleos.com", firstName: "Sam", lastName: "HR", department: "Human Resources", position: "HR Officer", baseSalary: 70000, startDate: "2021-03-15", absents: [20], halfDays: [10], leaves: [25] } });
  }

  for (const emp of empData) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        employeeId: emp.employeeId,
        email: emp.email,
        passwordHash: empPasswordHash,
        role: "EMPLOYEE",
        emailVerified: true,
        employee: {
          create: {
            firstName: emp.firstName,
            lastName: emp.lastName,
            department: emp.department,
            position: emp.position,
            employmentType: "Full-time",
            startDate: new Date(emp.startDate),
          },
        },
      },
      include: { employee: true },
    });

    if (user.employee) {
      allEmployees.push({ id: user.employee.id, name: emp.email, pattern: emp });

      const monthly = Math.round(emp.baseSalary / 12);
      const basic = Math.round(monthly * 0.5);

      await prisma.salaryStructure.upsert({
        where: { employeeId: user.employee.id },
        update: {},
        create: {
          employeeId: user.employee.id,
          baseSalary: emp.baseSalary,
          monthlyWage: monthly,
          yearlyWage: emp.baseSalary,
          basicSalary: basic,
          hra: Math.round(basic * 0.5),
          fixedAllowance: Math.round(monthly - basic - Math.round(basic * 0.5)),
          pfEmployee: Math.round(basic * 0.12),
          allowances: Math.round(emp.baseSalary * 0.1),
          deductions: Math.round(emp.baseSalary * 0.05),
          currency: "USD",
          effectiveFrom: new Date(emp.startDate),
        },
      });
    }

    console.log("✅ Employee seeded:", emp.email);
  }

  // ─── Seed 30 Days of Realistic Attendance ──────────────────────────────────
  console.log("\n⏰ Seeding 30 days of attendance (Present / Absent / Half Day / Leave) ...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendanceBatch: {
    employeeId: string;
    date: Date;
    checkIn: Date | null;
    checkOut: Date | null;
    status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
    notes: string;
  }[] = [];

  for (const { id: empId, pattern } of allEmployees) {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends

      const dateObj = new Date(d);
      let checkIn: Date | null = null;
      let checkOut: Date | null = null;
      let status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" = "PRESENT";
      let notes = "Regular workday";

      if (pattern.absents.includes(i)) {
        // ABSENT — no check-in / check-out
        status = "ABSENT";
        checkIn = null;
        checkOut = null;
        notes = "Absent — not present";
      } else if (pattern.leaves.includes(i)) {
        // LEAVE — no check-in / check-out
        status = "LEAVE";
        checkIn = null;
        checkOut = null;
        notes = "Approved Paid Leave";
      } else if (pattern.halfDays.includes(i)) {
        // HALF DAY — 09:00 to 13:00
        status = "HALF_DAY";
        checkIn = new Date(d); checkIn.setHours(9, 0, 0, 0);
        checkOut = new Date(d); checkOut.setHours(13, 0, 0, 0);
        notes = "Half day (personal appointment)";
      } else if (i === 0) {
        // TODAY — checked in, no checkout yet
        checkIn = new Date(d); checkIn.setHours(8, 45, 0, 0);
        checkOut = null;
        notes = "Checked in for today";
      } else if (i % 4 === 0) {
        // OVERTIME DAY — 08:30 to 19:30 (+3h extra)
        checkIn = new Date(d); checkIn.setHours(8, 30, 0, 0);
        checkOut = new Date(d); checkOut.setHours(19, 30, 0, 0);
        notes = "Project release overtime (+3.0 hrs extra)";
      } else {
        // STANDARD DAY — 09:00 to 17:45 (+45m extra)
        checkIn = new Date(d); checkIn.setHours(9, 0, 0, 0);
        checkOut = new Date(d); checkOut.setHours(17, 45, 0, 0);
        notes = "Standard shift completed";
      }

      attendanceBatch.push({ employeeId: empId, date: dateObj, checkIn, checkOut, status, notes });
    }
  }

  // Clear old and insert all at once
  await prisma.attendance.deleteMany({});
  await prisma.attendance.createMany({ data: attendanceBatch, skipDuplicates: true });

  console.log(`✅ ${attendanceBatch.length} attendance records inserted across ${allEmployees.length} employees!`);

  console.log("\n🎉 Seeding complete on Neon PostgreSQL!");
  console.log("\n📋 Demo credentials:");
  console.log("  Admin:    admin@peopleos.com        / Admin@123456");
  console.log("  HR:       hr@peopleos.com           / Hr@123456");
  console.log("  Employee: john.doe@peopleos.com     / Employee@123456");
  console.log("  Employee: priya.patel@peopleos.com  / Employee@123456");
  console.log("  Employee: carlos.mendez@peopleos.com/ Employee@123456");
  console.log("  Employee: aisha.khan@peopleos.com   / Employee@123456");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
