-- =============================================================
-- SmartDesk sample data (Day 4 / Day 8 / Day 12 demo data)
-- All demo accounts use the password:  Password123!
-- NOTE: the backend also seeds this data automatically on first start
--       if the users table is empty (see DataSeeder.java).
-- =============================================================
USE smartdesk;

INSERT INTO users (full_name, email, password_hash, role, department) VALUES
 ('System Administrator', 'admin@smartdesk.local', '$2b$10$LmpkzG4tLvNpLuxcM8FVI.1AVkSe8UBWAFLDh6se68Go6/9UQIM0S', 'ADMIN',      'IT Department'),
 ('Tom Technician',       'tech1@smartdesk.local', '$2b$10$LmpkzG4tLvNpLuxcM8FVI.1AVkSe8UBWAFLDh6se68Go6/9UQIM0S', 'TECHNICIAN', 'IT Support'),
 ('Tina Technician',      'tech2@smartdesk.local', '$2b$10$LmpkzG4tLvNpLuxcM8FVI.1AVkSe8UBWAFLDh6se68Go6/9UQIM0S', 'TECHNICIAN', 'IT Support'),
 ('Uma Student',          'user1@smartdesk.local', '$2b$10$LmpkzG4tLvNpLuxcM8FVI.1AVkSe8UBWAFLDh6se68Go6/9UQIM0S', 'USER',       'Computer Science'),
 ('Ulf Employee',         'user2@smartdesk.local', '$2b$10$LmpkzG4tLvNpLuxcM8FVI.1AVkSe8UBWAFLDh6se68Go6/9UQIM0S', 'USER',       'Finance');

INSERT INTO categories (name, description) VALUES
 ('Hardware',       'Computers, printers, monitors and other devices'),
 ('Software',       'Installation, licences and application errors'),
 ('Network',        'Wi-Fi, VPN, internet and LAN problems'),
 ('Account Access', 'Passwords, logins and permissions'),
 ('Email',          'Mailbox, Outlook and calendar issues'),
 ('Other',          'Anything that does not fit another category');

INSERT INTO tickets (title, description, status, priority, category_id, created_by_id, assigned_to_id, resolution, resolved_at) VALUES
 ('Laptop does not turn on',         'My laptop shows no power light even when plugged in.',               'OPEN',        'HIGH',   1, 4, NULL, NULL, NULL),
 ('Cannot connect to campus Wi-Fi',  'Wi-Fi keeps asking for my password and then disconnects.',           'IN_PROGRESS', 'MEDIUM', 3, 4, 2,    NULL, NULL),
 ('Need Microsoft Office installed', 'Please install Office on the finance office PC #12.',                'OPEN',        'LOW',    2, 5, NULL, NULL, NULL),
 ('Forgot my portal password',       'I am locked out of the student portal after 3 attempts.',           'RESOLVED',    'URGENT', 4, 5, 3,    'Account unlocked and temporary password issued.', CURRENT_TIMESTAMP(6)),
 ('Printer on 2nd floor jams',       'The shared printer jams on every second page.',                     'ON_HOLD',     'MEDIUM', 1, 5, 2,    NULL, NULL);

INSERT INTO comments (ticket_id, author_id, body, internal) VALUES
 (2, 2, 'Hi Uma, could you tell me which building you are in?', b'0'),
 (2, 4, 'I am in Building B, room 204.',                          b'0'),
 (2, 2, 'Probably the old certificate on the access point.',      b'1'),
 (4, 3, 'Your account is unlocked. Please change the password on first login.', b'0');

INSERT INTO ticket_history (ticket_id, actor_id, action, details) VALUES
 (1, 4, 'CREATED', 'Ticket created'),
 (2, 4, 'CREATED', 'Ticket created'),
 (2, 1, 'ASSIGNED', 'Assigned to Tom Technician'),
 (2, 2, 'STATUS_CHANGED', 'OPEN -> IN_PROGRESS'),
 (3, 5, 'CREATED', 'Ticket created'),
 (4, 5, 'CREATED', 'Ticket created'),
 (4, 1, 'ASSIGNED', 'Assigned to Tina Technician'),
 (4, 3, 'STATUS_CHANGED', 'OPEN -> RESOLVED'),
 (5, 5, 'CREATED', 'Ticket created'),
 (5, 1, 'ASSIGNED', 'Assigned to Tom Technician'),
 (5, 2, 'STATUS_CHANGED', 'OPEN -> ON_HOLD');
