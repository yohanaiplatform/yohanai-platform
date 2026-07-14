-- ============================================================================
-- FILE: project-docs/sql/008_chat_tables.sql
-- Yohan.AI Platform - Chat Tables
-- PostgreSQL 17 / Supabase Compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: chat.conversations
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_id UUID
        REFERENCES customer.leads(id)
        ON DELETE SET NULL,

    title VARCHAR(255),

    status VARCHAR(50) NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'closed',
                'archived'
            )
        ),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE chat.conversations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE chat.conversations IS
'Conversation header between customer and Yohan.AI.';

CREATE INDEX IF NOT EXISTS idx_conversations_lead
ON chat.conversations(lead_id);

CREATE INDEX IF NOT EXISTS idx_conversations_status
ON chat.conversations(status);

CREATE INDEX IF NOT EXISTS idx_conversations_created
ON chat.conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_deleted
ON chat.conversations(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_chat_conversations_updated_at
ON chat.conversations;

CREATE TRIGGER trg_chat_conversations_updated_at
BEFORE UPDATE
ON chat.conversations
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: chat.messages
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL
        REFERENCES chat.conversations(id)
        ON DELETE CASCADE,

    sender_type VARCHAR(50) NOT NULL
        CHECK (
            sender_type IN (
                'customer',
                'agent',
                'ai',
                'system'
            )
        ),

    sender_id UUID,

    content TEXT NOT NULL,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE chat.messages ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE chat.messages IS
'Every message exchanged inside a conversation.';

CREATE INDEX IF NOT EXISTS idx_messages_conversation
ON chat.messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender
ON chat.messages(sender_type);

CREATE INDEX IF NOT EXISTS idx_messages_created
ON chat.messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_deleted
ON chat.messages(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_chat_messages_updated_at
ON chat.messages;

CREATE TRIGGER trg_chat_messages_updated_at
BEFORE UPDATE
ON chat.messages
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

COMMIT;