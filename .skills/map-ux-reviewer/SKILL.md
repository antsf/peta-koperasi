# map-ux-reviewer

UX review expertise for map interactions and civic-tech conventions in the Koperasi Desa Merah Putih Map — ensuring the cooperative map is usable for Indonesian citizens on all devices.

## When to Use

Activate this skill when reviewing or building: map UI interactions, the submission flow, the pending/moderation page, mobile responsiveness of map components, loading states, or any user-facing map feature.

## The Indonesia Challenge

Indonesia is the world's largest archipelago: 17,000+ islands spanning 5,000 km east-to-west. At the default zoom level 5, the entire country fits on screen — but individual pins are invisible specks.

**Consequences for UX:**

- **Clustering is not optional.** At zoom 5, even 50 pins overlap into an unreadable blob. `leaflet.markercluster` must be active, decluttering at zoom < 8.
- **The first impression is overwhelming.** A first-time visitor sees an enormous island chain with cluster bubbles. The UX must guide them: "Click a cluster or zoom into your region."
- **Region diversity is extreme.** A user in Aceh (western tip) and a user in Papua (eastern tip) are 5,000 km apart. The map should not assume a "default region" — it should start zoomed out to show the whole country.

## The Empty Map Problem

Before the project has significant data, a first-time visitor may see a map of Indonesia with zero pins. This is demoralizing and suggests a dead project.

**Solutions (implement in order of priority):**

1. **Call-to-action overlay**: When zero approved points exist in the viewport, show a centered message: "Belum ada koperasi di area ini. Jadilah yang pertama menambahkan!" (No cooperatives in this area yet. Be the first to add one!) with a prominent "Tambah Koperasi" button.
2. **Seed data**: Pre-populate with a small number of verified cooperatives in major cities (Jakarta, Surabaya, Bandung, Medan, Makassar) so the map is never completely empty at launch.
3. **Counter in header**: Show a global count ("127 koperasi terdaftar") to communicate momentum even when the current viewport is empty.

## Pin Click to Popup to Detail Page

The interaction follows a two-step disclosure pattern:

```
Pin tap/click → Popup (minimal info) → "Lihat Detail" link → /point/[id] (full info)
```

### Why Two Steps

- **Mobile constraint**: A full-detail popup on a 375px screen is unreadable. The popup shows only: cooperative name, kabupaten, and a "Lihat Detail" link.
- **Scan-ability**: Users scanning the map want to quickly check multiple pins. Lightweight popups let them tap, glance, dismiss, tap another. A full-detail popup forces reading before dismissing.
- **Deep linking**: The detail page at `/point/[id]` is shareable and bookmarkable. A popup is not.

### Popup Design Rules

- Max width: 250px (fits on 375px mobile screens with margin)
- Content: cooperative name (bold, truncated at 2 lines), kabupaten/provinsi, "Lihat Detail" link
- No images in popups (slow to load, wastes mobile bandwidth)
- Popup closes when clicking elsewhere on the map (default Leaflet behavior — do not override)

### Detail Page Content

The `/point/[id]` page shows everything:
- Cooperative name, full address (kelurahan through provinsi)
- Map thumbnail showing the pin location (static or small interactive map)
- Photo (if available)
- Submission date, approval status
- Vote counts (if pending)

## Submit Flow UX

### The Map-Click-to-Drop-Pin Interaction

When a user enters submission mode:

1. **Mode entry**: User clicks "Tambah Koperasi" (Add Cooperative) button. The map enters pin-drop mode.
2. **Visual feedback**: Cursor changes to crosshair (desktop). A centered message appears: "Klik peta untuk menempatkan pin" (Click the map to place the pin).
3. **Pin placement**: User clicks/taps the map. A draggable pin appears at that location. The pin should be visually distinct (e.g., pulsing, larger, different color) from existing pins.
4. **Adjustment**: User can drag the pin to fine-tune placement. Coordinates update in real-time in the form.
5. **Form appears**: A form slides in (sidebar on desktop, bottom sheet on mobile) with fields for name, address, photo upload.
6. **Confirmation**: User submits. Pin changes to "pending" color (yellow). Success toast: "Terima kasih! Data Anda akan ditinjau oleh komunitas."

### Mobile Submit Considerations

- The form must not cover the map entirely — the user needs to see where their pin is while filling the form.
- A bottom sheet pattern (half-screen, draggable) works well: map visible on top, form on bottom.
- The "place pin" tap must have generous tap tolerance (15px minimum) — fat fingers on small screens.
- Reverse geocoding (coordinates to address) can pre-fill the kabupaten/provinsi fields, reducing manual input.

## Pending Page UX

The `/pending` route is the community moderation dashboard. It shows submissions awaiting approval.

### Design Principles

- **Trust spectrum, not binary**: Show vote counts (e.g., "12 approve, 2 flag") rather than just "pending." This communicates community consensus.
- **Map + list hybrid**: Show pending pins on a map (yellow pins) AND as a scrollable list below. Some users prefer visual scanning (map), others prefer systematic review (list).
- **Each submission card shows**: Name, kabupaten, map thumbnail with the pin, photo thumbnail (if any), vote buttons, vote counts, submission date.
- **Vote buttons**: "Setuju" (Approve) with a checkmark, "Tandai" (Flag) with a warning icon. Buttons must show current counts. Use color to reinforce meaning: green for approve, orange for flag.
- **No "reject" button for regular users**: Only admins can reject. Regular users can only approve or flag. Flagged submissions get admin review.

### Visual Tone

The moderation dashboard should feel collaborative, not clinical. These are community members contributing data, not suspects being investigated. Use warm language: "Bantu verifikasi data ini" (Help verify this data) instead of "Review submission #4523."

## Language Toggle

### Placement Rules

- The language toggle (ID/EN) MUST be visible in the top navigation bar at all times.
- It must NOT be buried in a hamburger menu, settings page, or footer.
- On mobile, it sits in the header bar — even if space is tight, it stays visible.
- Use flag icons (Indonesian flag for ID, UK/US flag for EN) alongside the text labels for quick recognition by non-readers of the current language.

**Rationale**: If the interface loads in English and a non-English-speaking Indonesian user needs to switch, they must find the toggle without understanding any English. A flag icon is universally recognizable. Placing it in a menu labeled "Settings" (English) defeats the purpose.

## Loading States

### While Fetching Pins (map moveend re-fetch)

- Do NOT show a full-screen spinner over the map. The map should remain interactive during data loading.
- Show a small, unobtrusive loading indicator: a thin progress bar at the top of the map, or a small spinner in the corner.
- Existing pins should remain visible until new pins load (optimistic update pattern). Clearing the map on every pan creates a jarring flash.
- If the fetch takes more than 3 seconds, show a subtle "Loading cooperatives..." text overlay.

### Initial Page Load

- The map container shows a gray placeholder with a subtle pulse animation while Leaflet loads (dynamic import).
- Once the map tiles load but before pins arrive, the map is interactive (user can pan/zoom) — pins appear asynchronously.

### Error State

- If the pin fetch fails, show a non-blocking toast: "Gagal memuat data. Coba lagi." (Failed to load data. Try again.) with a retry button.
- Do NOT show an empty map with no explanation — users will think the area has no data.

## Zoom-to-Fit on Region Filter

When a user selects a province or kabupaten from a filter dropdown:

- The map should animate (fly) to the bounding box of that region.
- Use `map.flyToBounds()` with a reasonable padding (e.g., 50px) so pins aren't right at the edge.
- The moveend event will trigger a re-fetch for that region's pins.

Do NOT just filter existing pins without moving the map — the user might be zoomed into Papua while filtering for Jawa Barat, resulting in an empty visible map with filtered data off-screen.

## Anti-Patterns to Catch in Review

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Pins smaller than 24x24px | Untappable on mobile | Minimum pin size 24x36px with 44x44px tap target |
| Popup wider than 280px | Overflows on 375px mobile screens | Max popup width 250px |
| Submit button below the fold | Users don't know they can contribute | Floating action button (FAB) or prominent header CTA |
| Full-screen loading spinner on map | Map feels broken; blocks panning | Small corner indicator; keep map interactive |
| Clearing all pins before new ones load | Jarring flash on every pan | Keep old pins until new data arrives |
| Language toggle in hamburger menu | Non-English speakers can't find it | Always-visible in header bar with flag icons |
| Detail-heavy popup | Unreadable on mobile; slow if it loads photos | Minimal popup, full detail on /point/[id] page |
| No empty state messaging | New visitors think the map is broken | Show "be the first to add" CTA when viewport is empty |
| Map without Indonesia bounds constraint | Users pan to Australia or China and see nothing | Set maxBounds to Indonesia bounding box |
| Cluster bubbles that just show numbers | No context for what the number means | Style clusters with a label like "12 koperasi" at higher zooms |

## Accessibility

Map interactions are inherently inaccessible — screen readers cannot meaningfully interact with a Leaflet map. The project must provide alternative access:

- **The `/pending` list view** must be fully keyboard-navigable. Tab through submission cards, Enter to expand details, arrow keys to navigate vote buttons.
- **The detail page** (`/point/[id]`) must be accessible: proper heading hierarchy, alt text on photos, semantic HTML.
- **Skip-to-content link**: Since the map is the first major element, provide a "Skip to list" link for keyboard users.
- **ARIA labels** on map controls: zoom buttons, layer toggles, and the submit button should have descriptive labels.
- **Color is not the only indicator**: Pin status uses color (green/yellow/orange) but the shape or icon inside the pin must also differ for colorblind users. The SVG pin design includes a white circle for approved, a question mark for pending, and an exclamation mark for flagged.

## UX Checklist Before Shipping a Map-Related Change

- [ ] Map loads without error on mobile (375px width) and desktop (1440px width)
- [ ] Pins are tappable on mobile (minimum 44x44px tap target)
- [ ] Popups fit within the viewport on mobile (max 250px wide)
- [ ] Clustering is active at zoom levels < 8
- [ ] Empty viewport shows a helpful message and submit CTA
- [ ] Submit flow works on touch devices (pin drop via tap, form in bottom sheet)
- [ ] Language toggle is visible in the header without opening any menu
- [ ] Loading states are non-blocking (map stays interactive during fetch)
- [ ] Old pins persist until new pins load (no flash-clear on pan)
- [ ] Region filter zooms the map to the selected region
- [ ] Pending page has both map and list views
- [ ] Vote buttons show current counts and use semantic colors
- [ ] Detail page is accessible (headings, alt text, keyboard navigation)
- [ ] No horizontal scroll on any mobile viewport
- [ ] Error states show a retry option, not a blank screen

## Exit Criteria

The UX review is complete when:

1. A first-time visitor on mobile can: see the map, understand what the project is, and find how to contribute — all within 10 seconds of page load.
2. Pin discovery flow works end-to-end: see cluster → zoom in → see individual pin → tap → popup → "Lihat Detail" → detail page.
3. Submit flow works end-to-end on mobile: tap "Tambah" → tap map to place pin → fill form → submit → see success feedback.
4. Pending page allows community review: see pending pins on map and list → read submission details → vote → see updated counts.
5. Language toggle is findable by a non-English speaker within 3 seconds.
6. No loading state leaves the user staring at a blank or frozen screen.
7. The list view on `/pending` is fully keyboard-navigable as an alternative to map interaction.
