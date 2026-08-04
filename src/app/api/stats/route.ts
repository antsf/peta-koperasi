import { NextResponse } from 'next/server'
import { getSiteStats } from '@/lib/geo'

// GET /api/stats — site-wide public statistics
export async function GET() {
  try {
    const stats = await getSiteStats()
    return NextResponse.json({ data: stats })
  } catch (err) {
    console.error('GET /api/stats error:', err)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 503 })
  }
}
