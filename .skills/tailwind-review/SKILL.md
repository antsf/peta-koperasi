# tailwind-review

Tailwind CSS review skill for the Koperasi Desa Merah Putih Map project UI.

## Activation

Use this skill when reviewing or implementing UI styles, layouts, and responsive design in this project.

---

## Mobile-First Requirement

Indonesia has extremely high mobile internet usage, especially in rural areas where cooperatives operate. The primary user device is a mid-range Android phone on a slow connection.

### Rules
- Every component must look correct at 375px width FIRST, then scale up.
- Write `className="text-sm md:text-base"` — mobile size first, desktop override.
- Touch targets must be at least 44x44px (`min-h-[44px] min-w-[44px]` or `p-3` on buttons).
- The map must be usable with touch gestures (pinch to zoom, drag to pan).
- Test with Chrome DevTools device toolbar set to "Moto G Power" (412px) — this is the representative device.

---

## Consistent Spacing

This project uses Tailwind's default spacing scale. Do not introduce arbitrary values.

### Allowed spacing
- `p-2`, `p-3`, `p-4`, `p-6`, `p-8` — standard padding.
- `gap-2`, `gap-3`, `gap-4` — flex/grid gaps.
- `space-y-2`, `space-y-4` — vertical stacking.
- `m-0`, `m-auto`, `mt-4`, `mb-6` — margins.

### Forbidden
```html
<!-- BAD — arbitrary spacing -->
<div className="mt-[13px] p-[7px] gap-[22px]">

<!-- GOOD — use the scale -->
<div className="mt-3 p-2 gap-6">
```

Exception: `h-[calc(100vh-4rem)]` for the map container is the ONE allowed arbitrary value because it precisely accounts for the header height.

---

## Color Palette

### UI chrome
- `slate-50` through `slate-900` for backgrounds, text, borders.
- `white` for card backgrounds.
- `slate-100` for page backgrounds.
- `slate-300` for borders.
- `slate-600` for body text.
- `slate-900` for headings.

### Branding: "Merah Putih" (Red and White)
- `red-600` / `red-700` — primary brand accents (header background, primary buttons, links).
- `white` — secondary brand color.
- Use sparingly. The map is the hero, not the chrome.

### Status colors (used consistently across ALL components)
| Status     | Background       | Text             | Border           |
|------------|-----------------|------------------|------------------|
| approved   | `bg-green-50`   | `text-green-700` | `border-green-200` |
| pending    | `bg-yellow-50`  | `text-yellow-700`| `border-yellow-200`|
| flagged    | `bg-red-50`     | `text-red-700`   | `border-red-200`  |
| removed    | `bg-slate-50`   | `text-slate-400` | `border-slate-200` |

### Forbidden colors
- No `blue-*` for status (reserved for links if needed).
- No `purple-*`, `pink-*`, `indigo-*` — not in the design language.
- No opacity hacks (`bg-black/50`) except for map overlay modals.

---

## Dark Mode: NOT in v1

Dark mode is out of scope for v1. It adds complexity to every component, requires a theme toggle, and doubles the visual QA surface.

### Review rule
**Reject any PR that adds `dark:` variants.** If a contributor submits dark mode styles:
1. Thank them for the contribution.
2. Explain it is not in scope for v1.
3. Point them to the roadmap issue (if one exists).

Do not add `dark:bg-*`, `dark:text-*`, or `dark:border-*` to any component.

---

## Map Container Sizing

The map must fill the viewport below the header with no scrollbar on the body.

```typescript
// Header: fixed height
<header className="h-16 bg-red-700 text-white flex items-center px-4">

// Map container: fills remaining viewport
<div className="h-[calc(100vh-4rem)]">
  <MapView />
</div>
```

### Rules
- Header height is `h-16` (4rem / 64px). This is fixed and must not change.
- Map container is `h-[calc(100vh-4rem)]` — the only allowed arbitrary height value.
- Body must have `overflow-hidden` on the map page to prevent double scrollbars.
- On mobile, the map takes the full viewport minus header. No bottom navigation bar in v1.

---

## Responsive Breakpoints

### Breakpoints used
| Breakpoint | Width  | Use case |
|------------|--------|----------|
| (default)  | 0-767px | Mobile layout. Single column. Full-width cards. |
| `md:`      | 768px+  | Tablet/desktop. Side panels, wider cards, multi-column grids. |

### Breakpoints NOT used
- `sm:` (640px) — not needed. The jump from 375px mobile to 768px tablet is sufficient.
- `lg:` (1024px), `xl:` (1280px), `2xl:` (1536px) — this is not a dashboard. No need for wide-screen layouts.

### Examples

```html
<!-- Pending page: cards stack on mobile, grid on tablet+ -->
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
  {points.map(p => <PointCard key={p.id} point={p} />)}
</div>

<!-- Submit form: full width on mobile, constrained on tablet+ -->
<form className="w-full md:max-w-lg md:mx-auto p-4">
```

---

## Status Badge Pattern

Status badges must look identical everywhere they appear — `PointCard`, `/point/[id]` page, `/pending` page.

```typescript
// src/components/status-badge.tsx
import type { PointStatus } from "@/types";

const statusStyles: Record<PointStatus, string> = {
  approved: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  flagged: "bg-red-50 text-red-700 border-red-200",
  removed: "bg-slate-50 text-slate-400 border-slate-200",
};

export function StatusBadge({ status }: { status: PointStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
```

### Rules
- Use the `StatusBadge` component everywhere. Do not inline status colors.
- The `statusStyles` record ensures exhaustiveness — if a new status is added to `PointStatus`, TypeScript will require a new entry here.
- Badge size is `text-xs` with `px-2 py-0.5` — small and unobtrusive.

---

## Anti-Patterns to Reject

### 1. Inline `style=` objects
```typescript
// BAD — violates project rules
<div style={{ marginTop: 13, backgroundColor: "#f00" }}>

// GOOD — Tailwind only
<div className="mt-3 bg-red-600">
```
The only exception: Leaflet sometimes requires inline styles for map positioning. These are generated by the library, not by us.

### 2. `@apply` overuse
```css
/* BAD — reimplementing Tailwind in CSS */
.card {
  @apply rounded-lg shadow-md p-4 bg-white border border-slate-200;
}

/* This should just be a className on the JSX element */
```
`@apply` is acceptable ONLY for styling elements that cannot receive className (e.g., third-party library elements that only accept plain CSS).

### 3. Arbitrary values
```html
<!-- BAD -->
<div className="w-[347px] h-[89px] mt-[13px] text-[15px]">

<!-- GOOD -->
<div className="w-full h-24 mt-3 text-sm">
```
The ONLY allowed arbitrary values:
- `h-[calc(100vh-4rem)]` — map container height.
- Leaflet-specific positioning if absolutely necessary.

### 4. Global CSS that Tailwind handles
```css
/* BAD — in globals.css */
body { font-family: sans-serif; }
h1 { font-size: 24px; font-weight: bold; }
a { color: blue; text-decoration: underline; }

/* GOOD — use Tailwind classes on elements, or @layer base for resets only */
```

### 5. CSS Modules or styled-components
```typescript
// BAD — wrong styling approach for this project
import styles from "./card.module.css";
import styled from "styled-components";

// GOOD — Tailwind className
<div className="rounded-lg shadow-md p-4 bg-white">
```

### 6. Hardcoded widths on responsive elements
```html
<!-- BAD — breaks on narrow screens -->
<div className="w-[600px]">

<!-- GOOD — responsive -->
<div className="w-full md:max-w-lg">
```

---

## Review Checklist

For every file under review:

- [ ] Mobile-first: base styles target 375px+, `md:` overrides for 768px+.
- [ ] No arbitrary spacing values (`mt-[13px]`, `p-[7px]`).
- [ ] Colors follow the palette: slate for chrome, red for branding, status colors per the table.
- [ ] No `dark:` variants anywhere.
- [ ] Map container uses `h-[calc(100vh-4rem)]`.
- [ ] No `sm:`, `lg:`, `xl:`, `2xl:` breakpoints (only `md:`).
- [ ] Status badges use the `StatusBadge` component, not inline colors.
- [ ] No `style=` objects (except Leaflet internals).
- [ ] No `@apply` (unless targeting a third-party element).
- [ ] No CSS modules or styled-components.
- [ ] Touch targets are at least 44x44px.
- [ ] Text is readable on mobile: body text `text-sm` or larger, headings `text-lg` or larger.
- [ ] Cards and forms are `w-full` on mobile, constrained on `md:`.

---

## Exit Criteria

A Tailwind review is complete when:
1. Every component renders correctly at 375px (mobile) and 768px (tablet).
2. The color palette is consistent — no off-palette colors.
3. No dark mode code exists in the codebase.
4. The map fills the viewport correctly with no scroll issues.
5. All status badges are visually identical across all pages.
6. Zero inline `style=` objects (except Leaflet library output).
7. Zero arbitrary Tailwind values (except the map height calc).
8. The review checklist has zero unchecked items.
