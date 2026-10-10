/**
 * @openapi
 * tags:
 *   - name: Health
 *   - name: Authentication
 *   - name: Dashboard
 *   - name: Users
 *   - name: Projects
 *   - name: Tasks
 *   - name: Comments
 *   - name: Activity
 *   - name: Notifications
 *   - name: Profile
 * paths:
 *   /health:
 *     get:
 *       tags: [Health]
 *       summary: Check API health
 *       security: []
 *       responses:
 *         '200':
 *           description: API is running
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status: { type: string, example: ok }
 *                   service: { type: string, example: neostats-api }
 *   /auth/login:
 *     post:
 *       tags: [Authentication]
 *       summary: Sign in and set the session cookie
 *       security: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [email, password]
 *               properties:
 *                 email: { type: string, format: email }
 *                 password: { type: string, minLength: 1 }
 *       responses:
 *         '200':
 *           description: Authenticated user and HTTP-only session cookie
 *           headers:
 *             Set-Cookie:
 *               schema: { type: string }
 *               description: neostats_session cookie
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: object
 *                     properties:
 *                       user: { $ref: '#/components/schemas/User' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *         '401': { description: Invalid credentials }
 *         '429': { description: Login rate limit exceeded }
 *   /auth/logout:
 *     post:
 *       tags: [Authentication]
 *       summary: Clear the session cookie
 *       security: []
 *       responses:
 *         '204': { description: Session cookie cleared }
 *   /auth/me:
 *     get:
 *       tags: [Authentication]
 *       summary: Get the authenticated user
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       responses:
 *         '200':
 *           description: Current user
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/User' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *   /dashboard/stats:
 *     get:
 *       tags: [Dashboard]
 *       summary: Get counts for projects visible to the authenticated user
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       responses:
 *         '200':
 *           description: Workspace statistics
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: object
 *                     properties:
 *                       projects: { type: integer }
 *                       tasks: { type: integer }
 *                       completedTasks: { type: integer }
 *                       unreadNotifications: { type: integer }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *   /users:
 *     get:
 *       tags: [Users]
 *       summary: List users (administrator only)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Page' }
 *         - { $ref: '#/components/parameters/Limit' }
 *         - { name: search, in: query, schema: { type: string } }
 *         - { name: role, in: query, schema: { $ref: '#/components/schemas/SystemRole' } }
 *         - { name: isActive, in: query, schema: { type: boolean } }
 *       responses:
 *         '200':
 *           description: Paginated safe user records
 *           content:
 *             application/json:
 *               schema: { $ref: '#/components/schemas/PaginatedUsers' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *     post:
 *       tags: [Users]
 *       summary: Create a user (administrator only)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserCreate' }
 *       responses:
 *         '201':
 *           description: Created safe user record
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/User' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '409': { description: Email already exists }
 *   /users/{id}:
 *     patch:
 *       tags: [Users]
 *       summary: Update a user's name, email, or system role (administrator only)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserUpdate' }
 *       responses:
 *         '200':
 *           description: Updated safe user record
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/User' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *   /projects:
 *     get:
 *       tags: [Projects]
 *       summary: List projects accessible to the authenticated user
 *       description: Sorted by updatedAt descending; results are access-filtered.
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Page' }
 *         - { $ref: '#/components/parameters/Limit' }
 *         - { name: search, in: query, schema: { type: string } }
 *         - { name: status, in: query, schema: { type: string, enum: [PLANNING, ACTIVE, ON_HOLD, COMPLETED] } }
 *       responses:
 *         '200':
 *           description: Paginated project records
 *           content:
 *             application/json:
 *               schema: { $ref: '#/components/schemas/PaginatedProjects' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *     post:
 *       tags: [Projects]
 *       summary: Create a project (administrator only)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProjectCreate' }
 *       responses:
 *         '201':
 *           description: Created project
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/Project' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *   /projects/{id}:
 *     get:
 *       tags: [Projects]
 *       summary: Get a project
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       responses:
 *         '200':
 *           description: Project visible to the authenticated user
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/Project' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *     patch:
 *       tags: [Projects]
 *       summary: Update a project (administrator or project manager)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProjectUpdate' }
 *       responses:
 *         '200':
 *           description: Updated project
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/Project' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *     delete:
 *       tags: [Projects]
 *       summary: Delete a project (administrator only)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       responses:
 *         '204': { description: Project deleted }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *   /projects/{id}/archive:
 *     post:
 *       tags: [Projects]
 *       summary: Archive a project (administrator or project manager)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       responses:
 *         '200':
 *           description: Archived project
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/Project' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *   /projects/{id}/members:
 *     get:
 *       tags: [Projects]
 *       summary: List project members
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       responses:
 *         '200':
 *           description: Project members with safe user records
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: array
 *                     items: { $ref: '#/components/schemas/ProjectMember' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *     post:
 *       tags: [Projects]
 *       summary: Add a project member (project manager only)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [userId]
 *               properties:
 *                 userId: { type: string, description: CUID of an active user }
 *                 projectRole: { type: string, enum: [MANAGER, MEMBER, VIEWER], default: MEMBER }
 *       responses:
 *         '201':
 *           description: Added project member
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/ProjectMember' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '409': { description: User is already a member }
 *   /projects/{id}/eligible-users:
 *     get:
 *       tags: [Projects]
 *       summary: List active users eligible to join a project (administrator or project manager)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *         - { name: search, in: query, schema: { type: string } }
 *       responses:
 *         '200':
 *           description: Up to 30 active users not already in the project
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: array
 *                     items: { $ref: '#/components/schemas/User' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *   /projects/{id}/members/{userId}:
 *     patch:
 *       tags: [Projects]
 *       summary: Change a project member role (administrator or project manager)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *         - { name: userId, in: path, required: true, schema: { type: string } }
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [projectRole]
 *               properties:
 *                 projectRole: { type: string, enum: [MANAGER, MEMBER, VIEWER] }
 *       responses:
 *         '200':
 *           description: Updated project member
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/ProjectMember' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *     delete:
 *       tags: [Projects]
 *       summary: Remove a project member (administrator or project manager)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *         - { name: userId, in: path, required: true, schema: { type: string } }
 *       responses:
 *         '204': { description: Member removed }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *   /projects/{id}/activity:
 *     get:
 *       tags: [Activity]
 *       summary: Get the latest 100 activity records for a project
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       responses:
 *         '200':
 *           description: Project activity records
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { type: array, items: { $ref: '#/components/schemas/Activity' } }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *   /tasks:
 *     get:
 *       tags: [Tasks]
 *       summary: List tasks in projects accessible to the authenticated user
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Page' }
 *         - { $ref: '#/components/parameters/Limit' }
 *         - { name: projectId, in: query, schema: { type: string } }
 *         - { name: status, in: query, schema: { type: string, enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE] } }
 *         - { name: priority, in: query, schema: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] } }
 *         - { name: search, in: query, schema: { type: string } }
 *       responses:
 *         '200':
 *           description: Paginated task records
 *           content:
 *             application/json:
 *               schema: { $ref: '#/components/schemas/PaginatedTasks' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *     post:
 *       tags: [Tasks]
 *       summary: Create a task (administrator or project manager)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TaskCreate' }
 *       responses:
 *         '201':
 *           description: Created task
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/Task' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *   /tasks/{id}:
 *     get:
 *       tags: [Tasks]
 *       summary: Get a task
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       responses:
 *         '200':
 *           description: Task visible to the authenticated user
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/Task' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *     patch:
 *       tags: [Tasks]
 *       summary: Update a task using optimistic version checking
 *       description: Project managers can update project tasks; team members can update assigned tasks. Assignment changes require project-management permission.
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TaskUpdate' }
 *       responses:
 *         '200':
 *           description: Updated task
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/Task' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *         '409': { description: Task version conflict }
 *     delete:
 *       tags: [Tasks]
 *       summary: Delete a task (administrator or project manager)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       responses:
 *         '204': { description: Task deleted }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *   /tasks/{id}/comments:
 *     get:
 *       tags: [Comments]
 *       summary: List comments for a task
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       responses:
 *         '200':
 *           description: Comments in chronological order
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { type: array, items: { $ref: '#/components/schemas/Comment' } }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *     post:
 *       tags: [Comments]
 *       summary: Add a comment (viewers cannot comment)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [content]
 *               properties:
 *                 content: { type: string, minLength: 1, maxLength: 5000 }
 *       responses:
 *         '201':
 *           description: Created comment
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/Comment' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *   /comments/{id}:
 *     delete:
 *       tags: [Comments]
 *       summary: Delete a comment (author or project manager)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       responses:
 *         '204': { description: Comment deleted }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *   /activity:
 *     get:
 *       tags: [Activity]
 *       summary: Get the latest 100 workspace activity records (administrator only)
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       responses:
 *         '200':
 *           description: Activity records
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { type: array, items: { $ref: '#/components/schemas/Activity' } }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '403': { $ref: '#/components/responses/Forbidden' }
 *   /notifications:
 *     get:
 *       tags: [Notifications]
 *       summary: List the authenticated user's latest 100 notifications
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       responses:
 *         '200':
 *           description: Notifications and unread count
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { type: array, items: { $ref: '#/components/schemas/Notification' } }
 *                   unreadCount: { type: integer }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *   /notifications/{id}/read:
 *     patch:
 *       tags: [Notifications]
 *       summary: Mark a notification as read
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       parameters:
 *         - { $ref: '#/components/parameters/Id' }
 *       responses:
 *         '200':
 *           description: Notification read state
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       read: { type: boolean, example: true }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *         '404': { $ref: '#/components/responses/NotFound' }
 *   /notifications/read-all:
 *     patch:
 *       tags: [Notifications]
 *       summary: Mark all of the authenticated user's unread notifications as read
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       responses:
 *         '204': { description: Unread notifications marked as read }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *   /profile:
 *     get:
 *       tags: [Profile]
 *       summary: Get the authenticated user's profile
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       responses:
 *         '200':
 *           description: Safe user profile
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/User' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 *     patch:
 *       tags: [Profile]
 *       summary: Update the authenticated user's profile
 *       security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProfileUpdate' }
 *       responses:
 *         '200':
 *           description: Updated safe user profile
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data: { $ref: '#/components/schemas/User' }
 *         '400': { $ref: '#/components/responses/ValidationError' }
 *         '401': { $ref: '#/components/responses/Unauthorized' }
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: neostats_session
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   parameters:
 *     Id:
 *       name: id
 *       in: path
 *       required: true
 *       schema: { type: string, description: CUID }
 *     Page:
 *       name: page
 *       in: query
 *       schema: { type: integer, minimum: 1, default: 1 }
 *     Limit:
 *       name: limit
 *       in: query
 *       schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *   responses:
 *     ValidationError:
 *       description: Request validation failed
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Error' }
 *     Unauthorized:
 *       description: Authentication required or session invalid
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Error' }
 *     Forbidden:
 *       description: Insufficient permission
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Error' }
 *     NotFound:
 *       description: Resource not found or not accessible
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Error' }
 *   schemas:
 *     SystemRole:
 *       type: string
 *       enum: [ADMIN, PROJECT_MANAGER, TEAM_MEMBER, VIEWER]
 *     User:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         name: { type: string }
 *         email: { type: string, format: email }
 *         role: { $ref: '#/components/schemas/SystemRole' }
 *         avatarUrl: { type: string, nullable: true }
 *         isActive: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     UserCreate:
 *       type: object
 *       required: [name, email, password, role]
 *       properties:
 *         name: { type: string, minLength: 2, maxLength: 100 }
 *         email: { type: string, format: email }
 *         password: { type: string, minLength: 10, maxLength: 128 }
 *         role: { $ref: '#/components/schemas/SystemRole' }
 *     UserUpdate:
 *       type: object
 *       properties:
 *         name: { type: string, minLength: 2, maxLength: 100 }
 *         email: { type: string, format: email }
 *         role: { $ref: '#/components/schemas/SystemRole' }
 *     Project:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         name: { type: string }
 *         description: { type: string }
 *         status: { type: string, enum: [PLANNING, ACTIVE, ON_HOLD, COMPLETED, ARCHIVED] }
 *         manager: { allOf: [{ $ref: '#/components/schemas/User' }], nullable: true }
 *         members: { type: array, items: { $ref: '#/components/schemas/ProjectMember' } }
 *         dueDate: { type: string, format: date-time, nullable: true }
 *     ProjectMember:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         projectRole: { type: string, enum: [MANAGER, MEMBER, VIEWER] }
 *         user: { $ref: '#/components/schemas/User' }
 *     ProjectCreate:
 *       type: object
 *       required: [name]
 *       properties:
 *         name: { type: string, minLength: 2, maxLength: 150 }
 *         description: { type: string, maxLength: 5000, default: "" }
 *         managerId: { type: string, nullable: true }
 *         status: { type: string, enum: [PLANNING, ACTIVE, ON_HOLD, COMPLETED], default: PLANNING }
 *         startDate: { type: string, format: date-time }
 *         dueDate: { type: string, format: date-time }
 *     ProjectUpdate:
 *       type: object
 *       properties:
 *         name: { type: string, minLength: 2, maxLength: 150 }
 *         description: { type: string, maxLength: 5000 }
 *         managerId: { type: string, nullable: true }
 *         status: { type: string, enum: [PLANNING, ACTIVE, ON_HOLD, COMPLETED] }
 *         startDate: { type: string, format: date-time, nullable: true }
 *         dueDate: { type: string, format: date-time, nullable: true }
 *     Task:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         projectId: { type: string }
 *         title: { type: string }
 *         description: { type: string }
 *         status: { type: string, enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE] }
 *         priority: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *         version: { type: integer }
 *         assignee: { allOf: [{ $ref: '#/components/schemas/User' }], nullable: true }
 *         createdBy: { $ref: '#/components/schemas/User' }
 *         project:
 *           type: object
 *           properties:
 *             id: { type: string }
 *             name: { type: string }
 *             status: { type: string }
 *     TaskCreate:
 *       type: object
 *       required: [projectId, title]
 *       properties:
 *         projectId: { type: string, description: CUID }
 *         title: { type: string, minLength: 2, maxLength: 200 }
 *         description: { type: string, maxLength: 10000, default: "" }
 *         status: { type: string, enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE], default: TODO }
 *         priority: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT], default: MEDIUM }
 *         assigneeId: { type: string, nullable: true }
 *         dueDate: { type: string, format: date-time, nullable: true }
 *     TaskUpdate:
 *       type: object
 *       required: [version]
 *       properties:
 *         title: { type: string, minLength: 2, maxLength: 200 }
 *         description: { type: string, maxLength: 10000 }
 *         status: { type: string, enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE] }
 *         priority: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *         assigneeId: { type: string, nullable: true }
 *         dueDate: { type: string, format: date-time, nullable: true }
 *         version: { type: integer, minimum: 1 }
 *     Comment:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         taskId: { type: string }
 *         content: { type: string }
 *         user: { $ref: '#/components/schemas/User' }
 *         createdAt: { type: string, format: date-time }
 *     Activity:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         action: { type: string }
 *         entityType: { type: string }
 *         entityId: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         actor: { $ref: '#/components/schemas/User' }
 *     Notification:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         type: { type: string }
 *         title: { type: string }
 *         message: { type: string }
 *         readAt: { type: string, format: date-time, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *     ProfileUpdate:
 *       type: object
 *       properties:
 *         name: { type: string, minLength: 2, maxLength: 100 }
 *         avatarUrl: { type: string, format: uri, nullable: true }
 *     Pagination:
 *       type: object
 *       properties:
 *         page: { type: integer }
 *         limit: { type: integer }
 *         total: { type: integer }
 *         pages: { type: integer }
 *     PaginatedUsers:
 *       type: object
 *       properties:
 *         data: { type: array, items: { $ref: '#/components/schemas/User' } }
 *         pagination: { $ref: '#/components/schemas/Pagination' }
 *     PaginatedProjects:
 *       type: object
 *       properties:
 *         data: { type: array, items: { $ref: '#/components/schemas/Project' } }
 *         pagination: { $ref: '#/components/schemas/Pagination' }
 *     PaginatedTasks:
 *       type: object
 *       properties:
 *         data: { type: array, items: { $ref: '#/components/schemas/Task' } }
 *         pagination: { $ref: '#/components/schemas/Pagination' }
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code: { type: string }
 *             message: { type: string }
 *             details: { type: object }
 */
import swaggerJsdoc from "swagger-jsdoc";
import { fileURLToPath } from "node:url";

export const openApiDocument = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "NeoStats API",
      version: "1.0.0",
      description: "Documentation for the existing NeoStats Express API."
    },
    servers: [{ url: "/api", description: "NeoStats API" }]
  },
  apis: [fileURLToPath(import.meta.url)]
});
