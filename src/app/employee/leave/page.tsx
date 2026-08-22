"use client";
// src/app/employee/leave/page.tsx (also used as template for admin leave)
// Full client component for employee leave management

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { CalendarOff, Plus, X, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDate, getDaysBetween } from "@/lib/utils";

export default function EmployeeLeavePage() {
  const [leaveTypes, setLeaveTypes] = useState<Record<string, unknown>[]>([]);
  const [leaves, setLeaves] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [form, setForm] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    remarks: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesRes, leavesRes] = await Promise.all([
        fetch("/api/leave/types"),
        fetch(`/api/leave/my${filter !== "ALL" ? `?status=${filter}` : ""}`),
      ]);
      const [typesData, leavesData] = await Promise.all([
        typesRes.json(),
        leavesRes.json(),
      ]);
      setLeaveTypes(typesData.leaveTypes || []);
      setLeaves(leavesData.leaveRequests || []);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.leaveTypeId) { setError("Please select a leave type"); return; }
    if (!form.startDate) { setError("Please select a start date"); return; }
    if (!form.endDate) { setError("Please select an end date"); return; }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError("End date cannot be before start date");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leave/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess("Leave request submitted successfully!");
      setShowForm(false);
      setForm({ leaveTypeId: "", startDate: "", endDate: "", remarks: "" });
      fetchData();
    } catch {
      setError("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "APPROVED") return <CheckCircle size={14} color="rgb(var(--success))" />;
    if (status === "REJECTED") return <XCircle size={14} color="rgb(var(--danger))" />;
    return <Clock size={14} color="rgb(var(--warning))" />;
  };

  const filteredLeaves = filter === "ALL" ? leaves : leaves.filter((l) => l.status === filter);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <Topbar title="Leave Requests" subtitle="Manage your time off" />
      <div className="page-body">
        {/* Header actions */}
        <div className="leave-header animate-fade-in">
          <div className="filter-tabs">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
              <button
                key={s}
                className={`filter-tab ${filter === s ? "active" : ""}`}
                onClick={() => setFilter(s)}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { setShowForm(true); setError(""); setSuccess(""); }}
            id="new-leave-btn"
          >
            <Plus size={16} /> New Request
          </button>
        </div>

        {/* Feedback */}
        {success && (
          <div className="alert alert-success animate-fade-in">
            <CheckCircle size={16} /> {success}
          </div>
        )}
        {error && !showForm && (
          <div className="alert alert-error animate-fade-in">⚠️ {error}</div>
        )}

        {/* Leave Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>New Leave Request</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                  <X size={16} />
                </button>
              </div>

              {error && <div className="alert alert-error" style={{ margin: "0 1.5rem" }}>⚠️ {error}</div>}

              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label className="label">Leave Type *</label>
                  <select
                    className="input"
                    value={form.leaveTypeId}
                    onChange={(e) => setForm((p) => ({ ...p, leaveTypeId: e.target.value }))}
                    required
                  >
                    <option value="">Select leave type</option>
                    {leaveTypes.map((lt) => (
                      <option key={String(lt.id)} value={String(lt.id)}>
                        {String(lt.name)} {lt.daysAllowed ? `(${lt.daysAllowed} days/year)` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Start Date *</label>
                    <input
                      type="date"
                      className="input"
                      min={today}
                      value={form.startDate}
                      onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">End Date *</label>
                    <input
                      type="date"
                      className="input"
                      min={form.startDate || today}
                      value={form.endDate}
                      onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {form.startDate && form.endDate && new Date(form.endDate) >= new Date(form.startDate) && (
                  <div className="days-count">
                    <Clock size={14} />
                    {getDaysBetween(new Date(form.startDate), new Date(form.endDate))} day(s) requested
                  </div>
                )}

                <div className="form-group">
                  <label className="label">Remarks (optional)</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Provide any additional context..."
                    value={form.remarks}
                    onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting} id="leave-submit-btn">
                    {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Leave List */}
        {loading ? (
          <div className="skeleton-list">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="empty-state card" style={{ marginTop: "1rem" }}>
            <CalendarOff size={36} opacity={0.3} />
            <p style={{ fontWeight: 600 }}>No leave requests found</p>
            <p style={{ fontSize: "0.85rem" }}>
              {filter === "ALL" ? "Submit your first leave request" : `No ${filter.toLowerCase()} requests`}
            </p>
            {filter === "ALL" && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                <Plus size={14} /> New Request
              </button>
            )}
          </div>
        ) : (
          <div className="leave-cards animate-fade-in">
            {filteredLeaves.map((leave) => {
              const lt = leave.leaveType as Record<string, unknown>;
              const reviewer = leave.reviewedBy as Record<string, unknown> | null;
              const reviewerEmp = reviewer?.employee as Record<string, unknown> | null;
              const days = getDaysBetween(new Date(String(leave.startDate)), new Date(String(leave.endDate)));

              return (
                <div key={String(leave.id)} className="leave-card card">
                  <div className="leave-card-header">
                    <div>
                      <h4 className="leave-card-type">{String(lt?.name)}</h4>
                      <p className="leave-card-dates">
                        {formatDate(String(leave.startDate))} → {formatDate(String(leave.endDate))}
                        <span className="leave-card-days"> · {days} day{days > 1 ? "s" : ""}</span>
                      </p>
                    </div>
                    <div className={`badge badge-${String(leave.status).toLowerCase()}`}>
                      {statusIcon(String(leave.status))}
                      {String(leave.status)}
                    </div>
                  </div>

                  {leave.remarks && (
                    <p className="leave-card-remarks">💬 {String(leave.remarks)}</p>
                  )}

                  {leave.reviewNote && (
                    <div className="leave-review-note">
                      <strong>{reviewerEmp ? `${reviewerEmp.firstName} ${reviewerEmp.lastName}` : "HR"}:</strong>{" "}
                      {String(leave.reviewNote)}
                    </div>
                  )}

                  <p className="leave-card-date">Submitted {formatDate(String(leave.createdAt))}</p>
                </div>
              );
            })}
          </div>
        )}

        <style jsx>{`
          .leave-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
            flex-wrap: wrap;
            gap: 0.75rem;
          }

          .filter-tabs {
            display: flex;
            gap: 0.375rem;
            background: rgb(var(--bg-secondary));
            padding: 0.25rem;
            border-radius: var(--radius-sm);
            border: 1px solid rgb(var(--border));
          }

          .filter-tab {
            padding: 0.375rem 0.75rem;
            border-radius: calc(var(--radius-sm) - 2px);
            border: none;
            background: none;
            cursor: pointer;
            font-size: 0.8rem;
            font-weight: 500;
            color: rgb(var(--text-secondary));
            transition: all 0.15s ease;
          }

          .filter-tab.active {
            background: rgb(var(--bg-card));
            color: rgb(var(--text-primary));
            box-shadow: var(--shadow-sm);
          }

          .alert {
            padding: 0.75rem 1rem;
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .alert-success {
            background: rgb(var(--success-light));
            color: rgb(var(--success));
            border: 1px solid rgb(var(--success) / 0.3);
          }

          .alert-error {
            background: rgb(var(--danger-light));
            color: rgb(var(--danger));
            border: 1px solid rgb(var(--danger) / 0.3);
          }

          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgb(0 0 0 / 0.5);
            backdrop-filter: blur(4px);
            z-index: 200;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }

          .modal {
            background: rgb(var(--bg-card));
            border: 1px solid rgb(var(--border));
            border-radius: var(--radius-lg);
            width: 100%;
            max-width: 480px;
            box-shadow: var(--shadow-xl);
            animation: scaleIn 0.2s ease forwards;
          }

          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid rgb(var(--border));
          }

          .modal-header h3 {
            font-size: 1rem;
            font-weight: 700;
            color: rgb(var(--text-primary));
          }

          .modal-body {
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }

          .days-count {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.8rem;
            color: rgb(var(--accent));
            font-weight: 600;
            background: rgb(var(--accent-light));
            padding: 0.375rem 0.75rem;
            border-radius: var(--radius-sm);
          }

          .modal-footer {
            display: flex;
            gap: 0.5rem;
            justify-content: flex-end;
          }

          .skeleton-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-top: 1rem;
          }

          .leave-cards {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-top: 1rem;
          }

          .leave-card {
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .leave-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
          }

          .leave-card-type {
            font-size: 0.95rem;
            font-weight: 700;
            color: rgb(var(--text-primary));
          }

          .leave-card-dates {
            font-size: 0.8rem;
            color: rgb(var(--text-secondary));
            margin-top: 0.2rem;
          }

          .leave-card-days {
            color: rgb(var(--text-muted));
          }

          .leave-card-remarks {
            font-size: 0.8rem;
            color: rgb(var(--text-secondary));
            padding: 0.5rem 0.75rem;
            background: rgb(var(--bg-secondary));
            border-radius: var(--radius-sm);
            border-left: 3px solid rgb(var(--border));
          }

          .leave-review-note {
            font-size: 0.78rem;
            color: rgb(var(--text-secondary));
            padding: 0.5rem 0.75rem;
            background: rgb(var(--info-light));
            border-radius: var(--radius-sm);
            border-left: 3px solid rgb(var(--info));
          }

          .leave-card-date {
            font-size: 0.72rem;
            color: rgb(var(--text-muted));
          }
        `}</style>
      </div>
    </div>
  );
}
