"use client";
// src/app/admin/attendance/client.tsx

import { useState } from "react";
import {
  Clock, CheckCircle, XCircle, AlertCircle, CalendarOff,
  Search, Filter, ChevronLeft, ChevronRight, Calendar, UserCheck
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
  notes?: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    department?: string | null;
    position?: string | null;
    profilePicture?: string | null;
    user: { employeeId: string };
  };
}

interface Props {
  employees: { id: string; firstName: string; lastName: string; department?: string | null; user: { employeeId: string } }[];
  initialAttendance: AttendanceRecord[];
}

export function AdminAttendanceClient({ employees, initialAttendance }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/admin?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    fetchAttendance(newDate);
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    handleDateChange(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    handleDateChange(d.toISOString().split("T")[0]);
  };

  const filteredAttendance = attendance.filter((a) => {
    const nameMatch = `${a.employee.firstName} ${a.employee.lastName} ${a.employee.user.employeeId}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const deptMatch = deptFilter === "ALL" || a.employee.department === deptFilter;
    const statusMatch = statusFilter === "ALL" || a.status === statusFilter;
    return nameMatch && deptMatch && statusMatch;
  });

  const stats = {
    present: attendance.filter((a) => a.status === "PRESENT").length,
    absent: attendance.filter((a) => a.status === "ABSENT").length,
    halfDay: attendance.filter((a) => a.status === "HALF_DAY").length,
    leave: attendance.filter((a) => a.status === "LEAVE").length,
    total: employees.length,
  };

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Date Navigator Bar */}
      <div className="card" style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrevDay}>
            <ChevronLeft size={16} /> Prev Day
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgb(var(--bg-secondary))", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", border: "1px solid rgb(var(--border))" }}>
            <Calendar size={16} color="rgb(var(--accent))" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{ background: "none", border: "none", color: "rgb(var(--text-primary))", fontWeight: 600, fontSize: "0.9rem" }}
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleNextDay}>
            Next Day <ChevronRight size={16} />
          </button>
        </div>

        <button className="btn btn-outline btn-sm" onClick={() => handleDateChange(new Date().toISOString().split("T")[0])}>
          Today
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgb(var(--success-light))" }}>
            <CheckCircle size={20} color="rgb(var(--success))" />
          </div>
          <div>
            <div className="stat-value">{stats.present}</div>
            <div className="stat-label">Present</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgb(var(--danger-light))" }}>
            <XCircle size={20} color="rgb(var(--danger))" />
          </div>
          <div>
            <div className="stat-value">{stats.absent}</div>
            <div className="stat-label">Absent</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgb(var(--warning-light))" }}>
            <AlertCircle size={20} color="rgb(var(--warning))" />
          </div>
          <div>
            <div className="stat-value">{stats.halfDay}</div>
            <div className="stat-label">Half Day</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgb(var(--accent-light))" }}>
            <CalendarOff size={20} color="rgb(var(--accent))" />
          </div>
          <div>
            <div className="stat-value">{stats.leave}</div>
            <div className="stat-label">On Leave</div>
          </div>
        </div>
      </div>

      {/* Filter Controls & Search */}
      <div className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div className="input-with-icon" style={{ flex: 1, minWidth: "240px" }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="input"
              placeholder="Search employee by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <select
              className="input"
              style={{ width: "160px" }}
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d as string} value={d as string}>{d as string}</option>
              ))}
            </select>

            <select
              className="input"
              style={{ width: "140px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="LEAVE">On Leave</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                    Loading attendance data...
                  </td>
                </tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2.5rem", color: "rgb(var(--text-muted))" }}>
                    No attendance records found for {selectedDate}.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="avatar avatar-sm">
                          {rec.employee.firstName.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "rgb(var(--text-primary))" }}>
                            {rec.employee.firstName} {rec.employee.lastName}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "rgb(var(--text-muted))" }}>
                            {rec.employee.user.employeeId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{rec.employee.department || "N/A"}</td>
                    <td>{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td>{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td>
                      <span className={`badge ${BADGE_STYLES[rec.status]}`}>
                        {rec.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const BADGE_STYLES: Record<string, string> = {
  PRESENT: "badge-success",
  ABSENT: "badge-danger",
  HALF_DAY: "badge-warning",
  LEAVE: "badge-accent",
};
