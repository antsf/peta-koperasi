# postgis-expert

PostGIS expertise for the Koperasi Desa Merah Putih Map — spatial queries, migrations, and performance for a Supabase + PostGIS backend mapping Indonesian village cooperatives.

## When to Use

Activate this skill when writing or reviewing: database migrations involving geography columns, spatial SQL queries, Supabase RPC functions for map data, or any code that touches `ST_*` functions.

## Core Concepts

### 1. Why geography(Point, 4326) — Not geometry

This project uses `geography`, not `geometry`, for the location column:

```sql
location geography(Point, 4326)
```

**Why geography over geometry for this project:**

- **Distance in meters**: `ST_Distance()` on geography returns meters, not degrees. When a user asks "find koperasi within 5km," the query is straightforward. With geometry, 1 degree of longitude varies from ~111km at the equator to ~0km at the poles — Indonesia straddles the equator, so this matters.
- **Antimeridian safety**: Indonesia spans lng 95 to 141. While it doesn't cross the antimeridian (180), geography handles great-circle math correctly for the large east-west span (~5,000km). Geometry treats coordinates as flat Cartesian, which distorts at this scale.
- **SRID 4326 is implicit**: Geography columns always use WGS84 (SRID 4326). No ambiguity about coordinate reference systems.

**The tradeoff**: Geography is slightly slower for simple bounding-box queries than geometry. But with a GIST index, the difference is negligible for our data size (thousands, not millions, of points).

### 2. The Viewport Query Pattern

The core query that powers the map. Called on every pan/zoom:

```sql
SELECT id, name, lat, lng, kabupaten, provinsi, status
FROM koperasi_points
WHERE ST_Within(
  location,
  ST_MakeEnvelope($west, $south, $east, $north, 4326)::geography
)
AND status = $status
LIMIT 500;
```

**Parameter order for ST_MakeEnvelope**: `(xmin, ymin, xmax, ymax, srid)` which is `(west, south, east, north, 4326)`. This is `(lng_min, lat_min, lng_max, lat_max)`.

**CRITICAL — coordinate order in PostGIS:**
- `ST_MakePoint(longitude, latitude)` — X before Y
- `ST_MakeEnvelope(west, south, east, north)` — which is `(lng_min, lat_min, lng_max, lat_max)`

If pins show up in the wrong place, the coordinates are swapped. See the coordinate order table:

| Function | Parameter order | Example (Jakarta) |
|----------|----------------|-------------------|
| `ST_MakePoint` | `(lng, lat)` | `ST_MakePoint(106.8, -6.2)` |
| `ST_MakeEnvelope` | `(west, south, east, north)` | `ST_MakeEnvelope(106.0, -7.0, 107.5, -6.0, 4326)` |
| Leaflet `L.marker` | `[lat, lng]` | `L.marker([-6.2, 106.8])` |

### 3. GIST Index

The GIST index on the geography column is essential for spatial query performance:

```sql
CREATE INDEX idx_koperasi_points_location
ON koperasi_points
USING GIST (location);
```

**How to verify it's being used:**

```sql
EXPLAIN ANALYZE
SELECT id, name FROM koperasi_points
WHERE ST_Within(
  location,
  ST_MakeEnvelope(106.0, -7.0, 107.5, -6.0, 4326)::geography
);
```

Look for `Index Scan using idx_koperasi_points_location` or `Bitmap Index Scan` in the output. If you see `Seq Scan`, the index is not being used — check that the query uses the indexed column directly and that the cast to geography is correct.

**When does the GIST index pay off?** Always, for spatial queries. Even with 100 rows, a GIST index avoids computing `ST_Within` for every row. The index uses an R-tree structure that prunes most rows before the expensive geography computation happens.

### 4. The 500-Point Limit

The API must never return more than 500 points. When the viewport contains more:

```sql
-- In the Supabase RPC function:
CREATE OR REPLACE FUNCTION get_points_in_viewport(
  p_west float8, p_south float8, p_east float8, p_north float8,
  p_status text DEFAULT 'approved'
)
RETURNS json AS $$
DECLARE
  total_count int;
  result json;
BEGIN
  SELECT count(*) INTO total_count
  FROM koperasi_points
  WHERE ST_Within(
    location,
    ST_MakeEnvelope(p_west, p_south, p_east, p_north, 4326)::geography
  )
  AND status = p_status;

  SELECT json_build_object(
    'points', COALESCE(json_agg(row_to_json(t)), '[]'::json),
    'total', total_count,
    'limited', total_count > 500
  ) INTO result
  FROM (
    SELECT id, name, lat, lng, kabupaten, provinsi, status
    FROM koperasi_points
    WHERE ST_Within(
      location,
      ST_MakeEnvelope(p_west, p_south, p_east, p_north, 4326)::geography
    )
    AND status = p_status
    LIMIT 500
  ) t;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;
```

When `limited` is `true`, the frontend should show a "Zoom in to see all cooperatives" message.

### 5. Supabase Client: rpc() vs from()

**Use `supabase.rpc()` for spatial queries.** The Supabase JS client's `from().select()` does not support PostGIS functions in WHERE clauses.

```tsx
// Correct: use rpc() for viewport queries
const { data, error } = await supabase.rpc("get_points_in_viewport", {
  p_west: bounds.west,
  p_south: bounds.south,
  p_east: bounds.east,
  p_north: bounds.north,
  p_status: "approved",
});
```

```tsx
// Use from() only for non-spatial queries
const { data } = await supabase
  .from("koperasi_points")
  .select("id, name, kabupaten")
  .eq("status", "approved")
  .order("created_at", { ascending: false })
  .limit(20);
```

### 6. Denormalized lat/lng Columns

The table has both `location geography(Point, 4326)` AND separate `lat float8` / `lng float8` columns. This is intentional:

- **`location`**: Used for spatial queries (ST_Within, ST_Distance). PostGIS needs this.
- **`lat`, `lng`**: Used by JavaScript code to create Leaflet markers. Extracting lat/lng from a geography column in SQL requires `ST_Y(location::geometry)` and `ST_X(location::geometry)` — the denormalized columns avoid this overhead on every read.

**Keep them in sync on INSERT:**

```sql
INSERT INTO koperasi_points (name, lat, lng, location, kabupaten, provinsi, status)
VALUES (
  $name,
  $lat,
  $lng,
  ST_MakePoint($lng, $lat)::geography,  -- note: lng first, lat second
  $kabupaten,
  $provinsi,
  'pending'
);
```

If you ever update `lat`/`lng`, you MUST also update `location`, and vice versa. A database trigger can enforce this:

```sql
CREATE OR REPLACE FUNCTION sync_location()
RETURNS trigger AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location := ST_MakePoint(NEW.lng, NEW.lat)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_location
BEFORE INSERT OR UPDATE OF lat, lng ON koperasi_points
FOR EACH ROW EXECUTE FUNCTION sync_location();
```

### 7. Indonesia-Specific Geography Notes

- **Longitude range**: 95.0 (Sabang, Aceh, westernmost) to 141.0 (Merauke, Papua, easternmost)
- **Latitude range**: -11.0 (Rote Island, southernmost) to 6.0 (northern Aceh / North Kalimantan)
- **Default center**: lat -2.5, lng 118.0 (roughly central Sulawesi — geographic center of the archipelago)
- **Total east-west span**: ~5,000 km. This is why flat Cartesian geometry distorts and geography is preferred.
- **No antimeridian crossing**: Indonesia does not cross the 180th meridian, so ST_MakeEnvelope works correctly without splitting the bbox.

Bounds validation before INSERT:

```sql
-- In a CHECK constraint or application code:
CHECK (lat BETWEEN -11 AND 6 AND lng BETWEEN 95 AND 141)
```

### 8. Migration Pattern

The exact SQL for setting up the geographic infrastructure from scratch:

```sql
-- Step 1: Enable PostGIS (must be done FIRST, before any geography column)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Step 2: Create the table
CREATE TABLE koperasi_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  lat float8 NOT NULL CHECK (lat BETWEEN -11 AND 6),
  lng float8 NOT NULL CHECK (lng BETWEEN 95 AND 141),
  location geography(Point, 4326) NOT NULL,
  kelurahan text,
  kecamatan text,
  kabupaten text NOT NULL,
  provinsi text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'flagged')),
  photo_url text,
  submitted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 3: GIST index for spatial queries
CREATE INDEX idx_koperasi_points_location
ON koperasi_points USING GIST (location);

-- Step 4: Index for status filtering (used in every viewport query)
CREATE INDEX idx_koperasi_points_status
ON koperasi_points (status);

-- Step 5: Sync trigger
CREATE OR REPLACE FUNCTION sync_location()
RETURNS trigger AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location := ST_MakePoint(NEW.lng, NEW.lat)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_location
BEFORE INSERT OR UPDATE OF lat, lng ON koperasi_points
FOR EACH ROW EXECUTE FUNCTION sync_location();
```

**In Supabase**: PostGIS is pre-enabled on all projects. But always run `CREATE EXTENSION IF NOT EXISTS postgis;` in your migration anyway — it's idempotent and future-proofs the migration for non-Supabase environments.

### 9. Common PostGIS Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Forgetting `CREATE EXTENSION postgis` | `type "geography" does not exist` | Run the extension creation first |
| Swapping lat/lng in `ST_MakePoint` | Pins land in the ocean or wrong continent | `ST_MakePoint(lng, lat)` — longitude first |
| Missing SRID in `ST_MakeEnvelope` | Implicit SRID 0, spatial comparisons fail | Always pass `4326` as the 5th argument |
| Forgetting `::geography` cast on envelope | Type mismatch with geography column | Cast: `ST_MakeEnvelope(...)::geography` |
| Using `ST_Contains` instead of `ST_Within` | Same result but reversed argument order — confusing | `ST_Within(point, envelope)` — "point is within envelope" |
| Not updating `location` when `lat`/`lng` change | Map shows stale positions | Use the sync trigger or update both in application code |
| `LIMIT` without `ORDER BY` | Non-deterministic results — different points on each refresh | Add `ORDER BY created_at DESC` or `ORDER BY id` |

## Checklist Before Committing a DB Migration or Geo Query

- [ ] PostGIS extension is enabled before any geography column is referenced
- [ ] `ST_MakePoint` uses `(lng, lat)` order — longitude first
- [ ] `ST_MakeEnvelope` uses `(west, south, east, north, 4326)` — all four bounds + SRID
- [ ] Geography column has a GIST index
- [ ] EXPLAIN ANALYZE confirms index usage for spatial queries
- [ ] lat/lng CHECK constraints enforce Indonesia bounds (-11 to 6, 95 to 141)
- [ ] lat/lng and location column stay in sync (trigger or application code)
- [ ] Viewport query has `LIMIT 500` and returns a `limited` flag when exceeded
- [ ] Supabase RPC function exists for spatial queries (not using `from().select()`)
- [ ] Migration is idempotent (uses `IF NOT EXISTS`, `CREATE OR REPLACE`)
- [ ] No hardcoded coordinates without a comment explaining what location they represent

## Exit Criteria

The database/query task is done when:

1. Migration runs cleanly on a fresh Supabase project with no errors.
2. `EXPLAIN ANALYZE` on the viewport query shows GIST index usage.
3. Viewport query returns correct points for a known bounding box (e.g., Jakarta metro area).
4. Points outside Indonesia bounds are rejected by CHECK constraints.
5. The 500-point limit is enforced, and the `limited` flag is returned when exceeded.
6. lat/lng and location columns are provably in sync (insert via lat/lng, query via ST_Within, get the same point back).
7. The Supabase RPC function is callable from the Next.js API route and returns well-formed JSON.
