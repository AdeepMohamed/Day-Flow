# PeopleOS — The Operating System for Your People 🚀

> **Live Demo**: [https://day-flow-p4my-xi.vercel.app](https://day-flow-p4my-xi.vercel.app)

Modern HR management platform built for digitized employee onboarding, attendance tracking, leave management, payroll, workforce analytics, and instant AI HR assistance.

---

## 🌐 Live Deployment
- **Production URL**: [https://day-flow-p4my-xi.vercel.app](https://day-flow-p4my-xi.vercel.app)
- **Repository**: [https://github.com/AdeepMohamed/Day-Flow](https://github.com/AdeepMohamed/Day-Flow)

### 📋 Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| 👑 **Admin** | `admin@peopleos.com` | `Admin@123456` | Full HR command center, employee management, payroll, leave approvals, audit trail |
| 👔 **HR Officer** | `hr@peopleos.com` | `Hr@123456` | Workforce analytics, attendance management, leave reviews |
| 👤 **Employee** | `john.doe@peopleos.com` | `Employee@123456` | Self-service dashboard, attendance check-in/out, time-off requests, salary breakdown |

---

## ✨ Core Features

1. **HR Command Center & Real-time Analytics**
   - Headcount metrics, department distribution charts, leave balance breakdown, 7-day attendance trend visualization (`Recharts`).

2. **Employee Directory & Dynamic Salary Engine**
   - Dual Grid/Table views, employee profile modals, dynamic salary calculation (50% Basic, 50% HRA, PF deductions, allowances, net pay calculation).

3. **Attendance & Overtime Management**
   - Check-in/Check-out tracking, overtime calculation (+3h extra logging), half-day / leave status tracking.

4. **Leave Management & Approvals**
   - Multi-type leave requests (Paid, Sick, Unpaid) with auto-conflict detection, admin review & approval workflow.

5. **AI HR Assistant**
   - Floating AI assistant powered by Groq (`groq/compound-mini`) providing instant sub-150ms responses for HR policies, attendance rules, and leave guidelines.

6. **Security & Audit Logging**
   - Role-based Access Control (RBAC), HMAC SHA-256 zero-latency session tokens, and security audit logs tracking system mutations.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (Turbopack App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Vanilla CSS + Glassmorphism design system
- **Database**: [Neon PostgreSQL](https://neon.tech/) (Serverless Cloud Database)
- **ORM**: [Prisma v7](https://www.prisma.io/)
- **AI Engine**: Groq API (`groq/compound-mini`)
- **Hosting**: [Vercel](https://vercel.com/)

---

## 💻 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/AdeepMohamed/Day-Flow.git
cd Day-Flow

# 2. Install dependencies
npm install

# 3. Configure environment variables (.env)
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"
AUTH_SECRET="your-super-secret-auth-key"
GROQ_API_KEY="your-groq-api-key"

# 4. Generate Prisma client & seed database
npx prisma generate
npx tsx prisma/seed.ts

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view locally.
