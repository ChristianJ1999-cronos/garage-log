# Garage Log

A full-stack real-time task board built for tracking JDM car builds. Each build gets its own Kanban workspace where tasks move through stages and update instantly across every connected client via WebSockets. The idea came from wanting shop techs and owners to see exactly where a car is in the build process without needing to call or check in.

**Live:** [garage-log-web.vercel.app](https://garage-log-web.vercel.app)

---

## Features

**Real-time Kanban board** — Socket.IO room-based broadcasting pushes task creation, status changes, archives, and deletions to every connected client viewing the same build instantly.

**Progress tracking** — A progress bar calculates completion across all active tasks, giving in-progress tasks half credit toward the total.

**Cascading vehicle selector** — Make and model dropdowns are powered by the NHTSA Vehicle API, filtered down to JDM brands. Duplicate build combinations are blocked at the API level.

**Severity tags** — Seven color-coded severity levels (Info, Warning, Urgent, Parts, Tune, Inspection, Critical) for quick visual prioritization across the board.

**Archive system** — Tasks can be soft-deleted out of the active board while keeping the full history intact. Archived tasks can be restored at any time.

**CI/CD pipeline** — GitHub Actions SSHs into EC2 on every push to main, pulls the latest code, and restarts the API automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, Socket.IO |
| Database | PostgreSQL, Prisma ORM |
| Infrastructure | AWS EC2, Neon, Vercel, PM2, Nginx, Let's Encrypt |
| CI/CD | GitHub Actions |
| Monorepo | pnpm workspaces |

---

## Architecture
```
garage-log/
├── apps/
│   ├── web/     # Next.js frontend deployed on Vercel
│   └── api/     # Express + Socket.IO backend deployed on AWS EC2
└── pnpm-workspace.yaml
```

The frontend deploys automatically to Vercel on every push to main. The backend runs on an AWS EC2 t2.micro instance behind Nginx with SSL certificates from Let's Encrypt, kept alive by PM2. The database is hosted on Neon serverless PostgreSQL. GitHub Actions handles automated deployment to EC2 so no manual SSH is needed after a push.

---

## Local Setup

**Prerequisites:** Node.js, pnpm, Docker
```bash
# Clone and install
git clone https://github.com/ChristianJ1999-cronos/garage-log.git
cd garage-log
pnpm install

# Start PostgreSQL
pnpm db:up

# Environment variables

# apps/api/.env
DATABASE_URL="postgresql://garagelog:garagelog@localhost:5432/garagelog"

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000

# Run migrations
cd apps/api && pnpm prisma migrate dev && cd ../..

# Start API (terminal 1)
pnpm dev:api

# Start frontend (terminal 2)
pnpm dev:web
```

Frontend: `http://localhost:3000`  
API: `http://localhost:4000`

---

## What Was Built

- Real-time Kanban board with Socket.IO room-based broadcasting
- Severity-colored task cards with 7 tag types
- JDM-themed dark UI
- Cascading make and model vehicle selector via NHTSA API
- Build creation with duplicate prevention at the API level
- Build and task deletion with cascade handling
- Progress bar with half credit for in-progress tasks
- Archive and unarchive tasks with full history preserved
- Real-time task count display per build detail page
- Deployed to Vercel, AWS EC2, and Neon
- CI/CD with GitHub Actions auto-deploy to EC2
- HTTPS via Nginx reverse proxy with Let's Encrypt SSL