# API reference

Base URL: `http://localhost:4000/api`. Authenticated requests use the `neostats_session` HttpOnly cookie. Successful JSON payloads are `{ "data": ... }`; errors are `{ "error": { "code", "message" } }`.

## Auth and dashboard

- `POST /auth/login` `{email,password}`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /dashboard/stats`

## Users (Admin)

- `GET /users?page=1&limit=20&search=&role=&isActive=`
- `POST /users` `{name,email,password,role}`
- `PATCH /users/:id` `{name?,email?,role?,isActive?}`

## Projects

- `GET /projects?page=1&limit=20&search=&status=` returns only accessible projects.
- `POST /projects` (Admin) `{name,description,status,managerId?,startDate?,dueDate?}`
- `GET/PATCH /projects/:id`
- `POST /projects/:id/archive`
- `GET/POST /projects/:id/members`; `PATCH/DELETE /projects/:id/members/:userId`
- `GET /projects/:id/eligible-users` lists active non-members for an authorized project manager.

## Tasks and comments

- `GET /tasks?projectId=&status=&priority=&search=&page=&limit=`
- `POST /tasks` `{projectId,title,description?,status?,priority?,assigneeId?,dueDate?}`
- `GET /tasks/:id`
- `PATCH /tasks/:id` includes mandatory current `{version}`. A stale version returns 409.
- `DELETE /tasks/:id`
- `GET/POST /tasks/:id/comments`; `DELETE /comments/:id`

## Activity, notifications and profile

- `GET /projects/:id/activity`; `GET /activity` (Admin)
- `GET /notifications`; `PATCH /notifications/:id/read`; `PATCH /notifications/read-all`
- `GET/PATCH /profile`

Pagination is `{page,limit,total,pages}`. Key error codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `DUPLICATE_RESOURCE`, `VERSION_CONFLICT`, `INTERNAL_SERVER_ERROR`.
