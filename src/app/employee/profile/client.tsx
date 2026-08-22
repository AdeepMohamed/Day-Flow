"use client";
// src/app/employee/profile/client.tsx
// Profile Client Component with 7 Tabbed Sections (Excalidraw Reference)

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Briefcase, Phone, MapPin, Mail, Calendar, Edit2, Save, X,
  CreditCard, Shield, FileText, Award, Wrench, DollarSign, Loader2, Plus, CheckCircle
} from "lucide-react";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";

interface Props {
  employee: Record<string, unknown>;
  isAdmin?: boolean;
}

type TabType = "profile" | "private" | "bank" | "documents" | "skills" | "certifications" | "salary";

export function ProfileClient({ employee, isAdmin = false }: Props) {
  const router = useRouter();
  const user = employee.user as Record<string, unknown>;
  const manager = employee.manager as Record<string, unknown> | null;
  const salary = employee.salary as Record<string, unknown> | null;
  const docs = (employee.documents as Record<string, unknown>[]) || [];

  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [form, setForm] = useState({
    phone: String(employee.phone || ""),
    address: String(employee.address || ""),
    personalEmail: String(employee.personalEmail || ""),
    // Admin fields
    firstName: String(employee.firstName || ""),
    lastName: String(employee.lastName || ""),
    department: String(employee.department || ""),
    position: String(employee.position || ""),
    company: String(employee.company || "Dayflow Corp"),
    location: String(employee.location || "Headquarters"),
    employmentType: String(employee.employmentType || "Full-time"),
    nationality: String(employee.nationality || "Indian"),
    maritalStatus: String(employee.maritalStatus || "Single"),
    bankName: String(employee.bankName || ""),
    bankAccountNo: String(employee.bankAccountNo || ""),
    ifscCode: String(employee.ifscCode || ""),
    panNumber: String(employee.panNumber || ""),
    uanNumber: String(employee.uanNumber || ""),
  });

  // Skill tags state
  const [skills, setSkills] = useState<string[]>(
    Array.isArray(employee.skills) ? (employee.skills as string[]) : ["TypeScript", "React", "Node.js", "HR Operations"]
  );
  const [newSkill, setNewSkill] = useState("");

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills((prev) => [...prev, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = isAdmin
        ? { ...form, skills }
        : {
            phone: form.phone,
            address: form.address,
            personalEmail: form.personalEmail,
            skills,
          };

      const res = await fetch(`/api/employees/${String(employee.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save profile");
        return;
      }

      setSuccess("✓ Profile updated successfully!");
      setEditing(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const fullName = `${String(employee.firstName)} ${String(employee.lastName)}`;
  const initials = getInitials(String(employee.firstName || "?"), String(employee.lastName || "?"));

  const tabs: { key: TabType; label: string; icon: React.ElementType }[] = [
    { key: "profile", label: "My Profile", icon: User },
    { key: "private", label: "Private Info", icon: Shield },
    { key: "bank", label: "Bank & Govt", icon: CreditCard },
    { key: "documents", label: "Resume & Docs", icon: FileText },
    { key: "skills", label: "Skills", icon: Wrench },
    { key: "certifications", label: "Certifications", icon: Award },
    { key: "salary", label: "Salary Info", icon: DollarSign },
  ];

  return (
    <div className="profile-wrapper animate-fade-in">
      {/* Profile Header Header Card */}
      <div className="card profile-header-card">
        <div className="profile-header-main">
          <div className="profile-avatar-lg">
            {employee.profilePicture ? (
              <img src={String(employee.profilePicture)} alt={fullName} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="profile-title-block">
            <h1 className="profile-full-name">{fullName}</h1>
            <p className="profile-role-dept">
              {String(employee.position || "Staff")} · {String(employee.department || "General")}
            </p>
            <div className="profile-tags-row">
              <span className="badge badge-present">{String(user?.role)}</span>
              <span className="meta-pill">{String(employee.company || "Dayflow Corp")}</span>
              <span className="emp-code">ID: {String(user?.employeeId)}</span>
            </div>
          </div>
        </div>

        <div className="profile-actions-bar">
          {success && <span className="save-success-tag">{success}</span>}

          {!editing ? (
            <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)} id="edit-profile-btn">
              <Edit2 size={14} /> Edit Information
            </button>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setError(""); }}>
                <X size={14} /> Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} id="save-profile-btn">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <div className="alert-error animate-fade-in" style={{ marginTop: "1rem" }}>⚠️ {error}</div>}

      {/* ── 7 TABBED SECTIONS (Excalidraw Reference) ── */}
      <div className="card profile-tabs-card" style={{ marginTop: "1rem" }}>
        <div className="profile-nav-tabs">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="profile-tab-content">
          {/* TAB 1: MY PROFILE */}
          {activeTab === "profile" && (
            <div className="tab-pane animate-fade-in">
              <h3 className="tab-title">Basic Information</h3>
              <div className="form-grid">
                {isAdmin && editing ? (
                  <>
                    <div className="form-group">
                      <label className="label">First Name</label>
                      <input className="input" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="label">Last Name</label>
                      <input className="input" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
                    </div>
                  </>
                ) : (
                  <ProfileField icon={<User size={14} />} label="Full Name" value={fullName} />
                )}

                <ProfileField icon={<Mail size={14} />} label="Work Email" value={String(user?.email || "—")} />

                {editing ? (
                  <div className="form-group">
                    <label className="label">Mobile Phone</label>
                    <input className="input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+1 234 567 890" />
                  </div>
                ) : (
                  <ProfileField icon={<Phone size={14} />} label="Mobile Phone" value={String(employee.phone || "Not provided")} />
                )}

                {isAdmin && editing ? (
                  <>
                    <div className="form-group">
                      <label className="label">Company</label>
                      <input className="input" value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="label">Location</label>
                      <input className="input" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
                    </div>
                  </>
                ) : (
                  <>
                    <ProfileField icon={<Briefcase size={14} />} label="Company" value={String(employee.company || "Dayflow Corp")} />
                    <ProfileField icon={<MapPin size={14} />} label="Location" value={String(employee.location || "Headquarters")} />
                  </>
                )}

                <ProfileField icon={<Briefcase size={14} />} label="Department" value={String(employee.department || "—")} />
                <ProfileField icon={<Briefcase size={14} />} label="Position" value={String(employee.position || "—")} />

                {manager && (
                  <ProfileField icon={<User size={14} />} label="Reporting Manager" value={`${manager.firstName} ${manager.lastName}`} />
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRIVATE INFO */}
          {activeTab === "private" && (
            <div className="tab-pane animate-fade-in">
              <h3 className="tab-title">Private & Personal Details</h3>
              <div className="form-grid">
                {Boolean(employee.dateOfJoining) && (
                  <ProfileField icon={<Calendar size={14} />} label="Date of Joining" value={formatDate(String(employee.dateOfJoining))} />
                )}
                {Boolean(employee.dateOfBirth) && (
                  <ProfileField icon={<Calendar size={14} />} label="Date of Birth" value={formatDate(String(employee.dateOfBirth))} />
                )}
                <ProfileField icon={<User size={14} />} label="Gender" value={String(employee.gender || "Not specified")} />

                {isAdmin && editing ? (
                  <>
                    <div className="form-group">
                      <label className="label">Nationality</label>
                      <input className="input" value={form.nationality} onChange={(e) => setForm((p) => ({ ...p, nationality: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="label">Marital Status</label>
                      <input className="input" value={form.maritalStatus} onChange={(e) => setForm((p) => ({ ...p, maritalStatus: e.target.value }))} />
                    </div>
                  </>
                ) : (
                  <>
                    <ProfileField icon={<Shield size={14} />} label="Nationality" value={String(employee.nationality || "Indian")} />
                    <ProfileField icon={<User size={14} />} label="Marital Status" value={String(employee.maritalStatus || "Single")} />
                  </>
                )}

                {editing ? (
                  <div className="form-group full-width">
                    <label className="label">Residing Address</label>
                    <textarea className="input" rows={2} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Your current address..." />
                  </div>
                ) : (
                  <div className="full-width">
                    <ProfileField icon={<MapPin size={14} />} label="Residing Address" value={String(employee.address || "Not provided")} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BANK & GOVT INFO */}
          {activeTab === "bank" && (
            <div className="tab-pane animate-fade-in">
              <h3 className="tab-title">Financial & Government Identification</h3>
              <div className="form-grid">
                {isAdmin && editing ? (
                  <>
                    <div className="form-group">
                      <label className="label">Bank Name</label>
                      <input className="input" value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="label">Account Number</label>
                      <input className="input" value={form.bankAccountNo} onChange={(e) => setForm((p) => ({ ...p, bankAccountNo: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="label">IFSC Code</label>
                      <input className="input" value={form.ifscCode} onChange={(e) => setForm((p) => ({ ...p, ifscCode: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="label">PAN Number</label>
                      <input className="input" value={form.panNumber} onChange={(e) => setForm((p) => ({ ...p, panNumber: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="label">UAN Number</label>
                      <input className="input" value={form.uanNumber} onChange={(e) => setForm((p) => ({ ...p, uanNumber: e.target.value }))} />
                    </div>
                  </>
                ) : (
                  <>
                    <ProfileField icon={<CreditCard size={14} />} label="Bank Name" value={String(employee.bankName || "HDFC Bank")} />
                    <ProfileField icon={<CreditCard size={14} />} label="Account Number" value={String(employee.bankAccountNo || "•••• •••• 4921")} />
                    <ProfileField icon={<CreditCard size={14} />} label="IFSC Code" value={String(employee.ifscCode || "HDFC0001234")} />
                    <ProfileField icon={<Shield size={14} />} label="PAN Number" value={String(employee.panNumber || "ABCDE1234F")} />
                    <ProfileField icon={<Shield size={14} />} label="UAN Number" value={String(employee.uanNumber || "100987654321")} />
                    <ProfileField icon={<Shield size={14} />} label="Employee Code" value={String(user?.employeeId || "EMP-001")} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RESUME & DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="tab-pane animate-fade-in">
              <h3 className="tab-title">Uploaded Documents & Resume</h3>
              {docs.length === 0 ? (
                <div className="empty-subpane">
                  <FileText size={32} opacity={0.3} />
                  <p>No documents uploaded yet</p>
                  <span className="sub-hint">Contracts, ID proofs, and certificates uploaded by HR will appear here.</span>
                </div>
              ) : (
                <div className="docs-list">
                  {docs.map((doc) => (
                    <div key={String(doc.id)} className="doc-item-card">
                      <FileText size={18} color="rgb(var(--accent))" />
                      <div className="doc-meta">
                        <strong>{String(doc.name)}</strong>
                        <span>{String(doc.type)} · Uploaded {formatDate(String(doc.createdAt))}</span>
                      </div>
                      <a href={String(doc.fileUrl)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SKILLS */}
          {activeTab === "skills" && (
            <div className="tab-pane animate-fade-in">
              <h3 className="tab-title">Skills & Competencies</h3>
              <div className="skills-container">
                <div className="skills-chips">
                  {skills.map((skill) => (
                    <span key={skill} className="skill-chip">
                      {skill}
                      {editing && (
                        <button type="button" className="skill-remove-btn" onClick={() => removeSkill(skill)}>
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {editing && (
                  <div className="add-skill-row">
                    <input
                      className="input"
                      style={{ maxWidth: 260 }}
                      placeholder="Add a new skill..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    />
                    <button className="btn btn-secondary btn-sm" type="button" onClick={addSkill}>
                      <Plus size={14} /> Add Skill
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CERTIFICATIONS */}
          {activeTab === "certifications" && (
            <div className="tab-pane animate-fade-in">
              <h3 className="tab-title">Professional Certifications</h3>
              <div className="certs-list">
                <div className="cert-card">
                  <Award size={20} color="rgb(var(--accent))" />
                  <div>
                    <strong>SHRM Certified Professional (SHRM-CP)</strong>
                    <p>Society for Human Resource Management · 2024</p>
                  </div>
                </div>
                <div className="cert-card">
                  <Award size={20} color="rgb(var(--success))" />
                  <div>
                    <strong>Certified Payroll Professional (CPP)</strong>
                    <p>American Payroll Association · 2023</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SALARY INFO */}
          {activeTab === "salary" && (
            <div className="tab-pane animate-fade-in">
              <h3 className="tab-title">Salary & Compensation Breakdown</h3>
              {!salary ? (
                <div className="empty-subpane">
                  <DollarSign size={32} opacity={0.3} />
                  <p>Salary structure not configured yet</p>
                  <span className="sub-hint">Your HR team will set up your wage breakdown shortly.</span>
                </div>
              ) : (
                <div className="salary-breakdown-box">
                  <div className="salary-main-header">
                    <div>
                      <span className="wage-label">Monthly Base Wage</span>
                      <h2 className="wage-amount">
                        {formatCurrency(Number(salary.monthlyWage || salary.baseSalary), String(salary.currency || "USD"))}
                      </h2>
                    </div>
                    <div className="salary-badge-pill">
                      Effective from {formatDate(String(salary.effectiveFrom))}
                    </div>
                  </div>

                  <div className="salary-table-wrapper">
                    <table className="salary-table">
                      <thead>
                        <tr>
                          <th>Salary Component</th>
                          <th>Computation Type</th>
                          <th style={{ textAlign: "right" }}>Monthly Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Basic Salary</td>
                          <td><span className="badge badge-info">50% of Wage</span></td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>
                            {formatCurrency(Number(salary.basicSalary || Number(salary.baseSalary) * 0.5), String(salary.currency))}
                          </td>
                        </tr>
                        <tr>
                          <td>House Rent Allowance (HRA)</td>
                          <td><span className="badge badge-info">50% of Basic</span></td>
                          <td style={{ textAlign: "right" }}>
                            {formatCurrency(Number(salary.hra || Number(salary.baseSalary) * 0.25), String(salary.currency))}
                          </td>
                        </tr>
                        {Number(salary.fixedAllowance || 0) > 0 && (
                          <tr>
                            <td>Fixed Allowance</td>
                            <td>Fixed Amount</td>
                            <td style={{ textAlign: "right" }}>
                              {formatCurrency(Number(salary.fixedAllowance), String(salary.currency))}
                            </td>
                          </tr>
                        )}
                        {Number(salary.pfEmployee || 0) > 0 && (
                          <tr className="deduction-row">
                            <td>Employee PF (Provident Fund)</td>
                            <td>12% of Basic</td>
                            <td style={{ textAlign: "right", color: "rgb(var(--danger))" }}>
                              − {formatCurrency(Number(salary.pfEmployee), String(salary.currency))}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .profile-wrapper { display: flex; flex-direction: column; }

        .profile-header-card {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .profile-header-main {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .profile-avatar-lg {
          width: 72px;
          height: 72px;
          border-radius: 9999px;
          background: linear-gradient(135deg, rgb(var(--accent)), rgb(79 70 229 / 0.8));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 800;
          flex-shrink: 0;
          overflow: hidden;
        }

        .profile-avatar-lg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-full-name {
          font-size: 1.35rem;
          font-weight: 800;
          color: rgb(var(--text-primary));
          letter-spacing: -0.02em;
        }

        .profile-role-dept {
          font-size: 0.875rem;
          color: rgb(var(--text-secondary));
          margin-top: 0.15rem;
        }

        .profile-tags-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .meta-pill {
          font-size: 0.72rem;
          padding: 0.15rem 0.5rem;
          background: rgb(var(--bg-secondary));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-full);
          color: rgb(var(--text-secondary));
        }

        .emp-code {
          font-size: 0.72rem;
          font-family: monospace;
          color: rgb(var(--text-muted));
        }

        .profile-actions-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .save-success-tag {
          font-size: 0.8rem;
          color: rgb(var(--success));
          font-weight: 600;
        }

        .profile-tabs-card {
          overflow: hidden;
        }

        .profile-nav-tabs {
          display: flex;
          overflow-x: auto;
          background: rgb(var(--bg-secondary));
          border-bottom: 1px solid rgb(var(--border));
        }

        .tab-btn {
          padding: 0.875rem 1.1rem;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 0.825rem;
          font-weight: 600;
          color: rgb(var(--text-secondary));
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .tab-btn:hover {
          color: rgb(var(--text-primary));
        }

        .tab-btn.active {
          background: rgb(var(--bg-card));
          color: rgb(var(--accent));
          border-bottom-color: rgb(var(--accent));
        }

        .profile-tab-content {
          padding: 1.5rem;
        }

        .tab-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: rgb(var(--text-primary));
          margin-bottom: 1.25rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .empty-subpane {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 3rem 1rem;
          text-align: center;
          color: rgb(var(--text-muted));
        }

        .sub-hint {
          font-size: 0.8rem;
        }

        .docs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .doc-item-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1rem;
          background: rgb(var(--bg-secondary));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-sm);
        }

        .doc-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .doc-meta strong {
          font-size: 0.875rem;
          color: rgb(var(--text-primary));
        }

        .doc-meta span {
          font-size: 0.75rem;
          color: rgb(var(--text-muted));
        }

        /* Skills */
        .skills-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .skills-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .skill-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.4rem 0.875rem;
          background: rgb(var(--accent-light));
          color: rgb(var(--accent));
          font-size: 0.825rem;
          font-weight: 600;
          border-radius: var(--radius-full);
        }

        .skill-remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: rgb(var(--accent));
          font-size: 0.75rem;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .add-skill-row {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        /* Certs */
        .certs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .cert-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgb(var(--bg-secondary));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-sm);
        }

        .cert-card strong {
          display: block;
          font-size: 0.875rem;
          color: rgb(var(--text-primary));
        }

        .cert-card p {
          font-size: 0.78rem;
          color: rgb(var(--text-muted));
          margin-top: 0.1rem;
        }

        /* Salary */
        .salary-breakdown-box {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .salary-main-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem;
          background: rgb(var(--bg-secondary));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-sm);
        }

        .wage-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: rgb(var(--text-muted));
          font-weight: 600;
        }

        .wage-amount {
          font-size: 1.75rem;
          font-weight: 800;
          color: rgb(var(--text-primary));
        }

        .salary-badge-pill {
          font-size: 0.78rem;
          color: rgb(var(--text-muted));
          background: rgb(var(--bg-card));
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius-full);
          border: 1px solid rgb(var(--border));
        }

        .salary-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .salary-table th {
          text-align: left;
          padding: 0.625rem;
          font-size: 0.75rem;
          color: rgb(var(--text-muted));
          text-transform: uppercase;
          border-bottom: 1px solid rgb(var(--border));
        }

        .salary-table td {
          padding: 0.75rem 0.625rem;
          border-bottom: 1px solid rgb(var(--border));
          color: rgb(var(--text-primary));
        }

        .deduction-row td {
          background: rgb(var(--danger-light) / 0.2);
        }

        .alert-error {
          padding: 0.75rem 1rem;
          background: rgb(var(--danger-light));
          color: rgb(var(--danger));
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
        }

        @media (max-width: 640px) {
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

function ProfileField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="profile-field-item">
      <div className="field-icon-wrap">{icon}</div>
      <div>
        <span className="field-label">{label}</span>
        <span className="field-value">{value}</span>
      </div>
      <style jsx>{`
        .profile-field-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .field-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: rgb(var(--bg-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgb(var(--text-muted));
          flex-shrink: 0;
        }
        .field-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          color: rgb(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .field-value {
          display: block;
          font-size: 0.875rem;
          color: rgb(var(--text-primary));
          margin-top: 0.1rem;
        }
      `}</style>
    </div>
  );
}
