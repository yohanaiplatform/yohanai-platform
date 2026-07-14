-- ============================================================================
-- FILE: project-docs/sql/015_indexes.sql
-- Yohan.AI Platform
-- Advanced Performance Indexes
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- PROPERTY
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_listings_category_price
ON property.listings(category_id, price);

CREATE INDEX IF NOT EXISTS idx_listings_category_created
ON property.listings(category_id, created_at DESC);

-- ============================================================================
-- CUSTOMER
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_leads_status_source
ON customer.leads(status, lead_source_id);

CREATE INDEX IF NOT EXISTS idx_contacts_primary
ON customer.contacts(lead_id, is_primary);

-- ============================================================================
-- CHAT
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_messages_sender
ON chat.messages(sender_type, sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON chat.messages(conversation_id, created_at DESC);

-- ============================================================================
-- WORKFLOW
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_step_unique
ON workflow.steps(definition_id, step_order);

CREATE INDEX IF NOT EXISTS idx_workflow_execution_status_created
ON workflow.executions(status, created_at DESC);

-- ============================================================================
-- MARKETING
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_campaign_status_date
ON marketing.campaigns(status, start_date);

-- ============================================================================
-- AI
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ai_interactions_model_created
ON ai.interactions(model_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_prompt_created
ON ai.interactions(prompt_id, created_at DESC);

-- ============================================================================
-- KNOWLEDGE (pgvector)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
ON knowledge.chunks
USING hnsw (embedding vector_cosine_ops);

-- ============================================================================
-- REPORTING
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_metric_unique
ON reporting.metrics(dashboard_id, name);

COMMIT;