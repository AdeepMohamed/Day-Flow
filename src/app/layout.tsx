// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PeopleOS — The Operating System for Your People",
    template: "%s | PeopleOS",
  },
  description:
    "PeopleOS is a modern HR management platform for digitizing employee onboarding, attendance, leave management, and payroll — built for teams that care about their people.",
  keywords: [
    "HRMS",
    "HR management",
    "employee management",
    "attendance",
    "leave management",
    "payroll",
    "PeopleOS",
  ],
  authors: [{ name: "PeopleOS" }],
  openGraph: {
    title: "PeopleOS — The Operating System for Your People",
    description:
      "Modern HR management platform. Attendance, leave, payroll, and more.",
    type: "website",
    locale: "en_US",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: false, // Keep private for hackathon
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4F46E5" },
    { media: "(prefers-color-scheme: dark)", color: "#6366F1" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <ThemeScript />
      </head>
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
