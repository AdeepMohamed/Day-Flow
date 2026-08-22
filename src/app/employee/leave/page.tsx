"use client";
// src/app/employee/leave/page.tsx
// Upgraded Employee Leave Page with Allocation Counter Cards & Attachment URL (Excalidraw Reference)

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { CalendarOff, Plus, X, Loader2, CheckCircle, XCircle, Clock, Paperclip, AlertCircle, Info } from "lucide-react";
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
    attachmentUrl: "",
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
      setError("Failed to load leave data");
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
      setForm({ leaveTypeId: "", startDate: "", endDate: "", remarks: "", attachmentUrl: "" });
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

  // Calculate allocation counters
  const approvedLeaves = leaves.filter((l) => l.status === "APPROVED");
  const paidUsed = approvedLeaves
    .filter((l) => (l.leaveType as Record<string, unknown>)?.type === "PAID")
    .reduce((acc, l) => acc + getDaysBetween(new Date(String(l.startDate)), new Date(String(l.endDate))), 0);

  const sickUsed = approvedLeaves
    .filter((l) => (l.leaveType as Record<string, unknown>)?.type === "SICK")
    .reduce((acc, l) => acc + getDaysBetween(new Date(String(l.startDate)), new Date(String(l.endDate))), 0);

  const paidAllowed = 20; // Default 20 days paid leave
  const sickAllowed = 10; // Default 10 days sick leave

  const filteredLeaves = filter === "ALL" ? leaves : leaves.filter((l) => l.status === filter);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <Topbar title="Time Off Management" subtitle="View allocation balances and submit requests" />
      <div className="page-body">
        {/* ── TIME OFF ALLOCATION CARDS (Excalidraw Requirement) ── */}
        <div className="allocation-cards-row animate-fade-in">
          <div className="card allocation-card">
            <div className="allocation-header">
              <span className="alloc-title">Paid Time Off (PTO)</span>
              <span className="badge badge-present">Annual</span>
            </div>
            <div className="alloc-numbers">
              <span className="alloc-remaining">{Math.max(0, paidAllowed - paidUsed)}</span>
              <span className="alloc-total">/ {paidAllowed} days left</span>
            </div>
            <div className="alloc-progress-bar">
              <div
                className="alloc-progress-fill"
                style={{ width: `${Math.min(100, (paidUsed / paidAllowed) * 100)}%` }}
              />
            </div>
            <span className="alloc-used-text">{paidUsed} days used this year</span>
          </div>

          <div className="card allocation-card">
            <div className="allocation-header">
              <span className="alloc-title">Sick Leave</span>
              <span className="badge badge-info">Medical</span>
            </div>
            <div className="alloc-numbers">
              <span className="alloc-remaining">{Math.max(0, sickAllowed - sickUsed)}</span>
              <span className="alloc-total">/ {sickAllowed} days left</span>
            </div>
            <div className="alloc-progress-bar">
              <div
                className="alloc-progress-fill sick-fill"
                style={{ width: `${Math.min(100, (sickUsed / sickAllowed) * 100)}%` }}
              />
            </div>
            <span className="alloc-used-text">{sickUsed} days used this year</span>
          </div>

          <div className="card allocation-card request-cta-card">
            <div className="cta-content">
              <h3>Need Time Off?</h3>
              <p>Submit your request for team review and approval.</p>
              <button
                className="btn btn-primary"
                onClick={() => { setShowForm(true); setError(""); setSuccess(""); }}
                id="new-leave-btn"
              >
                <Plus size={16} /> New Leave Request
              </button>
            </div>
          </div>
        </div>

        {/* Filters + List Header */}
        <div className="leave-header animate-fade-in" style={{ marginTop: "1.5rem" }}>
          <div className="filter-tabs">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
              <button
                key={s}
                className={`filter-tab ${filter === s ? "active" : ""}`}
                onClick={() => setFilter(s)}
              >
                {s === "ALL" ? "All Requests" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="alert alert-success animate-fade-in">
            <CheckCircle size={16} /> {success}
          </div>
        )}
        {error && !showForm && (
          <div className="alert alert-error animate-fade-in">⚠️ {error}</div>
        )}

        {/* Leave Request Form Modal */}
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
                  <label className="label">Remarks / Reason</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Describe your reason for time off..."
                    value={form.remarks}
                    onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Attachment URL (Optional / Medical Certificate)</label>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://..."
                    value={form.attachmentUrl}
                    onChange={(e) => setForm((p) => ({ ...p, attachmentUrl: e.target.value }))}
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
            <p style={{ fontSize: "0.85rem", color: "rgb(var(--text-muted))" }}>
              {filter === "ALL" ? "Submit your first time-off request above." : `No ${filter.toLowerCase()} leave requests.`}
            </p>
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

                  {Boolean(leave.remarks) && (
                    <p className="leave-card-remarks">💬 {String(leave.remarks)}</p>
                  )}

                  {Boolean(leave.attachmentUrl) && (
                    <div className="leave-attachment-link">
                      <Paperclip size={12} />
                      <a href={String(leave.attachmentUrl)} target="_blank" rel="noopener noreferrer">
                        Medical Certificate / Attachment
                      </a>
                    </div>
                  )}

                  {Boolean(leave.reviewNote) && (
                    <div className="leave-review-note">
                      <strong>{reviewerEmp ? `${reviewerEmp.firstName} ${reviewerEmp.lastName}` : "HR"}:</strong>{" "}
                      {String(leave.reviewNote)}
                    </div>
                  )}

                  <p className="leave-card-date">Submitted on {formatDate(String(leave.createdAt))}</p>
                </div>
              );
            })}
          </div>
        )}

        <style jsx>{`
          .allocation-cards-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
          }

          .allocation-card {
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 0.625rem;
          }

          .allocation-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .alloc-title {
            font-size: 0.875rem;
            font-weight: 700;
            color: rgb(var(--text-primary));
          }

          .alloc-numbers {
            display: flex;
            align-items: baseline;
            gap: 0.375rem;
          }

          .alloc-remaining {
            font-size: 1.75rem;
            font-weight: 800;
            color: rgb(var(--text-primary));
          }

          .alloc-total {
            font-size: 0.8rem;
            color: rgb(var(--text-muted));
          }

          .alloc-progress-bar {
            width: 100%;
            height: 6px;
            background: rgb(var(--bg-secondary));
            border-radius: var(--radius-full);
            overflow: hidden;
          }

          .alloc-progress-fill {
            height: 100%;
            background: rgb(var(--success));
            border-radius: var(--radius-full);
            transition: width 0.3s ease;
          }

          .sick-fill {
            background: rgb(var(--info));
          }

          .alloc-used-text {
            font-size: 0.72rem;
            color: rgb(var(--text-muted));
          }

          .request-cta-card {
            background: linear-gradient(135deg, rgb(var(--accent)), rgb(79 70 229 / 0.85));
            color: white;
            border: none;
          }

          .cta-content {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
          }

          .cta-content h3 {
            font-size: 1rem;
            font-weight: 700;
            color: white;
          }

          .cta-content p {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.8);
          }

          .leave-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
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
            margin-top: 1rem;
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

          .leave-attachment-link {
            font-size: 0.78rem;
            display: flex;
            align-items: center;
            gap: 0.3rem;
          }

          .leave-attachment-link a {
            color: rgb(var(--accent));
            text-decoration: underline;
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

          @media (max-width: 768px) {
            .allocation-cards-row { grid-template-columns: 1fr; }
          }
        `}</style>
      </div>
    </div>
  );
}
