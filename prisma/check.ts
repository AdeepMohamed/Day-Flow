import "dotenv/config";
import { db as prisma } from "../src/lib/db";

async function check() {
  const emps = await prisma.employee.findMany({ select: { firstName: true, lastName: true, department: true } });
  console.log("Employees in DB:", emps.length);
  emps.forEach(e => console.log(" -", e.firstName, e.lastName, "|", e.department));

  const att = await prisma.attendance.groupBy({ by: ["status"], _count: { id: true } });
  console.log("\nAttendance breakdown:");
  att.forEach((a: { status: string; _count: { id: number } }) => console.log(" -", a.status, ":", a._count.id, "records"));

  await prisma.$disconnect();
}

check().catch(console.error);
