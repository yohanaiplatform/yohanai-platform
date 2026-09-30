-- ============================================================================
-- 050_knowledge_entries.sql
-- Yohan.AI Platform -- Knowledge Base untuk AI Agent (30 September 2026)
--
-- Ditemukan saat tes AI Agent: lead tanya "unit di Kotabaru" -- AI selalu
-- refer ke tim karena tidak tahu "Kotabaru" itu area yang mencakup banyak
-- nama jalan (Jl. Parit Wak Gatak, Jl. Perintis, dst), padahal listing
-- yang sesuai (mis. "Purnama Golden", alamat "Jl. Parit Wak Gatak") ada
-- dan available -- listing-nya sendiri tidak pernah menyebut "Kotabaru".
--
-- Tabel ini simpan istilah lokal yang Yohan bisa tambah sendiri nanti
-- (schema `knowledge` sudah lama disiapkan aspirasional di docs, baru
-- dipakai pertama kali sekarang). keywords = kata pemicu dari pesan lead;
-- related_listing_terms = istilah tambahan (mis. nama jalan) yang dipakai
-- untuk mencari listing terkait secara otomatis.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS knowledge.entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,
    content TEXT NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    related_listing_terms TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS knowledge_entries_keywords_idx ON knowledge.entries USING GIN (keywords);

ALTER TABLE knowledge.entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can read active knowledge entries" ON knowledge.entries;
DROP POLICY IF EXISTS "admin can manage knowledge entries" ON knowledge.entries;

-- Baca: semua user login (bukan data sensitif, cuma referensi umum).
CREATE POLICY "authenticated can read active knowledge entries"
ON knowledge.entries
FOR SELECT TO authenticated
USING (is_active = TRUE);

-- Tulis: admin-only -- entri ini langsung mempengaruhi jawaban AI ke lead,
-- beda dari property.categories yang boleh authenticated_all.
CREATE POLICY "admin can manage knowledge entries"
ON knowledge.entries
FOR ALL TO authenticated
USING (core.is_admin_or_above())
WITH CHECK (core.is_admin_or_above());

GRANT SELECT, INSERT, UPDATE, DELETE ON knowledge.entries TO authenticated;
GRANT USAGE ON SCHEMA knowledge TO service_role;
GRANT SELECT ON knowledge.entries TO service_role;

-- Seed: kasus nyata yang ditemukan malam ini (Kotabaru).
INSERT INTO knowledge.entries (title, content, keywords, related_listing_terms)
VALUES (
    'Area Kotabaru',
    'Kotabaru adalah nama kawasan yang mencakup sebagian wilayah Kota Pontianak dan sebagian Kabupaten Kubu Raya, meliputi Jl. Perdamaian, Jl. Perintis, Jl. Swadaya, Jl. Karya, Jl. Ampera, Jl. Kesehatan, dan Jl. Parit Wak Gatak.',
    ARRAY['kotabaru', 'kota baru'],
    ARRAY['Perdamaian', 'Perintis', 'Swadaya', 'Karya', 'Ampera', 'Kesehatan', 'Parit Wak Gatak']
)
ON CONFLICT DO NOTHING;

COMMIT;
