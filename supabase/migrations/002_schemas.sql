-- FILE: project-docs/sql/002_schemas.sql
-- Yohan.AI Platform - Schemas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS auth_ext;
CREATE SCHEMA IF NOT EXISTS property;
CREATE SCHEMA IF NOT EXISTS customer;
CREATE SCHEMA IF NOT EXISTS chat;
CREATE SCHEMA IF NOT EXISTS workflow;
CREATE SCHEMA IF NOT EXISTS marketing;
CREATE SCHEMA IF NOT EXISTS ai;
CREATE SCHEMA IF NOT EXISTS knowledge;
CREATE SCHEMA IF NOT EXISTS reporting;
GRANT USAGE ON SCHEMA core TO authenticated, anon;
GRANT USAGE ON SCHEMA auth_ext TO authenticated, anon;
GRANT USAGE ON SCHEMA property TO authenticated, anon;
GRANT USAGE ON SCHEMA customer TO authenticated, anon;
GRANT USAGE ON SCHEMA chat TO authenticated, anon;
GRANT USAGE ON SCHEMA workflow TO authenticated, anon;
GRANT USAGE ON SCHEMA marketing TO authenticated, anon;
GRANT USAGE ON SCHEMA ai TO authenticated, anon;
GRANT USAGE ON SCHEMA knowledge TO authenticated, anon;
GRANT USAGE ON SCHEMA reporting TO authenticated, anon;