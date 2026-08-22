// src/app/admin/notifications/page.tsx
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { AdminNotificationsClient } from "./client";

export const metadata = { title: "Notifications — Admin" };

export default async function AdminNotificationsPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "HR")) {
    redirect("/auth/login");
  }

  const notifications = await db.notification.findMany({
    where: { receiverId: session.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <Topbar title="Admin Notifications" subtitle="System alerts, leave requests, and workforce updates" />
      <div className="page-body">
        <AdminNotificationsClient initialNotifs={JSON.parse(JSON.stringify(notifications))} />
      </div>
    </div>
  );
}
