# SmartDesk REST API

Base URL (local): `http://localhost:8080`
All requests and responses are JSON. Except for `login`, `register` and `health`, every request needs the header

```
Authorization: Bearer <token from /api/auth/login>
```

Errors always look like:
```json
{ "status": 400, "error": "Bad Request", "message": "Validation failed",
  "fields": { "email": "Email is not valid" }, "timestamp": "2026-11-27T15:00:00" }
```
Status codes used: `200` OK · `201` Created · `204` No content · `400` validation · `401` not logged in / bad password ·
`403` role not allowed · `404` not found (also returned when a user opens another user's ticket) · `409` conflict.

Timestamps are UTC, e.g. `2026-11-27T14:05:00.123`.

---

## Authentication — owner: Chamodya

| Method | Path | Who | Body |
|---|---|---|---|
| POST | `/api/auth/register` | public | `{fullName, email, password, department?}` → always role USER |
| POST | `/api/auth/login` | public | `{email, password}` |
| GET  | `/api/auth/me` | logged in | – |
| PUT  | `/api/auth/me` | logged in | `{fullName, department}` |
| PUT  | `/api/auth/me/password` | logged in | `{currentPassword, newPassword}` |

Login response:
```json
{ "token": "eyJhbGciOi...", "expiresInMs": 28800000,
  "user": { "id": 4, "fullName": "Uma Student", "email": "user1@smartdesk.local",
            "role": "USER", "department": "Computer Science", "active": true, "createdAt": "..." } }
```

## Tickets — owner: Yusuf

| Method | Path | Who | Notes |
|---|---|---|---|
| POST | `/api/tickets` | all | `{title, description, priority?, categoryId?}` |
| GET  | `/api/tickets` | all | query: `scope`=`all\|mine\|assigned\|unassigned`, `status`, `priority`, `categoryId`, `assignedToId`, `q` (search). Users always get only their own tickets. |
| GET  | `/api/tickets/my` | all | tickets I created |
| GET  | `/api/tickets/assigned` | tech/admin | tickets assigned to me |
| GET  | `/api/tickets/{id}` | owner, tech, admin | |
| PUT  | `/api/tickets/{id}` | owner (while open & unassigned), assignee, admin | `{title?, description?, categoryId?}` |
| PUT  | `/api/tickets/{id}/assign` | admin (anyone), technician (only themselves) | `{technicianId}` – `null` = unassign |
| PUT  | `/api/tickets/{id}/status` | assignee, admin; owner may only close/re-open a resolved ticket | `{status, resolution?}` – resolution required for `RESOLVED` |
| PUT  | `/api/tickets/{id}/priority` | tech/admin | `{priority}` |
| DELETE | `/api/tickets/{id}` | admin | |
| GET  | `/api/tickets/{id}/comments` | owner, tech, admin | users don't receive internal notes |
| POST | `/api/tickets/{id}/comments` | owner, tech, admin | `{body, internal}` – `internal` ignored for users |
| GET  | `/api/tickets/{id}/history` | owner, tech, admin | audit trail |

Ticket object:
```json
{ "id": 2, "title": "Cannot connect to campus Wi-Fi", "description": "...",
  "status": "IN_PROGRESS", "priority": "MEDIUM",
  "category":   { "id": 3, "name": "Network", "description": "..." },
  "createdBy":  { "id": 4, "fullName": "Uma Student", "email": "...", "role": "USER" },
  "assignedTo": { "id": 2, "fullName": "Tom Technician", "email": "...", "role": "TECHNICIAN" },
  "resolution": null, "createdAt": "...", "updatedAt": "...", "resolvedAt": null }
```

Statuses: `OPEN, IN_PROGRESS, ON_HOLD, RESOLVED, CLOSED` · Priorities: `LOW, MEDIUM, HIGH, URGENT`

## Categories

| Method | Path | Who |
|---|---|---|
| GET | `/api/categories` | all |
| POST / PUT `/{id}` / DELETE `/{id}` | `/api/categories` | admin – body `{name, description?}`; categories in use cannot be deleted |

## Users (administration)

| Method | Path | Who | Body |
|---|---|---|---|
| GET | `/api/users/technicians` | tech/admin | – |
| GET | `/api/users` | admin | – |
| POST | `/api/users` | admin | `{fullName, email, password, role, department?}` |
| PUT | `/api/users/{id}` | admin | `{fullName?, department?, role?, active?}` |
| PUT | `/api/users/{id}/password` | admin | `{password}` |
| DELETE | `/api/users/{id}` | admin | only users without any ticket activity – otherwise deactivate |

## Statistics & health

| Method | Path | Who |
|---|---|---|
| GET | `/api/stats` | admin – totals, byStatus, byPriority, byCategory, averageResolutionHours, technicianWorkload |
| GET | `/api/health` | public |

## Example with curl
```bash
TOKEN=$(curl -s -X POST localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"user1@smartdesk.local","password":"Password123!"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')

curl -X POST localhost:8080/api/tickets -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Printer offline","description":"The printer in room 12 is offline.","priority":"HIGH","categoryId":1}'
```
