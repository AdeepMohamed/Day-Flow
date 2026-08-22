"use client";
// src/app/admin/payroll/client.tsx

import { useState } from "react";
import { DollarSign, Search, Calculator, ShieldCheck, Edit3, X, CheckCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SalaryRecord {
  id: string;
  employeeId: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  monthlyWage?: number | null;
  yearlyWage?: number | null;
  basicSalary?: number | null;
  hra?: number | null;
  fixedAllowance?: number | null;
  pfEmployee?: number | null;
  currency: string;
  effectiveFrom: string;
  employee: {
    firstName: string;
    lastName: string;
    department?: string | null;
    position?: string | null;
    user: { employeeId: string };
  };
}

interface EmployeeRecord {
  id: string;
  firstName: string;
  lastName: string;
  department?: string | null;
  position?: string | null;
  user: { email: string; employeeId: string };
  salary: SalaryRecord | null;
}

interface Props {
  employees: EmployeeRecord[];
  salaryStructures: SalaryRecord[];
}

export function AdminPayrollClient({ employees }: Props) {
  const [search, setSearch] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<EmployeeRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    monthlyWage: 0,
    baseSalary: 0,
    allowances: 0,
    deductions: 0,
    effectiveFrom: new Date().toISOString().split("T")[0],
  });

  const handleOpenEdit = (emp: EmployeeRecord) => {
    setSelectedEmp(emp);
    setSuccess("");
    setError("");
    const sal = emp.salary;
    const monthly = sal?.monthlyWage || sal?.baseSalary || 50000;
    setForm({
      monthlyWage: Number(monthly),
      baseSalary: Number(sal?.baseSalary || monthly * 0.5),
      allowances: Number(sal?.allowances || monthly * 0.25),
      deductions: Number(sal?.deductions || monthly * 0.06),
      effectiveFrom: sal?.effectiveFrom ? new Date(sal.effectiveFrom).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    });
  };

  const handleWageChange = (monthly: number) => {
    const basic = Math.round(monthly * 0.5);
    const hra = Math.round(basic * 0.5);
    const pf = Math.round(basic * 0.12);
    const fixed = Math.max(0, monthly - (basic + hra));

    setForm((prev) => ({
      ...prev,
      monthlyWage: monthly,
      baseSalary: basic,
      allowances: hra + fixed,
      deductions: pf,
    }));
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/payroll/${selectedEmp.id}/salary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          monthlyWage: form.monthlyWage,
          yearlyWage: form.monthlyWage * 12,
          basicSalary: form.baseSalary,
          hra: Math.round(form.baseSalary * 0.5),
          fixedAllowance: Math.max(0, form.monthlyWage - (form.baseSalary + Math.round(form.baseSalary * 0.5))),
          pfEmployee: Math.round(form.baseSalary * 0.12),
          baseSalary: form.baseSalary,
          allowances: form.allowances,
          deductions: form.deductions,
          currency: "USD",
          effectiveFrom: form.effectiveFrom,
        }),
      });

      if (res.ok) {
        setSuccess("Salary structure updated successfully!");
        setTimeout(() => setSelectedEmp(null), 1200);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update salary");
      }
    } catch {
      setError("Network error while saving salary");
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter((e) =>
    `${e.firstName} ${e.lastName} ${e.user.employeeId} ${e.department}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalMonthlyPayroll = employees.reduce((acc, e) => acc + Number(e.salary?.monthlyWage || e.salary?.baseSalary || 0), 0);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgb(var(--accent-light))" }}>
            <DollarSign size={22} color="rgb(var(--accent))" />
          </div>
          <div>
            <div className="stat-value">{formatCurrency(totalMonthlyPayroll)}</div>
            <div className="stat-label">Total Monthly Payroll</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgb(var(--success-light))" }}>
            <ShieldCheck size={22} color="rgb(var(--success))" />
          </div>
          <div>
            <div className="stat-value">{employees.filter((e) => e.salary).length} / {employees.length}</div>
            <div className="stat-label">Salaries Configured</div>
          </div>
        </div>
      </div>

      {/* Directory & Actions */}
      <div className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="input-with-icon" style={{ maxWidth: "360px" }}>
          <Search size={16} className="input-icon" />
          <input
            type="text"
            className="input"
            placeholder="Search employee by name, ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Monthly Wage</th>
                <th>Basic Salary</th>
                <th>HRA</th>
                <th>Net Est.</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const sal = emp.salary;
                const monthly = Number(sal?.monthlyWage || sal?.baseSalary || 0);
                const basic = Number(sal?.basicSalary || monthly * 0.5);
                const hra = Number(sal?.hra || basic * 0.5);
                const net = monthly - Number(sal?.deductions || 0);

                return (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "rgb(var(--text-primary))" }}>
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "rgb(var(--text-muted))" }}>
                        {emp.user.employeeId}
                      </div>
                    </td>
                    <td>{emp.department || "General"}</td>
                    <td style={{ fontWeight: 700 }}>{monthly > 0 ? formatCurrency(monthly) : "Not Configured"}</td>
                    <td>{formatCurrency(basic)}</td>
                    <td>{formatCurrency(hra)}</td>
                    <td style={{ color: "rgb(var(--success))", fontWeight: 700 }}>{formatCurrency(net)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(emp)}>
                        <Edit3 size={14} /> Adjust Salary
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Calculator Modal */}
      {selectedEmp && (
        <div className="modal-overlay" onClick={() => setSelectedEmp(null)}>
          <div className="modal" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Salary Adjustment</h2>
                <p className="modal-subtitle">Configure monthly wage & components for {selectedEmp.firstName} {selectedEmp.lastName}</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedEmp(null)}>
                <X size={16} />
              </button>
            </div>

            {success && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{success}</div>}
            {error && <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>{error}</div>}

            <form onSubmit={handleSaveSalary} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="label">Monthly Base Wage ($)</label>
                <div className="input-with-icon">
                  <Calculator size={16} className="input-icon" />
                  <input
                    type="number"
                    className="input"
                    value={form.monthlyWage}
                    onChange={(e) => handleWageChange(Number(e.target.value))}
                    required
                  />
                </div>
                <span style={{ fontSize: "0.75rem", color: "rgb(var(--text-muted))" }}>
                  Yearly Wage: <strong>{formatCurrency(form.monthlyWage * 12)}</strong>
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="label">Basic Salary (50%)</label>
                  <input type="number" className="input" value={form.baseSalary} readOnly style={{ background: "rgb(var(--bg-secondary))" }} />
                </div>

                <div className="form-group">
                  <label className="label">HRA (50% of Basic)</label>
                  <input type="number" className="input" value={Math.round(form.baseSalary * 0.5)} readOnly style={{ background: "rgb(var(--bg-secondary))" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="label">Employee PF (12% of Basic)</label>
                  <input type="number" className="input" value={Math.round(form.baseSalary * 0.12)} readOnly style={{ background: "rgb(var(--bg-secondary))" }} />
                </div>

                <div className="form-group">
                  <label className="label">Effective From</label>
                  <input
                    type="date"
                    className="input"
                    value={form.effectiveFrom}
                    onChange={(e) => setForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedEmp(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Save Salary Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
