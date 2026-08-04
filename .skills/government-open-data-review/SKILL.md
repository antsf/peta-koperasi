# government-open-data-review

Review opportunities and risks when working with or alongside Indonesian government open data in the Koperasi Desa Merah Putih Map project.

Trigger: when evaluating a proposal to import government data, when reviewing data schema changes that accommodate external data, when discussing data partnerships with government agencies, or when reviewing language about the project's relationship to government.

## Context

This project is a community-owned, MIT-licensed crowdsourced map of Indonesian village cooperatives. It is NOT a government project. Government open data exists in parallel and may be complementary, but importing or integrating it carries legal, technical, and positioning risks that must be carefully evaluated.

---

## 1. Indonesian Government Open Data Landscape

### Relevant sources

| Source | URL | What it has | Data quality |
|---|---|---|---|
| **data.go.id** | https://data.go.id | National open data portal. Aggregates datasets from ministries and local governments. | Varies widely. Many datasets are PDFs or poorly structured CSVs. |
| **BPS (Badan Pusat Statistik)** | https://www.bps.go.id | National statistics: population, economic indicators, cooperative counts by region. | Generally reliable for aggregate statistics. Not location-level. |
| **Kemenkop (Kementerian Koperasi dan UKM)** | https://kemenkopukm.go.id | Ministry of Cooperatives. Publishes cooperative registration data. | See section 2. |
| **SATU Data Indonesia** | https://data.go.id/satu-data | Government initiative to standardize open data. | Improving but incomplete. |
| **Local government portals** | Various (e.g., data.jakarta.go.id) | Province/city-level data. May include local cooperative lists. | Highly variable. |

### Review actions

- [ ] If a government data source is proposed for integration, identify which source it is from this table.
- [ ] Check the data format (CSV, JSON, API, PDF). PDFs are not directly usable and require manual extraction.
- [ ] Check the last-updated date. Government data is often years old.

---

## 2. Government Data on Koperasi

The most relevant government dataset is from Kemenkop's **Sistem Informasi Data Tunggal (SIDT)** — a database of registered cooperatives.

### What SIDT typically contains

- Cooperative name (nama koperasi)
- Registration number (nomor badan hukum)
- Type (jenis koperasi: simpan pinjam, konsumen, produsen, etc.)
- Province and kabupaten/kota
- Registration date
- Active/inactive status

### What SIDT typically does NOT contain

- Precise geographic coordinates (latitude/longitude) — this is the key gap this project fills
- Contact information that is current
- Services offered
- Operating hours
- Community verification of existence

### Data quality issues

- **Outdated**: many listed cooperatives are dormant or dissolved but still appear as active.
- **Missing coordinates**: addresses are text-based (village name, street), not geocoded.
- **Inconsistent naming**: the same cooperative may appear with different name variations.
- **Mixed types**: includes all cooperative types, not just village cooperatives (koperasi desa). Filtering is needed.
- **No community signal**: no way to know if a listed cooperative is actually findable, accessible, or serving its community.

### Review actions

- [ ] If SIDT data is proposed for import, verify which fields are available and how they map to this project's schema.
- [ ] Check for the presence of geographic coordinates. If absent, the data cannot be directly placed on the map without geocoding.
- [ ] Assess the freshness of the dataset (when was it last updated?).

---

## 3. Risks of Importing Government Data

### License compatibility

- **Risk**: Indonesian government data may not have an explicit open license. The absence of a license does NOT mean the data is public domain.
- **Review**: check if the dataset has a stated license (e.g., Creative Commons, Indonesia's Open Data License). If no license is stated, do NOT import the data — it may be copyrighted by the government agency.
- **MIT compatibility**: if the government data has a CC-BY or CC0 license, it is compatible with this project's MIT license. If it has CC-BY-SA (share-alike), it MAY create obligations on the combined dataset. Evaluate carefully.

### Data accuracy

- **Risk**: importing inaccurate government data pollutes the project's dataset. If government data says a cooperative exists at location X but it actually closed 3 years ago, the map becomes less trustworthy.
- **Review**: any imported government data MUST be flagged as "unverified — from government registry" and distinguished from community-verified data. Never mix unverified imports with community-verified pins without clear labeling.

### Schema mismatch

- **Risk**: government data fields may not map cleanly to this project's schema. Forcing a fit loses information or creates nulls.
- **Review**: create an explicit field mapping document before any import. Identify which fields have no equivalent and how they will be handled.

### Review actions

- [ ] Verify the government dataset has an explicit open license before any import.
- [ ] Verify imported data will be clearly labeled as unverified/government-sourced.
- [ ] Verify a field mapping document exists before import.
- [ ] Verify the import does not silently overwrite community-verified data.

---

## 4. The Complementary Relationship

Government data and community data serve different purposes:

| | Government data (SIDT etc.) | Community data (this project) |
|---|---|---|
| **Answers the question** | "What cooperatives are officially registered?" | "What cooperatives can people actually find and use?" |
| **Strength** | Comprehensive registration records | Verified locations, community trust |
| **Weakness** | May include defunct cooperatives, no coordinates | May miss newly registered cooperatives |
| **Update mechanism** | Bureaucratic, slow | Crowdsourced, can be fast |

### The value proposition

This project's unique value is that it provides **what government data cannot**: verified, geolocated, community-curated cooperative information. Importing government data wholesale undermines this value unless it is clearly separated and used only as a discovery layer (e.g., "here are cooperatives that officially exist but haven't been verified yet — can you verify one near you?").

### Review actions

- [ ] If government data import is proposed, verify it is positioned as a discovery/verification layer, not as verified data.
- [ ] Verify the UI clearly distinguishes government-sourced pins from community-verified pins.

---

## 5. Data Export for Government Use

In v2, the project may provide a data export API. Review considerations:

### License

- The project is MIT-licensed. MIT applies to the code. The data itself should also carry an open license.
- Recommend the data be explicitly licensed under **CC0** (public domain dedication) or **CC-BY 4.0** (attribution required). This allows government agencies, researchers, and anyone else to use it freely.
- MIT for code, CC-BY 4.0 or CC0 for data — this is a common and well-understood pattern.

### Government agency usage

- A government agency CAN use MIT/CC-BY/CC0 data freely. There are no restrictions.
- The project should welcome government use of its data — this is a feature, not a risk.
- Do NOT add restrictions that prevent government use (e.g., non-commercial clauses).

### Review actions

- [ ] If a data export API is proposed, verify the data license is explicitly stated (not just inherited from code license).
- [ ] Verify the data license allows government use without restrictions.
- [ ] Verify export includes metadata (source, verification status, last updated) not just coordinates.

---

## 6. Privacy Review

### Government data privacy risks

If government data includes any of the following, it MUST be reviewed before inclusion:

| Field | Risk level | Action |
|---|---|---|
| Cooperative manager name (nama pengurus) | Medium | May be public record, but verify. Do not include personal names without consent or clear legal basis. |
| Personal phone numbers | High | Do NOT include. Even if published by government, re-publishing personal phone numbers on a public map is a privacy violation. |
| Personal email addresses | High | Do NOT include. Same reasoning as phone numbers. |
| Cooperative office phone | Low | This is a business contact, acceptable to include. |
| Cooperative office address | Low | This is a business location, acceptable to include. |
| Registration number (nomor badan hukum) | Low | Public record, acceptable to include. |
| Financial data (assets, revenue) | Medium | May be outdated or misleading. Include only if clearly dated and sourced. |

### Community-submitted data privacy

- The project's own contribution form should NOT collect personal information beyond what is necessary.
- Contributor identity (who submitted a pin) should be tracked internally for moderation but NOT displayed publicly unless the contributor opts in.

### Review actions

- [ ] If government data includes personal names or contact info, verify these are filtered out before import.
- [ ] If the contribution form collects personal data, verify a privacy policy exists.
- [ ] Verify contributor identity is not exposed publicly without consent.

---

## 7. The "Official Endorsement" Trap

### The risk

If the project uses government data or government branding, users may perceive it as an official government platform. This creates:

- **Liability**: if the data is wrong, users may blame the government or expect government-level accountability.
- **Dependency**: the government may ask the project to change or take down data.
- **Mission drift**: the project's community-driven identity gets diluted.

### Review actions

- [ ] Search the codebase, README, and UI for language that implies official government endorsement or partnership. Flag any found.
- [ ] Verify the project clearly states it is a community project, not a government initiative.
- [ ] If government logos or branding are used anywhere, flag for removal.
- [ ] Acceptable language: "Uses open data from [source]" with attribution. NOT acceptable: "Official koperasi map" or "In partnership with Kemenkop".

---

## 8. ODbL Compatibility

If the project later wants to contribute its data to OpenStreetMap, the data must be compatible with OSM's **Open Database License (ODbL)**.

- **MIT code license**: does not affect data. MIT is a software license.
- **Data license matters**: if the project's data is CC0, it can be contributed to ODbL (public domain can go anywhere). If CC-BY 4.0, the attribution requirement is compatible with ODbL's attribution requirement. If CC-BY-SA, the share-alike clause may conflict with ODbL — avoid this.
- **Government data in the mix**: if government data has been imported and it carries a restrictive license, that data CANNOT be contributed to OSM. Only the community-contributed portion can.

### Review actions

- [ ] If OSM contribution is planned, verify the project's data license is ODbL-compatible (CC0 or CC-BY 4.0).
- [ ] If government data has been imported, verify it is clearly separated so the community-contributed data can be independently exported for OSM.

---

## Checklist: Evaluating a Proposal to Integrate Government Open Data

Run this checklist for any proposal to import, display, or reference government data:

- [ ] **License identified**: the government dataset has an explicit open license (CC0, CC-BY, or equivalent). If no license is stated, STOP — do not import.
- [ ] **License compatible**: the license is compatible with MIT (code) and the project's data license.
- [ ] **Data freshness**: the dataset was updated within the last 2 years. If older, flag as potentially unreliable.
- [ ] **Field mapping**: a document exists mapping government fields to project schema fields.
- [ ] **Privacy screened**: personal names, phone numbers, and email addresses are filtered out.
- [ ] **Verification status**: imported data is labeled as "unverified — government registry" and visually distinct from community-verified data.
- [ ] **No overwrite**: the import does not overwrite or merge with existing community-verified data without explicit review.
- [ ] **No official branding**: the import does not introduce government logos, official language, or endorsement claims.
- [ ] **ODbL safe**: if the data may later go to OSM, the government data's license allows ODbL relicensing, OR the government data is kept separate.
- [ ] **Rollback plan**: the import can be fully reverted if problems are discovered.

---

## Exit Criteria

This skill's review is complete when:

1. Any proposed government data source has been identified and its license verified.
2. Privacy screening has been performed on the proposed data.
3. A field mapping document exists (if import is proposed).
4. The UI distinguishes government-sourced data from community-verified data (if import is proposed).
5. The project's language has been reviewed for official endorsement implications.
6. The project's data export license has been verified as open and government-friendly.
7. ODbL compatibility has been assessed.
8. All items in the integration checklist above have been checked (if integration is proposed).
