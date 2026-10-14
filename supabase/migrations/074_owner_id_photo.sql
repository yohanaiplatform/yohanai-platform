ALTER TABLE property.owner_identities ADD COLUMN IF NOT EXISTS id_photo TEXT;
COMMENT ON COLUMN property.owner_identities.id_photo IS 'Foto KTP pemilik (data URL JPEG kecil). SENSITIF, akses mengikuti RLS listing; jangan dibaca AI.';
