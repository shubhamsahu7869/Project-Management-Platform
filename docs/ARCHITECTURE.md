# Architecture

`frontend` and `backend` run as separate Node processes. The browser speaks REST to Express using credentialed requests and receives live events from Socket.IO. PostgreSQL is the source of truth through Prisma.

## Request flow

1. Login checks bcrypt password hashes and writes a signed, eight-hour, HttpOnly `neostats_session` cookie.
2. Express loads the current active user on every protected request.
3. Resource checks combine system role with project membership/manager checks; client-provided role or user IDs never determine authorization.
4. Mutations persist first in PostgreSQL, write activity/notifications where applicable, then emit to the authorized project or user socket room.

## Data relationships

`User` has system role and many `ProjectMember`, `Task`, `Comment`, `Notification`, `Activity` records. `ProjectMember` is unique on `(projectId,userId)`. A `Project` owns tasks and activity. A task has an integer `version` used by `updateMany({ id, version })` so stale task writes are rejected atomically.

Project deletion nulls the project reference on activity records rather than cascading the audit history away.

## Permission matrix

| Capability | Admin | Project Manager | Team Member | Viewer |
|---|---:|---:|---:|---:|
| System users | yes | no | no | no |
| Create projects | yes | no | no | no |
| Manage authorized project/team | yes | yes | no | no |
| Create/delete project task | yes | yes | no | no |
| Edit assigned task | yes | yes | yes | no |
| Comment on accessible task | yes | yes | yes | no |
| View accessible project | yes | yes | yes | yes |

## Socket rooms

- `user:<id>` carries private `notification:created` events.
- `project:<id>` carries task, comment and project-member events after a membership check during `project:join`.
