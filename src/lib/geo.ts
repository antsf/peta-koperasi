/**
 * PostGIS query helpers.
 * All map point queries go through here — never inline SQL in route handlers.
 *
 * RULES (per CLAUDE.md):
 * - Always viewport-bounded with ST_Within + ST_MakeEnvelope
 * - Never load all points at once
 * - Max 500 points per response
 */

import { createServerClient } from '@/lib/supabase/server'
import type { KoperasiPoint, KoperasiPointSummary, PointStatus, Viewport } from '@/types'

const MAX_POINTS_PER_REQUEST = 500

export interface PointsQueryResult {
  points: KoperasiPointSummary[]
  count: number
  limited: boolean
}

/**
 * Fetch points within a viewport bounding box.
 * Uses PostGIS ST_Within for spatial filtering.
 */
export async function getPointsInViewport(
  viewport: Viewport,
  status: PointStatus = 'approved',
  filters?: { provinsi?: string; kabupaten?: string }
): Promise<PointsQueryResult> {
  const supabase = createServerClient()

  const { data, error } = await supabase.rpc('get_points_in_viewport', {
    p_south: viewport.south,
    p_north: viewport.north,
    p_west: viewport.west,
    p_east: viewport.east,
    p_status: status,
    p_provinsi: filters?.provinsi ?? null,
    p_kabupaten: filters?.kabupaten ?? null,
  })

  if (error) throw new Error(`getPointsInViewport: ${error.message}`)

  const limited = data.length > MAX_POINTS_PER_REQUEST
  const points = (limited ? data.slice(0, MAX_POINTS_PER_REQUEST) : data) as KoperasiPointSummary[]

  return { points, count: points.length, limited }
}

/**
 * Fetch full detail for a single point.
 * Returns photo_url only when status === 'approved'.
 */
export async function getPointById(id: string): Promise<KoperasiPoint | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('koperasi_points')
    .select(
      'id, name, latitude, longitude, address, kelurahan, kecamatan, kabupaten, provinsi, phone, email, photo_path, status, upvotes, downvotes, created_at'
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`getPointById: ${error.message}`)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const photoUrl =
    data.status === 'approved' && data.photo_path
      ? `${supabaseUrl}/storage/v1/object/public/koperasi-photos/${data.photo_path}`
      : null

  return {
    ...data,
    photo_url: photoUrl,
  } as KoperasiPoint
}

/**
 * Get distinct provinsi + kabupaten groups from approved points.
 * Used to populate region filter dropdowns.
 */
export async function getRegions() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('koperasi_points')
    .select('provinsi, kabupaten')
    .eq('status', 'approved')
    .order('provinsi')
    .order('kabupaten')

  if (error) throw new Error(`getRegions: ${error.message}`)

  // Group kabupaten by provinsi
  const map = new Map<string, Set<string>>()
  for (const row of data) {
    if (!map.has(row.provinsi)) map.set(row.provinsi, new Set())
    map.get(row.provinsi)!.add(row.kabupaten)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([provinsi, kabSet]) => ({
      provinsi,
      kabupaten_list: Array.from(kabSet).sort(),
    }))
}

/**
 * Get site-wide stats.
 */
export async function getSiteStats() {
  const supabase = createServerClient()

  const [approvedResult, pendingResult, provinsiResult] = await Promise.all([
    supabase
      .from('koperasi_points')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved'),
    supabase
      .from('koperasi_points')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('koperasi_points')
      .select('provinsi')
      .eq('status', 'approved'),
  ])

  const totalProvinces = new Set(provinsiResult.data?.map(r => r.provinsi) ?? []).size

  return {
    total_approved: approvedResult.count ?? 0,
    total_pending: pendingResult.count ?? 0,
    total_provinces: totalProvinces,
  }
}
