'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { RegionFilter } from '@/components/region-filter'
import Link from 'next/link'

// Leaflet is SSR-incompatible — must be dynamically imported with ssr:false
const MapView = dynamic(
  () => import('@/components/map-view').then(m => ({ default: m.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-surface-raised flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Memuat peta...</p>
        </div>
      </div>
    ),
  }
)

export default function HomePage() {
  const [filterProvinsi, setFilterProvinsi] = useState('')
  const [filterKabupaten, setFilterKabupaten] = useState('')

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-surface z-10">
        <RegionFilter onFilterChange={(p, k) => { setFilterProvinsi(p); setFilterKabupaten(k) }} />
        <Link
          href="/submit"
          className="ml-auto sm:hidden flex items-center gap-1 h-9 px-4 bg-primary text-white text-sm font-medium rounded-button hover:bg-primary-hover transition-colors duration-180"
        >
          + Tambah
        </Link>
      </div>

      {/* Map — dynamic height: fixed on mobile, fills viewport on desktop */}
      <div className="w-full h-[50vh] sm:h-[calc(100vh-8rem)] min-h-[300px]">
        <MapView
          status="approved"
          filterProvinsi={filterProvinsi}
          filterKabupaten={filterKabupaten}
        />
      </div>
    </div>
  )
}
