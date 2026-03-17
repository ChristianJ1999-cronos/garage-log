# Garage Log

A full-stack realtime task board for tracking JDM car builds. Each build has its own Kanban workspace where tasks move through build tasks and broadcast instantly to every connected client via WebSockets. The mission is to be able to see where in the process your car currently is in while in the shop in real time.

> 🚧 Actively in development — core features are live, more incoming.

---

## Features

- **Realtime Kanban board** — Socket.IO room-based broadcasting. Task creation and status changes appear instantly across all connected clients viewing the same build

- **Cascading vehicle selector** — Make and model dropdowns powered by the NHTSA Vehicle API, filtered to JDM brands

- **Severity-colored task cards** — Info (blue), Warn (amber), Critical (red) for instant visual prioritization

- **Server components + client hydration** — Build list and detail pages use Next.js server components for fast initial load, with client-side Socket.IO for live updates

- **Relational data model** — Builds and tasks with cascading deletes and composite indexes optimized for filtered queries

---

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend:  Node.js, Express, TypeScript, Socket.IO
- Database: PostgreSQL, Prisma ORM
- Infrastructure:   Docker Compose, pnpm workspace

---

## Local Setup

**Prerequisites:** Node.js, pnpm, Docker
```bash
# Clone and install
git clone https://github.com/ChristianJ1999-cronos/garage-log.git
cd garage-log
pnpm install

# to start PostgreSQL
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

Frontend → `http://localhost:3000`  
API → `http://localhost:4000`

---

## Roadmap

- [x] Realtime Kanban board with Socket.IO
- [x] Severity-colored task cards
- [x] JDM-themed dark UI
- [x] Cascading make/model vehicle selector
- [ ] Mechanic assignment per task
- [ ] Task editing and deletion
- [ ] Build deletion
- [ ] Progress bar per build
- [ ] Archive tasks
- [ ] Deploy to Vercel + Render + Neon