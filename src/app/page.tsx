// src/app/page.tsx
// Root redirect based on auth state

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (session.role === "ADMIN" || session.role === "HR") {
    redirect("/admin/dashboard");
  }

  redirect("/employee/dashboard");
}
