-- =============================================================
-- SmartDesk – database verification queries (Day 5 / 7 / 8 / 9)
-- Run after the application has been used, to check consistency.
-- =============================================================
USE smartdesk;

-- 1. Tickets with their creator, technician and category
SELECT t.id, t.title, t.status, t.priority, c.name AS category,
       u.full_name AS created_by, a.full_name AS assigned_to
FROM tickets t
JOIN users u        ON u.id = t.created_by_id
LEFT JOIN users a   ON a.id = t.assigned_to_id
LEFT JOIN categories c ON c.id = t.category_id
ORDER BY t.id;

-- 2. Integrity: tickets assigned to someone who is NOT a technician/admin (should return 0 rows)
SELECT t.id, t.title, a.email, a.role
FROM tickets t JOIN users a ON a.id = t.assigned_to_id
WHERE a.role NOT IN ('TECHNICIAN','ADMIN');

-- 3. Integrity: resolved/closed tickets without a resolution date (should return 0 rows)
SELECT id, title, status FROM tickets
WHERE status IN ('RESOLVED','CLOSED') AND resolved_at IS NULL;

-- 4. Integrity: orphan comments / history (should return 0 rows)
SELECT c.id FROM comments c LEFT JOIN tickets t ON t.id = c.ticket_id WHERE t.id IS NULL;
SELECT h.id FROM ticket_history h LEFT JOIN tickets t ON t.id = h.ticket_id WHERE t.id IS NULL;

-- 5. Workload per technician
SELECT a.full_name, COUNT(t.id) AS open_tickets
FROM users a LEFT JOIN tickets t
  ON t.assigned_to_id = a.id AND t.status NOT IN ('RESOLVED','CLOSED')
WHERE a.role = 'TECHNICIAN'
GROUP BY a.id, a.full_name;

-- 6. Tickets per status
SELECT status, COUNT(*) FROM tickets GROUP BY status;

-- 7. Full history of one ticket
SELECT h.created_at, u.full_name, h.action, h.details
FROM ticket_history h JOIN users u ON u.id = h.actor_id
WHERE h.ticket_id = 2 ORDER BY h.created_at;

-- 8. Backup / export (run in a terminal, not inside MySQL) – Day 11
-- mysqldump -u root -p --routines --single-transaction smartdesk > smartdesk_backup.sql
-- Restore:  mysql -u root -p smartdesk < smartdesk_backup.sql
