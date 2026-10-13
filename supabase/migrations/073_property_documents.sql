-- ============================================================================
-- 073_property_documents.sql
-- Yohan.AI Platform -- dokumen perjanjian dari data listing (14 Oktober 2026): MoU Pemasaran dulu, lalu PPJB dan
-- Kwitansi Booking Unit memakai pola yang sama.
--
-- 1) property.listings.listing_code: Listing ID resmi (mis. GDI/2026/12). Backfill dari tag hasil migrasi
--    "[Migrasi dari spreadsheet, GDI/2026/xx]" di deskripsi; listing lain diberi kode otomatis saat dokumen pertamanya dibuat.
-- 2) property.owner_identities: identitas pemilik (TTL, alamat, pekerjaan, No. KTP) -- TERPISAH dari metadata listing karena
--    sensitif. Hanya admin atau agen yang ditugaskan ke listing (lewat RLS listings). TIDAK PERNAH dibaca AI Agent.
-- 3) property.documents: riwayat dokumen yang dibuat (snapshot isi formulir supaya bisa dibuka/dicetak ulang persis sama).
-- 4) property.document_settings: isian tetap Pihak 2 (agen/perusahaan, rekening, principal, prefix Listing ID) per pengguna,
--    supaya tidak mengetik ulang tiap dokumen dan tidak ada data satu bisnis yang di-hardcode di kode (siap multi-tenant).
-- ============================================================================

BEGIN;

ALTER TABLE property.listings ADD COLUMN IF NOT EXISTS listing_code TEXT;

-- Backfill dari tag migrasi; kalau kode ganda (tag yang sama di >1 listing) hanya listing tertua yang dapat.
WITH tagged AS (
    SELECT id,
           substring(description FROM 'GDI/[0-9]{4}/[0-9]+') AS code,
           row_number() OVER (PARTITION BY substring(description FROM 'GDI/[0-9]{4}/[0-9]+') ORDER BY created_at, id) AS rn
    FROM property.listings
    WHERE description ~ 'GDI/[0-9]{4}/[0-9]+' AND listing_code IS NULL
)
UPDATE property.listings l
SET listing_code = t.code
FROM tagged t
WHERE l.id = t.id AND t.rn = 1;

CREATE UNIQUE INDEX IF NOT EXISTS listings_listing_code_key ON property.listings (listing_code) WHERE listing_code IS NOT NULL;

COMMENT ON COLUMN property.listings.listing_code IS 'Listing ID resmi untuk dokumen (mis. GDI/2026/12). Unik. Dibuat otomatis saat dokumen pertama dibuat.';

CREATE TABLE IF NOT EXISTS property.owner_identities (
    listing_id UUID PRIMARY KEY REFERENCES property.listings(id) ON DELETE CASCADE,
    birth_info TEXT,
    address TEXT,
    occupation TEXT,
    id_number TEXT,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE property.owner_identities IS 'Identitas pemilik listing untuk dokumen perjanjian. SENSITIF: akses mengikuti listing (admin/agen yang ditugaskan); jangan dibaca AI Agent atau dikirim ke LLM.';

CREATE TABLE IF NOT EXISTS property.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES property.listings(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('mou_pemasaran', 'ppjb', 'kwitansi_booking')),
    doc_number TEXT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS documents_listing_idx ON property.documents (listing_id, doc_type, created_at DESC);

COMMENT ON TABLE property.documents IS 'Riwayat dokumen yang dibuat dari data listing (MoU Pemasaran, PPJB, Kwitansi Booking). data = snapshot isi formulir.';

CREATE TABLE IF NOT EXISTS property.document_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE property.document_settings IS 'Isian tetap Pihak 2 (agen/perusahaan, rekening, principal, prefix Listing ID) per pengguna untuk dokumen perjanjian.';

ALTER TABLE property.owner_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE property.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property.document_settings ENABLE ROW LEVEL SECURITY;

-- Akses mengikuti RLS listings (listings_owner_or_admin): subquery ke property.listings dievaluasi dengan hak pemanggil.
DROP POLICY IF EXISTS owner_identities_via_listing ON property.owner_identities;
CREATE POLICY owner_identities_via_listing ON property.owner_identities
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM property.listings l WHERE l.id = listing_id))
    WITH CHECK (EXISTS (SELECT 1 FROM property.listings l WHERE l.id = listing_id));

DROP POLICY IF EXISTS documents_via_listing ON property.documents;
CREATE POLICY documents_via_listing ON property.documents
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM property.listings l WHERE l.id = listing_id))
    WITH CHECK (EXISTS (SELECT 1 FROM property.listings l WHERE l.id = listing_id));

DROP POLICY IF EXISTS document_settings_own ON property.document_settings;
CREATE POLICY document_settings_own ON property.document_settings
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON property.owner_identities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON property.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON property.document_settings TO authenticated;
GRANT ALL ON property.owner_identities, property.documents, property.document_settings TO service_role;

COMMIT;
