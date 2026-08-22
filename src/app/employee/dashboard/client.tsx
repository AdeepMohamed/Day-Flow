"use client";
// src/app/employee/dashboard/client.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, CalendarOff, DollarSign, Bell, CheckCircle,
  XCircle, AlertCircle, ArrowRight, Loader2,
} from "lucide-react";
import Link from "next/link";
import { formatTime, formatDate, formatCurrency } from "@/lib/utils";

interface Props {
  employee: Record<string, unknown> | null;
  todayAttendance: Record<string, unknown> | null;
  weekAttendance: Record<string, unknown>[];
  weekStats: { present: number; absent: number; halfDay: number; leave: number };
  recentLeaves: Record<string, unknown>[];
  unreadNotifs: Record<string, unknown>[];
}

export function EmployeeDashboardClient({
  employee,
  todayAttendance,
  weekAttendance,
  weekStats,
  recentLeaves,
  unreadNotifs,
}: Props) {
  const router = useRouter();
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [attendance, setAttendance] = useState(todayAttendance);

  const salary = employee?.salary as Record<string, unknown> | null;

  const handleCheckIn = async () => {
    setError("");
    setCheckingIn(true);
    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setAttendance(data.attendance);
      router.refresh();
    } catch {
      setError("Failed to check in. Please try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setError("");
    setCheckingOut(true);
    try {
      const res = await fetch("/api/attendance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setAttendance(data.attendance);
      router.refresh();
    } catch {
      setError("Failed to check out. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const isCheckedIn = !!attendance?.checkIn;
  const isCheckedOut = !!attendance?.checkOut;

  return (
    <div className="dashboard-grid animate-fade-in">
      {/* ── Check-in Widget ── */}
      <div className="card checkin-card" style={{ gridColumn: "1 / -1" }}>
        <div className="checkin-inner">
          <div className="checkin-status">
            <div
              className={`checkin-dot ${
                isCheckedIn && !isCheckedOut
                  ? "dot-present"
                  : isCheckedOut
                  ? "dot-done"
                  : "dot-absent"
              }`}
            />
            <div>
              <h3 className="checkin-label">Today&apos;s Attendance</h3>
              <p className="checkin-sublabel">
                {isCheckedOut
                  ? `Checked out at ${formatTime(attendance?.checkOut as string)}`
                  : isCheckedIn
                  ? `Checked in at ${formatTime(attendance?.checkIn as string)} — currently working`
                  : "Not checked in yet"}
              </p>
            </div>
          </div>

          <div className="checkin-actions">
            {error && <span className="checkin-error">⚠️ {error}</span>}

            {!isCheckedIn && (
              <button
                className="btn btn-primary"
                onClick={handleCheckIn}
                disabled={checkingIn}
                id="checkin-btn"
              >
                {checkingIn ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                {checkingIn ? "Checking in..." : "Check In"}
              </button>
            )}

            {isCheckedIn && !isCheckedOut && (
              <button
                className="btn btn-secondary"
                onClick={handleCheckOut}
                disabled={checkingOut}
                id="checkout-btn"
              >
                {checkingOut ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                {checkingOut ? "Checking out..." : "Check Out"}
              </button>
            )}

            {isCheckedOut && (
              <div className="badge badge-present">
                <CheckCircle size={12} /> Done for today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Week Stats ── */}
      <div className="stat-card">
        <div className="stat-icon" style={{ background: "rgb(var(--success-light))" }}>
          <CheckCircle size={22} color="rgb(var(--success))" />
        </div>
        <div>
          <div className="stat-value">{weekStats.present}</div>
          <div className="stat-label">Days Present</div>
          <div className="stat-sub">This week</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ background: "rgb(var(--danger-light))" }}>
          <XCircle size={22} color="rgb(var(--danger))" />
        </div>
        <div>
          <div className="stat-value">{weekStats.absent}</div>
          <div className="stat-label">Days Absent</div>
          <div className="stat-sub">This week</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ background: "rgb(var(--warning-light))" }}>
          <AlertCircle size={22} color="rgb(var(--warning))" />
        </div>
        <div>
          <div className="stat-value">{weekStats.leave}</div>
          <div className="stat-label">Days on Leave</div>
          <div className="stat-sub">This week</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ background: "rgb(var(--accent-light))" }}>
          <DollarSign size={22} color="rgb(var(--accent))" />
        </div>
        <div>
          <div className="stat-value">
            {salary?.baseSalary
              ? formatCurrency(Number(salary.baseSalary), String(salary.currency || "USD"))
              : "—"}
          </div>
          <div className="stat-label">Base Salary</div>
          <div className="stat-sub">Monthly</div>
        </div>
      </div>

      {/* ── Weekly Attendance Timeline ── */}
      <div className="card" style={{ gridColumn: "span 2", padding: "1.25rem" }}>
        <div className="section-header">
          <h3>This Week</h3>
          <Link href="/employee/attendance" className="section-link">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="week-timeline">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1) + i;
            const date = new Date(d.setDate(diff));
            const dateStr = date.toISOString().split("T")[0];
            const record = weekAttendance.find(
              (a) => (a.date as string).split("T")[0] === dateStr
            );

            return (
              <div key={i} className="week-day">
                <span className="week-day-label">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <div
                  className={`week-day-dot ${
                    record
                      ? record.status === "PRESENT"
                        ? "dot-present"
                        : record.status === "ABSENT"
                        ? "dot-absent"
                        : record.status === "HALF_DAY"
                        ? "dot-half"
                        : "dot-leave"
                      : "dot-empty"
                  }`}
                />
                <span className="week-day-date">
                  {date.toLocaleDateString("en-US", { day: "numeric" })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent Leaves ── */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div className="section-header">
          <h3>Recent Leaves</h3>
          <Link href="/employee/leave" className="section-link">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {recentLeaves.length === 0 ? (
          <div className="empty-state" style={{ padding: "1.5rem" }}>
            <CalendarOff size={28} opacity={0.3} />
            <span>No leave requests yet</span>
            <Link href="/employee/leave" className="btn btn-primary btn-sm">
              Apply for Leave
            </Link>
          </div>
        ) : (
          <div className="leave-list">
            {recentLeaves.map((leave) => {
              const lt = leave.leaveType as Record<string, unknown>;
              return (
                <div key={String(leave.id)} className="leave-item">
                  <div>
                    <span className="leave-type">{String(lt?.name || "Leave")}</span>
                    <span className="leave-dates">
                      {formatDate(String(leave.startDate))} →{" "}
                      {formatDate(String(leave.endDate))}
                    </span>
                  </div>
                  <span
                    className={`badge badge-${String(leave.status).toLowerCase()}`}
                  >
                    {String(leave.status)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Notifications ── */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div className="section-header">
          <h3>Notifications</h3>
          <Link href="/employee/notifications" className="section-link">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {unreadNotifs.length === 0 ? (
          <div className="empty-state" style={{ padding: "1.5rem" }}>
            <Bell size={28} opacity={0.3} />
            <span>All caught up!</span>
          </div>
        ) : (
          <div className="notif-list">
            {unreadNotifs.map((n) => (
              <div key={String(n.id)} className="notif-item">
                <div className="notif-dot" />
                <div>
                  <p className="notif-title">{String(n.title)}</p>
                  <p className="notif-message">{String(n.message)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .checkin-card {
          padding: 1.25rem 1.5rem;
          background: linear-gradient(
            135deg,
            rgb(var(--accent)) 0%,
            rgb(79 70 229 / 0.85) 100%
          );
          border: none;
          color: white;
        }

        .checkin-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .checkin-status {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .checkin-dot {
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          flex-shrink: 0;
        }

        .dot-present { background: #4ade80; box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.3); }
        .dot-done { background: #94a3b8; }
        .dot-absent { background: rgba(255,255,255,0.4); }

        .checkin-label {
          font-size: 1rem;
          font-weight: 700;
          color: white;
        }

        .checkin-sublabel {
          font-size: 0.825rem;
          color: rgba(255,255,255,0.75);
          margin-top: 0.2rem;
        }

        .checkin-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .checkin-error {
          font-size: 0.8rem;
          background: rgba(255,255,255,0.15);
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius-sm);
          color: white;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: rgb(var(--text-primary));
          line-height: 1.2;
        }

        .stat-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: rgb(var(--text-primary));
          margin-top: 0.2rem;
        }

        .stat-sub {
          font-size: 0.7rem;
          color: rgb(var(--text-muted));
        }

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

        .week-timeline {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          text-align: center;
        }

        .week-day {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.375rem;
        }

        .week-day-label {
          font-size: 0.65rem;
          font-weight: 600;
          color: rgb(var(--text-muted));
          text-transform: uppercase;
        }

        .week-day-dot {
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          border: 2px solid transparent;
        }

        .dot-present { background: rgb(var(--success-light)); border-color: rgb(var(--success)); }
        .dot-absent { background: rgb(var(--danger-light)); border-color: rgb(var(--danger)); }
        .dot-half { background: rgb(var(--warning-light)); border-color: rgb(var(--warning)); }
        .dot-leave { background: rgb(var(--info-light)); border-color: rgb(var(--info)); }
        .dot-empty { background: rgb(var(--bg-secondary)); border-color: rgb(var(--border)); }

        .week-day-date {
          font-size: 0.7rem;
          color: rgb(var(--text-muted));
        }

        .leave-list, .notif-list {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .leave-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.625rem;
          background: rgb(var(--bg-secondary));
          border-radius: var(--radius-sm);
          gap: 0.5rem;
        }

        .leave-type {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: rgb(var(--text-primary));
        }

        .leave-dates {
          display: block;
          font-size: 0.7rem;
          color: rgb(var(--text-muted));
          margin-top: 0.1rem;
        }

        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.625rem;
          background: rgb(var(--bg-secondary));
          border-radius: var(--radius-sm);
        }

        .notif-dot {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: rgb(var(--accent));
          flex-shrink: 0;
          margin-top: 0.35rem;
        }

        .notif-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: rgb(var(--text-primary));
        }

        .notif-message {
          font-size: 0.72rem;
          color: rgb(var(--text-secondary));
          margin-top: 0.1rem;
          line-height: 1.4;
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
