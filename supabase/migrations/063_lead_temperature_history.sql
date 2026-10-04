-- ============================================================================
-- 063_lead_temperature_history.sql
-- Yohan.AI Platform -- riwayat perubahan Temperature lead (4 Oktober 2026)
--
-- Temperature disimpan di customer.leads.metadata->>'status_funnel_awal' dan
-- ditimpa tiap berubah, jadi tidak ada jejak "kapan lead jadi Warm/Hot".
-- Tanpa itu analisis pola (mis. pertanyaan apa yang muncul sebelum lead jadi
-- Hot, berapa lama dari Cold ke Hot) tidak mungkin. Trigger ini mencatat SETIAP
-- perubahan dari jalur apa pun (UI, AI Agent, SQL manual).
--
-- changed_by_user = auth.uid() (NULL kalau diubah service_role, yaitu AI Agent
-- atau job sistem) -- cukup untuk membedakan manual vs otomatis.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS customer.lead_temperature_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES customer.leads(id) ON DELETE CASCADE,
    from_temperature TEXT,
    to_temperature TEXT,
    changed_by_user UUID REFERENCES auth.users(id),
    source TEXT NOT NULL CHECK (source IN ('manual', 'otomatis')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_temperature_history_lead_idx
ON customer.lead_temperature_history (lead_id, created_at DESC);

CREATE OR REPLACE FUNCTION customer.log_lead_temperature_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = customer, public
AS $$
DECLARE
    old_temp TEXT;
    new_temp TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        old_temp := NULL;
    ELSE
        old_temp := OLD.metadata ->> 'status_funnel_awal';
    END IF;

    new_temp := NEW.metadata ->> 'status_funnel_awal';

    IF new_temp IS DISTINCT FROM old_temp AND NOT (TG_OP = 'INSERT' AND new_temp IS NULL) THEN
        INSERT INTO customer.lead_temperature_history (lead_id, from_temperature, to_temperature, changed_by_user, source)
        VALUES (
            NEW.id,
            old_temp,
            new_temp,
            auth.uid(),
            CASE WHEN auth.uid() IS NULL THEN 'otomatis' ELSE 'manual' END
        );
    END IF;

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION customer.log_lead_temperature_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_log_lead_temperature_change ON customer.leads;
CREATE TRIGGER trg_log_lead_temperature_change
AFTER INSERT OR UPDATE OF metadata ON customer.leads
FOR EACH ROW
EXECUTE FUNCTION customer.log_lead_temperature_change();

ALTER TABLE customer.lead_temperature_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lead_temperature_history_owner_or_admin ON customer.lead_temperature_history;
CREATE POLICY lead_temperature_history_owner_or_admin ON customer.lead_temperature_history
FOR SELECT TO authenticated
USING (
    core.is_admin_or_above()
    OR EXISTS (
        SELECT 1 FROM customer.leads l
        WHERE l.id = lead_temperature_history.lead_id AND l.assigned_to = auth.uid()
    )
);

GRANT SELECT ON customer.lead_temperature_history TO authenticated;
GRANT SELECT, INSERT ON customer.lead_temperature_history TO service_role;

COMMENT ON TABLE customer.lead_temperature_history IS
'Riwayat perubahan Temperature lead (dicatat trigger trg_log_lead_temperature_change) -- dasar analisis pola funnel.';

COMMIT;
