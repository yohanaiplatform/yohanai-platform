-- ============================================================================
-- 038_customer_notes.sql
-- Yohan.AI Platform -- riwayat catatan per lead (Timeline dasar)
--
-- Dipicu permintaan Yohan: butuh jejak waktu tiap kali ada update lead
-- (mis. "Lead sudah dapat unit di lokasi lain", "Lead batal booking"),
-- terpisah dari field terstruktur (kategori/temperature/dll) yang cuma
-- menyimpan nilai TERKINI -- overwrite tiap diedit, riwayatnya hilang.
-- customer.notes sengaja append-only (tidak ada UPDATE ke isi note,
-- cuma INSERT baris baru), supaya jadi log yang bisa dipercaya.
--
-- author_label disimpan mentah (bukan di-resolve dari auth_ext.profiles
-- saat ditampilkan) karena RLS auth_ext.profiles cuma izinkan user baca
-- profil sendiri -- non-admin yang lihat note yang ditulis admin di lead
-- miliknya tidak akan bisa resolve nama admin itu. Trade-off yang
-- diterima: field ini cuma label tampilan, bukan sumber kebenaran
-- identitas (itu tetap created_by/auth.uid()).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS customer.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_id UUID NOT NULL
        REFERENCES customer.leads(id)
        ON DELETE CASCADE,

    note TEXT NOT NULL,
    author_label TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE customer.notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notes_lead
ON customer.notes(lead_id);

CREATE INDEX IF NOT EXISTS idx_notes_created
ON customer.notes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notes_deleted
ON customer.notes(deleted_at)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_customer_notes_updated_at
ON customer.notes;

CREATE TRIGGER trg_customer_notes_updated_at
BEFORE UPDATE
ON customer.notes
FOR EACH ROW
EXECUTE FUNCTION core.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- RLS: visibilitas note ikut visibilitas lead induknya (leads_owner_or_admin
-- di 035) -- admin lihat semua, role lain cuma lihat note dari lead yang
-- assigned_to dirinya. Bukan authenticated_all -- pelajaran dari 035 langsung
-- diterapkan sejak awal, bukan nunggu ketahuan lagi.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS notes_owner_or_admin ON customer.notes;

CREATE POLICY notes_owner_or_admin ON customer.notes
FOR ALL
TO authenticated
USING (
  core.is_admin_or_above()
  OR EXISTS (
    SELECT 1 FROM customer.leads l
    WHERE l.id = notes.lead_id AND l.assigned_to = auth.uid()
  )
)
WITH CHECK (
  core.is_admin_or_above()
  OR EXISTS (
    SELECT 1 FROM customer.leads l
    WHERE l.id = notes.lead_id AND l.assigned_to = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- GRANT -- pola sama seperti 027 (leads/contacts): RLS saja tidak cukup,
-- authenticated butuh hak tabel dasar juga.
-- ----------------------------------------------------------------------------
GRANT SELECT, INSERT ON customer.notes TO authenticated;

COMMENT ON TABLE customer.notes IS
'Riwayat catatan per lead, append-only (dengan waktu & label penulis). Fondasi Timeline -- lihat docs/modules/crm.mdx.';

COMMIT;
