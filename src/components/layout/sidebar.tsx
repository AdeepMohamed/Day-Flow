"use client";
// src/components/layout/sidebar.tsx

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Clock, CalendarOff, DollarSign,
  BarChart3, Bell, ShieldCheck, LogOut, Menu, X, ChevronRight,
} from "lucide-react";
import { PeopleOSWordmark } from "@/components/peopleos-logo";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface SidebarProps {
  role: "EMPLOYEE" | "HR" | "ADMIN";
  unreadNotifs?: number;
  employeeName?: string;
  employeeAvatar?: string | null;
}

const EMPLOYEE_NAV: NavItem[] = [
  { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
  { label: "Attendance", href: "/employee/attendance", icon: Clock },
  { label: "Leave Requests", href: "/employee/leave", icon: CalendarOff },
  { label: "Payroll", href: "/employee/payroll", icon: DollarSign },
  { label: "Profile", href: "/employee/profile", icon: Users },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Employees", href: "/admin/employees", icon: Users },
  { label: "Attendance", href: "/admin/attendance", icon: Clock },
  { label: "Leave Approvals", href: "/admin/leave", icon: CalendarOff },
  { label: "Payroll", href: "/admin/payroll", icon: DollarSign },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Audit Trail", href: "/admin/audit", icon: ShieldCheck },
];

export function Sidebar({ role, unreadNotifs = 0, employeeName, employeeAvatar }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = role === "EMPLOYEE" ? EMPLOYEE_NAV : ADMIN_NAV;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
    } catch {
      router.push("/auth/login");
    }
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <PeopleOSWordmark />
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">
          {role === "EMPLOYEE" ? "Employee" : "HR Admin"}
        </div>

        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onMouseEnter={() => router.prefetch(item.href)}
            className={`sidebar-item ${isActive(item.href) ? "active" : ""}`}
            onClick={() => setMobileOpen(false)}
          >
            <item.icon size={18} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge ? (
              <span className="sidebar-badge">{item.badge}</span>
            ) : isActive(item.href) ? (
              <ChevronRight size={14} style={{ opacity: 0.7 }} />
            ) : null}
          </Link>
        ))}

        {/* Notifications */}
        <Link
          href={role === "EMPLOYEE" ? "/employee/notifications" : "/admin/notifications"}
          prefetch={true}
          onMouseEnter={() =>
            router.prefetch(
              role === "EMPLOYEE" ? "/employee/notifications" : "/admin/notifications"
            )
          }
          className={`sidebar-item ${
            isActive(`/${role === "EMPLOYEE" ? "employee" : "admin"}/notifications`)
              ? "active"
              : ""
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <Bell size={18} />
          <span style={{ flex: 1 }}>Notifications</span>
          {unreadNotifs > 0 && (
            <span className="sidebar-badge">{unreadNotifs > 9 ? "9+" : unreadNotifs}</span>
          )}
        </Link>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {employeeAvatar ? (
              <img src={employeeAvatar} alt={employeeName || "User"} />
            ) : (
              <span>
                {employeeName
                  ? employeeName.charAt(0).toUpperCase()
                  : role.charAt(0)}
              </span>
            )}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">
              {employeeName || role}
            </span>
            <span className="sidebar-user-role">
              {role === "ADMIN" ? "Administrator" : role === "HR" ? "HR Officer" : "Employee"}
            </span>
          </div>
        </div>

        <button
          className="sidebar-item sidebar-logout"
          onClick={handleLogout}
          disabled={loggingOut}
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer" }}
        >
          <LogOut size={18} />
          <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="mobile-sidebar-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <SidebarContent />
      </aside>

      <style jsx>{`
        .sidebar-badge {
          background: rgb(var(--accent));
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.1rem 0.4rem;
          border-radius: 9999px;
          min-width: 18px;
          text-align: center;
        }

        .sidebar-footer {
          padding: 0.75rem;
          border-top: 1px solid rgb(255 255 255 / 0.08);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.875rem;
          border-radius: var(--radius-sm);
        }

        .sidebar-avatar {
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          background: rgb(var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          color: white;
          flex-shrink: 0;
          overflow: hidden;
        }

        .sidebar-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sidebar-user-info {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          min-width: 0;
        }

        .sidebar-user-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: rgb(var(--text-sidebar-active));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-user-role {
          font-size: 0.7rem;
          color: rgb(var(--text-sidebar));
          white-space: nowrap;
        }

        .sidebar-logout {
          color: rgb(var(--danger)) !important;
          opacity: 0.8;
          text-align: left;
        }

        .sidebar-logout:hover {
          background: rgb(var(--danger) / 0.15) !important;
          color: rgb(var(--danger)) !important;
          opacity: 1;
        }

        .mobile-sidebar-toggle {
          display: none;
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 60;
          background: rgb(var(--accent));
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          padding: 0.5rem;
          cursor: pointer;
          box-shadow: var(--shadow-md);
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgb(0 0 0 / 0.5);
          z-index: 45;
          backdrop-filter: blur(2px);
        }

        @media (max-width: 768px) {
          .mobile-sidebar-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .sidebar-overlay {
            display: block;
          }
        }
      `}</style>
    </>
  );
}
