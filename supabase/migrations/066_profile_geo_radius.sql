-- ============================================================================
-- 066_profile_geo_radius.sql
-- Yohan.AI Platform -- radius pencarian fasilitas per user + seed kampus (4 Oktober 2026)
--
-- geo_radius_km (1-10, default 2) di profil user: dipakai saat user menekan
-- "Perbarui Data Lokasi" di listing (lihat PropertyGeoCard / geo-refresh).
-- Seed: kampus-kampus utama Pontianak ke Kamus Kawasan (knowledge.places),
-- koordinat dari OpenStreetMap (source geocoded -- periksa/koreksi di Settings).
-- ============================================================================

BEGIN;

ALTER TABLE auth_ext.profiles ADD COLUMN IF NOT EXISTS geo_radius_km INTEGER NOT NULL DEFAULT 2 CHECK (geo_radius_km BETWEEN 1 AND 10);

COMMENT ON COLUMN auth_ext.profiles.geo_radius_km IS
'Radius (km, 1-10) pencarian fasilitas umum saat user memperbarui data lokasi listing (default 2).';

INSERT INTO knowledge.places (name, aliases, lat, lng, source, review_status) VALUES
 ('UNTAN (Universitas Tanjungpura)', ARRAY['untan','universitas tanjungpura','kampus untan'], -0.05774, 109.34671, 'geocoded', 'approved'),
 ('Politeknik Negeri Pontianak (Polnep)', ARRAY['polnep','politeknik negeri pontianak','politeknik pontianak'], -0.05486, 109.34623, 'geocoded', 'approved'),
 ('IAIN Pontianak', ARRAY['iain','iain pontianak','institut agama islam negeri pontianak'], -0.03895, 109.34029, 'geocoded', 'approved'),
 ('Universitas Muhammadiyah Pontianak (UMP)', ARRAY['ump','umpontianak','universitas muhammadiyah pontianak','muhammadiyah pontianak'], -0.06015, 109.35213, 'geocoded', 'approved'),
 ('Universitas Widya Dharma Pontianak', ARRAY['widya dharma','universitas widya dharma'], -0.02744, 109.33483, 'geocoded', 'approved'),
 ('Universitas Panca Bhakti', ARRAY['panca bhakti','upb','universitas panca bhakti'], -0.00432, 109.30274, 'geocoded', 'approved'),
 ('Sekolah Tinggi Theologia Kalimantan', ARRAY['stt kalimantan','sekolah tinggi theologia kalimantan'], -0.03974, 109.34392, 'geocoded', 'approved')
ON CONFLICT DO NOTHING;

COMMIT;
