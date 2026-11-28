# Final demonstration script (Day 12) – about 10 minutes

**Before the demo:** start a fresh database so the demo data is clean (or restore the backup),
open three browser windows (normal, private, second browser) for User / Technician / Admin.

| # | Presenter | What to show | Say |
|---|---|---|---|
| 1 | Dunya | Proposal slide → login page | The problem: requests lost across email/phone/chat. SmartDesk = one ticket, one owner, full visibility. |
| 2 | Oshani | ER diagram (`docs/DATABASE.md`) + MySQL Workbench tables | 5 tables, relationships, audit trail, 3NF. |
| 3 | Chamodya | Login as **user1** | JWT login, BCrypt passwords, role-based access. Show 403/404 when a user tries the admin page or another ticket. |
| 4 | Dunya | User dashboard → **Create Ticket** ("Projector in room 101 not working", Hardware, High) | Validation, success message, ticket details page. |
| 5 | Nirasha | Login as **admin** → dashboard statistics → assign the new ticket to Tom | Workload table, unassigned list. |
| 6 | Nirasha | Login as **tech1** → Assigned to Me → open ticket → In progress, public comment + internal note | Technician queue & communication. |
| 7 | Dunya | User window → refresh → sees status + public comment (not the internal note) → replies | Transparency for the user. |
| 8 | Yusuf | Technician resolves with resolution text; show the Postman collection / API docs | REST endpoints, validation (try resolving without text). |
| 9 | Dunya | User closes the ticket → History timeline | Full lifecycle REPORT → TRIAGE → ASSIGN → RESOLVE → CLOSE. |
| 10 | Oshani | `test-queries.sql` → the ticket and its history in MySQL | Data persistence & integrity. |
| 11 | Chamodya | Admin → Users: create technician, deactivate user | Administration & security. |
| 12 | All | Phone-size view, deployment URL, what we would add next | Attachments, e-mail notifications, SLA. |

**Backup plan:** if the deployed version fails, run locally with `mvn spring-boot:run -Dspring-boot.run.profiles=h2`
(no database needed) and `npm run dev`. Keep screenshots of every page in the report as a last resort.

## Screenshots to prepare for the documentation
Login · Register · User dashboard · Create ticket · My tickets · Ticket details (user) · Technician dashboard ·
Ticket details (technician with internal note) · Admin dashboard · All tickets with filters · User management ·
Categories · Mobile view · Postman requests · MySQL tables · ER diagram.
