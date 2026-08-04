'use client'

import { useState, useEffect } from 'react'
import type { RegionGroup } from '@/types'

interface RegionFilterProps {
  onFilterChange: (provinsi: string, kabupaten: string) => void
}

export function RegionFilter({ onFilterChange }: RegionFilterProps) {
  const [regions, setRegions] = useState<RegionGroup[]>([])
  const [selectedProvinsi, setSelectedProvinsi] = useState('')
  const [selectedKabupaten, setSelectedKabupaten] = useState('')

  useEffect(() => {
    fetch('/api/regions')
      .then(r => r.json())
      .then(({ data }) => setRegions(data ?? []))
      .catch(() => {/* silent — filter just won't populate */})
  }, [])

  const kabupatenList =
    regions.find(r => r.provinsi === selectedProvinsi)?.kabupaten_list ?? []

  function handleProvinsi(val: string) {
    setSelectedProvinsi(val)
    setSelectedKabupaten('')
    onFilterChange(val, '')
  }

  function handleKabupaten(val: string) {
    setSelectedKabupaten(val)
    onFilterChange(selectedProvinsi, val)
  }

  function clearFilter() {
    setSelectedProvinsi('')
    setSelectedKabupaten('')
    onFilterChange('', '')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selectedProvinsi}
        onChange={e => handleProvinsi(e.target.value)}
        className="h-9 pl-3 pr-8 text-sm border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:border-primary transition-colors duration-120 appearance-none cursor-pointer"
        aria-label="Filter by province"
        role="combobox"
        aria-expanded="false"
      >
        <option value="">Semua Provinsi</option>
        {regions.map(r => (
          <option key={r.provinsi} value={r.provinsi}>{r.provinsi}</option>
        ))}
      </select>

      {selectedProvinsi && (
        <select
          value={selectedKabupaten}
          onChange={e => handleKabupaten(e.target.value)}
          className="h-9 pl-3 pr-8 text-sm border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:border-primary transition-colors duration-120 appearance-none cursor-pointer"
          aria-label="Filter by kabupaten"
          role="combobox"
          aria-expanded="false"
        >
          <option value="">Semua Kabupaten</option>
          {kabupatenList.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      )}

      {(selectedProvinsi || selectedKabupaten) && (
        <button
          onClick={clearFilter}
          className="h-9 px-3 text-sm text-text-secondary hover:text-danger transition-colors duration-120 flex items-center gap-1"
          aria-label="Clear region filter"
        >
          <span aria-hidden="true">✕</span>
          Hapus Filter
        </button>
      )}
    </div>
  )
}
