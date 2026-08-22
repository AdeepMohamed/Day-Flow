"use client";
// src/app/employee/profile/client.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Briefcase, Phone, MapPin, Mail, Calendar, Edit2, Save, X, Loader2 } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";

interface Props {
  employee: Record<string, unknown>;
  isAdmin?: boolean;
}

export function ProfileClient({ employee, isAdmin = false }: Props) {
  const router = useRouter();
  const user = employee.user as Record<string, unknown>;
  const manager = employee.manager as Record<string, unknown> | null;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    phone: String(employee.phone || ""),
    address: String(employee.address || ""),
    // Admin-only fields
    firstName: String(employee.firstName || ""),
    lastName: String(employee.lastName || ""),
    department: String(employee.department || ""),
    position: String(employee.position || ""),
    employmentType: String(employee.employmentType || ""),
  });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const body = isAdmin ? form : { phone: form.phone, address: form.address };
      const res = await fetch(`/api/employees/${String(employee.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update"); return; }
      setSuccess("Profile updated successfully!");
      setEditing(false);
      router.refresh();
    } catch { setError("Failed to save changes"); }
    finally { setSaving(false); }
  };

  const fullName = `${String(employee.firstName)} ${String(employee.lastName)}`;
  const initials = getInitials(String(employee.firstName || "?"), String(employee.lastName || "?"));

  return (
    <div className="profile-layout animate-fade-in">
      {/* Profile Header Card */}
      <div className="card profile-header-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar-lg">
            {employee.profilePicture ? (
              <img src={String(employee.profilePicture)} alt={fullName} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="profile-name-section">
            <h1 className="profile-full-name">{fullName}</h1>
            <p className="profile-position">{String(employee.position || "—")} · {String(employee.department || "—")}</p>
            <div className="profile-badges">
              <span className="badge badge-present">{String(user?.role)}</span>
              <span className="profile-emp-id">ID: {String(user?.employeeId)}</span>
            </div>
          </div>
        </div>

        <div className="profile-edit-actions">
          {success && <span className="success-msg"><Save size={12} /> {success}</span>}
          {!editing ? (
            <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)} id="edit-profile-btn">
              <Edit2 size={14} /> Edit Profile
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

      {error && (
        <div className="alert-error animate-fade-in">⚠️ {error}</div>
      )}

      <div className="profile-grid">
        {/* Personal Info */}
        <div className="card profile-section">
          <h3 className="section-title"><User size={16} /> Personal Information</h3>
          <div className="info-grid">
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
              <>
                <InfoRow icon={<User size={14} />} label="Full Name" value={fullName} />
              </>
            )}

            <InfoRow icon={<Mail size={14} />} label="Email" value={String(user?.email || "—")} />

            {editing ? (
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="label"><Phone size={12} style={{ display: "inline" }} /> Phone Number</label>
                <input className="input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+1 234 567 8900" />
              </div>
            ) : (
              <InfoRow icon={<Phone size={14} />} label="Phone" value={String(employee.phone || "Not provided")} />
            )}

            {editing ? (
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="label"><MapPin size={12} style={{ display: "inline" }} /> Address</label>
                <textarea className="input" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Your address..." rows={2} style={{ resize: "vertical" }} />
              </div>
            ) : (
              <InfoRow icon={<MapPin size={14} />} label="Address" value={String(employee.address || "Not provided")} />
            )}

            {employee.dateOfBirth && (
              <InfoRow icon={<Calendar size={14} />} label="Date of Birth" value={formatDate(String(employee.dateOfBirth))} />
            )}
          </div>
        </div>

        {/* Employment Info */}
        <div className="card profile-section">
          <h3 className="section-title"><Briefcase size={16} /> Employment Information</h3>
          <div className="info-grid">
            {isAdmin && editing ? (
              <>
                <div className="form-group">
                  <label className="label">Department</label>
                  <input className="input" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Position</label>
                  <input className="input" value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Employment Type</label>
                  <select className="input" value={form.employmentType} onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value }))}>
                    <option value="">Select...</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <InfoRow icon={<Briefcase size={14} />} label="Department" value={String(employee.department || "—")} />
                <InfoRow icon={<Briefcase size={14} />} label="Position" value={String(employee.position || "—")} />
                <InfoRow icon={<Briefcase size={14} />} label="Employment Type" value={String(employee.employmentType || "—")} />
              </>
            )}
            {employee.startDate && (
              <InfoRow icon={<Calendar size={14} />} label="Start Date" value={formatDate(String(employee.startDate))} />
            )}
            {manager && (
              <InfoRow icon={<User size={14} />} label="Manager" value={`${manager.firstName} ${manager.lastName}`} />
            )}
            <InfoRow icon={<Calendar size={14} />} label="Member Since" value={formatDate(String(user?.createdAt))} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-layout { display: flex; flex-direction: column; gap: 1rem; }
        .profile-header-card { padding: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
        .profile-avatar-section { display: flex; align-items: center; gap: 1.25rem; }
        .profile-avatar-lg { width: 72px; height: 72px; border-radius: 9999px; background: linear-gradient(135deg, rgb(var(--accent)), rgb(79 70 229 / 0.7)); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; color: white; flex-shrink: 0; overflow: hidden; }
        .profile-avatar-lg img { width: 100%; height: 100%; object-fit: cover; }
        .profile-full-name { font-size: 1.25rem; font-weight: 800; color: rgb(var(--text-primary)); }
        .profile-position { font-size: 0.85rem; color: rgb(var(--text-secondary)); margin-top: 0.2rem; }
        .profile-badges { display: flex; align-items: center; gap: 0.625rem; margin-top: 0.5rem; }
        .profile-emp-id { font-size: 0.75rem; color: rgb(var(--text-muted)); font-family: monospace; }
        .profile-edit-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .success-msg { font-size: 0.8rem; color: rgb(var(--success)); display: flex; align-items: center; gap: 0.25rem; }
        .alert-error { padding: 0.75rem 1rem; background: rgb(var(--danger-light)); color: rgb(var(--danger)); border-radius: var(--radius-sm); font-size: 0.875rem; border: 1px solid rgb(var(--danger) / 0.3); }
        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .profile-section { padding: 1.25rem; }
        .section-title { font-size: 0.875rem; font-weight: 700; color: rgb(var(--text-primary)); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .info-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="info-row">
      <div className="info-icon">{icon}</div>
      <div>
        <span className="info-label">{label}</span>
        <span className="info-value">{value}</span>
      </div>
      <style jsx>{`
        .info-row { display: flex; align-items: flex-start; gap: 0.75rem; }
        .info-icon { width: 28px; height: 28px; background: rgb(var(--bg-secondary)); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; color: rgb(var(--text-muted)); flex-shrink: 0; }
        .info-label { display: block; font-size: 0.7rem; font-weight: 600; color: rgb(var(--text-muted)); text-transform: uppercase; letter-spacing: 0.04em; }
        .info-value { display: block; font-size: 0.875rem; color: rgb(var(--text-primary)); margin-top: 0.1rem; word-break: break-word; }
      `}</style>
    </div>
  );
}
