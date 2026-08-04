# nextjs-expert

Primary engineering implementation skill for the Koperasi Desa Merah Putih Map project.

## Activation

Use this skill when implementing features, fixing bugs, or writing new code in this Next.js 14+ App Router + Supabase + Leaflet project.

---

## Server Components vs Client Components

**Default is Server Component.** Only add `"use client"` when the component genuinely needs browser APIs or interactive state.

### Components that MUST be `"use client"`
- `MapView` — Leaflet requires the DOM (`window`, `document`, `L.map()`).
- `VoteButtons` — interactive state: optimistic vote count, disabled-while-submitting.
- `SubmitForm` — controlled form inputs, file upload preview, client-side Zod validation feedback.

### Components that MUST stay Server Components
- `PointCard` — receives data via props, renders static markup.
- `Header`, `Footer` — static layout, no interactivity.
- `RegionFilter` — if it only generates `<a>` links with query params. If it uses `useState` for a dropdown, it becomes client.
- `SearchBar` — depends on implementation. Prefer server with `<form action>` pattern. If autocomplete is needed, then client.
- `PhotoDisplay` — server component that renders `<img>` tags. Lazy loading uses native `loading="lazy"` attribute, no JS needed.
- `MapPin` — rendered inside MapView's client boundary, but defined as a plain object/config, not a standalone client component.
- `LanguageToggle` — if it uses cookies/URL params (server-friendly). If it uses `useState`, then client.

### Decision rule
Ask: "Does this component call `useState`, `useEffect`, `useRef`, or attach an event handler?" If no, it is a server component.

---

## App Router File Structure

```
src/app/
  layout.tsx          — root layout (server), wraps Header + Footer
  page.tsx            — / (map page, server shell that renders MapView client component)
  submit/
    page.tsx          — /submit (server shell that renders SubmitForm client component)
  pending/
    page.tsx          — /pending (server component, fetches pending points server-side)
  point/
    [id]/
      page.tsx        — /point/[id] (server component, fetches single point server-side)
  api/
    points/
      route.ts        — GET (list points), POST (create point)
    points/
      [id]/
        route.ts      — GET (single point)
        vote/
          route.ts    — POST (cast vote)
    regions/
      route.ts        — GET (list regions)
    stats/
      route.ts        — GET (aggregate stats)
```

Every `page.tsx` uses default export. Every other file uses named exports.

---

## API Route Handler Pattern

Every API route handler follows this exact sequence:

```typescript
// src/app/api/points/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPoint, getPointsByViewport } from "@/lib/supabase/points";
import { hashPII } from "@/lib/hash";
import type { ApiResponse, KoperasiPoint } from "@/types";

const createPointSchema = z.object({
  name: z.string().min(1).max(200),
  latitude: z.number().min(-11).max(6),    // Indonesia bounds
  longitude: z.number().min(95).max(141),   // Indonesia bounds
  province: z.string().min(1),
  regency: z.string().min(1),
  description: z.string().max(2000).optional(),
  submitter_fingerprint: z.string().min(1),
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<KoperasiPoint>>> {
  // 1. Parse & validate with Zod — return early on failure
  const body = await request.json();
  const parsed = createPointSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // 2. Hash PII — never store raw IP or fingerprint
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const hashedIp = hashPII(ip);
  const hashedFingerprint = hashPII(parsed.data.submitter_fingerprint);

  // 3. Supabase query — all DB access through src/lib/supabase/*
  const point = await createPoint({
    ...parsed.data,
    submitter_ip: hashedIp,
    submitter_fingerprint: hashedFingerprint,
  });

  // 4. Return typed response
  return NextResponse.json({ success: true, data: point }, { status: 201 });
}
```

**Key rules:**
- Zod validation is ALWAYS step 1. No Supabase call happens before validation passes.
- PII (IP, fingerprint) is hashed with `hashPII()` from `src/lib/hash.ts` before any DB write.
- All Supabase queries live in `src/lib/supabase/` — never inline `supabase.from(...)` in route handlers.
- Return type is always `NextResponse<ApiResponse<T>>`.

---

## Leaflet in Next.js: The SSR Problem

Leaflet accesses `window` and `document` at import time. Next.js renders server-side first. This crashes.

### The fix: dynamic import with `ssr: false`

```typescript
// src/app/page.tsx (server component)
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => <div className="h-[calc(100vh-4rem)] bg-slate-100 animate-pulse" />,
});

export default function HomePage() {
  return <MapView />;
}
```

### Rules for Leaflet code
1. **Never** `import L from "leaflet"` at the top of a module that could be server-rendered.
2. The `MapView` component itself has `"use client"` and can import Leaflet normally because it is only ever loaded client-side via `dynamic(..., { ssr: false })`.
3. Leaflet CSS must be imported inside the client component or via `<link>` in the `<head>`.
4. All Leaflet plugins (markercluster, etc.) are imported inside `useEffect` or at the top of the `"use client"` file.

---

## Photo Upload (multipart/form-data in App Router)

```typescript
// src/app/api/points/route.ts — handling photo upload
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("photo") as File | null;
  const dataJson = formData.get("data") as string;

  // Validate the JSON payload
  const parsed = createPointSchema.safeParse(JSON.parse(dataJson));
  if (!parsed.success) { /* return 400 */ }

  // Validate the file
  if (file) {
    if (file.size > 5 * 1024 * 1024) { /* return 400: max 5MB */ }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { /* return 400 */ }

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `photos/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    await uploadPhoto(path, buffer, file.type);
  }
  // ... continue with point creation
}
```

**Do not** use `bodyParser` or `multer`. App Router handles `formData()` natively.

---

## MapView Re-fetch Pattern (viewport changes)

When the user pans or zooms, the map should fetch new points for the visible area.

```typescript
// Inside MapView ("use client")
import { useCallback, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

function MapEventHandler({ onViewportChange }: { onViewportChange: (v: Viewport) => void }) {
  const map = useMap();

  useEffect(() => {
    const handler = () => {
      const bounds = map.getBounds();
      onViewportChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        zoom: map.getZoom(),
      });
    };
    map.on("moveend", handler);
    return () => { map.off("moveend", handler); };
  }, [map, onViewportChange]);

  return null;
}

// In the parent MapView component:
const [points, setPoints] = useState<KoperasiPoint[]>([]);
const timeoutRef = useRef<NodeJS.Timeout>();

const handleViewportChange = useCallback((viewport: Viewport) => {
  clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(async () => {
    const res = await fetch(
      `/api/points?north=${viewport.north}&south=${viewport.south}&east=${viewport.east}&west=${viewport.west}`
    );
    const data: ApiResponse<KoperasiPoint[]> = await res.json();
    if (data.success) setPoints(data.data);
  }, 300); // 300ms debounce
}, []);
```

**Key:** The debounce prevents firing an API call on every pixel of a pan gesture. 300ms is the sweet spot.

---

## i18n Pattern

### Server components — use `getTranslation()`
```typescript
// src/app/pending/page.tsx
import { getTranslation } from "@/lib/i18n";

export default async function PendingPage() {
  const t = await getTranslation();
  return <h1>{t("pending.title")}</h1>;
}
```

### Client components — use `useTranslation()` hook
```typescript
// src/components/submit-form.tsx
"use client";
import { useTranslation } from "@/lib/i18n";

export function SubmitForm() {
  const { t } = useTranslation();
  return <button>{t("submit.button")}</button>;
}
```

Translation files live at `messages/id.json` and `messages/en.json`. Keys are dot-notated and grouped by page/feature.

---

## Supabase Client Selection

### `src/lib/supabase/client.ts` — anon key, used in client components
- For reading public data (approved points, regions, stats).
- Used in `"use client"` components that call Supabase directly (if any — prefer API routes).
- Row Level Security (RLS) is enforced.

### `src/lib/supabase/server.ts` — service role key, used in API routes and server components
- For writes (creating points, casting votes).
- For reading data that includes non-public fields.
- Bypasses RLS — use with care.
- **Never import this in a `"use client"` file.** The service role key must never reach the browser.

---

## Common Mistakes to Catch

1. **Forgetting `"use client"`** — component uses `useState` but has no directive. Build will fail or hydration will break.
2. **Using `useEffect` to fetch data in a server component** — just `await` the data directly. No `useEffect`, no `useState`, no loading spinners.
3. **Importing Leaflet at module level in a server-rendered file** — always use `dynamic(() => import(...), { ssr: false })`.
4. **Inline `supabase.from("koperasi_points")` in a route handler** — extract to `src/lib/supabase/points.ts`.
5. **Exposing PII** — returning `submitter_ip` or `submitter_fingerprint` in API responses to the client.
6. **Using `router.push()` where a `<Link>` suffices** — prefer declarative navigation.
7. **`fetch()` inside server components without caching strategy** — use `{ next: { revalidate: 60 } }` or appropriate cache settings.
8. **Missing explicit return types on API route handlers.**

---

## Checklist Before Committing a Next.js File

- [ ] Server or client? Is `"use client"` present only if genuinely needed?
- [ ] If it imports Leaflet: is it loaded via `dynamic(..., { ssr: false })`?
- [ ] If it is an API route: does it validate with Zod first, hash PII, use `src/lib/supabase/*`?
- [ ] Return types: does the API handler have an explicit `Promise<NextResponse<ApiResponse<T>>>` return type?
- [ ] No `any` types (or has a `// TODO:` comment explaining why)?
- [ ] All Supabase queries go through `src/lib/supabase/` functions, not inline?
- [ ] PII is hashed before storage and absent from client-facing responses?
- [ ] i18n: uses `getTranslation()` (server) or `useTranslation()` (client), not hardcoded strings?
- [ ] File name is kebab-case?
- [ ] One component per file, named export (except `page.tsx`)?
- [ ] Tailwind only — no CSS modules, no `style=` objects?

---

## Exit Criteria

A task using this skill is complete when:
1. The implemented code compiles with `npm run build` (no TypeScript errors, no build warnings).
2. Server/client boundary is correct — no hydration mismatches.
3. Leaflet components load without SSR crashes.
4. API routes follow the Zod-first pattern with typed responses.
5. No PII leaks in client-facing responses.
6. All DB access goes through `src/lib/supabase/` functions.
7. i18n strings are externalized to `messages/*.json`.
8. The checklist above has zero unchecked items for every file touched.
