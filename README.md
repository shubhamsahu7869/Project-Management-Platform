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

By default, the frontend runs on `http://localhost:3000`; if that port is already occupied, Next.js will automatically switch to the next available port such as `3001` or `3002`. The backend CORS config accepts those local ports so the app continues to work. API health is at `http://localhost:4000/api/health`.

## Deploy to Vercel and Render

The frontend and API are separate services. Connect this repository to Render using the root `render.yaml` Blueprint to create the API. Set `DATABASE_URL` to a PostgreSQL connection string and `FRONTEND_URL` to the exact HTTPS origin of the deployed frontend (no trailing slash). Render generates `JWT_SECRET`; do not use the demo secret in production. The API runs Prisma migrations during startup and reports health at `/api/health`.

In Vercel, import the same repository and set the project Root Directory to `frontend`. Add these Production environment variables, substituting the deployed Render API origin:

```text
NEXT_PUBLIC_API_URL=https://<render-api-host>/api
NEXT_PUBLIC_SOCKET_URL=https://<render-api-host>
```

After the first Vercel deployment, add its exact origin (for example, `https://<vercel-project>.vercel.app`) to Render's `FRONTEND_URL`, then redeploy the API. If using custom domains, use frontend and API subdomains of the same domain where possible so browser cookie policies treat them as same-site. The session cookie is Secure and cross-site-enabled in production; browsers that block third-party cookies may require same-site custom domains.

For a new database, create PostgreSQL in your hosting provider and set its connection string as Render's `DATABASE_URL`. To bootstrap the first production administrator, set `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_NAME`, and a strong `INITIAL_ADMIN_PASSWORD` (at least 12 characters) in Render. The startup command hashes the password and creates the administrator without changing an existing account. Remove the bootstrap variables from Render after the first successful startup. Production login does not display or prefill the local demo credentials. Never seed public demo accounts into production.

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
