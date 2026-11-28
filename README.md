# SmartDesk – IT Help Desk & Ticket Management System

A centralized web platform for **reporting, assigning, tracking and resolving IT support requests**.
*One ticket · One owner · Full visibility.*

| Layer     | Technology                          | Folder       |
|-----------|-------------------------------------|--------------|
| Frontend  | Next.js 15 (React 19, JavaScript)   | `frontend/`  |
| Backend   | Java 17 + Spring Boot 3.3 (REST)    | `backend/`   |
| Security  | Spring Security + JWT + BCrypt      | `backend/…/security` |
| Database  | MySQL 8                             | `database/`  |

```
Browser ──► Next.js (port 3000) ──HTTPS/JSON──► Spring Boot REST API (port 8080) ──► MySQL (port 3306)
```

Team: Dunya (frontend – user side) · Nirasha (frontend – technician/admin) · Yusuf (backend – tickets) ·
Chamodya (backend – auth & security) · Oshani (database).

---

## 1. Quick start

### Requirements

- Node.js 18.18+ (20 or 22 LTS recommended)
- JDK 17+ (tested with Java 21)
- Maven 3.9+
- MySQL 8
### Step 1 – Database (Oshani)
Option A – your own MySQL:
```sql
-- in MySQL Workbench or the mysql CLI
SOURCE database/schema.sql;
-- optional: SOURCE database/seed.sql;   (the backend also seeds demo data automatically)
```
Option B – Docker: `docker compose up -d` (starts MySQL 8 with user `root` / password `root` and database `smartdesk`).

### Step 2 – Backend (Yusuf, Chamodya)
```bash
cd backend
# default connection: jdbc:mysql://localhost:3306/smartdesk  user=root  password=root
# change it with environment variables if your password is different:
#   Windows (PowerShell):  $env:DB_PASSWORD="yourpassword"
#   macOS/Linux:           export DB_PASSWORD=yourpassword
mvn spring-boot:run
```
No MySQL yet? Run with the in-memory database instead:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```
Check it works: <http://localhost:8080/api/health> → `{"status":"UP"}`

On the first start with an empty database the backend inserts demo users, categories and tickets.

### Step 3 – Frontend (Dunya, Nirasha)
```bash
cd frontend
npm install
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:8080
npm run dev
```
Open <http://localhost:3000>.

### Demo accounts (password for all: `Password123!`)
| Role          | Email                     |
|---------------|---------------------------|
| Administrator | `admin@smartdesk.local`   |
| Technician    | `tech1@smartdesk.local`, `tech2@smartdesk.local` |
| User          | `user1@smartdesk.local`, `user2@smartdesk.local` |

The login page has buttons that fill these in for you.

---

## 2. Features

**Users (students / employees)**
* Register, log in, edit profile, change password
* Create tickets with title, description, category and priority
* *My Tickets* list with search and filters, ticket details page
* Conversation with the technician (comments)
* Confirm & close a resolved ticket, or re-open it

**IT technicians**
* Dashboard: my active tickets, urgent count, unassigned queue
* "Take ticket" from the unassigned queue
* Change status (Open → In progress → On hold → Resolved → Closed) and priority
* Record the final resolution (required to resolve)
* Public replies and **internal notes** hidden from the user

**Administrators**
* Statistics dashboard: totals, by status / priority / category, average resolution time, technician workload
* Assign / re-assign / unassign tickets to technicians
* User management: create technician/admin accounts, change roles, activate/deactivate, reset password
* Category management
* Delete tickets

**Everywhere:** full ticket history (audit trail), role-based access control on every endpoint, server and client
validation, responsive layout (works on phones).

---

## 3. Project structure

```
smartdesk/
├── backend/                         Spring Boot REST API
│   ├── pom.xml
│   └── src/main/java/com/smartdesk/
│       ├── model/                   JPA entities: User, Ticket, Category, Comment, TicketHistory + enums
│       ├── repository/              Spring Data repositories
│       ├── dto/                     Request/response records
│       ├── service/                 Business logic & permission rules (TicketService is the heart)
│       ├── controller/              REST endpoints
│       ├── security/                JWT, filter, SecurityConfig (roles, CORS)
│       ├── exception/               Consistent JSON error responses
│       └── config/DataSeeder.java   Demo data
│   └── src/test/…                   Integration tests (H2) for the whole workflow
├── frontend/                        Next.js app
│   ├── app/login, app/register
│   ├── app/(app)/dashboard          Role-based dashboards (user / technician / admin)
│   ├── app/(app)/tickets            List, create, details
│   ├── app/(app)/admin              Users & categories
│   ├── components/                  AppShell (sidebar), TicketTable, badges…
│   └── lib/api.js, lib/auth.js      API client + login state
├── database/                        schema.sql, seed.sql, test-queries.sql
├── docs/                            API, ER diagram, team plan, test plan, deployment
├── postman/                         Postman collection for API testing (Day 6)
└── docker-compose.yml               MySQL for local development
```

---

## 4. Documentation
* [docs/API.md](docs/API.md) – every endpoint with examples
* [docs/DATABASE.md](docs/DATABASE.md) – ER diagram and table descriptions
* [docs/TEAM-PLAN.md](docs/TEAM-PLAN.md) – the 12-day plan mapped to the code each member owns
* [docs/TEST-PLAN.md](docs/TEST-PLAN.md) – Day 6/7/9 test scenarios and checklist
* [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) – Day 11 production deployment (Render / Azure / AWS)
* [docs/DEMO-SCRIPT.md](docs/DEMO-SCRIPT.md) – Day 12 demonstration walkthrough

## 5. Running the tests
```bash
cd backend && mvn test          # end-to-end API tests on an in-memory database
cd frontend && npm run build    # checks that every page compiles
```
Import `postman/SmartDesk.postman_collection.json` into Postman for manual API testing.

## 6. Troubleshooting
| Problem | Fix |
|---|---|
| Frontend says *"Cannot reach the server"* | Backend not running, or `NEXT_PUBLIC_API_URL` wrong. Restart `npm run dev` after editing `.env.local`. |
| `Access denied for user 'root'` | Set `DB_USERNAME` / `DB_PASSWORD` environment variables to your MySQL login. |
| CORS error in the browser console | Frontend runs on a different URL than `http://localhost:3000` → set `CORS_ORIGINS`. |
| `Communications link failure` | MySQL is not running / wrong port. |
| Demo users missing | Seeder only runs on an **empty** `users` table. Drop and recreate the database or run `database/seed.sql`. |
