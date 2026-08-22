// src/app/admin/layout.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { AIChat } from "@/components/ai/ai-chat";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (session.role === "EMPLOYEE") {
    redirect("/employee/dashboard");
  }

  const unreadCount = await db.notification.count({
    where: { receiverId: session.id, isRead: false },
  });

  const employee = session.employeeProfileId
    ? await db.employee.findUnique({
        where: { id: session.employeeProfileId },
        select: { firstName: true, lastName: true, profilePicture: true },
      })
    : null;

  return (
    <div className="main-layout">
      <Sidebar
        role={session.role as "ADMIN" | "HR"}
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
