# openstreetmap-best-practices

Review OpenStreetMap usage in the Koperasi Desa Merah Putih Map project for compliance, best practices, and future readiness.

Trigger: when reviewing Leaflet/map configuration, tile usage, attribution, geocoding plans, or any OSM-related code or discussion.

## Context

This project uses Leaflet with OpenStreetMap tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) to display a crowdsourced map of Indonesian village cooperatives. The project is MIT-licensed, open-source, and community-owned. The project's data (koperasi locations) is separate from OSM data but may eventually be contributed back to OSM.

---

## 1. Tile Usage Policy Compliance

OSM's tile usage policy (https://operations.osmfoundation.org/policies/tiles/) has hard requirements:

- **Attribution**: the map MUST display "© OpenStreetMap contributors" with a link to https://www.openstreetmap.org/copyright. Leaflet's `L.tileLayer` adds this automatically when `attribution` is set correctly. Verify the attribution control is enabled (Leaflet enables it by default; do not set `attributionControl: false` on the map).
- **User-Agent**: HTTP requests to tile.openstreetmap.org MUST include a valid User-Agent or HTTP Referer header. Browsers send Referer automatically, so this is satisfied for normal web usage. If any server-side or script-based tile fetching exists, it MUST set a custom User-Agent.
- **No heavy automated use**: do not pre-fetch, bulk-download, or cache tiles from tile.openstreetmap.org outside of normal browser caching. No tile scraping scripts. No generating static map images by downloading tiles server-side.
- **Rate limiting**: the OSM tile server is a shared community resource. The project must not generate sustained high traffic against it. See section 5 for thresholds.

### Review actions

- [ ] Read the Leaflet map initialization code. Confirm `attribution` includes `© OpenStreetMap contributors` with the copyright link.
- [ ] Confirm `attributionControl` is NOT set to `false`.
- [ ] Search the codebase for any server-side tile fetching, tile caching scripts, or static map image generation. Flag any found.
- [ ] Search CSS for any rule that hides `.leaflet-control-attribution` (e.g., `display: none`, `visibility: hidden`, `opacity: 0`). Flag if found.

---

## 2. Attribution Verification

Leaflet automatically adds OSM attribution when you use the standard tile URL pattern and pass the `attribution` option to `L.tileLayer`. Verify:

```
Expected attribution HTML (or equivalent):
&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors
```

### Review actions

- [ ] Read the tile layer configuration. The `attribution` string must credit OpenStreetMap.
- [ ] Load the map in a browser (or review screenshots/tests). The attribution must be visible in the bottom-right corner.
- [ ] If a custom attribution control position is used, verify the text is still legible and not obscured by other UI elements.

---

## 3. Alternative Tile Providers

The default OSM tiles (`tile.openstreetmap.org`) are functional but visually busy for a pin-heavy map. Free alternatives that use OSM data:

| Provider | URL pattern | Visual style | Notes |
|---|---|---|---|
| **Carto Light** | `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png` | Clean, muted, ideal for data overlays | Free tier generous; requires Carto attribution |
| **Carto Voyager** | `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png` | Modern, colorful but not distracting | Same terms as Carto Light |
| **Stamen Toner Lite** | Via Stadia Maps now | High contrast, minimal | Requires Stadia Maps account for production |

### When to consider switching from default OSM tiles

- The map has many pins and the default tiles make them hard to read (visual clutter).
- The project wants a more polished, professional look.
- The project is hitting OSM tile server rate limits.

### When NOT to switch

- The project is in early development and traffic is low. Default OSM tiles are fine.
- The alternative provider requires an API key or account that adds operational burden.

### Review actions

- [ ] If the map has more than ~100 visible pins at any zoom level, recommend evaluating Carto Light tiles for readability.
- [ ] If switching providers, verify the new provider's attribution requirements are met (Carto requires `© CARTO` in addition to OSM attribution).

---

## 4. The Relationship to OpenStreetMap Data

This project's koperasi location data is separate from OSM. However, high-quality koperasi data COULD be contributed back to OSM as Points of Interest (POIs). This is a future consideration.

### Prerequisites for contributing data to OSM

- **Data quality threshold**: locations must be verified (at least one community member has confirmed the pin is in the right place). Unverified crowdsourced data should NOT be pushed to OSM.
- **OSM tagging**: koperasi would use `amenity=cooperative` or `office=cooperative` (check current OSM tagging conventions at the time of contribution).
- **License compatibility**: this project is MIT, which is permissive. Data contributed to OSM must be compatible with ODbL (Open Database License). MIT-licensed data can be contributed to ODbL — the contributor grants the ODbL license at upload time. This is fine.
- **Bulk imports**: OSM has a strict bulk import policy (https://wiki.openstreetmap.org/wiki/Import/Guidelines). Any batch upload of koperasi data must follow this process, including community discussion on the OSM imports mailing list.
- **Do not auto-sync**: never set up an automated pipeline that pushes project data to OSM without human review.

### Review actions

- [ ] If a proposal to contribute data to OSM is made, verify the data meets the quality threshold above.
- [ ] Verify the import guidelines are followed if bulk import is proposed.
- [ ] Flag any code that automatically writes to OSM APIs.

---

## 5. Tile Server Etiquette and Scaling

OSM's tile server is free but shared. At scale, the project must use alternatives.

### Traffic thresholds

| Monthly tile requests | Action needed |
|---|---|
| < 50,000 | OSM default tiles are fine |
| 50,000 - 250,000 | Monitor usage; consider switching to Carto or another provider with higher limits |
| 250,000+ | Self-host tiles or use a CDN/proxy. Options: tile.openstreetmap.fr (French OSM community mirror), or set up a Cloudflare caching proxy in front of a tile provider |

### Self-hosting options (when needed)

- **tile.openstreetmap.fr**: community-run mirror, more permissive on traffic, but still a shared resource.
- **Cloudflare proxy**: put a Cloudflare Worker in front of a tile URL to cache tiles at the edge. Reduces load on upstream. Easy to set up.
- **Full self-hosting**: use `openstreetmap-tile-server` Docker image with regional Indonesia extract from Geofabrik. Only needed at very high scale.

### Review actions

- [ ] Check if the project has analytics or logging that tracks tile request volume.
- [ ] If traffic is unknown, recommend adding basic analytics (even just counting page views as a proxy).
- [ ] If tile request volume exceeds 50,000/month, recommend a scaling plan.

---

## 6. Geocoding Policy

### Current state (v1)

The project does NOT use geocoding. Contributors manually enter region fields (provinsi, kabupaten/kota, kecamatan, kelurahan/desa). This is the correct approach for v1 — it avoids geocoding API dependencies and works well for Indonesia's administrative hierarchy.

### Future state (v2+)

If geocoding is added:

- **Use Nominatim** (OSM's geocoder), NOT Google Maps Geocoding API, Mapbox, or other proprietary geocoders. This aligns with the project's open-source principles and avoids vendor lock-in.
- **Nominatim usage policy** (https://operations.osmfoundation.org/policies/nominatim/):
  - Maximum 1 request per second (absolute limit, not average).
  - No bulk geocoding (do not geocode a list of addresses in a loop).
  - Cache results — if you geocode an address, store the result and do not re-geocode the same address.
  - Set a custom User-Agent header identifying this project.
  - No heavy autocomplete usage against the public Nominatim instance (each keystroke = 1 request; use debouncing with >= 300ms delay).
- **Self-hosted Nominatim**: if the project needs more than light geocoding, self-host Nominatim with an Indonesia data extract. The Docker setup is straightforward.

### Review actions

- [ ] If geocoding code is found in v1, flag it — it should not exist yet.
- [ ] If geocoding is proposed for v2, verify it uses Nominatim, not a proprietary API.
- [ ] If Nominatim is used, verify: rate limiting (1 req/s), result caching, custom User-Agent, debounced autocomplete.
- [ ] Search for imports/references to Google Maps Geocoding, Mapbox Geocoding, or other proprietary geocoders. Flag any found.

---

## 7. Indonesia-Specific OSM Quality

OSM coverage in Indonesia varies significantly:

- **Java, Bali**: well-mapped. Roads, buildings, POIs are relatively complete. The map background will look detailed.
- **Sumatra, Kalimantan, Sulawesi**: moderate coverage. Major roads and cities are mapped, but rural areas may be sparse.
- **Papua, Maluku, Nusa Tenggara Timur**: limited coverage. Many villages have minimal or no OSM data. The map background may show little context.

### Impact on this project

- This affects the **visual context** behind koperasi pins, not the koperasi data itself.
- In areas with poor OSM coverage, koperasi pins may appear on a mostly blank map. This is expected and acceptable.
- Do NOT use poor OSM coverage as a reason to block adding koperasi data in those areas. The koperasi data is valuable regardless of the background map quality.

### Review actions

- [ ] If the UI gives users the impression that blank areas have no koperasi, add a note explaining that map detail varies by region.
- [ ] Do not gate koperasi data entry on OSM map quality.

---

## Checklist: OSM Tile Usage Compliance

Run this checklist when reviewing any PR that touches map configuration, tile layers, or attribution:

- [ ] Attribution text includes "© OpenStreetMap contributors" with link to copyright page
- [ ] Attribution control is visible and not hidden by CSS
- [ ] No server-side tile fetching or bulk downloading
- [ ] No proprietary geocoding APIs (Google, Mapbox) — use Nominatim if needed
- [ ] If Nominatim is used: rate limit enforced, results cached, custom User-Agent set
- [ ] Tile URL uses `https://` (not `http://`)
- [ ] No tile prefetching or aggressive caching beyond browser defaults
- [ ] If alternative tile provider is used, its attribution requirements are also met

---

## Exit Criteria

This skill's review is complete when:

1. The tile layer configuration has been read and attribution verified.
2. CSS has been searched for attribution-hiding rules.
3. No server-side tile fetching or bulk downloading exists.
4. No proprietary geocoding APIs are in use.
5. A scaling recommendation exists if traffic data is available.
6. Any OSM data contribution proposals have been evaluated against the import guidelines.
7. All items in the compliance checklist above have been checked.
