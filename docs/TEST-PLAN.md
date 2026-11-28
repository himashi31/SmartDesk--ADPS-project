# SmartDesk test plan (Day 6, 7 and 9)

Use **separate browsers or a private window per role** so you can be logged in as user, technician and admin at the same time.
Tick each box and note the result in your report.

## Automated tests
`cd backend && mvn test` runs `TicketWorkflowIntegrationTest`:
full lifecycle, data isolation between users, role restrictions, internal notes, registration & validation.

## Day 6 – first integration
- [ ] User logs in (`user1@smartdesk.local`)
- [ ] User creates a ticket → success message and ticket page
- [ ] Ticket is stored in MySQL: `SELECT * FROM tickets ORDER BY id DESC LIMIT 1;`
- [ ] Technician (`tech1@`) sees the ticket in **Unassigned Queue**

## Day 7 – complete workflow
- [ ] Technician sees the new ticket
- [ ] Administrator assigns it to Tom Technician (dashboard dropdown or ticket page)
- [ ] Tom sees it under **Assigned to Me**; changes status to *In progress*
- [ ] User refreshes → sees *In progress*
- [ ] Tom tries *Resolved* without resolution → error shown
- [ ] Tom resolves with a resolution text → user sees the Resolution box
- [ ] User clicks **Yes – close ticket** → status Closed
- [ ] History panel shows every step

## Day 9 – testing by focus area

### Dunya – user interface & user workflows
- [ ] Register a new account (validation: empty name, bad e-mail, short password, passwords not matching)
- [ ] Create ticket validation (title < 5 chars, description < 10 chars, no category)
- [ ] Search + status/priority/category filters on My Tickets
- [ ] Edit ticket while it is still open & unassigned; edit button disappears after assignment
- [ ] Add comment; internal notes from the technician are **not** visible
- [ ] Re-open a closed ticket
- [ ] Profile update and password change (wrong current password → error)
- [ ] Mobile view (browser dev tools, iPhone size): menu button, tables readable

### Nirasha – technician & administrator workflows
- [ ] Technician dashboard numbers match the lists
- [ ] "Take ticket" moves ticket from queue to Assigned to Me
- [ ] Technician cannot manage a ticket assigned to someone else (read & comment only)
- [ ] Internal note checkbox works (yellow note)
- [ ] Admin: statistics update after creating/resolving tickets
- [ ] Admin: create technician account → can log in → appears in assign dropdown
- [ ] Admin: change role, deactivate (deactivated user cannot log in), reset password
- [ ] Admin: add/edit/delete category (category in use → error message)
- [ ] Admin: delete ticket (confirmation dialog)

### Yusuf – ticket APIs & backend
- [ ] Every request in the Postman collection returns the expected status
- [ ] `GET /api/tickets?status=OPEN&priority=HIGH&q=laptop` filters correctly
- [ ] Invalid enum (`"status":"DONE"`) → 400
- [ ] Non-existent ticket → 404
- [ ] `resolvedAt` set on RESOLVED, cleared on re-open

### Chamodya – authentication & security
- [ ] No token → 401 on every `/api/tickets` call
- [ ] Expired/modified token → 401 and frontend returns to login
- [ ] USER → `/api/users`, `/api/stats`, `POST /api/categories` → 403
- [ ] USER2 opening USER1's ticket id → 404 (cannot even tell it exists)
- [ ] Register request with `"role":"ADMIN"` → still created as USER
- [ ] Passwords in DB are BCrypt hashes (`$2a$…`/`$2b$…`), never plain text
- [ ] Admin cannot remove own admin role or deactivate self
- [ ] CORS: calls from an origin not in `CORS_ORIGINS` are blocked

### Oshani – MySQL data consistency
- [ ] Run every query in `database/test-queries.sql`; integrity queries return 0 rows
- [ ] Deleting a ticket (admin) also removes its comments and history
- [ ] A user with tickets cannot be deleted (409) – only deactivated
- [ ] Data survives backend restart (MySQL mode, not H2)
- [ ] Backup with `mysqldump` and restore into a new database works

## Bug log template
| # | Found by | Steps to reproduce | Expected | Actual | Fixed by | Status |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
