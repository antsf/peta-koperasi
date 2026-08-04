# react-performance

Performance optimization skill specific to the Koperasi Desa Merah Putih Map application.

## Activation

Use this skill when reviewing or implementing performance-related code in the map application, or when a component re-renders too often or the UI feels sluggish.

---

## Where Performance Actually Matters

### MapView is the ONLY hot path

`MapView` re-renders on every pan/zoom because it manages the `points` state array and the map viewport. Every other component in this app renders infrequently and handles small data sets. Focus performance work here and only here.

### Components that need ZERO performance work

- `PointCard` — renders once per page load on `/point/[id]`. One render. No optimization needed.
- `Header`, `Footer` — static markup, renders once.
- `SearchBar` — fires on submit or on debounced input. Not a bottleneck.
- `RegionFilter` — renders a short list of Indonesian provinces (~34 items). Trivial.
- `PhotoDisplay` — renders 1-3 images. Not a bottleneck.
- `LanguageToggle` — two options. Not a bottleneck.

**Do not add `React.memo`, `useMemo`, or `useCallback` to these components.** It adds complexity with zero measurable benefit.

---

## Marker Clustering

### The problem
At zoom levels 5-8 (province/regency level), hundreds of pins overlap, creating visual noise and slow rendering.

### The solution: Leaflet.markercluster

```typescript
// Inside MapView ("use client")
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import MarkerClusterGroup from "react-leaflet-cluster";

function MapView() {
  return (
    <MapContainer>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
      >
        {points.map((point) => (
          <Marker key={point.id} position={[point.latitude, point.longitude]}>
            <Popup>{point.name}</Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
```

### When to cluster
- Always cluster when zoom < 12 (regency level and above).
- `chunkedLoading` prevents the browser from freezing when adding many markers at once.

### When NOT to cluster
- At zoom >= 15 (village level), pins are far enough apart. Clustering still works but adds no visual benefit. The library handles this automatically — clusters of 1 just show the pin.

---

## The Viewport Debounce Problem

### The problem
User pans the map. Leaflet fires `moveend` after every gesture. Without debouncing, each pan triggers an API call.

### The solution: 300ms debounce

```typescript
const timeoutRef = useRef<NodeJS.Timeout>();

const handleViewportChange = useCallback((viewport: Viewport) => {
  clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(async () => {
    const res = await fetch(
      `/api/points?north=${viewport.north}&south=${viewport.south}` +
      `&east=${viewport.east}&west=${viewport.west}`
    );
    const json: ApiResponse<KoperasiPoint[]> = await res.json();
    if (json.success) setPoints(json.data);
  }, 300);
}, []);
```

### Why 300ms
- 100ms — too aggressive, fires during multi-gesture pans.
- 300ms — feels instant to humans, but waits for the gesture to finish.
- 500ms+ — noticeable lag, map feels unresponsive.

### Cleanup
Always clear the timeout on unmount:
```typescript
useEffect(() => {
  return () => clearTimeout(timeoutRef.current);
}, []);
```

---

## useMemo and useCallback: When Actually Needed

### Genuinely useful in this app

**1. `useCallback` for `handleViewportChange`** — passed as a prop to `MapEventHandler`. Without `useCallback`, the handler reference changes on every render, causing the `useEffect` inside `MapEventHandler` to re-attach the Leaflet event listener.

**2. `useMemo` for filtered/sorted points** — if the app filters points by status or region client-side:
```typescript
const approvedPoints = useMemo(
  () => points.filter((p) => p.status === "approved"),
  [points]
);
```

**3. `useCallback` for VoteButtons `onVote`** — prevents re-creating the vote handler on every parent render, which would cause unnecessary re-renders of the disabled-state logic.

**4. `useMemo` for RegionFilter options** — the province list is static per render, derived from a server response. Memoize it to avoid re-computing on every parent render:
```typescript
const regionOptions = useMemo(
  () => regions.map((r) => ({ value: r.code, label: r.name })),
  [regions]
);
```

### NOT needed (premature optimization)

- `React.memo(PointCard)` — rendered once per page load, not in a list that re-renders.
- `React.memo(Header)` / `React.memo(Footer)` — rendered once, at the root layout level.
- `useMemo` for string formatting or simple computations.
- `useCallback` for event handlers that are not passed as props to memoized children.

---

## The "500 Pins" Limit

### The problem
Rendering >500 Leaflet markers causes visible jank on mid-range Android phones (the primary user device in rural Indonesia).

### The solution: server-side limiting

```typescript
// src/lib/supabase/points.ts
export async function getPointsByViewport(viewport: Viewport): Promise<KoperasiPoint[]> {
  const { data } = await supabase
    .from("koperasi_points")
    .select("id, name, latitude, longitude, status, province, regency")
    .gte("latitude", viewport.south)
    .lte("latitude", viewport.north)
    .gte("longitude", viewport.west)
    .lte("longitude", viewport.east)
    .eq("status", "approved")
    .limit(500);

  return data ?? [];
}
```

### Key design decisions
- The API enforces `LIMIT 500`. The client never receives more.
- At low zoom levels (country view), the server returns the 500 most recent/relevant points. The user zooms in to see more.
- Select only the columns needed for map pins (`id, name, latitude, longitude, status, province, regency`). Do not fetch `description`, `photo_url`, `created_at` — those are loaded on the detail page.
- Use PostGIS `ST_Within` for proper spatial queries when the dataset grows beyond what simple lat/lng comparison handles.

---

## Photo Lazy Loading

### The approach: native `loading="lazy"`

```typescript
// src/components/photo-display.tsx (server component)
export function PhotoDisplay({ photoUrl, alt }: { photoUrl: string | null; alt: string }) {
  if (!photoUrl) return null;

  return (
    <img
      src={photoUrl}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="w-full rounded-lg object-cover aspect-video"
    />
  );
}
```

### Why NOT IntersectionObserver for v1
- The native `loading="lazy"` attribute has >95% browser support in Indonesia (Chrome Android dominates).
- `PhotoDisplay` appears on `/point/[id]` — a single detail page with 1-3 photos. Not a long scrollable list.
- IntersectionObserver is overkill here. Save it for if/when there is a photo gallery with 50+ images.

### If a scrollable photo list is added later
Use `IntersectionObserver` via a lightweight hook:
```typescript
function useLazyLoad(ref: RefObject<HTMLElement>) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { rootMargin: "200px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return isVisible;
}
```

---

## Anti-Patterns to Reject

### 1. Memoizing everything
```typescript
// BAD — Header never re-renders, memo is dead code
const MemoizedHeader = React.memo(Header);
```

### 2. Virtualizing short lists
```typescript
// BAD — pending page will never show more than ~50 items
import { FixedSizeList } from "react-window";
// Overkill. Just use .map().
```

### 3. Over-engineering state management
```typescript
// BAD — Redux/Zustand for a simple points array
import { create } from "zustand";
// This app has ONE piece of shared client state: the points array in MapView.
// useState is sufficient.
```

### 4. Premature code splitting
```typescript
// BAD — splitting PointCard into its own chunk
const PointCard = dynamic(() => import("./point-card"));
// PointCard is <1KB. Code splitting adds a network round-trip for nothing.
// Only MapView (because of Leaflet) benefits from dynamic import.
```

### 5. Fetching inside useEffect when server component would do
```typescript
// BAD — in /pending/page.tsx
"use client";
useEffect(() => { fetch("/api/points?status=pending").then(...) }, []);

// GOOD — server component, no client JS needed
export default async function PendingPage() {
  const points = await getPendingPoints();
  return <PointList points={points} />;
}
```

---

## How to Measure Performance

### React DevTools Profiler
1. Open React DevTools > Profiler tab.
2. Pan/zoom the map.
3. Look at the flamegraph for `MapView`.
4. **What to check:**
   - Does `MapView` re-render on every `moveend`? Expected — it updates the points list.
   - Do `Header`, `Footer`, `SearchBar` re-render during map interaction? They should NOT. If they do, the state is lifted too high.
   - Is the `MarkerClusterGroup` render time >16ms? If yes, you have too many markers (check the 500 limit).

### Chrome Performance tab
1. Record a 5-second pan/zoom session.
2. Look for long tasks (>50ms, shown in red).
3. Common culprits: too many DOM nodes (markers), JSON parsing of large responses, layout thrashing from marker repositioning.

### Lighthouse
- Target: Performance score >70 on mobile (3G throttled).
- LCP: the map tiles load. Not much we can control beyond tile CDN caching.
- CLS: the map container must have a fixed height (`h-[calc(100vh-4rem)]`) so it does not shift.
- TBT: keep JS bundle small. Leaflet + react-leaflet is ~40KB gzipped — acceptable.

---

## Exit Criteria

A performance task is complete when:
1. MapView renders <500 markers at any zoom level.
2. Viewport changes are debounced at 300ms.
3. No `React.memo`, `useMemo`, or `useCallback` exists on components that do not need it.
4. `Header`, `Footer`, `SearchBar`, `RegionFilter` do not re-render during map interaction.
5. Marker clustering is active and uses `chunkedLoading`.
6. No virtualization libraries are used for lists under 100 items.
7. Photos use native `loading="lazy"`.
8. Lighthouse mobile performance score is >70.
