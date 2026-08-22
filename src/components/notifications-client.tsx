"use client";
// src/components/notifications-client.tsx

import { useState } from "react";
import { Bell, CheckCheck, Loader2, Info, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  notifications: Record<string, unknown>[];
  unreadCount: number;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  LEAVE_APPROVED: { icon: CheckCircle, color: "rgb(var(--success))" },
  LEAVE_REJECTED: { icon: XCircle, color: "rgb(var(--danger))" },
  LEAVE_REQUEST: { icon: Bell, color: "rgb(var(--warning))" },
  PAYROLL_UPDATED: { icon: DollarSign, color: "rgb(var(--accent))" },
  GENERAL: { icon: Info, color: "rgb(var(--info))" },
};

export function NotificationsClient({ notifications: initial, unreadCount: initialUnread }: Props) {
  const [notifications, setNotifications] = useState(initial);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [markingAll, setMarkingAll] = useState(false);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {} finally { setMarkingAll(false); }
  };

  const groupedByDate: Record<string, Record<string, unknown>[]> = {};
  notifications.forEach((n) => {
    const key = formatDate(String(n.createdAt));
    if (!groupedByDate[key]) groupedByDate[key] = [];
    groupedByDate[key].push(n);
  });

  return (
    <div className="notifs-layout animate-fade-in">
      <div className="notifs-header">
        <div>
          <h2>Notifications</h2>
          {unreadCount > 0 && <p>{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>}
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead} disabled={markingAll} id="mark-all-read-btn">
            {markingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: "1rem" }}>
          <Bell size={36} opacity={0.3} />
          <p style={{ fontWeight: 600 }}>All caught up!</p>
          <p style={{ fontSize: "0.85rem" }}>No notifications yet. Check back later.</p>
        </div>
      ) : (
        <div className="notifs-list">
          {Object.entries(groupedByDate).map(([date, items]) => (
            <div key={date}>
              <div className="notifs-date-label">{date}</div>
              {items.map((n) => {
                const type = String(n.type || "GENERAL");
                const config = TYPE_CONFIG[type] || TYPE_CONFIG.GENERAL;
                const Icon = config.icon;
                const isUnread = !n.isRead;

                return (
                  <div key={String(n.id)} className={`notif-card card ${isUnread ? "unread" : ""}`}>
                    <div className="notif-icon-wrap" style={{ background: `${config.color}18` }}>
                      <Icon size={18} style={{ color: config.color }} />
                    </div>
                    <div className="notif-content">
                      <div className="notif-title-row">
                        <h4 className="notif-title">{String(n.title)}</h4>
                        {isUnread && <span className="unread-dot" />}
                      </div>
                      <p className="notif-message">{String(n.message)}</p>
                      <span className="notif-time">
                        {new Date(String(n.createdAt)).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .notifs-layout { display: flex; flex-direction: column; gap: 1rem; }
        .notifs-header { display: flex; align-items: center; justify-content: space-between; }
        .notifs-header h2 { font-size: 1rem; font-weight: 700; color: rgb(var(--text-primary)); }
        .notifs-header p { font-size: 0.8rem; color: rgb(var(--text-secondary)); margin-top: 0.2rem; }
        .notifs-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .notifs-date-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: rgb(var(--text-muted)); padding: 0.75rem 0 0.375rem; }
        .notif-card { padding: 1rem; display: flex; align-items: flex-start; gap: 0.875rem; }
        .notif-card.unread { border-left: 3px solid rgb(var(--accent)); }
        .notif-icon-wrap { width: 40px; height: 40px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .notif-content { flex: 1; min-width: 0; }
        .notif-title-row { display: flex; align-items: center; gap: 0.5rem; }
        .notif-title { font-size: 0.875rem; font-weight: 700; color: rgb(var(--text-primary)); }
        .unread-dot { width: 8px; height: 8px; border-radius: 9999px; background: rgb(var(--accent)); flex-shrink: 0; }
        .notif-message { font-size: 0.8rem; color: rgb(var(--text-secondary)); margin-top: 0.25rem; line-height: 1.5; }
        .notif-time { font-size: 0.7rem; color: rgb(var(--text-muted)); margin-top: 0.375rem; display: block; }
      `}</style>
    </div>
  );
}
