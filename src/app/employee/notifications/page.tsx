// src/app/employee/notifications/page.tsx
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { NotificationsClient } from "@/components/notifications-client";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const notifications = await db.notification.findMany({
    where: { receiverId: session.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <Topbar title="Notifications" subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"} />
      <div className="page-body">
        <NotificationsClient
          notifications={JSON.parse(JSON.stringify(notifications))}
          unreadCount={unreadCount}
        />
      </div>
    </div>
  );
}
