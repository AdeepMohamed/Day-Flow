"use client";
// src/app/auth/register/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { PeopleOSLogo } from "@/components/peopleos-logo";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    employeeId: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "EMPLOYEE",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      setSuccess(data.message);
      if (!data.requiresVerification) {
        setTimeout(() => router.push("/auth/login"), 2000);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordChecks = [
    { label: "At least 8 characters", pass: form.password.length >= 8 },
    { label: "One uppercase letter", pass: /[A-Z]/.test(form.password) },
    { label: "One lowercase letter", pass: /[a-z]/.test(form.password) },
    { label: "One number", pass: /[0-9]/.test(form.password) },
  ];

  return (
    <div className="auth-page">
      <div className="auth-container register-container">
        {/* Header */}
        <div className="register-header">
          <Link href="/auth/login" className="back-link">
            ← Back to sign in
          </Link>
          <div className="register-title-row">
            <PeopleOSLogo size={36} />
            <div>
              <h1>Create your account</h1>
              <p>Join PeopleOS and streamline your HR workflow</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="register-form-wrapper">
          {error && (
            <div className="auth-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="auth-success" role="status">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="label">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  className="input"
                  placeholder="John"
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  disabled={loading}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName" className="label">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  className="input"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="employeeId" className="label">Employee ID</label>
                <input
                  id="employeeId"
                  type="text"
                  className="input"
                  placeholder="EMP-001"
                  value={form.employeeId}
                  onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value.toUpperCase() }))}
                  disabled={loading}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="role" className="label">Role</label>
                <select
                  id="role"
                  className="input"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  disabled={loading}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="HR">HR Officer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email" className="label">Email Address</label>
              <input
                id="reg-email"
                type="email"
                className="input"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password" className="label">Password</label>
              <div className="input-with-icon">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {form.password && (
                <div className="password-checks">
                  {passwordChecks.map((check) => (
                    <div
                      key={check.label}
                      className={`password-check ${check.pass ? "pass" : "fail"}`}
                    >
                      <span>{check.pass ? "✓" : "○"}</span>
                      {check.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
              disabled={loading || !!success}
              id="register-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <Link href="/auth/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          background: rgb(var(--bg-primary));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }

        .register-container {
          width: 100%;
          max-width: 560px;
          background: rgb(var(--bg-card));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .back-link {
          font-size: 0.875rem;
          color: rgb(var(--text-secondary));
          text-decoration: none;
          display: inline-block;
          margin-bottom: 0.75rem;
        }

        .back-link:hover { color: rgb(var(--text-primary)); }

        .register-title-row {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .register-title-row h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: rgb(var(--text-primary));
          letter-spacing: -0.025em;
          line-height: 1.2;
        }

        .register-title-row p {
          font-size: 0.875rem;
          color: rgb(var(--text-secondary));
          margin-top: 0.2rem;
        }

        .register-form-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .auth-error {
          background: rgb(var(--danger-light));
          border: 1px solid rgb(var(--danger) / 0.3);
          border-radius: var(--radius-sm);
          padding: 0.75rem 1rem;
          color: rgb(var(--danger));
          font-size: 0.875rem;
        }

        .auth-success {
          background: rgb(var(--success-light));
          border: 1px solid rgb(var(--success) / 0.3);
          border-radius: var(--radius-sm);
          padding: 0.75rem 1rem;
          color: rgb(var(--success));
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon .input {
          padding-right: 2.5rem;
        }

        .input-icon-btn {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgb(var(--text-muted));
          padding: 0.25rem;
          display: flex;
          align-items: center;
        }

        .password-checks {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 0.5rem;
        }

        .password-check {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.72rem;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-full);
        }

        .password-check.pass {
          background: rgb(var(--success-light));
          color: rgb(var(--success));
        }

        .password-check.fail {
          background: rgb(var(--bg-secondary));
          color: rgb(var(--text-muted));
        }

        .auth-footer-text {
          text-align: center;
          font-size: 0.875rem;
          color: rgb(var(--text-secondary));
        }

        .auth-link {
          color: rgb(var(--accent));
          text-decoration: none;
          font-weight: 500;
        }

        .auth-link:hover { text-decoration: underline; }

        @media (max-width: 480px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .register-container {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
