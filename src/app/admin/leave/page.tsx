"use client";
// src/app/admin/leave/page.tsx
// Admin leave approval workflow

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { CheckCircle, XCircle, Clock, MessageSquare, Filter, Loader2, User } from "lucide-react";
import { formatDate, getDaysBetween } from "@/lib/utils";

export default function AdminLeavePage() {
  const [leaves, setLeaves] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leave/all${filter !== "ALL" ? `?status=${filter}` : ""}`);
      const data = await res.json();
      setLeaves(data.leaveRequests || []);
    } catch { setError("Failed to load requests"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, [filter]);

  const handleReview = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(true);
    setError(""); setSuccess("");
    try {
      const res = await fetch(`/api/leave/${leaveId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: reviewNote.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(`Leave request ${status.toLowerCase()} successfully`);
      setReviewing(null);
      setReviewNote("");
      fetchLeaves();
    } catch { setError("Failed to process request"); }
    finally { setActionLoading(false); }
  };

  return (
    <div>
      <Topbar title="Leave Approvals" subtitle="Review and manage employee leave requests" />
      <div className="page-body">
        <div className="leave-admin-header animate-fade-in">
          <div className="filter-tabs">
            {["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => (
              <button key={s} className={`filter-tab ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {success && <div className="alert-success animate-fade-in"><CheckCircle size={14} /> {success}</div>}
        {error && <div className="alert-error animate-fade-in">⚠️ {error}</div>}

        {loading ? (
          <div className="loading-list">
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
          </div>
        ) : leaves.length === 0 ? (
          <div className="empty-state card animate-fade-in" style={{ marginTop: "1rem" }}>
            <Clock size={36} opacity={0.3} />
            <p style={{ fontWeight: 600 }}>No {filter === "ALL" ? "" : filter.toLowerCase()} leave requests</p>
          </div>
        ) : (
          <div className="leave-admin-list animate-fade-in">
            {leaves.map((leave) => {
              const emp = leave.employee as Record<string, unknown>;
              const empUser = emp?.user as Record<string, unknown>;
              const lt = leave.leaveType as Record<string, unknown>;
              const reviewer = leave.reviewedBy as Record<string, unknown> | null;
              const reviewerEmp = reviewer?.employee as Record<string, unknown> | null;
              const days = getDaysBetween(new Date(String(leave.startDate)), new Date(String(leave.endDate)));
              const isPending = leave.status === "PENDING";

              return (
                <div key={String(leave.id)} className="leave-admin-card card">
                  <div className="leave-admin-card-header">
                    {/* Employee info */}
                    <div className="emp-info">
                      <div className="emp-avatar">
                        {String(emp?.firstName || "?").charAt(0)}{String(emp?.lastName || "").charAt(0)}
                      </div>
                      <div>
                        <span className="emp-name">{String(emp?.firstName)} {String(emp?.lastName)}</span>
                        <span className="emp-meta">{String(emp?.position || "—")} · {String(emp?.department || "—")}</span>
                        <span className="emp-id">ID: {String(empUser?.employeeId || "—")}</span>
                      </div>
                    </div>

                    {/* Leave info */}
                    <div className="leave-info">
                      <span className="leave-type-name">{String(lt?.name)}</span>
                      <span className="leave-dates">
                        {formatDate(String(leave.startDate))} → {formatDate(String(leave.endDate))}
                        <strong> ({days} day{days > 1 ? "s" : ""})</strong>
                      </span>
                      {leave.remarks && <span className="leave-remarks">💬 {String(leave.remarks)}</span>}
                    </div>

                    {/* Status / Actions */}
                    <div className="leave-actions">
                      {isPending ? (
                        <div className="action-buttons">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => { setReviewing(String(leave.id)); setReviewNote(""); }}
                            disabled={actionLoading}
                            id={`approve-btn-${leave.id}`}
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => { setReviewing(`reject-${leave.id}`); setReviewNote(""); }}
                            disabled={actionLoading}
                            id={`reject-btn-${leave.id}`}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className={`badge badge-${String(leave.status).toLowerCase()}`}>
                          {String(leave.status)}
                        </span>
                      )}
                      <span className="submitted-date">Submitted {formatDate(String(leave.createdAt))}</span>
                    </div>
                  </div>

                  {/* Review form */}
                  {(reviewing === String(leave.id) || reviewing === `reject-${leave.id}`) && (
                    <div className="review-form animate-fade-in">
                      <div className="review-form-inner">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <MessageSquare size={14} color="rgb(var(--text-muted))" />
                          <label className="label" style={{ margin: 0 }}>
                            Comment (optional)
                          </label>
                        </div>
                        <textarea
                          className="input"
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          placeholder="Add a note for the employee..."
                          rows={2}
                          style={{ resize: "vertical" }}
                        />
                        <div className="review-form-actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => setReviewing(null)}>
                            Cancel
                          </button>
                          {reviewing === String(leave.id) ? (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleReview(String(leave.id), "APPROVED")}
                              disabled={actionLoading}
                            >
                              {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                              Confirm Approval
                            </button>
                          ) : (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReview(String(leave.id), "REJECTED")}
                              disabled={actionLoading}
                            >
                              {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                              Confirm Rejection
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Existing review note */}
                  {!isPending && leave.reviewNote && (
                    <div className="existing-note">
                      <strong>{reviewerEmp ? `${reviewerEmp.firstName} ${reviewerEmp.lastName}` : "HR"}:</strong>{" "}
                      {String(leave.reviewNote)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <style jsx>{`
          .leave-admin-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; }
          .filter-tabs { display: flex; gap: 0.375rem; background: rgb(var(--bg-secondary)); padding: 0.25rem; border-radius: var(--radius-sm); border: 1px solid rgb(var(--border)); }
          .filter-tab { padding: 0.375rem 0.75rem; border-radius: calc(var(--radius-sm) - 2px); border: none; background: none; cursor: pointer; font-size: 0.8rem; font-weight: 500; color: rgb(var(--text-secondary)); transition: all 0.15s; }
          .filter-tab.active { background: rgb(var(--bg-card)); color: rgb(var(--text-primary)); box-shadow: var(--shadow-sm); }
          .alert-success { padding: 0.75rem 1rem; border-radius: var(--radius-sm); background: rgb(var(--success-light)); color: rgb(var(--success)); border: 1px solid rgb(var(--success) / 0.3); font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
          .alert-error { padding: 0.75rem 1rem; border-radius: var(--radius-sm); background: rgb(var(--danger-light)); color: rgb(var(--danger)); border: 1px solid rgb(var(--danger) / 0.3); font-size: 0.875rem; margin-bottom: 1rem; }
          .loading-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
          .leave-admin-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
          .leave-admin-card { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.875rem; }
          .leave-admin-card-header { display: flex; gap: 1.5rem; align-items: flex-start; flex-wrap: wrap; }
          .emp-info { display: flex; align-items: flex-start; gap: 0.75rem; min-width: 200px; }
          .emp-avatar { width: 40px; height: 40px; border-radius: 9999px; background: rgb(var(--accent)); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; flex-shrink: 0; }
          .emp-name { display: block; font-size: 0.9rem; font-weight: 700; color: rgb(var(--text-primary)); }
          .emp-meta { display: block; font-size: 0.75rem; color: rgb(var(--text-secondary)); margin-top: 0.1rem; }
          .emp-id { display: block; font-size: 0.7rem; color: rgb(var(--text-muted)); font-family: monospace; }
          .leave-info { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; min-width: 200px; }
          .leave-type-name { font-size: 0.875rem; font-weight: 600; color: rgb(var(--text-primary)); }
          .leave-dates { font-size: 0.8rem; color: rgb(var(--text-secondary)); }
          .leave-remarks { font-size: 0.78rem; color: rgb(var(--text-muted)); font-style: italic; }
          .leave-actions { display: flex; flex-direction: column; gap: 0.375rem; align-items: flex-end; }
          .action-buttons { display: flex; gap: 0.5rem; }
          .submitted-date { font-size: 0.7rem; color: rgb(var(--text-muted)); }
          .review-form { background: rgb(var(--bg-secondary)); border: 1px solid rgb(var(--border)); border-radius: var(--radius-sm); }
          .review-form-inner { padding: 1rem; display: flex; flex-direction: column; gap: 0.625rem; }
          .review-form-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
          .existing-note { font-size: 0.8rem; padding: 0.625rem 0.875rem; background: rgb(var(--info-light)); border-radius: var(--radius-sm); color: rgb(var(--text-secondary)); border-left: 3px solid rgb(var(--info)); }
        `}</style>
      </div>
    </div>
  );
}
