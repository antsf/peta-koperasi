import { NextResponse } from 'next/server'
import { getRegions } from '@/lib/geo'

// GET /api/regions — distinct province + kabupaten groups for filter dropdowns
export async function GET() {
  try {
    const regions = await getRegions()
    return NextResponse.json({ data: regions }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err) {
    console.error('GET /api/regions error:', err)
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 503 })
  }
}
