# NeoStats collaborative project management

NeoStats is a two-process project management platform for the engineering hackathon. It provides secure role-aware collaboration for projects, tasks, comments, notifications and activity.

## Stack

- Frontend: Next.js App Router, TypeScript strict mode, TanStack Query, React Hook Form, Zod, Socket.IO client-ready architecture, Lucide and Sonner.
- Backend: Express, TypeScript, Prisma/PostgreSQL, Socket.IO, Zod, bcrypt, signed HttpOnly JWT cookie, Helmet and rate limiting.

## Quick start

Prerequisites: Node.js 22+, npm, Docker Desktop (or PostgreSQL 14+).

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
docker compose up -d
npm.cmd install
npm.cmd --workspace backend run prisma:generate
npm.cmd --workspace backend run prisma:migrate -- --name init
npm.cmd --workspace backend run prisma:seed
npm.cmd run dev
```

Open `http://localhost:3000`; API health is at `http://localhost:4000/api/health`.

## Demo users

All use `DemoPass123!`:

| Role | Email |
|---|---|
| Admin | admin@neostats.local |
| Project Manager | manager@neostats.local |
| Team Member | member@neostats.local |
| Viewer | viewer@neostats.local |

## Commands

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run test
npm.cmd run lint
npm.cmd --workspace backend run prisma:migrate
npm.cmd --workspace backend run prisma:seed
```

## What is implemented

- Admin-managed users, projects, memberships and archive operations.
- Project-scoped task CRUD, assignment, filters, comments, activity, persistent notifications and notification read state.
- Four server-enforced roles: `ADMIN`, `PROJECT_MANAGER`, `TEAM_MEMBER`, `VIEWER`.
- Atomic task version checks. Updates include the displayed `version`; stale versions return `409 VERSION_CONFLICT`.
- Socket.IO authenticated user/project rooms and events emitted only after persistence.

See [architecture](docs/ARCHITECTURE.md), [API reference](docs/API.md), and [security notes](docs/SECURITY.md).

## Current UI scope

The interface covers sign-in, dashboard, accessible project boards, task details and comments, project teams and activity, notifications, profile, and administrator user creation, role changes, and activation controls. Project/task/team actions are shown to users authorized for those operations, and compact navigation remains available on mobile. Socket.IO invalidates the appropriate project and notification views as authorized events arrive.
