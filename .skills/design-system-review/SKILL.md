# design-system-review

Design system consistency review for the Koperasi Desa Merah Putih Map project — ensuring a coherent visual language without introducing unnecessary complexity.

## When to use

Run this skill when reviewing any PR that touches styling, adds new components, or changes visual patterns. Also run before any release milestone to check for visual drift.

## Instructions

This project has NO formal design system. The "system" is Tailwind defaults plus a small set of conventions established by the existing code. Your job is to review that these conventions are consistently applied and that no unnecessary complexity is creeping in.

Do NOT recommend building a design token system, a component library, Storybook, or any design tooling infrastructure. That is all out of scope for v1. If a PR introduces any of these, flag it as out of scope.

Work through every section below. For each item, read the relevant source files, report PASS or FAIL, and provide a concrete fix when failing.

### 1. Color conventions

Verify these color assignments are used consistently across all components and pages:

| Purpose | Tailwind palette | Example classes |
|---------|-----------------|-----------------|
| UI chrome (header, cards, borders) | `slate-*` | `bg-slate-50`, `border-slate-200`, `text-slate-700` |
| Merah Putih accent (brand, primary actions) | `red-600` | `bg-red-600`, `text-red-600`, `hover:bg-red-700` |
| Approved status | `green-*` | `bg-green-100`, `text-green-700`, `border-green-300` |
| Pending status | `yellow-*` | `bg-yellow-100`, `text-yellow-700`, `border-yellow-300` |
| Flagged status | `orange-*` | `bg-orange-100`, `text-orange-700`, `border-orange-300` |
| Removed / neutral | `gray-*` | `bg-gray-100`, `text-gray-500` |

Flag:
- Any use of `blue-*`, `purple-*`, `pink-*`, `indigo-*`, or `teal-*` — these are not in the project palette.
- Any status color that uses the wrong palette (e.g., pending using `amber-*` instead of `yellow-*`).
- Any brand accent using a red shade other than `red-600` (e.g., `red-500`, `red-700` for primary, though `red-700` for hover states is fine).

### 2. Typography conventions

- **Font stack**: The project uses Tailwind's default system font stack. There must be NO custom font imports (`@font-face`, Google Fonts link, `next/font` usage). Flag any.
- **Size scale**: Only these sizes should appear in body/UI content: `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`. 
  - `text-xs` must NOT be used for body content or labels — it is too small for budget phone screens. Acceptable only for non-essential metadata (e.g., timestamps, IDs).
  - `text-3xl` and above: acceptable only for page headings (`h1`).
- **Font weight**: `font-normal`, `font-medium`, `font-semibold`, `font-bold`. No `font-thin`, `font-light`, `font-black` (poor readability on low-res screens).
- **Line height**: Tailwind defaults are fine. Flag any custom `leading-*` values unless there is a clear readability reason.

### 3. Spacing conventions

Tailwind's spacing scale is based on 4px increments: `0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px), 16 (64px)`.

Flag:
- **Off-scale values**: `p-3.5`, `m-3.5`, `gap-3.5`, `p-7`, `m-7`, `gap-7`, `p-9`, `gap-9` — these are valid Tailwind but off the common 4px scale and indicate inconsistency.
- **Arbitrary spacing**: `p-[13px]`, `mt-[7px]`, etc. Not allowed (see Tailwind discipline in ui-review).
- **Inconsistent card padding**: All card-like components (`PointCard`, pending list items) should use the same internal padding. Check that they match.
- **Inconsistent section spacing**: Pages should use consistent vertical spacing between sections (`space-y-6` or `gap-6` — pick one pattern and verify consistency).

### 4. Component API consistency

Review the props of card-like and list-item components:
- `PointCard` should accept a single data object prop (e.g., `point: Point`) rather than spreading many individual props.
- If there are similar components (e.g., a card on the map page vs. a card on the pending page), they should either be the same component with variant props, or have explicitly different names and documented reasons for divergence.
- Flag any component that accepts more than 8 props — it likely needs restructuring.

### 5. Icon usage

- If icons are used, they must all come from a single library. Check `package.json` for icon dependencies.
- Acceptable: `lucide-react`, `@heroicons/react`, or `react-icons` (but only one sub-pack, e.g., only `react-icons/hi`). 
- Flag: mixing Heroicons and Lucide, or mixing multiple `react-icons` sub-packs (`hi` + `fa` + `md`).
- If no icon library is used and icons are inline SVGs, that is acceptable for a small number (fewer than 5 unique icons). Flag if there are more — they should be extracted into a shared icon component or an icon library should be adopted.

### 6. Button variants

This project needs only two button styles:

1. **Primary**: solid background (`bg-red-600 text-white`), used for submit, confirm, and primary actions.
2. **Secondary**: outlined or ghost (`border border-slate-300 text-slate-700`), used for cancel, back, and secondary actions.

Flag:
- More than 2 visually distinct button styles (excluding disabled state).
- Buttons with arbitrary colors not in the palette.
- Inconsistent border-radius on buttons (all should use the same `rounded-*` value).
- Buttons that are `<div>` or `<a>` elements when they should be `<button>` elements (and vice versa for navigation links).

### 7. What NOT to build (scope guard)

Flag any PR or code that introduces:
- A `tokens.js` or `theme.ts` design token file
- A `components/ui/` directory structured like a component library (shadcn pattern)
- Storybook configuration (`*.stories.tsx`)
- CSS-in-JS libraries (`styled-components`, `emotion`)
- A `tailwind.config.ts` with more than minimal customization (extending colors for status is fine; adding complex plugins is not)
- A `<ThemeProvider>` or theme context

These are all out of scope for v1. The project's strength is simplicity.

## Review output format

```
## Design System Review — [date]

### Summary
X passes, Y failures, Z warnings

### Color audit
[Table of all color classes found, grouped by purpose, with PASS/FAIL]

### Typography audit
[List of all text size classes found, with PASS/FAIL]

### Spacing audit
[Any off-scale or inconsistent spacing, with PASS/FAIL]

### Findings
| # | Check | Status | File:Line | Detail |
|---|-------|--------|-----------|--------|
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
- The color audit has scanned every component file for off-palette colors
- The typography audit has confirmed no `text-xs` in body content
- The spacing audit has confirmed consistent card and section spacing
- Icon source consistency has been verified
- Button variants have been catalogued and verified
- The scope guard has been checked against `package.json` and project structure
- The review output table is filled in completely
