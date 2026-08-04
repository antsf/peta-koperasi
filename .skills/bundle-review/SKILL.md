# bundle-review

JavaScript bundle size review for a map application serving users on slow connections in rural Indonesia.

## When to use

Run this skill when adding or updating dependencies, before a release milestone, when `next build` output shows unexpected size increases, or when investigating slow page loads. Also run when reviewing any PR that adds a new `import` statement for an external package.

## Activation

Trigger: user says "bundle review", "bundle size", "bundle analysis", "dependency review", "check bundle", or invokes `/bundle-review`.

## Instructions

You are reviewing JavaScript bundle size for a civic-tech crowdsourced map of Indonesian village cooperatives. Users are on budget Android devices over 3G/4G in rural areas. Every unnecessary kilobyte is a civic cost — it is bandwidth that a user in a remote village pays for and waits for.

Work through each section below in order. Read the relevant files, report findings, and flag violations.

---

### 1. Bundle Budget

**Total JS budget (gzipped, first load): 300kB**

This is not arbitrary. A budget Android phone on a 3G connection (~400kbps effective throughput) takes ~6 seconds to download 300kB. Add parse/compile time on a slow CPU and you are at 8-10 seconds before the page is interactive. This is already pushing the limit.

| Component | Budget (gzipped) | Notes |
|-----------|------------------|-------|
| Next.js framework | ~87kB | Non-negotiable, framework cost |
| Leaflet | ~41kB | Core mapping library |
| Leaflet.markercluster | ~20kB | Clustering for dense areas |
| FingerprintJS | ~8kB | Anti-fraud fingerprinting |
| Zod | ~13kB | Client-side form validation |
| Tailwind CSS | ~15kB | Fully purged |
| App code | remaining (~116kB) | All custom components, utilities, hooks |

**Total accounted: ~184kB framework + deps, ~116kB for app code.**

Any new dependency must justify its gzipped size against this remaining budget.

---

### 2. How to Run Bundle Analysis

**Method 1: `next build` output**

Run `next build` and read the route-by-route size table. Each route shows:
- Size: the route-specific JS
- First Load JS: route JS + shared chunks (this is what matters)

Check the `next build` output or read `.next/` build artifacts if available.

**Method 2: `@next/bundle-analyzer`**

Check if `@next/bundle-analyzer` is in `package.json` devDependencies. If installed:
```bash
ANALYZE=true next build
```
This opens a treemap visualization showing every module's contribution.

If not installed, recommend adding it as a devDependency:
```bash
npm install --save-dev @next/bundle-analyzer
```

**Method 3: Manual inspection**

Read `package.json` dependencies. For each dependency, estimate gzipped size using bundlephobia data. Flag any dependency exceeding 50kB gzipped.

---

### 3. Leaflet Dynamic Import Verification

Leaflet must be in a separate chunk, loaded only when the map component mounts. It must NOT be in the main page JS bundle.

**Verify:**

1. Read the MapView component. It should be imported via `next/dynamic`:
   ```tsx
   const MapView = dynamic(() => import('@/components/map-view'), { ssr: false })
   ```

2. Search for `import L from 'leaflet'` or `import * as L from 'leaflet'` or `import { ... } from 'leaflet'` in ALL files. These imports must ONLY appear in:
   - The MapView component file
   - Files that are only imported by MapView

3. Search `layout.tsx` and `page.tsx` (the root ones) for any Leaflet import — must not exist.

4. Check that `leaflet.css` is imported only inside the MapView component or loaded conditionally, not in `globals.css` or `layout.tsx`.

**Flag if:**
- Leaflet imported in layout.tsx or a server component — **CRITICAL**
- Leaflet CSS in globals.css — **WARNING** (loads CSS for every page, not just map)
- Leaflet not using dynamic import with ssr: false — **CRITICAL**

---

### 4. Leaflet.markercluster Isolation

Leaflet.markercluster adds ~20kB gzipped. It should only load when MapView loads.

**Verify:**

1. Search for `markercluster` imports. They must only appear in files imported by MapView.
2. Verify markercluster is not re-exported from a barrel file (`index.ts`) that other components import.

**Flag if:**
- Markercluster in main bundle — **WARNING**

---

### 5. FingerprintJS Loading Strategy

FingerprintJS (~8kB gzipped) is used for vote deduplication. It is acceptable in size but must not block page rendering.

**Verify:**

1. Search for FingerprintJS imports. It should be loaded in a `useEffect` or called lazily, not at module top level in a component that renders on every page.
2. If FingerprintJS is initialized in a context provider or layout, verify it uses `dynamic import()` or is deferred until after the page is interactive.

**Flag if:**
- FingerprintJS blocks initial render — **WARNING**
- FingerprintJS imported synchronously in layout.tsx — **WARNING**

---

### 6. The "Imported on Every Page" Trap

Any module imported in `layout.tsx` (the root layout) becomes part of the shared chunk loaded on EVERY page. This is the most expensive place to import anything.

**Audit `layout.tsx` imports:**

1. Read `src/app/layout.tsx`.
2. List every import statement.
3. For each import, determine if it is needed on every page:
   - `globals.css` — yes, needed
   - Header component — yes, if header is on every page
   - i18n provider — yes, if language toggle is global
   - Anything else — question it

4. Search for heavy dependencies in the import chain. If layout imports a component that imports a heavy library, that library is in the shared chunk.

**Flag if:**
- Layout imports a component that transitively imports Leaflet — **CRITICAL**
- Layout imports a component exceeding 20kB gzipped — **WARNING**
- Layout imports a utility that is only used on one page — **INFO**

---

### 7. Tree Shaking Verification

**Tailwind CSS:**
- Must be processed by PostCSS with purging enabled. Verify `tailwind.config.ts` has `content` paths pointing to all component files.
- Search for `import 'tailwindcss/tailwind.css'` — this imports the FULL Tailwind CSS (~3MB unpurged). Must not exist. The correct pattern is `@tailwind base; @tailwind components; @tailwind utilities;` in `globals.css`.

**Icon libraries:**
- If an icon library is used (lucide-react, heroicons, react-icons), verify individual icon imports:
  - GOOD: `import { MapPin } from 'lucide-react'`
  - BAD: `import * as Icons from 'lucide-react'` (imports ALL icons)

**Lodash:**
- If lodash is a dependency, verify individual function imports:
  - GOOD: `import debounce from 'lodash/debounce'`
  - BAD: `import { debounce } from 'lodash'` (imports full lodash ~70kB)

**Flag if:**
- Full Tailwind CSS imported — **CRITICAL**
- Barrel import of icon library — **WARNING**
- Full lodash imported — **WARNING**

---

### 8. Dependency Rejection Criteria

Any dependency should be rejected if:

1. **Size > 50kB gzipped** without explicit justification documented in a comment or PR description
2. **Duplicate functionality:** two date libraries, two icon sets, two HTTP clients, two validation libraries
3. **Client-side i18n framework** (next-intl, react-i18next, etc.) when the project uses a simple JSON + custom hook approach — these frameworks add 15-40kB for functionality the project does not need
4. **UI component library** (MUI, Chakra, Ant Design) — the project uses Tailwind. A component library would add 50-200kB and conflict with the styling approach
5. **State management library** (Redux, MobX, Zustand) — the project's state needs are simple enough for React useState/useContext
6. **Animation library** (Framer Motion, GSAP) — the project has no animations by design (soul.md: simplicity)

**Review `package.json` dependencies:**

1. Read `package.json`.
2. For each dependency, verify it is in the approved list or has clear justification.
3. For each devDependency, verify it is not accidentally bundled (imported in source code).

**Approved dependencies:** next, react, react-dom, leaflet, leaflet.markercluster, @fingerprintjs/fingerprintjs, zod, @supabase/supabase-js, tailwindcss, postcss, autoprefixer.

**Flag if:**
- Unapproved dependency exceeding 50kB — **CRITICAL**
- Duplicate functionality — **WARNING**
- devDependency imported in source code — **CRITICAL**

---

### 9. Tracing a Bundle Regression

When bundle size increases unexpectedly, use this process:

1. Compare `next build` output between the current branch and main.
2. If the increase is in a specific route, check that route's imports for new dependencies.
3. If the increase is in the shared chunk, check `layout.tsx` and shared utility imports.
4. Use `git bisect` with a script that runs `next build` and checks output size to find the offending commit:
   ```bash
   git bisect start HEAD <last-known-good-commit>
   git bisect run bash -c 'next build 2>&1 | grep "First Load JS" | awk "{print \$4}" | head -1 | xargs -I {} test {} -lt 300'
   ```
5. Once the commit is found, review its changes for new imports or dependency additions.

---

### 10. Review Checklist

- [ ] Total first-load JS on `/` (map page) is under 300kB gzipped
- [ ] Total first-load JS on other pages is under 250kB gzipped
- [ ] Leaflet is in a separate dynamic chunk (not in main bundle)
- [ ] Leaflet.markercluster is only loaded with MapView
- [ ] Leaflet CSS is not in globals.css
- [ ] FingerprintJS loads asynchronously, not blocking render
- [ ] `layout.tsx` imports are minimal and justified
- [ ] No layout import transitively pulls in Leaflet or other heavy deps
- [ ] Tailwind CSS is purged (not full import)
- [ ] Icon imports are individual, not barrel imports
- [ ] No dependency exceeds 50kB gzipped without justification
- [ ] No duplicate functionality in dependencies
- [ ] No devDependency imported in source code
- [ ] `package.json` contains only approved or justified dependencies
- [ ] `@next/bundle-analyzer` is available as a devDependency

---

### 11. Exit Criteria

The review is complete when:

1. Every item in the checklist above is confirmed PASS or has a filed finding
2. All CRITICAL findings are reported with file path, line number, and fix suggestion
3. All WARNING findings are reported with explanation of risk and remediation
4. A bundle size table is provided showing each route's first-load JS from `next build` output (or estimated from code analysis)
5. Every dependency in `package.json` is accounted for with its approximate gzipped size
6. A summary is provided: X critical / Y warning / Z info findings
7. If budget is exceeded, specific reduction recommendations are listed with estimated savings
