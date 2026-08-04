-- ============================================================
-- Koperasi Desa Merah Putih Map — Initial Schema
-- Run this after enabling PostGIS:
--   CREATE EXTENSION IF NOT EXISTS postgis;
-- ============================================================

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- Table: koperasi_points
-- ============================================================
CREATE TABLE IF NOT EXISTS koperasi_points (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL CHECK (char_length(name) <= 200),
  location              GEOGRAPHY(Point, 4326) NOT NULL,
  latitude              FLOAT8 NOT NULL,
  longitude             FLOAT8 NOT NULL,
  address               TEXT NOT NULL,
  kelurahan             TEXT,
  kecamatan             TEXT,
  kabupaten             TEXT NOT NULL,
  provinsi              TEXT NOT NULL,
  phone                 TEXT,
  email                 TEXT,
  photo_path            TEXT,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'flagged', 'removed')),
  upvotes               INT4 NOT NULL DEFAULT 0,
  downvotes             INT4 NOT NULL DEFAULT 0,
  -- PII stored as SHA-256 hashes only. Raw values never persisted.
  submitter_ip          TEXT,
  submitter_fingerprint TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validate Indonesia bounds on insert/update
ALTER TABLE koperasi_points
  ADD CONSTRAINT chk_indonesia_lat CHECK (latitude BETWEEN -11.0 AND 6.0),
  ADD CONSTRAINT chk_indonesia_lng CHECK (longitude BETWEEN 95.0 AND 141.0);

-- Indexes
CREATE INDEX idx_koperasi_location  ON koperasi_points USING GIST (location);
CREATE INDEX idx_koperasi_status    ON koperasi_points (status);
CREATE INDEX idx_koperasi_provinsi  ON koperasi_points (provinsi);
CREATE INDEX idx_koperasi_kabupaten ON koperasi_points (kabupaten);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER koperasi_points_updated_at
  BEFORE UPDATE ON koperasi_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Table: votes
-- ============================================================
CREATE TABLE IF NOT EXISTS votes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  point_id            UUID NOT NULL REFERENCES koperasi_points(id) ON DELETE CASCADE,
  vote_type           TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  voter_ip            TEXT NOT NULL,
  voter_fingerprint   TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dedup index — prevents same voter from voting twice on same point
-- This is the load-bearing anti-sybil constraint. NEVER drop this index.
CREATE UNIQUE INDEX idx_votes_dedup ON votes (point_id, voter_ip, voter_fingerprint);
CREATE INDEX idx_votes_point_id ON votes (point_id);

-- ============================================================
-- Supabase Storage Bucket: koperasi-photos
-- Run this in Supabase dashboard or via Storage API:
--   Create bucket "koperasi-photos" with public: false
--   Set file size limit: 5242880 (5MB)
--   Allowed MIME types: image/jpeg, image/png, image/webp
-- ============================================================

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE koperasi_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- koperasi_points: public can read approved + pending (for voting page)
CREATE POLICY "public_read_approved"
  ON koperasi_points FOR SELECT
  USING (status IN ('approved', 'pending'));

-- koperasi_points: anyone can insert (anonymous submission)
CREATE POLICY "public_insert"
  ON koperasi_points FOR INSERT
  WITH CHECK (true);

-- koperasi_points: only service role can update (status transitions via voting logic)
-- UPDATE and DELETE are not allowed via anon key — handled by API with service role.

-- votes: public can read votes (for showing counts)
CREATE POLICY "public_read_votes"
  ON votes FOR SELECT
  USING (true);

-- votes: anyone can insert a vote (dedup enforced by unique index)
CREATE POLICY "public_insert_votes"
  ON votes FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Seed data for local development (optional, comment out for prod)
-- ============================================================
-- INSERT INTO koperasi_points (name, location, latitude, longitude, address, kabupaten, provinsi, status, upvotes)
-- VALUES (
--   'Koperasi Simpan Pinjam Maju Bersama',
--   ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)::geography,
--   -6.2088, 106.8456,
--   'Jl. Sudirman No. 1',
--   'Jakarta Pusat', 'DKI Jakarta',
--   'approved', 5
-- );
