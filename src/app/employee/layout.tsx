// src/app/employee/layout.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
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

  if (session.role === "ADMIN" || session.role === "HR") {
    redirect("/admin/dashboard");
  }

  let unreadCount = 0;
  let employeeName: string | undefined = session.email.split("@")[0];
  let employeeAvatar: string | null = null;

  try {
    const [count, emp] = await withDbRetry(() =>
      Promise.all([
        db.notification.count({
          where: { receiverId: session.id, isRead: false },
        }),
        session.employeeProfileId
          ? db.employee.findUnique({
              where: { id: session.employeeProfileId },
              select: { firstName: true, lastName: true, profilePicture: true },
            })
          : Promise.resolve(null),
      ])
    );

    unreadCount = count;
    if (emp) {
      employeeName = `${emp.firstName} ${emp.lastName}`;
      employeeAvatar = emp.profilePicture;
    }
  } catch (e) {
    console.error("[EmployeeLayout] Non-fatal layout DB error, using fallbacks:", e);
  }

  return (
    <div className="main-layout">
      <Sidebar
        role="EMPLOYEE"
        unreadNotifs={unreadCount}
        employeeName={employeeName}
        employeeAvatar={employeeAvatar}
      />
      <div className="page-content">{children}</div>
      <AIChat />
    </div>
  );
}
