-- VivoQuest Database Schema
-- Run once: psql -U postgres -d vivoquest -f server/schema.sql

-- Create database if needed (run separately as superuser):
-- CREATE DATABASE vivoquest;

-- ─── Webinar Registrations ────────────────────────────────
CREATE TABLE IF NOT EXISTS webinar_registrations (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255)  NOT NULL,
  email           VARCHAR(255)  NOT NULL UNIQUE,
  phone           VARCHAR(50),
  organization    VARCHAR(255),
  webinar_session VARCHAR(10)   NOT NULL CHECK (webinar_session IN ('1', '2', 'both')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webinar_reg_email     ON webinar_registrations (email);
CREATE INDEX IF NOT EXISTS idx_webinar_reg_session   ON webinar_registrations (webinar_session);
CREATE INDEX IF NOT EXISTS idx_webinar_reg_created   ON webinar_registrations (created_at DESC);

-- ─── Early Access Signups ─────────────────────────────────
CREATE TABLE IF NOT EXISTS early_access_signups (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255)  NOT NULL,
  email        VARCHAR(255)  NOT NULL UNIQUE,
  phone        VARCHAR(50),
  organization VARCHAR(255),
  country      VARCHAR(100)  NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_early_access_email    ON early_access_signups (email);
CREATE INDEX IF NOT EXISTS idx_early_access_country  ON early_access_signups (country);
CREATE INDEX IF NOT EXISTS idx_early_access_created  ON early_access_signups (created_at DESC);
