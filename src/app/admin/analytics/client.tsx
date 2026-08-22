"use client";
// src/app/admin/analytics/client.tsx

import { Users, BarChart3, TrendingUp, CalendarOff, CheckCircle, PieChart } from "lucide-react";

interface Props {
  totalEmployees: number;
  attendanceCount: number;
  departmentData: { name: string; count: number }[];
  leaveData: { status: string; count: number }[];
}

export function AdminAnalyticsClient({ totalEmployees, attendanceCount, departmentData, leaveData }: Props) {
  const approvedLeaves = leaveData.find((l) => l.status === "APPROVED")?.count || 0;
  const pendingLeaves = leaveData.find((l) => l.status === "PENDING")?.count || 0;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgb(var(--accent-light))" }}>
            <Users size={22} color="rgb(var(--accent))" />
          </div>
          <div>
            <div className="stat-value">{totalEmployees}</div>
            <div className="stat-label">Total Headcount</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgb(var(--success-light))" }}>
            <BarChart3 size={22} color="rgb(var(--success))" />
          </div>
          <div>
            <div className="stat-value">{attendanceCount}</div>
            <div className="stat-label">Total Check-ins Logged</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgb(var(--warning-light))" }}>
            <CalendarOff size={22} color="rgb(var(--warning))" />
          </div>
          <div>
            <div className="stat-value">{pendingLeaves}</div>
            <div className="stat-label">Pending Leave Requests</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgb(var(--success-light))" }}>
            <CheckCircle size={22} color="rgb(var(--success))" />
          </div>
          <div>
            <div className="stat-value">{approvedLeaves}</div>
            <div className="stat-label">Approved Leaves</div>
          </div>
        </div>
      </div>

      {/* Analytics Visuals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
        {/* Department Breakdown */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgb(var(--text-primary))", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <PieChart size={18} color="rgb(var(--accent))" /> Department Headcount Distribution
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {departmentData.map((dept) => {
              const pct = totalEmployees > 0 ? Math.round((dept.count / totalEmployees) * 100) : 0;
              return (
                <div key={dept.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem", color: "rgb(var(--text-primary))", fontWeight: 500 }}>
                    <span>{dept.name}</span>
                    <span style={{ color: "rgb(var(--text-muted))" }}>{dept.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: "8px", background: "rgb(var(--bg-secondary))", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "rgb(var(--accent))", borderRadius: "9999px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave Status Overview */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgb(var(--text-primary))", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp size={18} color="rgb(var(--success))" /> Leave Request Status Breakdown
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {["APPROVED", "PENDING", "REJECTED"].map((st) => {
              const cnt = leaveData.find((l) => l.status === st)?.count || 0;
              const totalLeaves = leaveData.reduce((a, b) => a + b.count, 0);
              const pct = totalLeaves > 0 ? Math.round((cnt / totalLeaves) * 100) : 0;
              const color = st === "APPROVED" ? "rgb(var(--success))" : st === "PENDING" ? "rgb(var(--warning))" : "rgb(var(--danger))";

              return (
                <div key={st}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem", color: "rgb(var(--text-primary))", fontWeight: 500 }}>
                    <span>{st}</span>
                    <span style={{ color: "rgb(var(--text-muted))" }}>{cnt} ({pct}%)</span>
                  </div>
                  <div style={{ height: "8px", background: "rgb(var(--bg-secondary))", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "9999px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
