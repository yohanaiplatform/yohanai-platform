-- ============================================================================
-- 043_property_listing_ownership.sql
-- Yohan.AI Platform — kepemilikan listing per agent
--
-- Pola sama persis seperti customer.leads (migration 035): kolom
-- assigned_to + policy owner-or-admin, dibangun ulang dari core.is_admin_or_above()
-- yang sudah ada. Backfill listing lama ke admin@yohanai.id, sama seperti
-- keputusan backfill 1968 lead lama di 035.
--
-- Catatan: policy authenticated_all yang di-DROP di sini ternyata tidak
-- pernah tercatat di migration manapun untuk property.listings (sama
-- seperti temuan property.categories) -- policy itu ada di database sejak
-- awal tanpa file migration yang membuatnya eksplisit.
-- ============================================================================

BEGIN;

ALTER TABLE property.listings
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_property_listings_assigned_to
ON property.listings(assigned_to);

UPDATE property.listings
SET assigned_to = (SELECT id FROM auth.users WHERE email = 'admin@yohanai.id')
WHERE assigned_to IS NULL;

DROP POLICY IF EXISTS authenticated_all ON property.listings;

CREATE POLICY listings_owner_or_admin ON property.listings
FOR ALL
TO authenticated
USING (
  assigned_to = auth.uid() OR core.is_admin_or_above()
)
WITH CHECK (
  assigned_to = auth.uid() OR core.is_admin_or_above()
);

COMMIT;
