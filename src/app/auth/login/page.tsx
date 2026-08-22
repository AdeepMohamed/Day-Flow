"use client";
// src/app/auth/login/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { PeopleOSLogo } from "@/components/peopleos-logo";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sign in failed");
        return;
      }

      const { role } = data.user;
      if (role === "ADMIN" || role === "HR") {
        router.push("/admin/dashboard");
      } else {
        router.push("/employee/dashboard");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Panel — Branding */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <PeopleOSLogo size={52} />
            <h1 className="auth-brand-title">PeopleOS</h1>
            <p className="auth-brand-tagline">
              The Operating System for Your People
            </p>
            <div className="auth-features">
              {[
                "📋 Smart Attendance Tracking",
                "🏖️ Leave Management & Approvals",
                "💰 Payroll Visibility",
                "🤖 AI-Powered HR Assistant",
                "📊 Real-time Analytics",
              ].map((f) => (
                <div key={f} className="auth-feature-item">
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h2>Welcome back</h2>
              <p>Sign in to your PeopleOS account</p>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <span>⚠️ {error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="input-with-icon">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="input"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
                id="login-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="auth-link">
                  Create account
                </Link>
              </p>
            </div>

            {/* Demo credentials */}
            <div className="demo-credentials">
              <p className="demo-label">Demo Credentials</p>
              <div className="demo-grid">
                <div className="demo-card" onClick={() => setForm({ email: "admin@peopleos.com", password: "Admin@123456" })}>
                  <span className="demo-role">Admin</span>
                  <span className="demo-email">admin@peopleos.com</span>
                </div>
                <div className="demo-card" onClick={() => setForm({ email: "john.doe@peopleos.com", password: "Employee@123456" })}>
                  <span className="demo-role">Employee</span>
                  <span className="demo-email">john.doe@peopleos.com</span>
                </div>
              </div>
              <p className="demo-hint">Click to fill credentials</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          background: rgb(var(--bg-primary));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .auth-container {
          width: 100%;
          max-width: 960px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-xl);
          min-height: 600px;
        }

        .auth-brand-panel {
          background: linear-gradient(135deg, rgb(var(--bg-sidebar)) 0%, #1e1b4b 100%);
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .auth-brand-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .auth-brand-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.025em;
        }

        .auth-brand-tagline {
          color: rgb(148 163 184);
          font-size: 1rem;
          line-height: 1.6;
        }

        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          margin-top: 1.5rem;
        }

        .auth-feature-item {
          color: rgb(203 213 225);
          font-size: 0.875rem;
          padding: 0.5rem 0.75rem;
          background: rgb(255 255 255 / 0.06);
          border-radius: var(--radius-sm);
          border: 1px solid rgb(255 255 255 / 0.08);
        }

        .auth-form-panel {
          background: rgb(var(--bg-card));
          padding: 3rem 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-form-wrapper {
          width: 100%;
          max-width: 380px;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .auth-form-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: rgb(var(--text-primary));
          letter-spacing: -0.025em;
        }

        .auth-form-header p {
          color: rgb(var(--text-secondary));
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }

        .auth-error {
          background: rgb(var(--danger-light));
          border: 1px solid rgb(var(--danger) / 0.3);
          border-radius: var(--radius-sm);
          padding: 0.75rem 1rem;
          color: rgb(var(--danger));
          font-size: 0.875rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
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

        .input-icon-btn:hover {
          color: rgb(var(--text-secondary));
        }

        .w-full {
          width: 100%;
        }

        .auth-footer {
          text-align: center;
          font-size: 0.875rem;
          color: rgb(var(--text-secondary));
        }

        .auth-link {
          color: rgb(var(--accent));
          text-decoration: none;
          font-weight: 500;
        }

        .auth-link:hover {
          text-decoration: underline;
        }

        .demo-credentials {
          background: rgb(var(--bg-secondary));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-sm);
          padding: 1rem;
        }

        .demo-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgb(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.625rem;
        }

        .demo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .demo-card {
          background: rgb(var(--bg-card));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-sm);
          padding: 0.625rem;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          transition: border-color 0.15s ease, background 0.15s ease;
        }

        .demo-card:hover {
          border-color: rgb(var(--accent));
          background: rgb(var(--accent-light));
        }

        .demo-role {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgb(var(--accent));
        }

        .demo-email {
          font-size: 0.7rem;
          color: rgb(var(--text-muted));
          word-break: break-all;
        }

        .demo-hint {
          font-size: 0.7rem;
          color: rgb(var(--text-muted));
          text-align: center;
          margin-top: 0.375rem;
        }

        @media (max-width: 640px) {
          .auth-container {
            grid-template-columns: 1fr;
          }

          .auth-brand-panel {
            display: none;
          }

          .auth-form-panel {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
