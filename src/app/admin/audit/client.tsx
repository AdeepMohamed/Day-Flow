"use client";
// src/app/admin/audit/client.tsx

import { useState } from "react";
import { ShieldCheck, Search, Filter, Clock, Activity, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AuditLogRecord {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
  user: {
    email: string;
    employeeId: string;
    role: string;
    employee?: { firstName: string; lastName: string } | null;
  };
}

interface Props {
  initialLogs: AuditLogRecord[];
}

export function AdminAuditClient({ initialLogs }: Props) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const filteredLogs = initialLogs.filter((log) => {
    const userStr = `${log.user.employee?.firstName || ""} ${log.user.employee?.lastName || ""} ${log.user.email} ${log.entity}`.toLowerCase();
    const searchMatch = userStr.includes(search.toLowerCase());
    const actionMatch = actionFilter === "ALL" || log.action === actionFilter;
    return searchMatch && actionMatch;
  });

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Controls */}
      <div className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div className="input-with-icon" style={{ flex: 1, minWidth: "260px" }}>
          <Search size={16} className="input-icon" />
          <input
            type="text"
            className="input"
            placeholder="Search by user, email, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input"
          style={{ width: "160px" }}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="ALL">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="APPROVE">APPROVE</option>
          <option value="REJECT">REJECT</option>
          <option value="LOGIN">LOGIN</option>
        </select>
      </div>

      {/* Log Feed Table */}
      <div className="card" style={{ padding: "1.25rem", overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "rgb(var(--text-muted))" }}>
                  No audit log records match your filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: "0.8rem", color: "rgb(var(--text-muted))", whiteSpace: "nowrap" }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "rgb(var(--text-primary))" }}>
                      {log.user.employee ? `${log.user.employee.firstName} ${log.user.employee.lastName}` : log.user.email}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "rgb(var(--text-muted))" }}>
                      {log.user.role} ({log.user.employeeId})
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${ACTION_BADGES[log.action] || "badge-secondary"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.entity}</td>
                  <td style={{ fontSize: "0.75rem", color: "rgb(var(--text-muted))", fontFamily: "monospace" }}>
                    {log.entityId}
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "rgb(var(--text-muted))" }}>
                    {log.ipAddress || "Internal"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ACTION_BADGES: Record<string, string> = {
  CREATE: "badge-success",
  UPDATE: "badge-warning",
  DELETE: "badge-danger",
  APPROVE: "badge-success",
  REJECT: "badge-danger",
  LOGIN: "badge-accent",
  LOGOUT: "badge-secondary",
};
