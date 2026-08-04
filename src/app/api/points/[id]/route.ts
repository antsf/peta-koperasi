import { NextRequest, NextResponse } from 'next/server'
import { getPointById } from '@/lib/geo'

// GET /api/points/[id] — fetch full detail for a single point
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  try {
    const point = await getPointById(id)

    if (!point) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ data: point })
  } catch (err) {
    console.error('GET /api/points/[id] error:', err)
    return NextResponse.json({ error: 'Failed to fetch point' }, { status: 503 })
  }
}
