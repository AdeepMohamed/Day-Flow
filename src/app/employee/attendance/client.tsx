"use client";
// src/app/employee/attendance/client.tsx
// Upgraded Attendance Client with Date Navigation & Extra Hours (Overtime) calculation

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { formatTime, formatDate } from "@/lib/utils";

interface Props {
  todayAttendance: Record<string, unknown> | null;
  weekAttendance: Record<string, unknown>[];
  monthAttendance: Record<string, unknown>[];
  monthStats: { present: number; absent: number; halfDay: number; leave: number; total: number };
}

const STATUS_CONFIG = {
  PRESENT: { label: "Present", badge: "badge-present", icon: CheckCircle },
  ABSENT: { label: "Absent", badge: "badge-rejected", icon: XCircle },
  HALF_DAY: { label: "Half Day", badge: "badge-pending", icon: AlertCircle },
  LEAVE: { label: "On Leave", badge: "badge-leave", icon: Clock },
};

export function AttendanceClient({ todayAttendance, weekAttendance, monthAttendance, monthStats }: Props) {
  const router = useRouter();
  const [today, setToday] = useState(todayAttendance);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"week" | "month">("week");

  // Date Navigation State
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleCheckIn = async () => {
    setError("");
    setCheckingIn(true);
    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setToday(data.attendance);
      router.refresh();
    } catch {
      setError("Check-in failed");
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
        body: "{}",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setToday(data.attendance);
      router.refresh();
    } catch {
      setError("Check-out failed");
    } finally {
      setCheckingOut(false);
    }
  };

  const isCheckedIn = !!today?.checkIn;
  const isCheckedOut = !!today?.checkOut;

  // Date Navigator handlers
  const prevDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const nextDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const resetToday = () => setSelectedDate(new Date());

  const displayRecords = view === "week" ? weekAttendance : monthAttendance;
  const attendanceRate = monthStats.total > 0 ? Math.round((monthStats.present / monthStats.total) * 100) : 0;

  return (
    <div className="attendance-layout animate-fade-in">
      {/* Date Navigator Bar */}
      <div className="card date-navigator-bar">
        <div className="nav-controls">
          <button className="btn btn-ghost btn-sm" onClick={prevDate} title="Previous Day">
            <ChevronLeft size={16} />
          </button>
          <div className="current-date-label">
            <Calendar size={15} color="rgb(var(--accent))" />
            <span>{formatDate(selectedDate)}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={nextDate} title="Next Day">
            <ChevronRight size={16} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={resetToday}>
            Today
          </button>
        </div>

        <div className="date-nav-stats">
          <span className="rate-badge">Monthly Attendance: {attendanceRate}%</span>
        </div>
      </div>

      {/* Check-in Widget */}
      <div className="card checkin-panel">
        <h3 className="panel-title">Today — {formatDate(new Date())}</h3>
        {error && <div className="alert-error">{error}</div>}

        <div className="checkin-times">
          <div className="time-block">
            <span className="time-label">Check In</span>
            <span className="time-value">{today?.checkIn ? formatTime(String(today.checkIn)) : "—"}</span>
          </div>
          <div className="time-divider" />
          <div className="time-block">
            <span className="time-label">Check Out</span>
            <span className="time-value">{today?.checkOut ? formatTime(String(today.checkOut)) : "—"}</span>
          </div>
          {Boolean(today?.checkIn && today?.checkOut) && (
            <>
              <div className="time-divider" />
              <div className="time-block">
                <span className="time-label">Work Hours</span>
                <span className="time-value">
                  {((new Date(String(today?.checkOut)).getTime() - new Date(String(today?.checkIn)).getTime()) / 3600000).toFixed(1)}h
                </span>
              </div>
              <div className="time-divider" />
              <div className="time-block">
                <span className="time-label">Extra Hours (OT)</span>
                <span className="time-value extra-val">
                  {Math.max(
                    0,
                    (new Date(String(today?.checkOut)).getTime() - new Date(String(today?.checkIn)).getTime()) / 3600000 - 8.0
                  ).toFixed(1)}h
                </span>
              </div>
            </>
          )}
        </div>

        {Boolean(today?.status) && today && (
          <div className={`badge ${STATUS_CONFIG[today.status as keyof typeof STATUS_CONFIG]?.badge}`} style={{ alignSelf: "flex-start" }}>
            {STATUS_CONFIG[today.status as keyof typeof STATUS_CONFIG]?.label}
          </div>
        )}

        <div className="checkin-btns">
          {!isCheckedIn && (
            <button className="btn btn-primary" onClick={handleCheckIn} disabled={checkingIn} id="checkin-btn">
              {checkingIn ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
              {checkingIn ? "Checking in..." : "Check In Now"}
            </button>
          )}
          {isCheckedIn && !isCheckedOut && (
            <button className="btn btn-secondary" onClick={handleCheckOut} disabled={checkingOut} id="checkout-btn">
              {checkingOut ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
              {checkingOut ? "Checking out..." : "Check Out"}
            </button>
          )}
          {isCheckedOut && (
            <div className="badge badge-present"><CheckCircle size={12} /> Completed for today</div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        {[
          { label: "Present", value: monthStats.present, cls: "success" },
          { label: "Absent", value: monthStats.absent, cls: "danger" },
          { label: "Half Day", value: monthStats.halfDay, cls: "cls-half" },
          { label: "On Leave", value: monthStats.leave, cls: "info" },
          { label: "Attendance Rate", value: `${attendanceRate}%`, cls: "accent" },
        ].map((s) => (
          <div key={s.label} className="mini-stat">
            <span className="mini-stat-value">{s.value}</span>
            <span className="mini-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* History Table with Extra Hours (Excalidraw Column) */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div className="view-header">
          <h3>Attendance Records & Overtime</h3>
          <div className="view-tabs">
            <button className={`filter-tab ${view === "week" ? "active" : ""}`} onClick={() => setView("week")}>
              This Week
            </button>
            <button className={`filter-tab ${view === "month" ? "active" : ""}`} onClick={() => setView("month")}>
              This Month
            </button>
          </div>
        </div>

        {displayRecords.length === 0 ? (
          <div className="empty-state">
            <Clock size={28} opacity={0.3} />
            <span>No attendance records found</span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Work Hours</th>
                  <th>Extra Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayRecords.map((rec) => {
                  const cfg = STATUS_CONFIG[String(rec.status) as keyof typeof STATUS_CONFIG];
                  const hoursNum = rec.checkIn && rec.checkOut
                    ? (new Date(String(rec.checkOut)).getTime() - new Date(String(rec.checkIn)).getTime()) / 3600000
                    : 0;
                  const hoursStr = hoursNum > 0 ? `${hoursNum.toFixed(1)}h` : "—";
                  const extraHoursStr = hoursNum > 8.0 ? `+${(hoursNum - 8.0).toFixed(1)}h` : "0.0h";

                  return (
                    <tr key={String(rec.id)}>
                      <td style={{ fontWeight: 600 }}>{formatDate(String(rec.date))}</td>
                      <td>{rec.checkIn ? formatTime(String(rec.checkIn)) : "—"}</td>
                      <td>{rec.checkOut ? formatTime(String(rec.checkOut)) : "—"}</td>
                      <td>{hoursStr}</td>
                      <td style={{ color: hoursNum > 8.0 ? "rgb(var(--success))" : "rgb(var(--text-muted))", fontWeight: hoursNum > 8.0 ? 700 : 400 }}>
                        {extraHoursStr}
                      </td>
                      <td><span className={`badge ${cfg?.badge}`}>{cfg?.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .attendance-layout { display: flex; flex-direction: column; gap: 1rem; }

        .date-navigator-bar {
          padding: 0.875rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .nav-controls {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .current-date-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 0.95rem;
          color: rgb(var(--text-primary));
        }

        .rate-badge {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.3rem 0.75rem;
          background: rgb(var(--accent-light));
          color: rgb(var(--accent));
          border-radius: var(--radius-full);
        }

        .checkin-panel { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .panel-title { font-size: 1rem; font-weight: 700; color: rgb(var(--text-primary)); }
        .alert-error { padding: 0.625rem 0.875rem; background: rgb(var(--danger-light)); color: rgb(var(--danger)); border-radius: var(--radius-sm); font-size: 0.85rem; }

        .checkin-times { display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; }
        .time-divider { width: 1px; height: 36px; background: rgb(var(--border)); }
        .time-block { display: flex; flex-direction: column; gap: 0.2rem; }
        .time-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: rgb(var(--text-muted)); font-weight: 600; }
        .time-value { font-size: 1.25rem; font-weight: 800; color: rgb(var(--text-primary)); }
        .extra-val { color: rgb(var(--success)); }

        .checkin-btns { display: flex; gap: 0.75rem; }

        .stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; }
        .mini-stat { background: rgb(var(--bg-card)); border: 1px solid rgb(var(--border)); border-radius: var(--radius-sm); padding: 0.875rem; display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
        .mini-stat-value { font-size: 1.25rem; font-weight: 800; color: rgb(var(--text-primary)); }
        .mini-stat-label { font-size: 0.7rem; color: rgb(var(--text-muted)); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }

        .view-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .view-header h3 { font-size: 0.9rem; font-weight: 700; color: rgb(var(--text-primary)); }
        .view-tabs { display: flex; gap: 0.25rem; background: rgb(var(--bg-secondary)); padding: 0.2rem; border-radius: var(--radius-sm); border: 1px solid rgb(var(--border)); }
        .filter-tab { padding: 0.3rem 0.625rem; border-radius: calc(var(--radius-sm) - 2px); border: none; background: none; cursor: pointer; font-size: 0.78rem; font-weight: 500; color: rgb(var(--text-secondary)); transition: all 0.15s; }
        .filter-tab.active { background: rgb(var(--bg-card)); color: rgb(var(--text-primary)); box-shadow: var(--shadow-sm); }

        @media (max-width: 640px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
          .time-divider { display: none; }
        }
      `}</style>
    </div>
  );
}
