# ui-review

Visual and component-level UI review for the Koperasi Desa Merah Putih Map project.

## When to use

Run this skill when reviewing any PR or change that touches components, pages, layouts, Tailwind classes, or UI strings. Also run proactively before any release milestone.

## Instructions

You are reviewing the UI of a Next.js App Router civic-tech project: a crowdsourced map of Indonesian village cooperatives. The audience is the Indonesian general public on mobile-first budget Android devices. There is no dark mode, no custom fonts, no animation beyond native browser defaults.

Work through every section of the checklist below. For each item, read the relevant source files, report PASS or FAIL with file path and line number, and provide a concrete fix when failing.

### 1. Status badge consistency

Check that status visual coding is identical across all surfaces:
- `pending` = yellow (`yellow-*`)
- `approved` = green (`green-*`)
- `flagged` = orange (`orange-*`)
- `removed` = gray (`gray-*`)

Files to check: `PointCard`, `MapPin` (popup content), and the pending list on `/pending`. Every surface must use the same Tailwind color shade AND the same badge shape (rounded-full pill, or rounded-md tag — pick one, but it must be consistent). Flag any surface that deviates.

### 2. Tailwind usage discipline

Scan all `.tsx` and `.jsx` files for:
- **Arbitrary values**: regex `\[[\d.]+(px|rem|em|%|vh|vw)\]` in className strings. The only allowed arbitrary value is `calc(100vh - 4rem)` for map height. Everything else is a failure.
- **Inline style objects**: `style={{` in JSX. Not allowed.
- **CSS modules**: any `.module.css` imports. Not allowed.
- **@apply in globals**: `@apply` in `globals.css` is acceptable only for base resets. Flag `@apply` that recreates component styles.

### 3. Component size

For every `.tsx` file in `components/` and `app/`, count lines. Flag any component file exceeding 150 lines. Recommend how to split it (e.g., extract a sub-component, move data fetching to a separate file, extract a custom hook).

### 4. Server vs client component marking

Only these components should have `"use client"` at the top:
- `MapView`
- `VoteButtons`
- `SubmitForm`
- `LanguageToggle`

All other components must be server components (no `"use client"` directive). Flag any component that has `"use client"` but is not in the list above. Also flag any component in the list above that is missing `"use client"`.

### 5. Language consistency (Bahasa Indonesia)

- Every user-facing string in JSX must be hardcoded in Bahasa Indonesia — not English, and no i18n hook (the project has no i18n system).
- Search all `.tsx` files for string literals inside JSX (between `>` and `<`, or in attributes like `placeholder=`, `aria-label=`, `title=`). Exclude technical strings (CSS classes, HTML tags, component names). Flag any human-readable English text or any i18n hook usage.

### 6. Photo display safety

Review the `PhotoDisplay` component:
- When `photo_url` is `null` or `undefined`, it must render a placeholder (e.g., a gray box with a camera icon), NOT a broken `<img>`.
- It must NEVER render a photo for a point whose status is not `approved`. Check that status is checked before rendering.
- The `<img>` tag must have `loading="lazy"` for performance on mobile.

### 7. Loading and error states

For every client component that fetches data (uses `fetch`, `useSWR`, `useQuery`, or similar):
- There must be a loading state (skeleton, spinner, or text).
- There must be an error state (user-friendly message, not a blank screen or raw error).
- Flag any component that goes straight from loading to rendered without handling errors.

### 8. Mobile map experience

Review at 375px viewport width:
- The header must not overlap the map. Check that the map container uses `calc(100vh - 4rem)` or equivalent, and the header is exactly `4rem` / `h-16`.
- The submit button (FAB or nav link) must be reachable without scrolling on the map page.
- Map popup text must be readable: minimum `text-sm` (14px). Check popup content classes.
- Touch targets: all interactive elements on mobile must be at least 44x44px (per WCAG). Check button/link sizing.

### 9. Empty states

- `/pending` with zero pending submissions: must show a friendly message like "Belum ada pengajuan" — not a blank page or a spinner that never resolves.
- Main map `/` with zero approved points: must show a message or prompt, not just an empty map with no explanation.
- Check that empty state messages are hardcoded in Bahasa Indonesia (no English text).

## Review output format

```
## UI Review — [date]

### Summary
X passes, Y failures, Z warnings

### Findings
| # | Check | Status | File:Line | Detail |
|---|-------|--------|-----------|--------|
| 1 | Status badge consistency | PASS/FAIL | ... | ... |
...

### Required fixes (blocking)
1. ...

### Recommended improvements (non-blocking)
1. ...
```

## Exit criteria

The review is complete when:
- Every section of the checklist has been evaluated with PASS or FAIL
- Every FAIL has a concrete, actionable fix described
- Every user-facing string is hardcoded in Bahasa Indonesia
- No client component fetches data without loading + error states
- The review output table is filled in completely
