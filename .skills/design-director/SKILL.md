# Skill: design-director

Creative Director for the Koperasi Desa Merah Putih Map. Every visual, motion, and interaction decision passes through this skill first.

---

## The 5-Second Test

When someone opens this website for 5 seconds, the impression must be:

> "This is a serious public digital service — built with care — but it feels warm, friendly, and easy to use."

NOT:
- "Another AI startup landing page."
- "A Tailwind CSS template."
- "A government portal from 2015."
- "A SaaS dashboard."

If a design decision moves the site toward any of the four "NOT" categories, reject it.

---

## Design Identity

**One sentence:** *Perpustakaan Nasional bertemu Google Maps bertemu Airbnb.*

This is not a metaphor to argue about. It is a north star for decision-making:
- **Perpustakaan Nasional** → authoritative, trustworthy, serious about information
- **Google Maps** → spatial clarity, effortless navigation, data-forward
- **Airbnb** → warm photography, human presence, local texture, inviting

Every component, every spacing decision, every color choice must be traceable back to at least one of these three.

---

## Design Influences (In Priority Order)

### 1. GOV.UK Design System — Structure & Trust

Borrow:
- Information hierarchy: the most important thing on the page is the largest and highest. No mystery meat navigation.
- Typography rhythm: headings are functional, not decorative. Body text is comfortable at 16–18px.
- Form design: every input has a visible label above it (never placeholder-only). Error messages are red, inline, specific.
- Spacing discipline: use a consistent 8px base unit. Nothing is `p-3.5`.
- Color for communication: color reinforces meaning, it does not create it. A status indicator is always labeled in text AND colored.

Do NOT borrow:
- The stark, cold blue-and-white palette. This project is warmer.
- The institutional flatness. We have gentle depth.

### 2. IBM Carbon — Data & Spatial Clarity

Borrow:
- Data density done right: show meaningful information without cramming. White space is a feature.
- Grid discipline: 12-column grid, consistent gutters, nothing arbitrarily offset.
- Map integration: data panels alongside maps that don't fight for space. Side panel on desktop, bottom sheet on mobile.
- Icon system: functional, consistent, never decorative. One icon library, one weight.

Do NOT borrow:
- The enterprise gray monotone. We have warmth.
- The heavy information density of a dashboard. This is a public-facing map, not a data warehouse UI.

### 3. Radix Themes — Components & Interaction

Borrow:
- Dropdown menus, dialogs, tooltips: use Radix primitives for their accessibility foundation (focus trapping, keyboard navigation, ARIA out of the box).
- Component composition: small, composable, accessible primitives — not monolithic components with 40 props.
- The "not obviously Tailwind" feel: components that look considered, not assembled from classes.

Do NOT borrow:
- The neutral-gray palette defaults. Override with the project palette.

### 4. Open Props — Natural Feel

Borrow these specifically:
- **Shadows:** `--shadow-2` through `--shadow-4` for card depth. No hard box shadows. The shadow color is warm (slight amber tint), not cold gray.
- **Easing curves:** `--ease-3` (ease-in-out) for motion. `--ease-out-5` for element entrances.
- **Spacing scale:** the Open Props spacing scale (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px) maps cleanly to Tailwind's default scale. Use it.
- **Typography rhythm:** `--font-size-fluid-0` through `--font-size-fluid-3` for text that scales with viewport.

### 5. Apple Human Interface Guidelines — Motion & Touch

Borrow ONLY these three things:
- **Spacing generosity:** Apple's minimum touch target is 44×44pt. Apply this to all interactive elements (buttons, vote buttons, dropdown items, map pins at mobile zoom).
- **Typography hierarchy:** The contrast between a large, confident heading weight and a lighter body weight creates natural reading order. Never use more than 3 type sizes on one screen.
- **Motion physics:** Animations feel like physical objects. Things decelerate as they arrive. Spring easing on things that "pop in." Ease-out on things that slide in from outside the viewport. Nothing is linear.

Do NOT borrow:
- Apple's specific SF Pro typography (we use IBM Plex Sans + Inter).
- Apple's iOS visual components (they feel out of place in a browser civic context).
- Blur effects, vibrancy, translucency. None of these.

---

## Color System

### Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#FAF9F5` | Page background. Warm white, not pure white. |
| `--color-surface` | `#FFFFFF` | Cards, panels, dialogs. |
| `--color-surface-raised` | `#F5F3EE` | Hover state on cards, subtle inset areas. |
| `--color-primary` | `#0B6E4F` | Primary actions, links, active states. Deep forest green — references nature, growth, gotong royong. |
| `--color-primary-hover` | `#085A40` | Darker on hover. |
| `--color-secondary` | `#D97706` | Secondary accent, highlights, the "Merah Putih" warmth. Amber, not orange. |
| `--color-accent` | `#2563EB` | External links, informational UI, map tile interaction. |
| `--color-danger` | `#B91C1C` | Errors, downvotes, flagged status. |
| `--color-text-primary` | `#1C1917` | All body text. Warm near-black, not pure black (#000). |
| `--color-text-secondary` | `#57534E` | Metadata, secondary labels, helper text. |
| `--color-text-disabled` | `#A8A29E` | Disabled states. |
| `--color-border` | `#E7E5E4` | Card borders, input borders, dividers. |
| `--color-border-focus` | `#0B6E4F` | Focus ring on interactive elements. |

### Status Colors (Semantic)

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| `pending` | `#FEF9C3` | `#713F12` | `#FDE047` |
| `approved` | `#DCFCE7` | `#14532D` | `#86EFAC` |
| `flagged` | `#FFEDD5` | `#7C2D12` | `#FDBA74` |
| `removed` | `#F5F5F4` | `#78716C` | `#D6D3D1` |

**Rule:** Status colors are for badges only. Never use status colors as page-level backgrounds or button fills.

### What's Forbidden

- Pure black (`#000000`) anywhere on screen.
- Pure white (`#FFFFFF`) as the page background (use `--color-bg`).
- Glassmorphism: `backdrop-filter: blur()` on any surface.
- Neon or fluorescent colors.
- Gradient backgrounds on interactive surfaces (buttons, cards).
- Dark mode in v1. Not implemented. Reject any PR that adds it.

---

## Typography

### Font Stack

```css
--font-heading: 'IBM Plex Sans', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

**Loading strategy:** Load IBM Plex Sans (400, 600) and Inter (400, 500) from Google Fonts with `display=swap`. JetBrains Mono loaded only on pages that display coordinate/data values (`/point/[id]`).

### Type Scale

| Role | Font | Size | Weight | Usage |
|------|------|------|--------|-------|
| Display | IBM Plex Sans | 2.25rem (36px) | 600 | Page hero titles |
| H1 | IBM Plex Sans | 1.875rem (30px) | 600 | Section headings |
| H2 | IBM Plex Sans | 1.5rem (24px) | 600 | Card titles, panel headers |
| H3 | IBM Plex Sans | 1.25rem (20px) | 500 | Sub-section labels |
| Body | Inter | 1rem (16px) | 400 | All paragraph text |
| Body Small | Inter | 0.875rem (14px) | 400 | Helper text, metadata |
| Label | Inter | 0.875rem (14px) | 500 | Form labels, data labels |
| Mono | JetBrains Mono | 0.875rem (14px) | 400 | Coordinates, IDs, code |
| Caption | Inter | 0.75rem (12px) | 400 | Attribution, legal, map credit |

**Rule:** Do not use text-xs (`0.75rem`) for body-level information. Minimum readable size for content is `0.875rem`. Caption (`0.75rem`) is for legal/attribution only.

**Rule:** Line height for body text is `1.6`. Heading line height is `1.2`. Tighter for large display text, looser for small body text.

---

## Spacing & Layout

### Grid

- Desktop (≥768px): 12-column grid, 24px gutters, max-width 1280px, centered.
- Mobile (<768px): single column, 16px horizontal padding.
- No arbitrary breakpoints. `sm:` (≥375px), `md:` (≥768px). That is all.

### Spacing Scale

Base unit: 4px. All spacing is a multiple of 4.

```
4px   → gap-1, p-1   (tight — icon padding, badge internal)
8px   → gap-2, p-2   (small — between label and input)
12px  → gap-3, p-3   (medium-tight — card internal top/bottom)
16px  → gap-4, p-4   (base — card padding, list item padding)
24px  → gap-6, p-6   (medium — section separation)
32px  → gap-8, p-8   (large — page section spacing)
48px  → gap-12        (extra-large — hero spacing)
64px  → gap-16        (page-level vertical rhythm)
```

**Banned values:** `p-3.5`, `gap-7`, `mt-5`, `mb-9`, `p-[13px]`, any arbitrary Tailwind value.

### Border Radius

- All cards, panels, modals: `rounded-2xl` (16px). This is slightly warmer than the `14px` target — Tailwind's nearest step.
- Buttons: `rounded-xl` (12px).
- Badges/tags: `rounded-full`.
- Inputs: `rounded-lg` (8px).
- Map container: `rounded-none` (full bleed).

---

## Elevation & Shadow

No glass. No blur. Soft, warm shadows only.

```css
/* Card at rest */
--shadow-card: 0 1px 3px rgba(28, 25, 23, 0.08), 0 1px 2px rgba(28, 25, 23, 0.06);

/* Card on hover */
--shadow-card-hover: 0 4px 12px rgba(28, 25, 23, 0.10), 0 2px 4px rgba(28, 25, 23, 0.06);

/* Modal / bottom sheet */
--shadow-modal: 0 20px 40px rgba(28, 25, 23, 0.15), 0 8px 16px rgba(28, 25, 23, 0.10);

/* Map pin popup */
--shadow-popup: 0 4px 16px rgba(28, 25, 23, 0.12);
```

Shadow color is `#1C1917` (the text color) at low opacity — not pure black. This gives warmth.

**Rule:** Elevation is communicated through shadow + slight background lightness change, never through color saturation change alone.

---

## Motion

### The Principle

Animations feel like physical objects in a gentle gravity field. They do not "pop." They do not "flash." They do not overshoot dramatically. They arrive, settle, and feel satisfying.

### Duration Scale

| Type | Duration | Usage |
|------|----------|-------|
| Micro | 120ms | Button hover state, focus ring appear |
| Short | 180ms | Badge status change, toggle switch |
| Medium | 240ms | Card hover lift, panel slide-in |
| Long | 500ms | Pin drop animation, page transition |

**Rule:** Never exceed 500ms for any single animation. Animations that take longer than 500ms feel broken on a slow connection.

**Rule:** All animations respect `prefers-reduced-motion`. If the user has reduced motion enabled, use instant transitions or opacity-only fades (no movement).

### Easing

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* things arriving — slide in, card lift */
--ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);  /* things moving — map pan, page transition */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* things that pop — pin drop, vote confirmation */
```

### Specific Micro-Interactions

These are not optional polish. They are what makes the map feel alive vs dead.

#### 1. Card Hover Lift
```css
.koperasi-card {
  transition: transform 180ms var(--ease-out), box-shadow 180ms var(--ease-out);
}
.koperasi-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
}
```

#### 2. Map Marker Breathing on Hover
The approved pin scales up 10% and its shadow grows when hovered. Not a bounce — a gentle swell.
```css
.map-marker {
  transition: transform 180ms var(--ease-out);
}
.map-marker:hover {
  transform: scale(1.10);
}
```

#### 3. Pin Drop After Submission
When a contributor submits a new koperasi, after the API returns 201:
1. Map pans to the submitted coordinates (600ms, ease-in-out).
2. A new marker appears at the coordinates, starting at `scale(0)` and `translateY(-20px)`, easing to `scale(1)` and `translateY(0)` over 500ms with `--ease-spring`.
3. A small ripple pulse (CSS `@keyframes`) radiates from the pin once (not looping).
This replaces a generic toast notification. The user sees their contribution land on the map.

#### 4. Statistics Count-Up
On the `/` page, the "Total Koperasi" number counts up from 0 to the actual value over 1200ms when first visible. Use `IntersectionObserver` to trigger only when the stat enters the viewport. Easing: fast at first, decelerate at the end (ease-out).

#### 5. Skeleton Loading
Skeleton screens must match the actual content shape:
- PointCard skeleton: 2 lines for name, 1 line for kabupaten, 1 shorter line for status badge.
- MapView skeleton: solid `--color-surface-raised` background with a centered spinner — not a generic gray rectangle.
- Skeleton pulse animation: a single shimmer sweep (left to right) at 1.5s interval. Use `background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)`.

#### 6. Vote Button Feedback
When a user taps Upvote:
1. Button immediately disables (prevents double-tap).
2. Count increments optimistically (+1) with a 120ms fade-in of the new number.
3. If API returns 200: the button gets a green fill with a 180ms transition. Done.
4. If API returns 409 (already voted): button shows a brief shake animation (3 horizontal oscillations, 300ms total) and a tooltip "Sudah pernah memilih."
5. If API returns 500: count reverts, button re-enables, show inline error.

#### 7. Detail Panel (Bottom Sheet / Side Panel)
- **Mobile:** Cooperative detail slides up from the bottom as a sheet. Background map is still visible above it. The sheet handle (drag indicator) is a 40×4px rounded bar.
  - Open: `translateY(100%)` → `translateY(0)`, 300ms, `--ease-out`.
  - Close: `translateY(0)` → `translateY(100%)`, 240ms, `--ease-in-out`.
- **Desktop:** Detail panel slides in from the right. Map reflows to fill the remaining space.
  - Open: `translateX(100%)` → `translateX(0)`, 300ms, `--ease-out`.

#### 8. Map Pan to Detail
When a user clicks a pin popup's "Lihat Detail" link, before navigating:
1. Map pans so the selected pin is at 30% from the left (making room for the incoming side panel).
2. Pan duration: 400ms, `--ease-in-out`.
3. Then the side panel slides in.

#### 9. Region Filter Zoom
When a region filter is applied:
1. Map fits bounds of the matching pins with `fitBounds()`, with padding `{ paddingTopLeft: [50, 50], paddingBottomRight: [50, 50] }`.
2. Leaflet's `animate: true` option. Duration: 600ms.
3. Never instant-jump. Always animated pan+zoom.

#### 10. Page Transitions
Between routes, use a simple opacity fade: 80ms fade-out, then 120ms fade-in. No sliding pages (disorienting). No full-screen wipes. Just a gentle breath.

---

## Component Patterns

### PointCard

```
┌─────────────────────────────────┐
│ [STATUS BADGE]                  │
│                                 │
│ Nama Koperasi                   │  ← H2, IBM Plex Sans 600
│ Kecamatan · Kabupaten           │  ← Body Small, text-secondary
│                                 │
│ [PHOTO if approved]             │  ← 16:9 ratio, object-cover, rounded-lg
│                                 │
│ 📍 Alamat singkat               │  ← Body Small
│ 📞 Nomor telepon                │  ← Body Small, JetBrains Mono
│                                 │
│ [▲ 12]  [▼ 2]   Lihat Detail → │  ← VoteButtons + link
└─────────────────────────────────┘
```

- Border: 1px `--color-border`
- Background: `--color-surface`
- Padding: 24px
- Hover: lift 3px, shadow grows
- Photo slot: gray placeholder with cooperative icon when no photo or not approved

### MapPin (SVG)

Approved: Forest green (`#0B6E4F`) filled teardrop, white circle dot center.
Pending: Amber (`#D97706`) filled teardrop, white circle dot center.
Flagged: Warm orange teardrop with diagonal stripe pattern.
Selected: Scale 1.2, drop shadow.

All pins are SVGs, not Leaflet's default icon. Min click target: 32×32px.

### VoteButtons

```
┌────────────┐  ┌────────────┐
│  ▲  12     │  │  ▼  2      │
└────────────┘  └────────────┘
  Upvote           Downvote
```

- Outlined style at rest (border: 1px, bg transparent)
- After voting: filled. Upvote fills green. Downvote fills red.
- Disabled after voting: reduced opacity (0.6), cursor not-allowed, tooltip explanation
- Min touch target: 44×44px (Apple HIG)

### Status Badge

```
┌─────────────┐
│ ● Menunggu  │
└─────────────┘
```

- Dot indicator + text label
- `rounded-full`, `text-xs` font, `font-medium`
- Background and text use the status color tokens from the color system table

### Form Inputs (SubmitForm)

GOV.UK-style: label above, hint text below label, input full-width, error message in red below input.

```
Nama Koperasi *
Nama lengkap koperasi sesuai akta
┌────────────────────────────────┐
│                                │
└────────────────────────────────┘
```

- Border: 2px solid `--color-border` at rest
- Focus: border becomes `--color-primary` (`#0B6E4F`), 2px, no box shadow ring
- Error: border becomes `--color-danger`, error message text below in red
- Required fields: asterisk (*) in primary color, not red

---

## Empty States

**Rule:** No generic illustrations. No AI-generated art. Specifically:

- Use linocut-style or woodcut-style illustrations with an Indonesian village theme. These can be SVGs.
- Illustration subjects: a farmer at a cooperative meeting, a village market, hands exchanging goods, rice fields, a school savings group.
- Color: use 2-color illustrations (primary green + warm background) — not full-color.
- Each empty state has:
  1. Illustration (max 200px height)
  2. Short heading (e.g., "Belum ada koperasi di area ini")
  3. 1–2 sentences of context ("Jadilah yang pertama menambahkan koperasi di wilayah ini.")
  4. A call-to-action button ("Tambah Koperasi")

**On the pending page with zero submissions:** Show the illustration + "Semua data sudah diverifikasi" (all data is verified) — frame it as a success, not an empty state.

---

## What This Project Is NOT Allowed to Look Like

Reviewers should reject any PR that moves the design toward:

| Forbidden Pattern | Signal | Why |
|---|---|---|
| Glassmorphism | `backdrop-filter`, `bg-white/20`, frosted glass cards | Trendy, inaccessible, feels like a 2023 SaaS template |
| Dark gradient hero | `bg-gradient-to-br from-slate-900 to-emerald-900` | Startup landing page energy, not civic |
| Neon accents | Colors with high saturation + brightness on dark bg | AI product aesthetic |
| "Dashboard" layout | Sidebar navigation + data grid at the top level | This is a map, not analytics |
| Emoji in UI | 🗺️ 🏪 ✅ in component labels | Inconsistent across OS, not accessible |
| Stock photo hero | Generic person-at-computer or handshake photo | Soulless |
| Animated gradient backgrounds | `bg-gradient-animate` on hero or header | AI product aesthetic |
| Brutalist typography | Very heavy black fonts, huge letter-spacing | Trend-chasing |
| Pure white background | `bg-white` on body | Too clinical, too cold |

---

## Design Review Checklist

Before any UI change is merged:

```
IDENTITY
[ ] 5-second test passes: feels like serious public service, warm, not startup
[ ] No forbidden patterns from the list above
[ ] Consistent with "Perpustakaan Nasional × Google Maps × Airbnb" identity

COLOR
[ ] Using color tokens, not hardcoded hex values
[ ] Background is --color-bg (#FAF9F5), not pure white
[ ] Status colors only on badges, not as page backgrounds
[ ] No glassmorphism, no gradients on surfaces

TYPOGRAPHY
[ ] IBM Plex Sans for headings, Inter for body
[ ] No text-xs for content (only for attribution/caption)
[ ] Label above every input (no placeholder-only labels)
[ ] All strings via i18n keys (id.json + en.json)

SPACING
[ ] All spacing values on the 4px grid
[ ] No arbitrary Tailwind values
[ ] Card padding: 24px (p-6)
[ ] Touch targets ≥ 44×44px on mobile

MOTION
[ ] Duration: 120ms / 180ms / 240ms / 500ms only
[ ] Easing: ease-out for arrivals, ease-in-out for traversals, spring for pops
[ ] prefers-reduced-motion: fallback implemented
[ ] No animation loops (except subtle skeleton shimmer)

COMPONENTS
[ ] Status badge has both color AND text label
[ ] VoteButtons disabled correctly after vote
[ ] PhotoDisplay shows placeholder (not broken img) when no photo or not approved
[ ] Empty state has illustration + heading + CTA, not just "No data"

ACCESSIBILITY
[ ] Color is not the only status indicator
[ ] Focus ring visible (--color-primary border)
[ ] Min touch target 44×44px for all interactive elements
[ ] Alt text on all images
```

---

## Exit Criteria

A design decision is complete when:

1. All checklist items above pass.
2. The 5-second test is passed (show to one person unfamiliar with the project — what do they feel in 5 seconds?).
3. Mobile at 375px: map fills screen, header doesn't overlap content, submit button is reachable.
4. No forbidden patterns introduced.
5. Motion animations tested with `prefers-reduced-motion: reduce` (verify graceful degradation).
6. Both Indonesian and English UI strings present — no component shows "undefined" or a missing key.

---

## A Note to Future Contributors

This design is not precious. It is purposeful.

Every choice — the warm off-white background, the forest green, the IBM Plex Sans headings, the 240ms easing — exists to serve one group of people: Indonesian village residents who may have never used a civic digital map before, opening it on a budget Redmi phone, trying to find a cooperative near them.

When you review a design change, ask: *Does this serve that person better? Or does it make me, the developer, feel more sophisticated?*

Those are different questions. The answer should always be the first.

*Ini milik semua. Buat untuk semua.*
