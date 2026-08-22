"use client";
// src/components/layout/topbar.tsx

import { Moon, Sun, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("peopleos-theme") as "light" | "dark" | null;
    const initial = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("peopleos-theme", next);
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <header className="topbar">
      {/* Page title */}
      <div className="topbar-title" style={{ marginLeft: "1rem" }}>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div style={{ flex: 1 }} />

      {/* Date/time */}
      <div className="topbar-datetime" suppressHydrationWarning>
        <span className="topbar-time" suppressHydrationWarning>{timeStr}</span>
        <span className="topbar-date" suppressHydrationWarning>{dateStr}</span>
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="btn btn-ghost btn-sm topbar-btn"
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        id="theme-toggle-btn"
      >
        {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <style jsx>{`
        .topbar-title h2 {
          font-size: 1rem;
          font-weight: 700;
          color: rgb(var(--text-primary));
          line-height: 1.2;
        }

        .topbar-title p {
          font-size: 0.75rem;
          color: rgb(var(--text-secondary));
          margin-top: 0.1rem;
        }

        .topbar-datetime {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.1rem;
        }

        .topbar-time {
          font-size: 0.875rem;
          font-weight: 600;
          color: rgb(var(--text-primary));
        }

        .topbar-date {
          font-size: 0.7rem;
          color: rgb(var(--text-muted));
        }

        .topbar-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          padding: 0;
        }

        @media (max-width: 768px) {
          .topbar-datetime { display: none; }
          .topbar-title { margin-left: 3.5rem !important; }
        }
      `}</style>
    </header>
  );
}
