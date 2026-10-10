# Security model

- Passwords are bcrypt-hashed (cost 12) and never returned by the API.
- A signed JWT lives only in an HttpOnly, SameSite=Lax cookie. It expires after eight hours, and every request re-checks that the account is active.
- Production cookies are marked `Secure`; CORS has one explicit frontend origin and credentials enabled.
- Helmet provides defensive response headers. Login is limited to ten attempts per 15-minute window, and JSON payloads are limited to 200 KB.
- Zod validates all mutation payloads. Prisma is used for parameterized database access and only validated fields are written.
- Authorization is implemented in the backend. Project resources use membership/manager checks; Socket.IO uses the same user identity and validates project room joins.
- Task updates use an atomic id-and-version condition, preventing lost updates.

## Operational notes

Set a random 32+ character `JWT_SECRET` for every production deployment. Serve frontend/backend over HTTPS in production. The current cookie model is appropriate for the same-site local deployment; if frontend and API are moved to unrelated sites, add a synchronizer-token CSRF defense and use `SameSite=None; Secure`.
