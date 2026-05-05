-- =============================================================================
-- RevSathi RAG System – Supabase Schema
-- Multi-tenant safe, pgvector indexed, ready to run
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- for full-text / similarity search


-- =============================================================================
-- TENANTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,           -- e.g. "acme-corp"
    priority_score  FLOAT NOT NULL DEFAULT 1.0,     -- 1.0 = free, 2.0 = growth, 3.0 = enterprise
    plan            TEXT NOT NULL DEFAULT 'free',   -- free | growth | enterprise
    api_key_hash    TEXT,                           -- bcrypt hash of tenant API key
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants (slug);


-- =============================================================================
-- DOCUMENTS
-- =============================================================================

CREATE TYPE document_status AS ENUM ('pending', 'processing', 'ready', 'failed');
CREATE TYPE document_file_type AS ENUM ('pdf', 'docx', 'xlsx');

CREATE TABLE IF NOT EXISTS documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    file_name       TEXT NOT NULL,
    file_type       document_file_type NOT NULL,
    file_size_bytes BIGINT,
    storage_path    TEXT,                           -- Supabase Storage path
    status          document_status NOT NULL DEFAULT 'pending',
    error_message   TEXT,
    chunk_count     INT DEFAULT 0,
    metadata        JSONB DEFAULT '{}',             -- arbitrary caller metadata
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant    ON documents (tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_status    ON documents (status);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_status ON documents (tenant_id, status);


-- =============================================================================
-- CHUNKS
-- =============================================================================

CREATE TABLE IF NOT EXISTS chunks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    document_id     UUID NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
    chunk_index     INT NOT NULL,
    text            TEXT NOT NULL,
    token_count     INT,
    section         TEXT DEFAULT '',
    importance      FLOAT NOT NULL DEFAULT 1.0,     -- manually or auto-assigned weight
    embedding       vector(1536),                   -- text-embedding-3-small dimension
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast tenant-scoped vector similarity search
CREATE INDEX IF NOT EXISTS idx_chunks_tenant
    ON chunks (tenant_id);

CREATE INDEX IF NOT EXISTS idx_chunks_document
    ON chunks (document_id);

-- pgvector HNSW index (best ANN performance, low memory vs IVFFlat)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
    ON chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Full-text search index for hybrid retrieval
CREATE INDEX IF NOT EXISTS idx_chunks_text_fts
    ON chunks USING gin (to_tsvector('english', text));

-- trgm index for partial-word / fuzzy matches
CREATE INDEX IF NOT EXISTS idx_chunks_text_trgm
    ON chunks USING gin (text gin_trgm_ops);


-- =============================================================================
-- QUERY LOGS  (optional telemetry)
-- =============================================================================

CREATE TABLE IF NOT EXISTS query_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    query_text      TEXT NOT NULL,
    retrieved_chunk_ids UUID[],
    llm_model       TEXT,
    response_text   TEXT,
    latency_ms      INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_query_logs_tenant ON query_logs (tenant_id);


-- =============================================================================
-- Row-Level Security (RLS) – enforces tenant isolation at DB level
-- =============================================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_logs ENABLE ROW LEVEL SECURITY;

-- Application passes tenant_id via session variable: set app.current_tenant_id = '<uuid>'
CREATE POLICY tenant_isolation_documents ON documents
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY tenant_isolation_chunks ON chunks
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY tenant_isolation_query_logs ON query_logs
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);


-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- EXAMPLE QUERIES
-- =============================================================================

-- Insert a tenant
-- INSERT INTO tenants (name, slug, priority_score, plan)
-- VALUES ('Acme Corp', 'acme-corp', 2.0, 'growth');

-- Insert a document (after upload to Supabase Storage)
-- INSERT INTO documents (tenant_id, file_name, file_type, storage_path)
-- VALUES ('<tenant_uuid>', 'product-catalog.pdf', 'pdf', 'tenants/acme-corp/docs/product-catalog.pdf');

-- Insert a chunk with its embedding
-- INSERT INTO chunks (tenant_id, document_id, chunk_index, text, token_count, section, embedding)
-- VALUES ('<tenant_uuid>', '<doc_uuid>', 0, 'chunk text here', 120, 'Introduction', '[0.1, 0.2, ...]'::vector);

-- Vector similarity search (tenant-scoped, top-6)
-- SELECT c.id, c.text, c.section, c.importance,
--        1 - (c.embedding <=> query_embedding::vector) AS similarity
-- FROM   chunks c
-- WHERE  c.tenant_id = '<tenant_uuid>'
-- ORDER  BY c.embedding <=> query_embedding::vector
-- LIMIT  6;
