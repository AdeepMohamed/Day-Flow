"use client";
// src/app/admin/notifications/client.tsx

import { useState } from "react";
import { Bell, CheckCircle2, Info, AlertTriangle, Clock, Check } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface Props {
  initialNotifs: NotificationItem[];
}

export function AdminNotificationsClient({ initialNotifs }: Props) {
  const [notifs, setNotifs] = useState<NotificationItem[]>(initialNotifs);
  const [markingAll, setMarkingAll] = useState(false);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read-all", { method: "PUT" });
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Bar */}
      <div className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Bell size={20} color="rgb(var(--accent))" />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgb(var(--text-primary))" }}>
            Notifications ({unreadCount} unread)
          </h3>
        </div>

        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead} disabled={markingAll}>
            <Check size={14} /> Mark all as read
          </button>
        )}
      </div>

      {/* Feed List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {notifs.length === 0 ? (
          <div className="card" style={{ padding: "3rem", textAlign: "center", color: "rgb(var(--text-muted))" }}>
            No notifications available.
          </div>
        ) : (
          notifs.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{
                padding: "1.25rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                borderLeft: n.isRead ? "1px solid rgb(var(--border))" : "4px solid rgb(var(--accent))",
                background: n.isRead ? "rgb(var(--bg-card))" : "rgb(var(--accent-light))",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "9999px",
                  background: "rgb(var(--bg-secondary))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {NOTIF_ICONS[n.type] || <Info size={18} color="rgb(var(--accent))" />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <h4 style={{ fontWeight: 700, fontSize: "0.95rem", color: "rgb(var(--text-primary))" }}>{n.title}</h4>
                  <span style={{ fontSize: "0.75rem", color: "rgb(var(--text-muted))" }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "rgb(var(--text-secondary))", lineHeight: 1.5 }}>
                  {n.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  LEAVE_SUBMITTED: <Clock size={18} color="rgb(var(--warning))" />,
  LEAVE_APPROVED: <CheckCircle2 size={18} color="rgb(var(--success))" />,
  LEAVE_REJECTED: <AlertTriangle size={18} color="rgb(var(--danger))" />,
  PAYROLL_UPDATED: <Info size={18} color="rgb(var(--accent))" />,
};
