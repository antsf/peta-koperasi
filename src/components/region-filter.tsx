'use client'

import { useState, useEffect } from 'react'
import type { RegionGroup } from '@/types'
import { useTranslation } from '@/lib/i18n'

interface RegionFilterProps {
  onFilterChange: (provinsi: string, kabupaten: string) => void
}

export function RegionFilter({ onFilterChange }: RegionFilterProps) {
  const { t } = useTranslation()
  const [regions, setRegions] = useState<RegionGroup[]>([])
  const [selectedProvinsi, setSelectedProvinsi] = useState('')
  const [selectedKabupaten, setSelectedKabupaten] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/regions')
      .then(r => r.json())
      .then(({ data }) => setRegions(data ?? []))
      .catch(() => setError('Gagal memuat data wilayah'))
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
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
      <select
        value={selectedProvinsi}
        onChange={e => handleProvinsi(e.target.value)}
        className="min-h-11 w-full sm:w-auto pl-3 pr-8 text-sm border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:border-primary transition-colors duration-120 appearance-none cursor-pointer"
        aria-label="Filter by province"
        role="combobox"
        aria-expanded="false"
      >
        <option value="">{t('filter.all_provinces')}</option>
        {regions.map(r => (
          <option key={r.provinsi} value={r.provinsi}>{r.provinsi}</option>
        ))}
      </select>

      {selectedProvinsi && (
        <select
          value={selectedKabupaten}
          onChange={e => handleKabupaten(e.target.value)}
          className="min-h-11 w-full sm:w-auto pl-3 pr-8 text-sm border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:border-primary transition-colors duration-120 appearance-none cursor-pointer"
          aria-label="Filter by kabupaten"
          role="combobox"
          aria-expanded="false"
        >
          <option value="">{t('filter.all_kabupaten')}</option>
          {kabupatenList.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      )}

      {(selectedProvinsi || selectedKabupaten) && (
        <button
          onClick={clearFilter}
          className="min-h-11 px-3 text-sm text-text-secondary hover:text-danger transition-colors duration-120 flex items-center justify-center sm:justify-start gap-1"
          aria-label="Clear region filter"
        >
          <span aria-hidden="true">✕</span>
          {t('filter.clear')}
        </button>
      )}

      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  )
}
