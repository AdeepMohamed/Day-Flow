"use client";
// src/app/admin/employees/page.tsx
// Employee Directory — Grid Cards view (Excalidraw reference) + Table view + Clickable profile details & salary editor

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import {
  Users, Search, LayoutGrid, List, DollarSign, Loader2,
  CheckCircle, Plane, AlertCircle, Mail, Phone, MapPin,
  Calendar, Briefcase, ChevronRight, X, Building, CreditCard
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Selected employee for detail / salary modal
  const [activeEmp, setActiveEmp] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "salary">("profile");

  // Salary form state
  const [salaryForm, setSalaryForm] = useState({
    monthlyWage: "",
    yearlyWage: "",
    basicSalary: "",
    hra: "",
    standardAllowance: "0",
    performanceBonus: "0",
    lta: "0",
    fixedAllowance: "",
    pfEmployee: "0",
    pfEmployer: "0",
    professionalTax: "0",
    workingDaysPerWeek: "5",
    breakTimeMinutes: "60",
    currency: "USD",
    effectiveFrom: new Date().toISOString().split("T")[0],
  });
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryMsg, setSalaryMsg] = useState("");

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/employees?${params}`);
      const data = await res.json();
      setEmployees(data.employees || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      // silent catch
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(t);
  }, [fetchEmployees]);

  // Handle Dynamic Wage Calculations (Excalidraw logic: 50% Basic, 50% HRA of Basic)
  const calculateSalaryComponents = (wageVal: number) => {
    const monthly = wageVal;
    const yearly = monthly * 12;
    const basic = monthly * 0.5; // 50% of Wage
    const hra = basic * 0.5;     // 50% of Basic
    const stdAllowance = Number(salaryForm.standardAllowance || 0);
    const bonus = Number(salaryForm.performanceBonus || 0);
    const lta = Number(salaryForm.lta || 0);
    const fixed = Math.max(0, monthly - (basic + hra + stdAllowance + bonus + lta));

    const pfEmp = basic * 0.12; // 12% of Basic PF
    const pfEmployer = basic * 0.12;

    setSalaryForm((prev) => ({
      ...prev,
      monthlyWage: String(monthly),
      yearlyWage: String(yearly),
      basicSalary: String(basic),
      hra: String(hra),
      fixedAllowance: String(fixed),
      pfEmployee: String(pfEmp),
      pfEmployer: String(pfEmployer),
    }));
  };

  const handleWageChange = (val: string) => {
    const num = Number(val);
    setSalaryForm((prev) => ({ ...prev, monthlyWage: val }));
    if (!isNaN(num) && num > 0) {
      calculateSalaryComponents(num);
    }
  };

  const openModal = (emp: Record<string, unknown>, initialTab: "profile" | "salary" = "profile") => {
    setActiveEmp(emp);
    setActiveTab(initialTab);
    setSalaryMsg("");

    const salary = emp.salary as Record<string, unknown> | undefined;
    if (salary) {
      setSalaryForm({
        monthlyWage: String(salary.monthlyWage || salary.baseSalary || ""),
        yearlyWage: String(salary.yearlyWage || Number(salary.baseSalary || 0) * 12),
        basicSalary: String(salary.basicSalary || Number(salary.baseSalary || 0) * 0.5),
        hra: String(salary.hra || Number(salary.baseSalary || 0) * 0.25),
        standardAllowance: String(salary.standardAllowance || "0"),
        performanceBonus: String(salary.performanceBonus || "0"),
        lta: String(salary.lta || "0"),
        fixedAllowance: String(salary.fixedAllowance || "0"),
        pfEmployee: String(salary.pfEmployee || "0"),
        pfEmployer: String(salary.pfEmployer || "0"),
        professionalTax: String(salary.professionalTax || "0"),
        workingDaysPerWeek: String(salary.workingDaysPerWeek || "5"),
        breakTimeMinutes: String(salary.breakTimeMinutes || "60"),
        currency: String(salary.currency || "USD"),
        effectiveFrom: String(salary.effectiveFrom || new Date().toISOString()).split("T")[0],
      });
    } else {
      setSalaryForm({
        monthlyWage: "",
        yearlyWage: "",
        basicSalary: "",
        hra: "",
        standardAllowance: "0",
        performanceBonus: "0",
        lta: "0",
        fixedAllowance: "",
        pfEmployee: "0",
        pfEmployer: "0",
        professionalTax: "0",
        workingDaysPerWeek: "5",
        breakTimeMinutes: "60",
        currency: "USD",
        effectiveFrom: new Date().toISOString().split("T")[0],
      });
    }
  };

  const handleSalarySave = async () => {
    if (!activeEmp) return;
    setSalaryLoading(true);
    setSalaryMsg("");

    const monthlyWageNum = Number(salaryForm.monthlyWage);
    const basicNum = Number(salaryForm.basicSalary);
    const hraNum = Number(salaryForm.hra);
    const allowancesNum = Number(salaryForm.hra) + Number(salaryForm.fixedAllowance) + Number(salaryForm.standardAllowance);
    const deductionsNum = Number(salaryForm.pfEmployee) + Number(salaryForm.professionalTax);

    try {
      const res = await fetch(`/api/payroll/${String(activeEmp.id)}/salary`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseSalary: monthlyWageNum || 1,
          allowances: allowancesNum,
          deductions: deductionsNum,
          monthlyWage: monthlyWageNum,
          yearlyWage: Number(salaryForm.yearlyWage),
          basicSalary: basicNum,
          hra: hraNum,
          standardAllowance: Number(salaryForm.standardAllowance),
          performanceBonus: Number(salaryForm.performanceBonus),
          lta: Number(salaryForm.lta),
          fixedAllowance: Number(salaryForm.fixedAllowance),
          pfEmployee: Number(salaryForm.pfEmployee),
          pfEmployer: Number(salaryForm.pfEmployer),
          professionalTax: Number(salaryForm.professionalTax),
          workingDaysPerWeek: Number(salaryForm.workingDaysPerWeek),
          breakTimeMinutes: Number(salaryForm.breakTimeMinutes),
          currency: salaryForm.currency,
          effectiveFrom: salaryForm.effectiveFrom,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSalaryMsg("Error: " + (data.error || "Failed to update"));
        return;
      }
      setSalaryMsg("✓ Salary structure saved successfully!");
      fetchEmployees();
    } catch {
      setSalaryMsg("Network error. Please try again.");
    } finally {
      setSalaryLoading(false);
    }
  };

  // Helper for status badge/dot (Excalidraw: Green = Present, Airplane = Leave, Yellow = Absent)
  const getEmployeeStatus = (emp: Record<string, unknown>) => {
    const attendance = emp.attendance as Record<string, unknown>[] | undefined;
    const leaveRequests = emp.leaveRequests as Record<string, unknown>[] | undefined;

    const todayStr = new Date().toISOString().split("T")[0];

    const onLeave = leaveRequests?.some((l) => {
      const s = String(l.startDate).split("T")[0];
      const e = String(l.endDate).split("T")[0];
      return l.status === "APPROVED" && todayStr >= s && todayStr <= e;
    });

    if (onLeave) {
      return { label: "On Leave", icon: Plane, cls: "status-leave", color: "rgb(var(--info))" };
    }

    const todayAtt = attendance?.find((a) => String(a.date).split("T")[0] === todayStr);
    if (todayAtt && todayAtt.status === "PRESENT") {
      return { label: "Present", icon: CheckCircle, cls: "status-present", color: "rgb(var(--success))" };
    }

    return { label: "Absent", icon: AlertCircle, cls: "status-absent", color: "rgb(var(--warning))" };
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div>
      <Topbar title="Employee Directory" subtitle={`${total} active team member${total !== 1 ? "s" : ""}`} />
      <div className="page-body">
        {/* Toolbar */}
        <div className="emp-toolbar animate-fade-in">
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              className="input search-input"
              placeholder="Search employee name, department, ID, position..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              id="employee-search-input"
            />
          </div>

          <div className="view-switchers">
            <button
              className={`btn btn-ghost btn-sm ${viewMode === "grid" ? "active-view" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View (Cards)"
              aria-label="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`btn btn-ghost btn-sm ${viewMode === "table" ? "active-view" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
              aria-label="Table View"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-grid animate-fade-in">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton" style={{ height: 180, borderRadius: "12px" }} />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="empty-state card animate-fade-in">
            <Users size={40} opacity={0.3} />
            <p style={{ fontWeight: 600, fontSize: "1rem" }}>
              {search ? "No employees match your search" : "No employees registered yet"}
            </p>
            <p style={{ fontSize: "0.85rem", color: "rgb(var(--text-muted))" }}>
              {search ? "Try searching by a different name or department" : "Registered employees will appear here"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* ── GRID CARDS VIEW (Excalidraw Reference) ── */
          <div className="employee-cards-grid animate-fade-in">
            {employees.map((emp) => {
              const user = emp.user as Record<string, unknown>;
              const salary = emp.salary as Record<string, unknown> | undefined;
              const fn = String(emp.firstName || "");
              const ln = String(emp.lastName || "");
              const status = getEmployeeStatus(emp);
              const StatusIcon = status.icon;

              return (
                <div
                  key={String(emp.id)}
                  className="card emp-card"
                  onClick={() => openModal(emp, "profile")}
                >
                  <div className="emp-card-header">
                    <div className="emp-card-avatar">
                      {emp.profilePicture ? (
                        <img src={String(emp.profilePicture)} alt={`${fn} ${ln}`} />
                      ) : (
                        <span>{fn.charAt(0)}{ln.charAt(0)}</span>
                      )}
                      <div className={`status-dot ${status.cls}`} title={status.label}>
                        <StatusIcon size={10} color="white" />
                      </div>
                    </div>

                    <div className="emp-card-title-group">
                      <h3 className="emp-card-name">{fn} {ln}</h3>
                      <p className="emp-card-position">{String(emp.position || "Staff")}</p>
                      <span className="emp-card-dept">{String(emp.department || "General")}</span>
                    </div>
                  </div>

                  <div className="emp-card-body">
                    <div className="emp-card-info-item">
                      <Mail size={13} className="info-icon" />
                      <span>{String(user?.email || "—")}</span>
                    </div>
                    <div className="emp-card-info-item">
                      <Phone size={13} className="info-icon" />
                      <span>{String(emp.phone || "Not set")}</span>
                    </div>
                    {salary?.monthlyWage || salary?.baseSalary ? (
                      <div className="emp-card-info-item">
                        <DollarSign size={13} className="info-icon" />
                        <span className="salary-val">
                          {formatCurrency(
                            Number(salary.monthlyWage || salary.baseSalary),
                            String(salary.currency || "USD")
                          )} / mo
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="emp-card-footer">
                    <span className="emp-id-badge">ID: {String(user?.employeeId || "—")}</span>
                    <button
                      className="btn btn-ghost btn-sm emp-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(emp, "salary");
                      }}
                      title="Salary Breakdown"
                    >
                      <DollarSign size={13} /> Salary
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── TABLE VIEW ── */
          <div className="card table-wrapper animate-fade-in" style={{ marginTop: "1rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Joining Date</th>
                  <th>Monthly Wage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const user = emp.user as Record<string, unknown>;
                  const salary = emp.salary as Record<string, unknown> | undefined;
                  const fn = String(emp.firstName || "");
                  const ln = String(emp.lastName || "");
                  const status = getEmployeeStatus(emp);

                  return (
                    <tr key={String(emp.id)}>
                      <td>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
                          onClick={() => openModal(emp, "profile")}
                        >
                          <div className="table-avatar">
                            {fn.charAt(0)}{ln.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{fn} {ln}</div>
                            <div style={{ fontSize: "0.72rem", color: "rgb(var(--text-muted))" }}>{String(user?.email || "")}</div>
                          </div>
                        </div>
                      </td>
                      <td>{String(emp.department || "—")}</td>
                      <td>{String(emp.position || "—")}</td>
                      <td>
                        <span className={`badge ${status.cls === "status-present" ? "badge-present" : status.cls === "status-leave" ? "badge-leave" : "badge-pending"}`}>
                          {status.label}
                        </span>
                      </td>
                      <td>{emp.dateOfJoining ? formatDate(String(emp.dateOfJoining)) : emp.startDate ? formatDate(String(emp.startDate)) : "—"}</td>
                      <td>
                        {salary?.monthlyWage || salary?.baseSalary ? (
                          <span style={{ fontWeight: 700 }}>
                            {formatCurrency(Number(salary.monthlyWage || salary.baseSalary), String(salary.currency))}
                          </span>
                        ) : (
                          <span style={{ color: "rgb(var(--text-muted))", fontSize: "0.8rem" }}>Not configured</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openModal(emp, "profile")}>
                            View Profile
                          </button>
                          <button className="btn btn-primary btn-sm" onClick={() => openModal(emp, "salary")}>
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
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              ← Previous
            </button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        )}

        {/* ── EMPLOYEE DETAIL & SALARY MODAL (Excalidraw 7-Tab Specifications) ── */}
        {activeEmp && (
          <div className="modal-overlay" onClick={() => setActiveEmp(null)}>
            <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-emp-info">
                  <div className="modal-avatar">
                    {String(activeEmp.firstName).charAt(0)}{String(activeEmp.lastName).charAt(0)}
                  </div>
                  <div>
                    <h3>{String(activeEmp.firstName)} {String(activeEmp.lastName)}</h3>
                    <p>{String(activeEmp.position || "—")} · {String(activeEmp.department || "—")}</p>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveEmp(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="modal-tabs">
                <button className={`modal-tab ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
                  <Users size={14} /> Full Profile
                </button>
                <button className={`modal-tab ${activeTab === "salary" ? "active" : ""}`} onClick={() => setActiveTab("salary")}>
                  <DollarSign size={14} /> Salary Information
                </button>
              </div>

              <div className="modal-body-scroll">
                {activeTab === "profile" ? (
                  /* ── PROFILE TAB ── */
                  <div className="profile-detail-grid">
                    {/* Basic Info */}
                    <div className="detail-section">
                      <h4><Briefcase size={14} /> Employment & Basic Info</h4>
                      <div className="detail-row"><span>Employee ID</span><strong>{String((activeEmp.user as Record<string, unknown>)?.employeeId || "—")}</strong></div>
                      <div className="detail-row"><span>Email</span><strong>{String((activeEmp.user as Record<string, unknown>)?.email || "—")}</strong></div>
                      <div className="detail-row"><span>Company</span><strong>{String(activeEmp.company || "Dayflow Corp")}</strong></div>
                      <div className="detail-row"><span>Location</span><strong>{String(activeEmp.location || "Headquarters")}</strong></div>
                      <div className="detail-row"><span>Employment Type</span><strong>{String(activeEmp.employmentType || "Full-time")}</strong></div>
                    </div>

                    {/* Personal Info (Excalidraw) */}
                    <div className="detail-section">
                      <h4><Users size={14} /> Personal Information</h4>
                      <div className="detail-row"><span>Date of Birth</span><strong>{activeEmp.dateOfBirth ? formatDate(String(activeEmp.dateOfBirth)) : "Not provided"}</strong></div>
                      <div className="detail-row"><span>Gender</span><strong>{String(activeEmp.gender || "Not specified")}</strong></div>
                      <div className="detail-row"><span>Nationality</span><strong>{String(activeEmp.nationality || "Indian")}</strong></div>
                      <div className="detail-row"><span>Marital Status</span><strong>{String(activeEmp.maritalStatus || "Single")}</strong></div>
                      <div className="detail-row"><span>Mobile Phone</span><strong>{String(activeEmp.phone || "Not provided")}</strong></div>
                      <div className="detail-row"><span>Residing Address</span><strong>{String(activeEmp.address || "Not provided")}</strong></div>
                    </div>

                    {/* Bank & Govt Info (Excalidraw) */}
                    <div className="detail-section">
                      <h4><CreditCard size={14} /> Bank & Government Info</h4>
                      <div className="detail-row"><span>Bank Name</span><strong>{String(activeEmp.bankName || "HDFC Bank")}</strong></div>
                      <div className="detail-row"><span>Account Number</span><strong>{String(activeEmp.bankAccountNo || "•••• •••• 4921")}</strong></div>
                      <div className="detail-row"><span>IFSC Code</span><strong>{String(activeEmp.ifscCode || "HDFC0001234")}</strong></div>
                      <div className="detail-row"><span>PAN Number</span><strong>{String(activeEmp.panNumber || "ABCDE1234F")}</strong></div>
                      <div className="detail-row"><span>UAN Number</span><strong>{String(activeEmp.uanNumber || "100987654321")}</strong></div>
                    </div>
                  </div>
                ) : (
                  /* ── DYNAMIC SALARY TAB (Excalidraw Engine) ── */
                  <div className="salary-editor-view">
                    {salaryMsg && (
                      <div className={salaryMsg.startsWith("✓") ? "alert-success" : "alert-error"} style={{ marginBottom: "1rem" }}>
                        {salaryMsg}
                      </div>
                    )}

                    <div className="salary-calc-box">
                      <div className="form-group">
                        <label className="label">Monthly Wage * (Main Salary Base)</label>
                        <div className="input-prefix-wrapper">
                          <span className="prefix-symbol">$</span>
                          <input
                            type="number"
                            className="input prefix-input"
                            placeholder="e.g. 50000"
                            value={salaryForm.monthlyWage}
                            onChange={(e) => handleWageChange(e.target.value)}
                          />
                        </div>
                        <p className="hint-text">Updating wage automatically calculates 50% Basic, 50% HRA & PF deductions.</p>
                      </div>

                      <div className="salary-summary-pills">
                        <div className="pill-item">
                          <span>Yearly Wage</span>
                          <strong>{formatCurrency(Number(salaryForm.yearlyWage || 0), salaryForm.currency)}</strong>
                        </div>
                        <div className="pill-item">
                          <span>Basic Salary (50%)</span>
                          <strong>{formatCurrency(Number(salaryForm.basicSalary || 0), salaryForm.currency)}</strong>
                        </div>
                        <div className="pill-item">
                          <span>HRA (50% of Basic)</span>
                          <strong>{formatCurrency(Number(salaryForm.hra || 0), salaryForm.currency)}</strong>
                        </div>
                        <div className="pill-item highlight">
                          <span>Fixed Allowance</span>
                          <strong>{formatCurrency(Number(salaryForm.fixedAllowance || 0), salaryForm.currency)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="salary-components-grid">
                      {/* Allowances */}
                      <div className="component-column">
                        <h5 className="column-title positive">+ Allowances</h5>
                        <div className="form-group">
                          <label className="label">Standard Allowance</label>
                          <input
                            type="number"
                            className="input"
                            value={salaryForm.standardAllowance}
                            onChange={(e) => setSalaryForm((p) => ({ ...p, standardAllowance: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="label">Performance Bonus</label>
                          <input
                            type="number"
                            className="input"
                            value={salaryForm.performanceBonus}
                            onChange={(e) => setSalaryForm((p) => ({ ...p, performanceBonus: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="label">Leave Travel Allowance (LTA)</label>
                          <input
                            type="number"
                            className="input"
                            value={salaryForm.lta}
                            onChange={(e) => setSalaryForm((p) => ({ ...p, lta: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Deductions */}
                      <div className="component-column">
                        <h5 className="column-title negative">− Deductions & PF</h5>
                        <div className="form-group">
                          <label className="label">Employee PF (12% of Basic)</label>
                          <input
                            type="number"
                            className="input"
                            value={salaryForm.pfEmployee}
                            onChange={(e) => setSalaryForm((p) => ({ ...p, pfEmployee: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="label">Employer PF</label>
                          <input
                            type="number"
                            className="input"
                            value={salaryForm.pfEmployer}
                            onChange={(e) => setSalaryForm((p) => ({ ...p, pfEmployer: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="label">Professional Tax</label>
                          <input
                            type="number"
                            className="input"
                            value={salaryForm.professionalTax}
                            onChange={(e) => setSalaryForm((p) => ({ ...p, professionalTax: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer-sticky">
                      <button className="btn btn-secondary" onClick={() => setActiveEmp(null)}>
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleSalarySave}
                        disabled={salaryLoading || !salaryForm.monthlyWage}
                        id="save-salary-structure-btn"
                      >
                        {salaryLoading ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save Salary Structure"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .emp-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1.25rem;
            flex-wrap: wrap;
          }

          .search-wrapper {
            position: relative;
            flex: 1;
            max-width: 440px;
          }

          .search-icon {
            position: absolute;
            left: 0.875rem;
            top: 50%;
            transform: translateY(-50%);
            color: rgb(var(--text-muted));
          }

          .search-input {
            padding-left: 2.75rem;
          }

          .view-switchers {
            display: flex;
            gap: 0.25rem;
            background: rgb(var(--bg-secondary));
            padding: 0.25rem;
            border-radius: var(--radius-sm);
            border: 1px solid rgb(var(--border));
          }

          .active-view {
            background: rgb(var(--bg-card)) !important;
            color: rgb(var(--accent)) !important;
            box-shadow: var(--shadow-sm);
          }

          .loading-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
          }

          /* Cards Grid View (Excalidraw Reference) */
          .employee-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
          }

          .emp-card {
            padding: 1.25rem;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
          }

          .emp-card:hover {
            transform: translateY(-2px);
            border-color: rgb(var(--accent) / 0.4);
            box-shadow: var(--shadow-md);
          }

          .emp-card-header {
            display: flex;
            gap: 0.875rem;
            align-items: flex-start;
          }

          .emp-card-avatar {
            position: relative;
            width: 48px;
            height: 48px;
            border-radius: 9999px;
            background: linear-gradient(135deg, rgb(var(--accent)), rgb(79 70 229 / 0.8));
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            font-weight: 700;
            flex-shrink: 0;
            overflow: hidden;
          }

          .emp-card-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .status-dot {
            position: absolute;
            bottom: -1px;
            right: -1px;
            width: 16px;
            height: 16px;
            border-radius: 9999px;
            border: 2px solid rgb(var(--bg-card));
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .status-present { background: rgb(var(--success)); }
          .status-leave { background: rgb(var(--info)); }
          .status-absent { background: rgb(var(--warning)); }

          .emp-card-title-group {
            min-width: 0;
            flex: 1;
          }

          .emp-card-name {
            font-size: 0.95rem;
            font-weight: 700;
            color: rgb(var(--text-primary));
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .emp-card-position {
            font-size: 0.78rem;
            color: rgb(var(--text-secondary));
            margin-top: 0.1rem;
          }

          .emp-card-dept {
            display: inline-block;
            font-size: 0.68rem;
            font-weight: 600;
            padding: 0.15rem 0.5rem;
            background: rgb(var(--bg-secondary));
            border-radius: var(--radius-full);
            color: rgb(var(--text-muted));
            margin-top: 0.3rem;
            text-transform: uppercase;
          }

          .emp-card-body {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            padding-top: 0.5rem;
            border-top: 1px solid rgb(var(--border));
          }

          .emp-card-info-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.78rem;
            color: rgb(var(--text-secondary));
          }

          .info-icon {
            color: rgb(var(--text-muted));
            flex-shrink: 0;
          }

          .salary-val {
            font-weight: 700;
            color: rgb(var(--accent));
          }

          .emp-card-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 0.5rem;
          }

          .emp-id-badge {
            font-size: 0.7rem;
            font-family: monospace;
            color: rgb(var(--text-muted));
          }

          .table-avatar {
            width: 32px;
            height: 32px;
            border-radius: 9999px;
            background: rgb(var(--accent));
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 700;
          }

          .pagination {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin-top: 1.5rem;
          }

          .page-info {
            font-size: 0.85rem;
            color: rgb(var(--text-secondary));
          }

          /* Modal Styling */
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

          .modal-lg {
            max-width: 680px !important;
            width: 100%;
          }

          .modal {
            background: rgb(var(--bg-card));
            border: 1px solid rgb(var(--border));
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xl);
            display: flex;
            flex-direction: column;
            max-height: 88vh;
            overflow: hidden;
            animation: scaleIn 0.2s ease forwards;
          }

          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid rgb(var(--border));
          }

          .modal-emp-info {
            display: flex;
            align-items: center;
            gap: 0.875rem;
          }

          .modal-avatar {
            width: 40px;
            height: 40px;
            border-radius: 9999px;
            background: rgb(var(--accent));
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
          }

          .modal-tabs {
            display: flex;
            border-bottom: 1px solid rgb(var(--border));
            background: rgb(var(--bg-secondary));
          }

          .modal-tab {
            flex: 1;
            padding: 0.75rem;
            border: none;
            background: none;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            color: rgb(var(--text-secondary));
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            border-bottom: 2px solid transparent;
            transition: all 0.15s ease;
          }

          .modal-tab.active {
            background: rgb(var(--bg-card));
            color: rgb(var(--accent));
            border-bottom-color: rgb(var(--accent));
          }

          .modal-body-scroll {
            padding: 1.5rem;
            overflow-y: auto;
            flex: 1;
          }

          .profile-detail-grid {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }

          .detail-section {
            background: rgb(var(--bg-secondary));
            border: 1px solid rgb(var(--border));
            border-radius: var(--radius-sm);
            padding: 1rem;
          }

          .detail-section h4 {
            font-size: 0.85rem;
            font-weight: 700;
            color: rgb(var(--text-primary));
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.825rem;
            padding: 0.35rem 0;
            border-bottom: 1px solid rgb(var(--border) / 0.5);
          }

          .detail-row:last-child {
            border-bottom: none;
          }

          .detail-row span {
            color: rgb(var(--text-secondary));
          }

          .detail-row strong {
            color: rgb(var(--text-primary));
          }

          /* Salary Calculator */
          .salary-editor-view {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }

          .salary-calc-box {
            background: rgb(var(--bg-secondary));
            border: 1px solid rgb(var(--border));
            border-radius: var(--radius-sm);
            padding: 1.25rem;
          }

          .input-prefix-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .prefix-symbol {
            position: absolute;
            left: 0.875rem;
            font-weight: 700;
            color: rgb(var(--text-muted));
          }

          .prefix-input {
            padding-left: 2rem;
            font-size: 1.1rem;
            font-weight: 700;
          }

          .hint-text {
            font-size: 0.72rem;
            color: rgb(var(--text-muted));
            margin-top: 0.35rem;
          }

          .salary-summary-pills {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem;
            margin-top: 1rem;
          }

          .pill-item {
            background: rgb(var(--bg-card));
            border: 1px solid rgb(var(--border));
            border-radius: var(--radius-sm);
            padding: 0.625rem;
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
          }

          .pill-item.highlight {
            background: rgb(var(--accent-light));
            border-color: rgb(var(--accent) / 0.3);
          }

          .pill-item span {
            font-size: 0.68rem;
            color: rgb(var(--text-muted));
            font-weight: 600;
            text-transform: uppercase;
          }

          .pill-item strong {
            font-size: 0.875rem;
            color: rgb(var(--text-primary));
          }

          .salary-components-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          .component-column {
            background: rgb(var(--bg-secondary));
            border: 1px solid rgb(var(--border));
            border-radius: var(--radius-sm);
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .column-title {
            font-size: 0.825rem;
            font-weight: 700;
            text-transform: uppercase;
          }

          .column-title.positive { color: rgb(var(--success)); }
          .column-title.negative { color: rgb(var(--danger)); }

          .modal-footer-sticky {
            display: flex;
            gap: 0.5rem;
            justify-content: flex-end;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid rgb(var(--border));
          }

          .alert-success {
            padding: 0.625rem 0.875rem;
            background: rgb(var(--success-light));
            color: rgb(var(--success));
            border-radius: var(--radius-sm);
            font-size: 0.85rem;
          }

          .alert-error {
            padding: 0.625rem 0.875rem;
            background: rgb(var(--danger-light));
            color: rgb(var(--danger));
            border-radius: var(--radius-sm);
            font-size: 0.85rem;
          }

          @media (max-width: 640px) {
            .salary-summary-pills { grid-template-columns: 1fr 1fr; }
            .salary-components-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </div>
    </div>
  );
}
