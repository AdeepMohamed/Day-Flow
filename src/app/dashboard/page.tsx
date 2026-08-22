// src/app/dashboard/page.tsx
// Route handler for /dashboard — redirects based on user role

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardRedirectPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (session.role === "ADMIN" || session.role === "HR") {
    redirect("/admin/dashboard");
  }

  redirect("/employee/dashboard");
}
