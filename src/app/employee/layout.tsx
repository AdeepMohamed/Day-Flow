// src/app/employee/layout.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { AIChat } from "@/components/ai/ai-chat";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Admins/HR should use the admin layout
  if (session.role === "ADMIN" || session.role === "HR") {
    redirect("/admin/dashboard");
  }

  // Get unread notification count
  const unreadCount = await db.notification.count({
    where: { receiverId: session.id, isRead: false },
  });

  // Get employee name
  const employee = session.employeeProfileId
    ? await db.employee.findUnique({
        where: { id: session.employeeProfileId },
        select: { firstName: true, lastName: true, profilePicture: true },
      })
    : null;

  return (
    <div className="main-layout">
      <Sidebar
        role="EMPLOYEE"
        unreadNotifs={unreadCount}
        employeeName={employee ? `${employee.firstName} ${employee.lastName}` : undefined}
        employeeAvatar={employee?.profilePicture ?? null}
      />
      <div className="page-content">
        {children}
      </div>
      <AIChat />
    </div>
  );
}
