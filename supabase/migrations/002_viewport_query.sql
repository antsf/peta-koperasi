-- ============================================================
-- PostGIS viewport query via RPC
-- Replaces lat/lng column comparisons with ST_Within
-- ============================================================

-- Function: get_points_in_viewport
-- Accepts bounding box (south, north, west, east), status filter, optional provinsi/kabupaten filters
-- Returns: id, name, latitude, longitude, kabupaten, provinsi, status, upvotes, downvotes
CREATE OR REPLACE FUNCTION get_points_in_viewport(
  p_south FLOAT8,
  p_north FLOAT8,
  p_west FLOAT8,
  p_east FLOAT8,
  p_status TEXT DEFAULT 'approved',
  p_provinsi TEXT DEFAULT NULL,
  p_kabupaten TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  latitude FLOAT8,
  longitude FLOAT8,
  kabupaten TEXT,
  provinsi TEXT,
  status TEXT,
  upvotes INT4,
  downvotes INT4
)
LANGUAGE sql STABLE
AS $$
  SELECT
    k.id,
    k.name,
    k.latitude,
    k.longitude,
    k.kabupaten,
    k.provinsi,
    k.status,
    k.upvotes,
    k.downvotes
  FROM koperasi_points k
  WHERE k.status = p_status
    AND ST_Within(
      k.location::geometry,
      ST_MakeEnvelope(p_west, p_south, p_east, p_north, 4326)
    )
    AND (p_provinsi IS NULL OR k.provinsi = p_provinsi)
    AND (p_kabupaten IS NULL OR k.kabupaten = p_kabupaten)
  LIMIT 500;
$$;
