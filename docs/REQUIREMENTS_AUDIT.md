# Challenge brief audit

This review compares the application to `NeoStats_Hackathon_Challenge (1).pdf`.

| Brief requirement | Status | Evidence |
|---|---|---|
| Separate Next.js frontend and Express API | Complete | `frontend/` and `backend/` workspaces with separate dev scripts. |
| PostgreSQL, reproducible schema, seed data | Partial | The configured database reports all three migrations applied and schema up to date, and the seed command completed. The two original init migration directories both contain full-schema DDL, so a clean-database migration run still needs to be resolved without rewriting applied history. |
| Login, server authorization, four roles | Complete | HttpOnly signed cookie, active-account check, role and membership middleware. |
| User CRUD/deactivation | Complete | Admin user list/create/update endpoints and UI create, edit, role change, deactivate and reactivate controls. |
| Project CRUD/archive and manager assignment | Complete | Create/update/archive/delete endpoints plus manager data model. |
| Team add/remove/change project role | Complete | Protected API plus Team page, eligible-user selector and role editor. |
| Task CRUD, assignment, status updates | Complete | Protected API, version checks, board and task detail view. |
| Comments CRUD | Complete | API, task-detail comment UI and viewer write restriction. |
| Real-time synchronization | Complete in code; unverified live | Authenticated Socket.IO project/user rooms and frontend query invalidation hooks. |
| Conflict protection | Complete | Task `version`, atomic `updateMany({id, version})`, and 409 response. |
| Activity and notifications | Complete | Persisted records/endpoints, project activity screen, notification center, assignment/membership events. |
| Tests and local verification | Partial | Type checks, production builds, Prisma schema validation, migration status, seed, three request-validation unit tests, and a live login/identity/non-admin-403 smoke check pass. Automated database-backed CRUD/conflict and two-session WebSocket tests are not yet present. |

## Demo checklist

1. Start PostgreSQL, migrate and seed as documented in the README.
2. Sign in as Admin and create a user/project; assign the manager.
3. Sign in as Manager in a second browser profile, add a member and create/assign a task.
4. Sign in as the Team Member, update the assigned task and add a comment.
5. Show the Viewer can read but receives `403` for write requests.
6. Demonstrate a stale task update using the older task version and show the `409 VERSION_CONFLICT` response.
