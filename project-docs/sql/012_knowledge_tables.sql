-- ============================================================================
-- FILE: project-docs/sql/012_knowledge_tables.sql
-- Yohan.AI Platform - Knowledge Tables
-- PostgreSQL 17 / Supabase Compatible
-- Requires: pgvector extension
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: knowledge.categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE knowledge.categories ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE knowledge.categories IS
'Knowledge Base Categories.';

CREATE INDEX IF NOT EXISTS idx_knowledge_categories_name
ON knowledge.categories(name);

CREATE INDEX IF NOT EXISTS idx_knowledge_categories_deleted
ON knowledge.categories(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_knowledge_categories_updated_at
ON knowledge.categories;

CREATE TRIGGER trg_knowledge_categories_updated_at
BEFORE UPDATE
ON knowledge.categories
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: knowledge.articles
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category_id UUID
        REFERENCES knowledge.categories(id)
        ON DELETE SET NULL,

    title VARCHAR(255) NOT NULL,

    content TEXT NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'published',
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

ALTER TABLE knowledge.articles ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE knowledge.articles IS
'Knowledge Base Articles.';

CREATE INDEX IF NOT EXISTS idx_articles_category
ON knowledge.articles(category_id);

CREATE INDEX IF NOT EXISTS idx_articles_status
ON knowledge.articles(status);

CREATE INDEX IF NOT EXISTS idx_articles_created
ON knowledge.articles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_deleted
ON knowledge.articles(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_knowledge_articles_updated_at
ON knowledge.articles;

CREATE TRIGGER trg_knowledge_articles_updated_at
BEFORE UPDATE
ON knowledge.articles
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- TABLE: knowledge.chunks
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge.chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    article_id UUID NOT NULL
        REFERENCES knowledge.articles(id)
        ON DELETE CASCADE,

    chunk_text TEXT NOT NULL,

    embedding vector(1536),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE knowledge.chunks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE knowledge.chunks IS
'Vector chunks used for semantic search / RAG.';

CREATE INDEX IF NOT EXISTS idx_chunks_article
ON knowledge.chunks(article_id);

CREATE INDEX IF NOT EXISTS idx_chunks_created
ON knowledge.chunks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chunks_deleted
ON knowledge.chunks(deleted_at)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chunks_embedding
ON knowledge.chunks
USING hnsw (embedding vector_cosine_ops);

DROP TRIGGER IF EXISTS trg_knowledge_chunks_updated_at
ON knowledge.chunks;

CREATE TRIGGER trg_knowledge_chunks_updated_at
BEFORE UPDATE
ON knowledge.chunks
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

COMMIT;