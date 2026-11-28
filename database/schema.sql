-- =============================================================
-- SmartDesk – IT Help Desk & Ticket Management System
-- MySQL 8 schema  (Day 1 ER design / Day 3 tables & relationships)
-- Owner: Oshani
-- =============================================================

CREATE DATABASE IF NOT EXISTS smartdesk
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartdesk;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ticket_history;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------------
-- users: students/employees, IT technicians and administrators
-- -------------------------------------------------------------
CREATE TABLE users (
  id            BIGINT        NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL,
  password_hash VARCHAR(100)  NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'USER',   -- USER | TECHNICIAN | ADMIN
  department    VARCHAR(100)  NULL,
  active        BIT(1)        NOT NULL DEFAULT b'1',
  created_at    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  CONSTRAINT chk_users_role CHECK (role IN ('USER','TECHNICIAN','ADMIN'))
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- categories: Hardware, Software, Network, Account access ...
-- -------------------------------------------------------------
CREATE TABLE categories (
  id          BIGINT        NOT NULL AUTO_INCREMENT,
  name        VARCHAR(60)   NOT NULL,
  description VARCHAR(255)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_categories_name (name)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- tickets: one ticket · one owner · full visibility
-- -------------------------------------------------------------
CREATE TABLE tickets (
  id              BIGINT        NOT NULL AUTO_INCREMENT,
  title           VARCHAR(150)  NOT NULL,
  description     VARCHAR(4000) NOT NULL,
  status          VARCHAR(20)   NOT NULL DEFAULT 'OPEN',     -- OPEN | IN_PROGRESS | ON_HOLD | RESOLVED | CLOSED
  priority        VARCHAR(20)   NOT NULL DEFAULT 'MEDIUM',   -- LOW | MEDIUM | HIGH | URGENT
  category_id     BIGINT        NULL,
  created_by_id   BIGINT        NOT NULL,
  assigned_to_id  BIGINT        NULL,
  resolution      VARCHAR(4000) NULL,
  created_at      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  resolved_at     DATETIME(6)   NULL,
  PRIMARY KEY (id),
  KEY idx_tickets_status (status),
  KEY idx_tickets_created_by (created_by_id),
  KEY idx_tickets_assigned_to (assigned_to_id),
  CONSTRAINT fk_tickets_category    FOREIGN KEY (category_id)    REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_tickets_created_by  FOREIGN KEY (created_by_id)  REFERENCES users(id),
  CONSTRAINT fk_tickets_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_tickets_status   CHECK (status IN ('OPEN','IN_PROGRESS','ON_HOLD','RESOLVED','CLOSED')),
  CONSTRAINT chk_tickets_priority CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT'))
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- comments: communication between user and technician
-- -------------------------------------------------------------
CREATE TABLE comments (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  ticket_id  BIGINT       NOT NULL,
  author_id  BIGINT       NOT NULL,
  body       VARCHAR(4000) NOT NULL,
  internal   BIT(1)       NOT NULL DEFAULT b'0',   -- internal notes are hidden from normal users
  created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_comments_ticket (ticket_id),
  CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- ticket_history: audit trail of every change (status, assignment...)
-- -------------------------------------------------------------
CREATE TABLE ticket_history (
  id         BIGINT        NOT NULL AUTO_INCREMENT,
  ticket_id  BIGINT        NOT NULL,
  actor_id   BIGINT        NOT NULL,
  action     VARCHAR(40)   NOT NULL,          -- CREATED | ASSIGNED | STATUS_CHANGED | PRIORITY_CHANGED
  details    VARCHAR(255)  NULL,
  created_at DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_history_ticket (ticket_id),
  CONSTRAINT fk_history_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_actor  FOREIGN KEY (actor_id)  REFERENCES users(id)
) ENGINE=InnoDB;
