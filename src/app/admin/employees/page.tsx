"use client";
// src/app/admin/employees/page.tsx
// Employee management — list, search, view, edit salary

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Users, Search, Plus, ChevronRight, Loader2, DollarSign } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<Record<string, unknown> | null>(null);
  const [salaryForm, setSalaryForm] = useState({ baseSalary: "", allowances: "0", deductions: "0", currency: "USD", effectiveFrom: new Date().toISOString().split("T")[0] });
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryMsg, setSalaryMsg] = useState("");

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10", ...(search ? { search } : {}) });
      const res = await fetch(`/api/employees?${params}`);
      const data = await res.json();
      setEmployees(data.employees || []);
      setTotal(data.pagination?.total || 0);
    } catch {} finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(t);
  }, [fetchEmployees]);

  const handleSalaryUpdate = async () => {
    if (!selectedEmployee) return;
    setSalaryLoading(true); setSalaryMsg("");
    try {
      const res = await fetch(`/api/payroll/${String(selectedEmployee.id)}/salary`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseSalary: Number(salaryForm.baseSalary),
          allowances: Number(salaryForm.allowances),
          deductions: Number(salaryForm.deductions),
          currency: salaryForm.currency,
          effectiveFrom: salaryForm.effectiveFrom,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSalaryMsg("Error: " + data.error); return; }
      setSalaryMsg("✓ Salary updated successfully");
      fetchEmployees();
    } catch { setSalaryMsg("Failed to update"); }
    finally { setSalaryLoading(false); }
  };

  const openSalaryModal = (emp: Record<string, unknown>) => {
    setSelectedEmployee(emp);
    const salary = emp.salary as Record<string, unknown> | undefined;
    if (salary) {
      setSalaryForm({
        baseSalary: String(salary.baseSalary || ""),
        allowances: String(salary.allowances || "0"),
        deductions: String(salary.deductions || "0"),
        currency: String(salary.currency || "USD"),
        effectiveFrom: String(salary.effectiveFrom || new Date().toISOString()).split("T")[0],
      });
    } else {
      setSalaryForm({ baseSalary: "", allowances: "0", deductions: "0", currency: "USD", effectiveFrom: new Date().toISOString().split("T")[0] });
    }
    setSalaryMsg("");
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      <Topbar title="Employees" subtitle={`${total} team member${total !== 1 ? "s" : ""}`} />
      <div className="page-body">
        {/* Search + actions */}
        <div className="emp-toolbar animate-fade-in">
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input className="input search-input" placeholder="Search by name, department, or position..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} id="employee-search" />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="loading-list animate-fade-in">
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 64 }} />)}
          </div>
        ) : employees.length === 0 ? (
          <div className="empty-state card animate-fade-in">
            <Users size={36} opacity={0.3} />
            <p style={{ fontWeight: 600 }}>{search ? "No employees found" : "No employees yet"}</p>
            <p style={{ fontSize: "0.85rem" }}>
              {search ? "Try a different search" : "Register employees to get started"}
            </p>
          </div>
        ) : (
          <div className="card table-wrapper animate-fade-in" style={{ marginTop: "1rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const user = emp.user as Record<string, unknown>;
                  const salary = emp.salary as Record<string, unknown> | undefined;
                  const fn = String(emp.firstName || "");
                  const ln = String(emp.lastName || "");
                  const initials = `${fn.charAt(0)}${ln.charAt(0)}`;
                  return (
                    <tr key={String(emp.id)}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div className="table-avatar">{initials}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{fn} {ln}</div>
                            <div style={{ fontSize: "0.72rem", color: "rgb(var(--text-muted))" }}>{String(user?.email || "")}</div>
                          </div>
                        </div>
                      </td>
                      <td>{String(emp.department || "—")}</td>
                      <td>{String(emp.position || "—")}</td>
                      <td>{String(emp.employmentType || "—")}</td>
                      <td>{emp.startDate ? formatDate(String(emp.startDate)) : "—"}</td>
                      <td>
                        {salary
                          ? <span style={{ fontWeight: 600 }}>{formatCurrency(Number(salary.baseSalary), String(salary.currency))}</span>
                          : <span style={{ color: "rgb(var(--text-muted))", fontSize: "0.8rem" }}>Not set</span>
                        }
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openSalaryModal(emp)} id={`salary-btn-${emp.id}`}>
                            <DollarSign size={12} /> Salary
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination animate-fade-in">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}

        {/* Salary Modal */}
        {selectedEmployee && (
          <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Set Salary — {String(selectedEmployee.firstName)} {String(selectedEmployee.lastName)}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedEmployee(null)}>✕</button>
              </div>
              <div className="modal-body">
                {salaryMsg && (
                  <div className={salaryMsg.startsWith("✓") ? "alert-success" : "alert-error"}>{salaryMsg}</div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Base Salary *</label>
                    <input type="number" className="input" min="0" step="100" value={salaryForm.baseSalary} onChange={(e) => setSalaryForm(p => ({ ...p, baseSalary: e.target.value }))} placeholder="e.g. 5000" />
                  </div>
                  <div className="form-group">
                    <label className="label">Currency</label>
                    <select className="input" value={salaryForm.currency} onChange={(e) => setSalaryForm(p => ({ ...p, currency: e.target.value }))}>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="MYR">MYR</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Allowances</label>
                    <input type="number" className="input" min="0" step="50" value={salaryForm.allowances} onChange={(e) => setSalaryForm(p => ({ ...p, allowances: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="label">Deductions</label>
                    <input type="number" className="input" min="0" step="50" value={salaryForm.deductions} onChange={(e) => setSalaryForm(p => ({ ...p, deductions: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Effective From</label>
                  <input type="date" className="input" value={salaryForm.effectiveFrom} onChange={(e) => setSalaryForm(p => ({ ...p, effectiveFrom: e.target.value }))} />
                </div>
                {salaryForm.baseSalary && (
                  <div className="net-preview">
                    Net Pay = {formatCurrency(
                      Number(salaryForm.baseSalary) + Number(salaryForm.allowances) - Number(salaryForm.deductions),
                      salaryForm.currency
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgb(var(--border))", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button className="btn btn-secondary" onClick={() => setSelectedEmployee(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSalaryUpdate} disabled={salaryLoading || !salaryForm.baseSalary} id="save-salary-btn">
                  {salaryLoading ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save Salary"}
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .emp-toolbar { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
          .search-wrapper { position: relative; flex: 1; max-width: 400px; }
          .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: rgb(var(--text-muted)); }
          .search-input { padding-left: 2.5rem; }
          .loading-list { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
          .table-avatar { width: 32px; height: 32px; border-radius: 9999px; background: rgb(var(--accent)); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; flex-shrink: 0; }
          .pagination { display: flex; align-items: center; gap: 1rem; justify-content: center; margin-top: 1rem; }
          .page-info { font-size: 0.85rem; color: rgb(var(--text-secondary)); }
          .modal-overlay { position: fixed; inset: 0; background: rgb(0 0 0 / 0.5); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; }
          .modal { background: rgb(var(--bg-card)); border: 1px solid rgb(var(--border)); border-radius: var(--radius-lg); width: 100%; max-width: 480px; box-shadow: var(--shadow-xl); animation: scaleIn 0.2s ease; }
          .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgb(var(--border)); }
          .modal-header h3 { font-size: 0.95rem; font-weight: 700; color: rgb(var(--text-primary)); }
          .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
          .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
          .alert-success { padding: 0.625rem 0.875rem; background: rgb(var(--success-light)); color: rgb(var(--success)); border-radius: var(--radius-sm); font-size: 0.85rem; }
          .alert-error { padding: 0.625rem 0.875rem; background: rgb(var(--danger-light)); color: rgb(var(--danger)); border-radius: var(--radius-sm); font-size: 0.85rem; }
          .net-preview { padding: 0.75rem; background: rgb(var(--accent-light)); border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 700; color: rgb(var(--accent)); text-align: center; }
        `}</style>
      </div>
    </div>
  );
}
