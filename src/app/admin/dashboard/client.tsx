"use client";
// src/app/admin/dashboard/client.tsx

import Link from "next/link";
import {
  Users, Clock, CalendarOff, TrendingUp,
  CheckCircle, XCircle, AlertCircle, ArrowRight,
  ShieldCheck, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { formatDate } from "@/lib/utils";

interface Props {
  totalEmployees: number;
  todayStats: { present: number; absent: number; halfDay: number; leave: number; total: number };
  pendingLeaves: number;
  recentLeaveRequests: Record<string, unknown>[];
  recentAuditLogs: Record<string, unknown>[];
  trend: { date: string; label: string; present: number; absent: number; leave: number }[];
}

export function AdminDashboardClient({
  totalEmployees, todayStats, pendingLeaves,
  recentLeaveRequests, recentAuditLogs, trend,
}: Props) {
  const attendanceRate = todayStats.total > 0
    ? Math.round((todayStats.present / todayStats.total) * 100)
    : 0;

  return (
    <div className="admin-grid animate-fade-in">
      {/* ── KPI Cards ── */}
      <div className="stat-card">
        <div className="stat-icon" style={{ background: "rgb(var(--accent-light))" }}>
          <Users size={22} color="rgb(var(--accent))" />
        </div>
        <div>
          <div className="stat-value">{totalEmployees}</div>
          <div className="stat-label">Total Employees</div>
          <Link href="/admin/employees" className="stat-link">View all →</Link>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ background: "rgb(var(--success-light))" }}>
          <CheckCircle size={22} color="rgb(var(--success))" />
        </div>
        <div>
          <div className="stat-value">{todayStats.present}</div>
          <div className="stat-label">Present Today</div>
          <div className="stat-sub">{attendanceRate}% attendance rate</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ background: "rgb(var(--danger-light))" }}>
          <XCircle size={22} color="rgb(var(--danger))" />
        </div>
        <div>
          <div className="stat-value">{todayStats.absent}</div>
          <div className="stat-label">Absent Today</div>
          <Link href="/admin/attendance" className="stat-link">View details →</Link>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ background: "rgb(var(--warning-light))" }}>
          <CalendarOff size={22} color="rgb(var(--warning))" />
        </div>
        <div>
          <div className="stat-value">{pendingLeaves}</div>
          <div className="stat-label">Pending Leaves</div>
          <Link href="/admin/leave" className="stat-link">Review now →</Link>
        </div>
      </div>

      {/* ── Attendance Chart ── */}
      <div className="card admin-chart" style={{ gridColumn: "span 3", padding: "1.25rem" }}>
        <div className="section-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp size={16} color="rgb(var(--accent))" />
            <h3>7-Day Attendance Trend</h3>
          </div>
          <Link href="/admin/analytics" className="section-link">
            Full Analytics <ArrowRight size={14} />
          </Link>
        </div>

        {trend.some((d) => d.present > 0 || d.absent > 0 || d.leave > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trend} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "rgb(var(--text-muted))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "rgb(var(--text-muted))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "rgb(var(--bg-card))",
                  border: "1px solid rgb(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "rgb(var(--text-primary))",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="present" fill="rgb(var(--success))" name="Present" radius={[3, 3, 0, 0]} />
              <Bar dataKey="absent" fill="rgb(var(--danger))" name="Absent" radius={[3, 3, 0, 0]} />
              <Bar dataKey="leave" fill="rgb(var(--info))" name="On Leave" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state" style={{ height: 200 }}>
            <Activity size={28} opacity={0.3} />
            <span>No attendance data for this week yet</span>
          </div>
        )}
      </div>

      {/* ── Today Breakdown ── */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div className="section-header">
          <h3>Today&apos;s Breakdown</h3>
        </div>
        <div className="today-breakdown">
          {[
            { label: "Present", value: todayStats.present, cls: "badge-present" },
            { label: "Absent", value: todayStats.absent, cls: "badge-rejected" },
            { label: "Half Day", value: todayStats.halfDay, cls: "badge-pending" },
            { label: "On Leave", value: todayStats.leave, cls: "badge-leave" },
          ].map((item) => (
            <div key={item.label} className="breakdown-item">
              <span className={`badge ${item.cls}`}>{item.label}</span>
              <span className="breakdown-count">{item.value}</span>
            </div>
          ))}
        </div>

        {todayStats.total === 0 && (
          <p className="empty-note">No attendance records for today yet.</p>
        )}
      </div>

      {/* ── Pending Leaves Queue ── */}
      <div className="card" style={{ gridColumn: "span 2", padding: "1.25rem" }}>
        <div className="section-header">
          <h3>Pending Leave Requests</h3>
          <Link href="/admin/leave" className="section-link">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {recentLeaveRequests.length === 0 ? (
          <div className="empty-state" style={{ padding: "2rem" }}>
            <CalendarOff size={28} opacity={0.3} />
            <span>No pending leave requests</span>
          </div>
        ) : (
          <div className="leave-queue">
            {recentLeaveRequests.map((req) => {
              const emp = req.employee as Record<string, unknown>;
              const lt = req.leaveType as Record<string, unknown>;
              return (
                <div key={String(req.id)} className="leave-queue-item">
                  <div className="leave-queue-avatar">
                    {String(emp?.firstName || "?").charAt(0)}
                    {String(emp?.lastName || "").charAt(0)}
                  </div>
                  <div className="leave-queue-info">
                    <span className="leave-queue-name">
                      {String(emp?.firstName)} {String(emp?.lastName)}
                    </span>
                    <span className="leave-queue-details">
                      {String(lt?.name)} · {formatDate(String(req.startDate))} → {formatDate(String(req.endDate))}
                    </span>
                  </div>
                  <Link
                    href="/admin/leave"
                    className="btn btn-primary btn-sm"
                  >
                    Review
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent Audit Activity ── */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div className="section-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldCheck size={16} color="rgb(var(--accent))" />
            <h3>Recent Activity</h3>
          </div>
          <Link href="/admin/audit" className="section-link">
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="audit-list">
          {recentAuditLogs.map((log) => {
            const user = log.user as Record<string, unknown>;
            const emp = user?.employee as Record<string, unknown> | null;
            return (
              <div key={String(log.id)} className="audit-item">
                <div className="audit-action">{String(log.action)}</div>
                <div className="audit-detail">
                  <span className="audit-entity">{String(log.entity)}</span>
                  <span className="audit-by">
                    by {emp ? `${emp.firstName} ${emp.lastName}` : String(user?.email || "System")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .admin-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .stat-sub { font-size: 0.7rem; color: rgb(var(--text-muted)); }
        .stat-link { font-size: 0.72rem; color: rgb(var(--accent)); text-decoration: none; }
        .stat-link:hover { text-decoration: underline; }

        .admin-chart { background: rgb(var(--bg-card)); }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .section-header h3 {
          font-size: 0.9rem;
          font-weight: 700;
          color: rgb(var(--text-primary));
        }

        .section-link {
          font-size: 0.75rem;
          color: rgb(var(--accent));
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .today-breakdown {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .breakdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .breakdown-count {
          font-size: 1.1rem;
          font-weight: 700;
          color: rgb(var(--text-primary));
        }

        .empty-note {
          font-size: 0.78rem;
          color: rgb(var(--text-muted));
          text-align: center;
          margin-top: 1rem;
        }

        .leave-queue {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .leave-queue-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgb(var(--bg-secondary));
          border-radius: var(--radius-sm);
          border: 1px solid rgb(var(--border));
        }

        .leave-queue-avatar {
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          background: rgb(var(--accent));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .leave-queue-info {
          flex: 1;
          min-width: 0;
        }

        .leave-queue-name {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: rgb(var(--text-primary));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .leave-queue-details {
          display: block;
          font-size: 0.72rem;
          color: rgb(var(--text-muted));
          margin-top: 0.1rem;
        }

        .audit-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .audit-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          transition: background 0.1s;
        }

        .audit-item:hover {
          background: rgb(var(--bg-secondary));
        }

        .audit-action {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.2rem 0.45rem;
          border-radius: var(--radius-full);
          background: rgb(var(--accent-light));
          color: rgb(var(--accent));
          white-space: nowrap;
          text-transform: uppercase;
        }

        .audit-detail {
          display: flex;
          flex-direction: column;
          gap: 0.05rem;
        }

        .audit-entity {
          font-size: 0.78rem;
          font-weight: 500;
          color: rgb(var(--text-primary));
        }

        .audit-by {
          font-size: 0.7rem;
          color: rgb(var(--text-muted));
        }

        @media (max-width: 1200px) {
          .admin-grid { grid-template-columns: repeat(2, 1fr); }
          .admin-chart { grid-column: 1 / -1; }
        }

        @media (max-width: 640px) {
          .admin-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
