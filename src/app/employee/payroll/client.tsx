"use client";
// src/app/employee/payroll/client.tsx

import { DollarSign, TrendingUp, Shield } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  salary: Record<string, unknown> | null;
  payrollHistory: Record<string, unknown>[];
  employee: { firstName: string; lastName: string; position?: string | null; department?: string | null } | null;
}

export function PayrollClient({ salary, payrollHistory, employee }: Props) {
  const net = salary
    ? Number(salary.baseSalary || 0) + Number(salary.allowances || 0) - Number(salary.deductions || 0)
    : null;

  return (
    <div className="payroll-layout animate-fade-in">
      {!salary ? (
        <div className="card empty-state" style={{ padding: "3rem" }}>
          <DollarSign size={40} opacity={0.3} />
          <p style={{ fontWeight: 600, marginTop: "0.5rem" }}>No salary information configured</p>
          <p style={{ fontSize: "0.875rem", color: "rgb(var(--text-muted))" }}>
            Your HR team will update your salary structure shortly.
          </p>
        </div>
      ) : (
        <div className="payroll-layout">
          {/* Salary Summary */}
          <div className="payroll-summary card">
            <div className="payroll-header">
              <div>
                <h2>Salary Structure Breakdown</h2>
                <p>{employee?.position || "Staff"} · {employee?.department || "General"}</p>
              </div>
              <div className="payroll-read-only-badge">
                <Shield size={12} /> Read Only View
              </div>
            </div>

            <div className="salary-breakdown">
              <div className="salary-line">
                <span>Monthly Base Wage</span>
                <span className="salary-amount">
                  {formatCurrency(Number(salary.monthlyWage || salary.baseSalary), String(salary.currency || "USD"))}
                </span>
              </div>
              <div className="salary-line">
                <span>Basic Salary (50%)</span>
                <span className="salary-amount">
                  {formatCurrency(Number(salary.basicSalary || Number(salary.baseSalary) * 0.5), String(salary.currency || "USD"))}
                </span>
              </div>
              <div className="salary-line positive">
                <span>House Rent Allowance (HRA)</span>
                <span className="salary-amount positive">
                  + {formatCurrency(Number(salary.hra || Number(salary.baseSalary) * 0.25), String(salary.currency || "USD"))}
                </span>
              </div>
              {Number(salary.allowances || 0) > 0 && (
                <div className="salary-line positive">
                  <span>Other Allowances</span>
                  <span className="salary-amount positive">
                    + {formatCurrency(Number(salary.allowances), String(salary.currency || "USD"))}
                  </span>
                </div>
              )}
              {Number(salary.deductions || 0) > 0 && (
                <div className="salary-line negative">
                  <span>Deductions & PF</span>
                  <span className="salary-amount negative">
                    − {formatCurrency(Number(salary.deductions), String(salary.currency || "USD"))}
                  </span>
                </div>
              )}
              <div className="salary-divider" />
              <div className="salary-line total">
                <span>Net Pay</span>
                <span className="salary-amount total">
                  {formatCurrency(net!, String(salary.currency || "USD"))}
                </span>
              </div>
            </div>

            <div className="payroll-meta">
              <span>Effective from {formatDate(String(salary.effectiveFrom))}</span>
              {salary.updatedBy ? (
                <span>
                  Updated by HR
                </span>
              ) : null}
            </div>
          </div>

          {/* Payroll History */}
          {payrollHistory.length > 0 && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <TrendingUp size={16} color="rgb(var(--accent))" />
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700 }}>Payroll History</h3>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Base</th>
                      <th>Allowances</th>
                      <th>Deductions</th>
                      <th>Net Pay</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollHistory.map((rec) => {
                      const monthName = new Date(Number(rec.year), Number(rec.month) - 1).toLocaleString("default", { month: "long" });
                      return (
                        <tr key={String(rec.id)}>
                          <td>{monthName} {String(rec.year)}</td>
                          <td>{formatCurrency(Number(rec.baseSalary), String(salary.currency || "USD"))}</td>
                          <td className="positive">+{formatCurrency(Number(rec.allowances), String(salary.currency || "USD"))}</td>
                          <td className="negative">-{formatCurrency(Number(rec.deductions), String(salary.currency || "USD"))}</td>
                          <td style={{ fontWeight: 700 }}>{formatCurrency(Number(rec.netPay), String(salary.currency || "USD"))}</td>
                          <td>
                            <span className={`badge ${rec.status === "FINALIZED" ? "badge-present" : "badge-pending"}`}>
                              {String(rec.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .payroll-layout { display: flex; flex-direction: column; gap: 1rem; }
        .payroll-summary { padding: 1.5rem; }
        .payroll-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; gap: 1rem; }
        .payroll-header h2 { font-size: 1.1rem; font-weight: 700; color: rgb(var(--text-primary)); }
        .payroll-header p { font-size: 0.825rem; color: rgb(var(--text-secondary)); margin-top: 0.2rem; }
        .payroll-read-only-badge { display: flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; padding: 0.3rem 0.625rem; background: rgb(var(--bg-secondary)); border: 1px solid rgb(var(--border)); border-radius: var(--radius-full); color: rgb(var(--text-muted)); white-space: nowrap; }
        .salary-breakdown { display: flex; flex-direction: column; gap: 0.75rem; }
        .salary-line { display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem; color: rgb(var(--text-secondary)); }
        .salary-amount { font-weight: 600; color: rgb(var(--text-primary)); }
        .salary-line.positive .salary-amount { color: rgb(var(--success)); }
        .salary-line.negative .salary-amount { color: rgb(var(--danger)); }
        .salary-line.total { font-weight: 700; font-size: 1rem; }
        .salary-line.total span:first-child { color: rgb(var(--text-primary)); font-weight: 700; }
        .salary-line.total .salary-amount { font-size: 1.25rem; color: rgb(var(--accent)); }
        .salary-divider { height: 1px; background: rgb(var(--border)); margin: 0.25rem 0; }
        .payroll-meta { display: flex; gap: 1.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgb(var(--border)); }
        .payroll-meta span { font-size: 0.75rem; color: rgb(var(--text-muted)); }
        td.positive { color: rgb(var(--success)); }
        td.negative { color: rgb(var(--danger)); }
      `}</style>
    </div>
  );
}
