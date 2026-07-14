-- ============================================================================
-- FILE: project-docs/sql/018_seed_data.sql
-- Yohan.AI Platform
-- Initial Seed Data
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- SYSTEM SETTINGS
-- ============================================================================

INSERT INTO core.settings (key, value, description)
VALUES
('app.name','"Yohan.AI Platform"'::jsonb,'Application Name'),
('app.version','"1.0.0"'::jsonb,'Current Version'),
('app.timezone','"Asia/Jakarta"'::jsonb,'Default Timezone'),
('currency','"IDR"'::jsonb,'Default Currency')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- ROLES
-- ============================================================================

INSERT INTO core.roles(name,description)
VALUES
('super_admin','Full System Access'),
('admin','Administrator'),
('manager','Manager'),
('marketing','Marketing'),
('agent','Property Agent'),
('customer_service','Customer Service'),
('ai_service','AI Internal Service')
ON CONFLICT(name) DO NOTHING;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

INSERT INTO core.permissions(name,description)
VALUES
('system.manage','System Administration'),
('listing.manage','Manage Listings'),
('customer.manage','Manage Customers'),
('chat.manage','Manage Conversations'),
('workflow.manage','Manage Workflow'),
('marketing.manage','Manage Marketing'),
('knowledge.manage','Manage Knowledge Base'),
('report.manage','Manage Reports')
ON CONFLICT(name) DO NOTHING;

-- ============================================================================
-- PROPERTY CATEGORIES
-- ============================================================================

INSERT INTO property.categories(name)
VALUES
('Rumah Subsidi'),
('Rumah Komersial'),
('Ruko'),
('Apartemen'),
('Tanah'),
('Gudang'),
('Kavling'),
('Villa')
ON CONFLICT(name) DO NOTHING;

-- ============================================================================
-- LEAD SOURCES
-- ============================================================================

INSERT INTO customer.lead_sources(name)
VALUES
('Facebook'),
('Instagram'),
('TikTok'),
('WhatsApp'),
('Website'),
('Referral'),
('Google Ads'),
('Organic Search')
ON CONFLICT(name) DO NOTHING;

-- ============================================================================
-- AI MODELS
-- ============================================================================

INSERT INTO ai.models
(
    name,
    provider,
    config,
    is_active
)
VALUES
(
    'gpt-5.5',
    'OpenAI',
    '{"temperature":0.3}'::jsonb,
    true
),
(
    'gpt-5-mini',
    'OpenAI',
    '{"temperature":0.2}'::jsonb,
    true
)
ON CONFLICT(name) DO NOTHING;

-- ============================================================================
-- DEFAULT PROMPT
-- ============================================================================

INSERT INTO ai.prompts
(
    name,
    system_prompt,
    variables
)
VALUES
(
    'default_sales_assistant',
    'You are Yohan.AI Property Buyer Intelligence System.',
    '[]'::jsonb
)
ON CONFLICT(name) DO NOTHING;

-- ============================================================================
-- WORKFLOW
-- ============================================================================

INSERT INTO workflow.definitions
(
    name,
    description,
    trigger_event,
    definition
)
VALUES
(
    'Lead Qualification',
    'Default lead qualification workflow',
    'lead.created',
    '{}'::jsonb
)
ON CONFLICT DO NOTHING;

COMMIT;