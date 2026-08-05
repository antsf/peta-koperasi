'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Map as LeafletMap, DivIcon, Marker } from 'leaflet'
import type { KoperasiPointSummary } from '@/types'
import { useTranslation } from '@/lib/i18n'

const MAP_CENTER_LAT = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT ?? '-2.5')
const MAP_CENTER_LNG = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG ?? '118.0')
const MAP_DEFAULT_ZOOM = parseInt(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM ?? '5')

const INDONESIA_BOUNDS: [[number, number], [number, number]] = [
  [-11.0, 95.0],
  [6.0, 141.0],
]

interface MapViewProps {
  status?: 'approved' | 'pending'
  onPointClick?: (point: KoperasiPointSummary) => void
  filterProvinsi?: string
  filterKabupaten?: string
}

export function MapView({
  status = 'approved',
  onPointClick,
  filterProvinsi,
  filterKabupaten,
}: MapViewProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<Marker[]>([])
  const [loading, setLoading] = useState(false)
  const [limited, setLimited] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchAndRenderPoints = useCallback(async (map: LeafletMap) => {
    const bounds = map.getBounds()
    const params = new URLSearchParams({
      north: String(bounds.getNorth()),
      south: String(bounds.getSouth()),
      east: String(bounds.getEast()),
      west: String(bounds.getWest()),
      status,
    })
    if (filterProvinsi) params.set('provinsi', filterProvinsi)
    if (filterKabupaten) params.set('kabupaten', filterKabupaten)

    setLoading(true)
    try {
      const res = await fetch(`/api/points?${params}`)
      if (!res.ok) {
        console.error(`[map] API ${res.status}`)
        return
      }
      const json = await res.json()
      setLimited(json.limited ?? false)
      renderMarkers(map, json.data ?? [])
    } catch (err) {
      console.error('[map] Failed to fetch points:', err)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, filterProvinsi, filterKabupaten])

  function renderMarkers(map: LeafletMap, points: KoperasiPointSummary[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).LeafletLib
    if (!L) return

    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    points.forEach(point => {
      const color = point.status === 'approved' ? '#0B6E4F' : '#D97706'
      const icon: DivIcon = L.divIcon({
        className: '',
        html: `<div style="width:24px;height:32px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(28,25,23,0.2)"></div>`,
        iconSize: [24, 32],
        iconAnchor: [12, 32],
      })

      const marker: Marker = L.marker([point.latitude, point.longitude], { icon })
      marker.bindPopup(`
        <div style="font-family:Inter,system-ui,sans-serif;min-width:180px;padding:4px 0">
          <div style="font-weight:600;font-size:14px;color:#1C1917;margin-bottom:4px;line-height:1.3">${point.name}</div>
          <div style="font-size:12px;color:#57534E;margin-bottom:8px">${point.kabupaten}, ${point.provinsi}</div>
          <a href="/point/${point.id}" style="font-size:12px;font-weight:500;color:#0B6E4F;text-decoration:none">Lihat Detail →</a>
        </div>
      `, { maxWidth: 220 })

      if (onPointClick) {
        marker.on('click', () => onPointClick(point))
      }

      marker.addTo(map)
      markersRef.current.push(marker)
    })
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    ;(async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      // Fix broken default icons in webpack
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Store L on window under a namespaced key for renderMarkers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).LeafletLib = L

      const map = L.map(containerRef.current!, {
        center: [MAP_CENTER_LAT, MAP_CENTER_LNG],
        zoom: MAP_DEFAULT_ZOOM,
        maxBounds: INDONESIA_BOUNDS,
        maxBoundsViscosity: 0.8,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map)

      mapRef.current = map
      fetchAndRenderPoints(map)

      map.on('moveend', () => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => fetchAndRenderPoints(map), 300)
      })
    })()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markersRef.current = []
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapRef.current) return
    fetchAndRenderPoints(mapRef.current)
  }, [filterProvinsi, filterKabupaten, fetchAndRenderPoints])

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="absolute inset-0 bg-surface-raised"
        aria-label="Peta koperasi Indonesia"
        role="application"
      />

      {loading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-surface px-3 py-1.5 rounded-full shadow-popup text-xs text-text-secondary flex items-center gap-2">
          <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          {t('common.loading')}
        </div>
      )}

      {limited && !loading && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-surface/95 px-4 py-2 rounded-full shadow-popup text-xs text-text-secondary">
          {t('home.zoom_in_prompt')}
        </div>
      )}
    </div>
  )
}
