# accessibility-review

Accessibility review for the Koperasi Desa Merah Putih Map project, tailored to the specific constraints of a Leaflet-based civic-tech map application.

## When to use

Run this skill when reviewing any PR that touches components, forms, navigation, or ARIA attributes. Also run before any release milestone.

## Instructions

You are reviewing the accessibility of a Next.js civic-tech map app. The key constraint: **the Leaflet map is inherently inaccessible** for keyboard and screen reader users. This is an accepted limitation. The mitigation strategy is that all map data is also available through fully accessible list views (`/pending`) and detail pages (`/point/[id]`).

Your job is to ensure everything OUTSIDE the map canvas is properly accessible, and that the accessible alternatives are genuinely usable.

Work through every section below. For each item, read the relevant source files, report PASS or FAIL, and provide a concrete fix when failing.

### 1. Keyboard navigation (non-map pages)

Test these keyboard flows by reading the component structure:

- **`/pending` page**: Can a keyboard user Tab through every pending card and reach the vote buttons? Is the tab order logical (card content, then upvote, then downvote, then next card)?
- **`/point/[id]` detail page**: Can a keyboard user Tab through all interactive elements? Is there a "back to map" link that is keyboard-reachable?
- **`/submit` form**: Can a keyboard user Tab through all fields in order and submit with Enter? Is the map pin-drop the only part that requires a mouse? If so, is there an alternative (e.g., address search or coordinate input)?
- **Header navigation**: Can a keyboard user Tab through all nav links and the language toggle?

### 2. Focus management

- **After form submission**: When `SubmitForm` is submitted successfully, focus must move to the success message or confirmation element — not stay on the (now possibly disabled) submit button, and not jump to the top of the page silently.
- **After voting**: When a vote button in `VoteButtons` is clicked, focus must remain on or near the vote button. It must NOT jump to the top of the page or to an unrelated element.
- **Modal/dialog focus**: If any modal or dialog exists, focus must be trapped inside it while open and restored to the trigger element when closed.
- **Route changes**: After client-side navigation, focus should move to the main content area or page heading.

### 3. ARIA attributes

Check these specific requirements:

- `PointCard`: must have `role="article"` on the outer container.
- `VoteButtons`: each button must have `aria-label` that includes the action and current count. Example: `aria-label="Upvote, currently 5 votes"` or `aria-label="Setuju, saat ini 5 suara"` (must be translated).
- `RegionFilter`: must use `role="combobox"` with proper `aria-expanded`, `aria-controls`, and `aria-activedescendant` attributes if it has a dropdown/listbox.
- `SearchBar`: the input must have `role="searchbox"` or `type="search"`, with `aria-label` describing what it searches.
- Status badges: must have `aria-label` or visible text for screen readers (e.g., `aria-label="Status: pending"`).

### 4. Color is not the only indicator

The status colors (green/yellow/orange/gray) must always be accompanied by text labels:
- Check `PointCard`: does the status badge include text ("Approved", "Pending", etc.) in addition to color?
- Check `MapPin` popup: does the popup show status as text, not just a colored dot?
- Check `/pending` page: is the pending status communicated through text, not just yellow styling?
- A color-blind user viewing the page in grayscale must be able to distinguish approved from pending from flagged.

### 5. Image accessibility

Review `PhotoDisplay`:
- Every `<img>` must have a meaningful `alt` attribute. Pattern: `"Foto koperasi [cooperative name]"` or English equivalent.
- `alt` must NOT be empty string, "photo", "image", or "foto".
- Decorative images (if any) must have `alt=""` and `role="presentation"`.
- If photo is a placeholder (no actual photo), the placeholder must have `alt="Belum ada foto"` / `"No photo available"`.

### 6. Language attributes

- The root `<html>` element must have `lang="id"` when in Indonesian mode and `lang="en"` when in English mode.
- Check the layout file (`app/layout.tsx` or equivalent) to verify the `lang` attribute is dynamic, not hardcoded.
- If any section of the page is in a different language than the page default, it must have its own `lang` attribute.

### 7. Form accessibility

Review `SubmitForm`:
- Every `<input>`, `<select>`, and `<textarea>` must have an associated `<label>` element with a matching `htmlFor`/`id` pair. Placeholder text is NOT a substitute for a label.
- Required fields must have `aria-required="true"` or the HTML `required` attribute.
- Error messages must be linked to their field via `aria-describedby`.
- The form must have a `<fieldset>` and `<legend>` if it has logical groups of fields.
- Autocomplete attributes must be present where applicable (`autoComplete="name"`, `autoComplete="email"`, `autoComplete="tel"`).

### 8. Skip navigation

- There must be a "Skip to main content" link as the first focusable element on every page. This is a `<a href="#main-content">` that is visually hidden until focused.
- On the map page, consider an additional "Skip to map" link, though the map itself is not keyboard-operable — document this acknowledged limitation.
- The main content area must have `id="main-content"` and `tabIndex="-1"` (to receive focus programmatically).

### 9. What NOT to flag

Do not flag or attempt to fix:
- Leaflet map canvas keyboard accessibility (acknowledged limitation)
- Map marker keyboard interaction (acknowledged limitation)
- Map zoom controls keyboard access (Leaflet provides basic keyboard support natively)
- Adding `role="button"` to elements that are already `<button>` elements
- Adding ARIA roles that duplicate native HTML semantics

## Review output format

```
## Accessibility Review — [date]

### Summary
X passes, Y failures, Z warnings

### Acknowledged limitations
- Leaflet map canvas is not fully keyboard-accessible. Mitigation: /pending and /point/[id] provide full data access.

### Findings
| # | Check | Status | File:Line | Detail |
|---|-------|--------|-----------|--------|
| 1 | Keyboard nav — /pending | PASS/FAIL | ... | ... |
...

### Required fixes (blocking)
1. ...

### Recommended improvements (non-blocking)
1. ...
```

## Exit criteria

The review is complete when:
- Every section of the checklist has been evaluated with PASS or FAIL
- Every FAIL has a concrete, actionable fix with code example
- All ARIA requirements from section 3 have been individually verified
- Color-only indicators have been checked in all status-displaying components
- Form accessibility has been verified field-by-field
- The acknowledged limitations are documented but not flagged as failures
- The review output table is filled in completely
