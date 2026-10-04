-- ============================================================================
-- 064_knowledge_places.sql
-- Yohan.AI Platform -- Kamus Kawasan: titik peta untuk AI Agent (4 Oktober 2026)
--
-- Nama jalan/kawasan/patokan + koordinat (dari link Google Maps yang ditempel
-- agen di Settings). AI Agent memakainya untuk menghitung jarak garis lurus ke
-- listing (dihitung KODE, bukan LLM) -- lihat src/lib/geo/geo.ts.
-- source = 'geocoded' berarti hasil pencarian peta otomatis (OpenStreetMap
-- Nominatim) yang BELUM diverifikasi manusia.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS knowledge.places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    aliases TEXT[] NOT NULL DEFAULT '{}',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    maps_url TEXT,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'geocoded')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS places_name_unique_idx ON knowledge.places (lower(name));

ALTER TABLE knowledge.places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS places_authenticated_read ON knowledge.places;
CREATE POLICY places_authenticated_read ON knowledge.places
FOR SELECT TO authenticated
USING (core.is_authenticated());

GRANT SELECT ON knowledge.places TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON knowledge.places TO service_role;

COMMENT ON TABLE knowledge.places IS
'Kamus Kawasan: nama jalan/kawasan/patokan + koordinat (dari link Google Maps, source manual) -- dipakai AI Agent menghitung jarak ke listing. source geocoded = hasil pencarian peta otomatis, BELUM diverifikasi manusia.';

COMMIT;
