# geo-data-review

Review submitted geographic data for validity and quality in the Koperasi Desa Merah Putih Map — the last line of defense before bad data enters the cooperative map.

## When to Use

Activate this skill when reviewing submitted koperasi data points, writing validation logic for the submission API, building the admin/moderation review flow, or debugging data quality issues.

## Coordinate Validation

### Indonesia Bounds Check

Every submitted point MUST fall within Indonesia's bounding box:

- **Latitude**: -11.0 to 6.0
- **Longitude**: 95.0 to 141.0

This validation must happen at THREE layers:

1. **Client-side** (immediate feedback): Reject before the form submits.
2. **API route** (server-side): Reject before calling Supabase.
3. **Database CHECK constraint**: Reject at the data layer as the final safeguard.

```tsx
// Shared validation function
function isWithinIndonesia(lat: number, lng: number): boolean {
  return lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141;
}
```

```sql
-- Database constraint
CHECK (lat BETWEEN -11 AND 6 AND lng BETWEEN 95 AND 141)
```

### The Null Island Trap

Null Island is the point at coordinates (0, 0) — in the Gulf of Guinea, off the coast of West Africa. It is the most common garbage coordinate in geographic data.

**Why it happens:**
- Uninitialized variables defaulting to 0
- GPS devices that haven't acquired a fix returning (0, 0)
- Form submissions where coordinate fields were left empty and parsed as 0
- API errors returning null that get coerced to 0

**Detection:**
```tsx
function isNullIsland(lat: number, lng: number): boolean {
  return lat === 0 && lng === 0;
}
```

Validate bounds BEFORE inserting — not after. Once (0, 0) is in the database, it's a phantom pin in the Atlantic Ocean that might not be noticed for weeks.

### Swapped Coordinates Detection

A common submission error: the user or client code swaps latitude and longitude.

Jakarta is at approximately lat -6.2, lng 106.8. If swapped, the point becomes lat 106.8, lng -6.2 — which is outside Indonesia bounds and will be caught by the bounds check.

But some Indonesian locations have coordinates where both values fall within plausible ranges when swapped. For example, a point at lat -2.0, lng 120.0 — when swapped to lat 120.0, lng -2.0 — fails bounds check (lat 120 is invalid). So the bounds check catches most swaps.

**The edge case**: If a submission has lat and lng both within -11 to 6 (e.g., lat 3.5, lng 5.0), it passes bounds but might be swapped. These are rare — lng 5.0 is in West Africa. Flag any submission where lng < 95 for manual review.

### Ocean Detection

Some points might pass the Indonesia bounding box check but land in the ocean (Indonesia is ~80% water by bounding box area). Full ocean detection requires a coastline polygon dataset, which is out of scope for this project.

**Pragmatic approach:**
- The Indonesia bounds check catches the worst cases.
- Community voting handles ocean-placed pins — voters can see the map preview and flag pins that are clearly in the water.
- In the moderation UI, always show the submitted point on a map preview so reviewers can visually verify land placement.

## Address Field Quality

### Expected Fields

| Field | Required | Example | Notes |
|-------|----------|---------|-------|
| `name` | Yes | "Koperasi Mekar Jaya" | Name of the cooperative |
| `kelurahan` | No | "Menteng" | Village/urban neighborhood |
| `kecamatan` | No | "Menteng" | District |
| `kabupaten` | Yes | "Kota Jakarta Pusat" | Regency/city |
| `provinsi` | Yes | "DKI Jakarta" | Province |

### What Makes a Good Address Entry

- **Real place names**: "Kota Bandung" is good. "asdf" is bad. "test123" is bad.
- **Consistent formatting for kabupaten**: Regencies use "Kabupaten X" (e.g., "Kabupaten Bogor"). Cities use "Kota X" (e.g., "Kota Bogor"). Both are valid — the key is that the name matches an actual Indonesian administrative region.
- **Province names**: Indonesia has 38 provinces. The name should match one of them. Common variations to watch for:
  - "DKI Jakarta" vs "Jakarta" — both refer to the same province
  - "DI Yogyakarta" vs "Yogyakarta" vs "DIY" vs "Jogja"
  - "Jawa Barat" vs "JAWA BARAT" vs "Jabar"

### Province Name Normalization Policy

The project stores province names **as submitted** — no automatic normalization. This is a deliberate decision:

- Normalization logic is complex and error-prone for Indonesian administrative names.
- Community members know their own region's correct name.
- A future region filter feature may add a normalization layer.

**However**, reviewers should flag extreme inconsistencies that will cause problems:
- All-caps entries ("JAWA BARAT") when every other entry uses title case
- Abbreviations ("Jabar") when every other entry uses the full name
- Obvious misspellings ("Jawa Braat")

## Photo Review Criteria

Submitted photos should show evidence of the cooperative's existence:

**Acceptable:**
- Photo of the cooperative's building or storefront
- Photo of cooperative activities (meetings, farming, production)
- Photo of the cooperative's signage or banner
- Photo of cooperative products or services

**Flag for review:**
- Close-up of a person's face (privacy concern)
- Photo of an ID card, KTP, or official document (PII risk — should be rejected)
- Completely unrelated image (landscape with no cooperative context, memes, etc.)
- Very low resolution or entirely black/white images (possible placeholder uploads)
- Screenshots of other apps or websites

**The photo field is optional.** A submission without a photo is valid — many cooperatives in rural areas may not have a readily available photo.

## How Community Voting Handles Data Quality

The data quality system has two layers:

### Layer 1: Technical Validation (API enforces)

These are hard rejections — the API returns an error:

- Coordinates outside Indonesia bounds
- Missing required fields (name, kabupaten, provinsi)
- Null Island coordinates (0, 0)
- Invalid data types (non-numeric lat/lng)

### Layer 2: Community Review (humans decide)

These are soft quality issues that the community corrects through the voting system on `/pending`:

- Pin placed slightly off from the actual location
- Misspelled cooperative name
- Wrong kabupaten or provinsi
- Photo doesn't match the cooperative
- Duplicate submission for a cooperative that already exists

The pending page shows each submission with a map preview, and community members vote to approve, flag, or reject. A threshold of votes (configurable) moves the submission to approved or flagged status.

**Key principle**: Technical validation is strict and automated. Content quality review is delegated to the community. Don't try to automate judgment calls about whether a photo is "good enough" — let the community decide.

## Data Review Checklist

When reviewing a submitted koperasi point (either in code review or in the moderation UI):

- [ ] Coordinates are within Indonesia bounds (lat -11 to 6, lng 95 to 141)
- [ ] Coordinates are not (0, 0) — Null Island
- [ ] Coordinates are not obviously swapped (check if pin lands on land in the map preview)
- [ ] `name` field contains a plausible cooperative name (not test data, not empty string)
- [ ] `kabupaten` matches a real Indonesian regency or city
- [ ] `provinsi` matches a real Indonesian province (no abbreviations, no all-caps unless project-wide convention)
- [ ] Photo (if provided) shows the cooperative or its activities, not PII or irrelevant content
- [ ] Not a duplicate of an existing approved point (check by name + proximity)
- [ ] If the submission has community votes, the vote counts are displayed and make sense

## Exit Criteria

The data review task is done when:

1. All three validation layers are in place (client, API, database constraint) for coordinate bounds.
2. Null Island (0, 0) is explicitly rejected at the API level with a clear error message.
3. The moderation UI shows a map preview for each submission so reviewers can visually verify location.
4. Photo review criteria are documented and visible to moderators.
5. The voting system on `/pending` allows community members to approve, flag, or reject submissions.
6. Required fields (name, kabupaten, provinsi, lat, lng) are enforced at the API level.
7. No submitted data can bypass bounds validation by going directly to the database (CHECK constraints are in place).
