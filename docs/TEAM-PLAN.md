# 12-day plan → where it lives in the code

Every task from the ADPS guide is implemented. Use this table so each member knows **which files are theirs**
to understand, explain in the demo, and keep improving.

## Ownership

| Member | Area | Files |
|---|---|---|
| **Dunya** | User-side frontend | `frontend/app/login`, `app/register`, `app/(app)/dashboard` (UserDashboard), `app/(app)/tickets/new`, `app/(app)/tickets/page.js`, `app/(app)/tickets/[id]`, `app/(app)/profile`, `lib/api.js`, `lib/auth.js`, `app/globals.css` |
| **Nirasha** | Technician & admin frontend | `components/AppShell.js` (navigation), `app/(app)/dashboard` (TechnicianDashboard, AdminDashboard), `app/(app)/admin/users`, `app/(app)/admin/categories`, ManagePanel in `tickets/[id]`, `components/TicketTable.js`, `components/ui.js` |
| **Yusuf** | Ticket API | `backend/.../model/Ticket*.java`, `Comment.java`, `Category.java`, `repository/Ticket*`, `service/TicketService.java`, `service/StatsService.java`, `service/CategoryService.java`, `controller/TicketController.java`, `controller/CategoryController.java`, `controller/StatsController.java`, `postman/` |
| **Chamodya** | Auth, roles & security | `backend/.../model/User.java`, `Role.java`, `security/*` (JWT, filter, SecurityConfig, CORS), `service/AuthService.java`, `service/UserService.java`, `controller/AuthController.java`, `controller/UserController.java`, `exception/*`, `application-prod.properties` |
| **Oshani** | Database | `database/schema.sql`, `seed.sql`, `test-queries.sql`, `docs/DATABASE.md`, `config/DataSeeder.java`, `docker-compose.yml`, datasource settings in `application.properties` |

## Day by day

| Day | Guide task | Status / where |
|---|---|---|
| 1 | User pages sketch (Dunya) | Implemented as real pages – see routes below |
| 1 | Technician/admin pages + navigation (Nirasha) | `AppShell.js` role-based sidebar |
| 1 | Ticket API endpoints (Yusuf) | `docs/API.md` |
| 1 | Login, roles, permissions (Chamodya) | `docs/API.md` "Who" column; rules in `TicketService` header comment |
| 1 | ER diagram & DB design (Oshani) | `docs/DATABASE.md` |
| 2 | Next.js project (Dunya / Nirasha) | `frontend/` – `npm install && npm run dev` |
| 2 | Spring Boot project (Yusuf / Chamodya) | `backend/` – `mvn spring-boot:run` |
| 2 | MySQL + smartdesk DB (Oshani) | `database/schema.sql` or `docker compose up -d` |
| 3 | Login page + user dashboard layout | `app/login`, `dashboard` |
| 3 | Technician/admin dashboard layouts | `dashboard/page.js` |
| 3 | Ticket entity/repository/service | `model/Ticket.java`, `TicketRepository`, `TicketService` |
| 3 | User entity/repository/auth structure | `model/User.java`, `UserRepository`, `security/` |
| 3 | All tables & relationships | `schema.sql` (+ JPA annotations create the same tables) |
| 4 | Login page + Create Ticket form | `app/login`, `tickets/new` (with validation) |
| 4 | Technician + admin dashboards | done |
| 4 | Ticket create & retrieve endpoints | `POST /api/tickets`, `GET /api/tickets/{id}` |
| 4 | Registration/login + password hashing | `AuthService` (BCrypt), `JwtService` |
| 4 | Sample users, roles, categories | `seed.sql` + `DataSeeder` |
| 5 | My Tickets + Ticket Details | `tickets/page.js`, `tickets/[id]` |
| 5 | All Tickets + Assigned Tickets | `tickets/page.js?scope=all / assigned / unassigned` |
| 5 | Assignment & status APIs | `PUT /assign`, `PUT /status`, `PUT /priority` |
| 5 | Roles & authorization rules | `SecurityConfig` + checks in `TicketService` |
| 5 | Verify relationships / DB operations | `test-queries.sql` |
| 6 | Connect pages to APIs | all pages use `lib/api.js` (no sample data) |
| 6 | Test APIs with Postman | `postman/SmartDesk.postman_collection.json` |
| 6 | Auth connected, role tests | `TicketWorkflowIntegrationTest.roleRestrictions` |
| 7 | Full workflow (create → assign → status → user sees it) | `TicketWorkflowIntegrationTest.fullTicketLifecycle`, `docs/TEST-PLAN.md` |
| 7 | Users cannot access other users' data | returns 404; test `usersCannotSeeOtherUsersTickets` |
| 8 | UI improvements & form validation | client validation on all forms + server `@Valid` |
| 8 | Admin dashboard & user management | `admin/users`, `admin/categories`, `/api/stats` |
| 8 | Backend validation & filtering | DTO annotations; `GET /api/tickets` filters + search |
| 8 | Admin permissions | `/api/users/**`, `/api/stats`, `/api/categories` writes = ADMIN |
| 9 | Full testing by role | `docs/TEST-PLAN.md` |
| 10 | Optional features | internal notes, ticket history, statistics, profile/password change, re-open/close, responsive mobile layout |
| 11 | Deployment & production config | `docs/DEPLOYMENT.md`, `application-prod.properties` |
| 12 | Demo, accounts, sample tickets | `docs/DEMO-SCRIPT.md`, demo accounts in README |

## Frontend routes
| Route | Who | Page |
|---|---|---|
| `/login`, `/register` | public | authentication |
| `/dashboard` | all | role-specific dashboard |
| `/tickets` | all | My Tickets (user) / All · Assigned · Unassigned (staff) with filters |
| `/tickets/new` | all | Create Ticket form |
| `/tickets/[id]` | owner, staff | details, conversation, history, actions |
| `/admin/users` | admin | user management |
| `/admin/categories` | admin | categories |
| `/profile` | all | profile & password |

## Ideas if you have time left (Day 10)
* Screenshot attachments on tickets (proposal mentions it): add an `attachments` table + `MultipartFile` upload endpoint.
* E-mail notifications on assignment/status change (`spring-boot-starter-mail`).
* Pagination for very large ticket lists (`Pageable`).
* SLA/due date per priority and an "overdue" badge.
