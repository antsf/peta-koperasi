# leaflet-expert

Deep Leaflet knowledge for the Koperasi Desa Merah Putih Map — a Next.js App Router + Leaflet + OpenStreetMap project mapping Indonesian village cooperatives.

## When to Use

Activate this skill when working on any Leaflet map code in this project: rendering the map, adding/removing markers, handling map events, fixing SSR errors, or optimizing map performance.

## Core Problems and Solutions

### 1. The SSR Problem

Leaflet accesses `window` and `document` on import. Next.js App Router renders on the server first, where these globals don't exist. Every Leaflet component MUST be dynamically imported with `ssr: false`.

```tsx
// components/Map.tsx — the wrapper that gets imported elsewhere
"use client";
import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () => import("@/components/MapInner"),
  { ssr: false, loading: () => <div className="h-[70vh] bg-gray-100 animate-pulse" /> }
);

export default MapContainer;
```

The actual Leaflet code lives in `MapInner.tsx`, which is NEVER imported directly — only through the dynamic wrapper. If you see `import L from 'leaflet'` at the top level of a server component or layout, that is a bug.

### 2. The Leaflet CSS Problem

Leaflet CSS must be imported globally. In Next.js App Router, do this in `app/layout.tsx`:

```tsx
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
```

Do NOT import Leaflet CSS inside a `"use client"` component — it causes FOUC (flash of unstyled content) and duplicate style injection.

### 3. The Broken Default Marker Icon

Webpack rewrites asset paths, breaking Leaflet's default marker icon. Fix this once at the top of `MapInner.tsx`:

```tsx
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/markers/marker-icon-2x.png",
  iconUrl: "/markers/marker-icon.png",
  shadowUrl: "/markers/marker-shadow.png",
});
```

Place the marker images in `public/markers/`. Copy them from `node_modules/leaflet/dist/images/`.

### 4. MapView Re-fetch Pattern

The map fetches points based on the visible viewport. On every `moveend` event, debounce 300ms, then fetch:

```tsx
useEffect(() => {
  if (!map) return;

  let timeout: NodeJS.Timeout;

  const handleMoveEnd = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const bounds = map.getBounds();
      const params = new URLSearchParams({
        north: String(bounds.getNorth()),
        south: String(bounds.getSouth()),
        east: String(bounds.getEast()),
        west: String(bounds.getWest()),
        status: status ?? "approved",
      });
      fetch(`/api/points?${params}`)
        .then((res) => res.json())
        .then((data) => setMarkers(data.points));
    }, 300);
  };

  map.on("moveend", handleMoveEnd);
  handleMoveEnd(); // initial fetch

  return () => {
    map.off("moveend", handleMoveEnd);
    clearTimeout(timeout);
  };
}, [map, status]);
```

NEVER load all points client-side. Always viewport-bounded. The API enforces a max of ~500 points per response.

### 5. Marker Clustering

Use `leaflet.markercluster`. Clustering is mandatory at zoom levels < 8 (Indonesia-wide view where individual pins are useless).

```tsx
import "leaflet.markercluster";

const clusterGroup = L.markerClusterGroup({
  maxClusterRadius: 50,
  disableClusteringAtZoom: 8,
  spiderfyOnMaxZoom: true,
  chunkedLoading: true,
  iconCreateFunction: (cluster) => {
    const count = cluster.getChildCount();
    const size = count < 10 ? "small" : count < 50 ? "medium" : "large";
    return L.divIcon({
      html: `<div><span>${count}</span></div>`,
      className: `marker-cluster marker-cluster-${size}`,
      iconSize: L.point(40, 40),
    });
  },
});
```

### 6. Custom Marker Icons

Three pin states, three colors:

```tsx
function createPinIcon(color: "green" | "yellow" | "orange"): L.DivIcon {
  const fill = { green: "#16a34a", yellow: "#eab308", orange: "#ea580c" }[color];
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${fill}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="#fff"/>
    </svg>`,
    className: "custom-pin",
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

const ICONS = {
  approved: createPinIcon("green"),
  pending: createPinIcon("yellow"),
  flagged: createPinIcon("orange"),
} as const;
```

### 7. Popup Content

Keep popups minimal. Full details go on the detail page:

```tsx
marker.bindPopup(`
  <div class="koperasi-popup">
    <strong>${point.name}</strong>
    <p>${point.kabupaten}, ${point.provinsi}</p>
    <a href="/point/${point.id}">Lihat Detail &rarr;</a>
  </div>
`);
```

### 8. Indonesia Bounds Constraint

Lock the map to Indonesia to prevent users panning away:

```tsx
const INDONESIA_BOUNDS: L.LatLngBoundsExpression = [
  [-11, 95],   // southwest
  [6, 141],    // northeast
];

const map = L.map("map", {
  center: [-2.5, 118.0],
  zoom: 5,
  maxBounds: INDONESIA_BOUNDS,
  maxBoundsViscosity: 0.8,
  minZoom: 4,
  maxZoom: 18,
});
```

### 9. The Coordinate Order Trap

**This is the #1 source of bugs in this project.**

| Context | Order | Example |
|---------|-------|---------|
| Leaflet JS | `[lat, lng]` | `L.marker([-6.2, 106.8])` — Jakarta |
| PostGIS SQL | `(lng, lat)` | `ST_MakePoint(106.8, -6.2)` — Jakarta |
| GeoJSON | `[lng, lat]` | `"coordinates": [106.8, -6.2]` — Jakarta |

If a pin lands in the ocean south of Somalia instead of Jakarta, you swapped the coordinates.

When converting API response to Leaflet markers:
```tsx
// API returns { lat: -6.2, lng: 106.8 }
L.marker([point.lat, point.lng]) // Correct: Leaflet takes [lat, lng]
```

When sending to PostGIS:
```sql
-- Correct: ST_MakePoint takes (longitude, latitude)
ST_MakePoint(106.8, -6.2)
```

### 10. Performance: Imperative Markers over React-Leaflet Components

Do NOT use React-Leaflet's `<Marker>` component model for rendering viewport markers. Each `<Marker>` is a React component; on every pan/zoom, React re-renders potentially hundreds of components. This causes visible jank.

Instead, use imperative Leaflet API:

```tsx
// Clear old markers, add new ones imperatively
clusterGroup.clearLayers();
points.forEach((p) => {
  const marker = L.marker([p.lat, p.lng], { icon: ICONS[p.status] });
  marker.bindPopup(/* ... */);
  clusterGroup.addLayer(marker);
});
```

This is a React app that uses Leaflet imperatively — not a React-Leaflet app.

### 11. Touch/Mobile

- Set `tap: true` and `tapTolerance: 15` in map options for reliable mobile pin selection.
- Popups should be max 250px wide to fit on 375px screens.
- The submit-pin "drop pin on tap" interaction must use `map.on('click')`, which Leaflet normalizes for both mouse and touch.

### 12. OSM Tiles Only

The ONLY permitted tile layer:

```tsx
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(map);
```

No Google Maps. No Mapbox. No paid tile services.

## Checklist Before Committing Map Code

- [ ] Map component is dynamically imported with `ssr: false`
- [ ] No direct `import L from 'leaflet'` in any server component or layout
- [ ] Leaflet CSS imported in `app/layout.tsx`, not in a client component
- [ ] Default marker icon fix is applied (mergeOptions)
- [ ] Coordinates are in correct order: `[lat, lng]` for Leaflet, `(lng, lat)` for PostGIS
- [ ] Viewport re-fetch uses 300ms debounce on `moveend`
- [ ] No full-dataset fetch — always viewport-bounded with max 500 points
- [ ] Marker clustering enabled and configured to decluster at zoom 8
- [ ] Markers use imperative API, not React-Leaflet `<Marker>` components
- [ ] Popups are narrow enough for mobile (max 250px)
- [ ] Map is bounded to Indonesia (`maxBounds`)
- [ ] Only OSM tiles are used
- [ ] Touch interactions tested (or at minimum, `tap: true` is set)

## Exit Criteria

The map task is done when:

1. The map renders correctly on first load with no SSR errors in the console.
2. Panning and zooming triggers viewport-bounded re-fetch with visible markers updating.
3. Clustering groups pins at zoom < 8 and expands them at zoom >= 8.
4. Pin colors match status (green = approved, yellow = pending, orange = flagged).
5. Popup shows name, kabupaten, and "Lihat Detail" link that navigates to `/point/[id]`.
6. Map is constrained to Indonesia bounds.
7. Mobile: pins are tappable, popups are readable, no horizontal overflow.
8. No console errors related to Leaflet, SSR, or missing icons.
