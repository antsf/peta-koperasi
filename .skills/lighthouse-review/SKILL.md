# lighthouse-review

Lighthouse performance and quality review for a map application serving rural Indonesia.

## When to use

Run this skill when reviewing performance of any page, before a release milestone, after adding new dependencies, or when investigating slow load times. Especially relevant for the map page (`/`) which carries the heaviest client-side payload (Leaflet).

## Activation

Trigger: user says "lighthouse review", "performance review", "lighthouse audit", "page speed review", or invokes `/lighthouse-review`.

## Instructions

You are reviewing Lighthouse scores and web performance for a civic-tech crowdsourced map of Indonesian village cooperatives. The audience is the Indonesian general public on budget Android devices over 3G/4G connections. Performance is a civic equity issue — a map that does not load on a budget phone fails the people it is supposed to serve.

Work through each section below in order. Read the relevant files, report findings, and flag violations.

---

### 1. Why Lighthouse Scores Matter Differently Here

A 60 Performance score might be acceptable for a SaaS dashboard used by people on fiber connections with modern MacBooks. It is a civic failure for a map serving users on 3G in Kalimantan, Papua, or rural Sulawesi.

**Target scores:**

| Category | General pages | Map page (`/`) |
|----------|--------------|----------------|
| Performance | >= 85 | >= 80 (Leaflet overhead accepted) |
| Accessibility | >= 90 | >= 90 |
| Best Practices | >= 95 | >= 95 |
| SEO | >= 90 | >= 90 |

The map page gets a 5-point Performance discount because Leaflet is a client-rendered library — LCP will always involve a client-rendered element. This is an inherent cost of interactive mapping, not an optimization failure.

If actual scores are available (from a Lighthouse run or CI report), compare against these targets. If not, perform a code-level audit predicting where scores will fall short.

---

### 2. Largest Contentful Paint (LCP)

The map page challenge: Leaflet renders entirely client-side via `dynamic(() => import(...), { ssr: false })`. This means LCP is a client-rendered element, not server HTML.

**Mitigation strategy — review that these are implemented:**

1. **Server-render meaningful content above the fold.** The header, stats bar (total cooperatives count), and search bar should be server components that render in the initial HTML. Read `src/app/page.tsx` and verify these are NOT inside a `"use client"` boundary.

2. **Map container placeholder.** The map container `<div>` should have:
   - A background color (`bg-slate-100` or similar) so it does not flash white
   - A "Memuat peta..." / "Loading map..." message visible while Leaflet loads
   - Explicit dimensions set in CSS (not computed by JS after load)

   Search for the map container in the page component and the MapView component. Verify the placeholder exists.

3. **Leaflet chunk is separate.** Verify that `MapView` uses `next/dynamic` with `{ ssr: false }` and that Leaflet is NOT imported at the top level of any server component or layout.

**Flag if:**
- The entire page is wrapped in `"use client"` — **CRITICAL** (nothing server-renders, LCP is terrible)
- Map container has no background color or loading message — **WARNING**
- Leaflet is imported in `layout.tsx` or a server component — **CRITICAL**

---

### 3. First Input Delay (FID) / Interaction to Next Paint (INP)

The most interaction-heavy component is `VoteButtons`. Users tap upvote/downvote and expect immediate feedback.

**Review `VoteButtons` component:**

1. **Optimistic UI:** On click, the button should visually update immediately (increment count, change color/state) BEFORE the API call completes. Search for `useState` that tracks a local vote state.

2. **Disable on click:** The button must be disabled immediately when clicked to prevent double-taps. Check for `disabled` attribute or pointer-events management. This should NOT wait for the API response — disable synchronously in the click handler.

3. **Debounce or throttle:** If rapid tapping is possible, verify the click handler is debounced or that the disabled state prevents multiple API calls.

4. **No long tasks:** The click handler should dispatch the API call and return. No synchronous computation in the handler that could block the main thread.

**Flag if:**
- Vote button waits for API response before updating UI — **WARNING**
- Vote button is not disabled during API call — **WARNING**
- Click handler contains synchronous heavy computation — **CRITICAL**

---

### 4. Cumulative Layout Shift (CLS)

Layout shift on a map page is especially jarring — the map jumps and the user loses their place.

**Review these specific CLS risks:**

1. **Map container height.** The Leaflet container must have an explicit height set in HTML/CSS BEFORE JavaScript loads. The standard pattern is `h-[calc(100vh-4rem)]` where 4rem is the header height. This must be set on the container div, not computed after Leaflet initializes.

   Search for the map container's className. Verify it has explicit height.

2. **Header height.** The header must have a fixed height (`h-16` = 4rem). If the header height changes (e.g., wrapping on small screens), the map shifts. Verify the header does not wrap on mobile (375px viewport).

3. **Font loading.** If custom fonts are used (they should not be in this project), verify `font-display: swap` or `optional` is set. Search for `@font-face` or `next/font` imports.

4. **Dynamic content injection.** Stats bar, search results, filter dropdowns — anything that appears after initial render and pushes content down causes CLS. Verify these elements have reserved space.

5. **Map popups and controls.** Leaflet popups are overlays (position: absolute), so they should NOT cause layout shift. Verify no custom popup implementation uses flow layout.

**Flag if:**
- Map container has no explicit height before JS loads — **CRITICAL**
- Header height is not fixed — **WARNING**
- Custom fonts without `font-display` strategy — **WARNING**
- Dynamic content pushes map down after load — **WARNING**

---

### 5. Network Payload Review

Main map page total transfer size should be under 500kB gzipped on first load.

**Budget breakdown (gzipped estimates):**

| Asset | Budget |
|-------|--------|
| Next.js framework | ~87kB |
| Leaflet | ~41kB |
| Leaflet.markercluster | ~20kB |
| FingerprintJS | ~8kB |
| App code + other deps | ~100kB |
| CSS (Tailwind purged) | ~15kB |
| HTML | ~10kB |
| OSM tiles (first viewport) | ~200kB (images, not JS) |
| **Total JS** | **~256kB** |
| **Total transfer** | **~481kB** |

**How to verify:**

1. Run `next build` and check the output. Each route shows its JS size.
2. If `@next/bundle-analyzer` is installed, run `ANALYZE=true next build` and review the treemap.
3. Check `next build` output for any route exceeding 300kB JS (first load).

**Flag if:**
- Total first-load JS exceeds 300kB gzipped — **WARNING**
- Any single route exceeds 350kB first-load JS — **CRITICAL**
- Images are not optimized (no `next/image` or no `loading="lazy"`) — **WARNING**

---

### 6. Third-Party Script Review

**FingerprintJS:**
- Must load asynchronously after the page is interactive
- Must NOT be in the critical rendering path
- Search for how FingerprintJS is loaded. It should be in a `useEffect` or lazy-loaded, not imported at module top level in a layout or page component

**OpenStreetMap tiles:**
- Tiles load on demand as the map viewport changes — this is fine
- Verify no tile preloading that wastes bandwidth on initial load

**No other third-party scripts should exist.** Search for `<script>` tags in `layout.tsx`, `page.tsx`, and any `head.tsx`. Flag any analytics, tracking, or third-party embeds — these violate the project's principles.

**Flag if:**
- FingerprintJS blocks rendering — **WARNING**
- Analytics or tracking scripts found — **CRITICAL** (violates project principles)
- Any third-party script not in the approved list (Next.js, Leaflet, FingerprintJS) — **WARNING**

---

### 7. SEO Review

**Meta tags:**

1. The home page (`/`) must have a meta title and description in Indonesian. Example:
   - Title: "Peta Koperasi Desa Merah Putih — Peta Crowdsource Koperasi Indonesia"
   - Description: meaningful, 120-160 characters, in Indonesian

2. Individual point pages (`/point/[id]`) must have dynamic SEO titles. Expected format:
   `"Koperasi [name] - [kabupaten] | Peta Koperasi Merah Putih"`

   Search for `generateMetadata` or `metadata` export in point page files.

3. **OpenGraph tags:** at minimum, `og:title`, `og:description`, `og:type`. If a point has a photo, `og:image` should be set for approved points.

4. **Canonical URL:** each page should have a canonical URL to prevent duplicate content issues.

5. **robots.txt and sitemap:** verify `robots.txt` allows crawling and a sitemap exists (or `next-sitemap` is configured).

**Flag if:**
- No meta title/description on the home page — **CRITICAL**
- Point pages have no dynamic metadata — **WARNING**
- No OpenGraph tags — **INFO**
- Analytics tracking in meta tags or headers — **CRITICAL**

---

### 8. Accessibility Quick Check

While a full accessibility review is a separate skill, Lighthouse catches common issues:

1. **Color contrast:** Tailwind default colors generally pass. But check status badge colors (yellow on white is notorious for failing contrast). Verify badge text has sufficient contrast.

2. **Image alt text:** all `<img>` tags must have `alt` attributes. Map tile images are decorative (Leaflet handles this). Cooperative photos need descriptive alt text.

3. **Button labels:** vote buttons, submit button, language toggle — all must have accessible names (visible text or `aria-label`).

4. **Heading hierarchy:** one `<h1>` per page, headings in order. The map page h1 might be the project title in the header.

5. **Language attribute:** `<html lang="id">` for Indonesian default. If language is toggled, verify the `lang` attribute updates.

**Flag if:**
- Missing alt text on images — **WARNING**
- Buttons without accessible names — **WARNING**
- Color contrast failure on status badges — **WARNING**
- No `lang` attribute on `<html>` — **WARNING**

---

### 9. Review Checklist

- [ ] LCP: server-rendered content exists above the fold (header, stats, search)
- [ ] LCP: map container has background color and loading message
- [ ] LCP: Leaflet is in a separate dynamic chunk, not in main bundle
- [ ] FID/INP: VoteButtons disable immediately on click
- [ ] FID/INP: VoteButtons use optimistic UI update
- [ ] CLS: map container has explicit height in CSS before JS loads
- [ ] CLS: header has fixed height that does not wrap on mobile
- [ ] CLS: no dynamic content injection causes layout shift
- [ ] Payload: total first-load JS under 300kB gzipped
- [ ] Payload: total page transfer under 500kB gzipped
- [ ] Third-party: FingerprintJS loads async, not blocking
- [ ] Third-party: no analytics or tracking scripts
- [ ] SEO: home page has Indonesian meta title and description
- [ ] SEO: point pages have dynamic metadata with cooperative name
- [ ] Accessibility: all images have alt text
- [ ] Accessibility: all buttons have accessible names
- [ ] Accessibility: status badge colors pass contrast check

---

### 10. Exit Criteria

The review is complete when:

1. Every item in the checklist above is confirmed PASS or has a filed finding
2. All CRITICAL findings are reported with file path, line number, and fix suggestion
3. All WARNING findings are reported with explanation of risk and remediation
4. A Lighthouse score estimate is provided for each category (Performance, Accessibility, Best Practices, SEO) with justification
5. A summary is provided: X critical / Y warning / Z info findings
6. If actual Lighthouse scores are available, they are compared against the target scores and gaps are explained
