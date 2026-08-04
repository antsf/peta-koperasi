// Shared TypeScript types for Koperasi Desa Merah Putih Map
// These are the CLIENT-FACING types. PII fields (submitter_ip, submitter_fingerprint) are excluded.

export type PointStatus = 'pending' | 'approved' | 'flagged' | 'removed'

export type VoteType = 'up' | 'down'

export interface KoperasiPoint {
  id: string
  name: string
  latitude: number
  longitude: number
  address: string
  kelurahan: string | null
  kecamatan: string | null
  kabupaten: string
  provinsi: string
  phone: string | null
  email: string | null
  /** Only populated when status === 'approved'. Null otherwise. */
  photo_url: string | null
  status: PointStatus
  upvotes: number
  downvotes: number
  created_at: string
}

/** Minimal representation returned in list/map endpoints */
export interface KoperasiPointSummary {
  id: string
  name: string
  latitude: number
  longitude: number
  kabupaten: string
  provinsi: string
  status: PointStatus
  upvotes: number
  downvotes: number
}

export interface Vote {
  id: string
  point_id: string
  vote_type: VoteType
  created_at: string
}

export interface Viewport {
  north: number
  south: number
  east: number
  west: number
}

export interface RegionGroup {
  provinsi: string
  kabupaten_list: string[]
}

export interface SiteStats {
  total_approved: number
  total_pending: number
  total_provinces: number
}

export interface VoteResult {
  upvotes: number
  downvotes: number
  status: PointStatus
}

// Generic API response wrappers
export interface ApiSuccess<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// i18n
export type Locale = 'id' | 'en'
