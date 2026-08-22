// prisma/seed.ts
import "dotenv/config";
import { db as prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding PeopleOS database on Neon PostgreSQL...");

  // Seed leave types
  const leaveTypes = await Promise.all([
    prisma.leaveType.upsert({
      where: { name: "Paid Leave" },
      update: {},
      create: {
        name: "Paid Leave",
        type: "PAID",
        daysAllowed: 20,
        description: "Annual paid time off",
      },
    }),
    prisma.leaveType.upsert({
      where: { name: "Sick Leave" },
      update: {},
      create: {
        name: "Sick Leave",
        type: "SICK",
        daysAllowed: 10,
        description: "Medical and illness leave",
      },
    }),
    prisma.leaveType.upsert({
      where: { name: "Unpaid Leave" },
      update: {},
      create: {
        name: "Unpaid Leave",
        type: "UNPAID",
        daysAllowed: null,
        description: "Leave without pay",
      },
    }),
  ]);

  console.log("✅ Leave types seeded:", leaveTypes.map((l) => l.name));

  // Create Admin user
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

  // Create HR user
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

  // Create Employee users
  const empData = [
    {
      employeeId: "EMP-001",
      email: "john.doe@peopleos.com",
      firstName: "John",
      lastName: "Doe",
      department: "Engineering",
      position: "Software Engineer",
      baseSalary: 85000,
    },
    {
      employeeId: "EMP-002",
      email: "jane.smith@peopleos.com",
      firstName: "Jane",
      lastName: "Smith",
      department: "Marketing",
      position: "Marketing Manager",
      baseSalary: 75000,
    },
    {
      employeeId: "EMP-003",
      email: "mike.johnson@peopleos.com",
      firstName: "Mike",
      lastName: "Johnson",
      department: "Engineering",
      position: "Senior Engineer",
      baseSalary: 105000,
    },
  ];

  const empPasswordHash = await bcrypt.hash("Employee@123456", 12);

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
            startDate: new Date("2022-01-01"),
          },
        },
      },
      include: { employee: true },
    });

    if (user.employee) {
      await prisma.salaryStructure.upsert({
        where: { employeeId: user.employee.id },
        update: {},
        create: {
          employeeId: user.employee.id,
          baseSalary: emp.baseSalary,
          allowances: emp.baseSalary * 0.1,
          deductions: emp.baseSalary * 0.05,
          currency: "USD",
          effectiveFrom: new Date("2022-01-01"),
        },
      });
    }

    console.log("✅ Employee seeded:", emp.email);
  }

  console.log("\n🎉 Seeding complete on Neon PostgreSQL!");
  console.log("\n📋 Demo credentials:");
  console.log("  Admin:    admin@peopleos.com  / Admin@123456");
  console.log("  HR:       hr@peopleos.com     / Hr@123456");
  console.log("  Employee: john.doe@peopleos.com / Employee@123456");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
