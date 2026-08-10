import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PointsQuerySchema, SubmitPointSchema } from '@/lib/validation'
import { getPointsInViewport } from '@/lib/geo'
import { createServerClient } from '@/lib/supabase/server'
import { hashPII, extractIP } from '@/lib/hash'

// Simple in-memory rate limiter: max 10 submissions per IP per hour
// Note: resets on Vercel function cold start — acceptable for MVP
const submissionLog = new Map<string, number[]>()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_WINDOW_MS
  const times = (submissionLog.get(ip) ?? []).filter(t => t > windowStart)
  if (times.length >= RATE_LIMIT) return false
  submissionLog.set(ip, [...times, now])
  return true
}

// GET /api/points — fetch approved (or pending) points in viewport
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = PointsQuerySchema.safeParse(params)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid parameters' },
      { status: 400 }
    )
  }

  const { north, south, east, west, status, provinsi, kabupaten } = parsed.data

  try {
    const result = await getPointsInViewport(
      { north, south, east, west },
      status,
      { provinsi, kabupaten }
    )

    return NextResponse.json({
      data: result.points,
      count: result.count,
      limited: result.limited,
    })
  } catch (err) {
    console.error('GET /api/points error:', err)
    return NextResponse.json({ error: 'Failed to fetch points' }, { status: 503 })
  }
}

// POST /api/points — submit a new cooperative
export async function POST(req: NextRequest) {
  // Extract and hash PII at the edge — before anything else
  const rawIP = extractIP(req.headers.get('x-forwarded-for'))
  const rawFingerprint = req.headers.get('x-fingerprint') ?? 'unknown'

  // Rate limit by raw IP (not hashed — for limiting only, not stored)
  if (!checkRateLimit(rawIP)) {
    return NextResponse.json(
      { error: 'Too many submissions. Please wait before submitting again.' },
      { status: 429 }
    )
  }

  // Hash PII immediately — raw values not used after this point
  const [hashedIP, hashedFingerprint] = await Promise.all([
    hashPII(rawIP),
    hashPII(rawFingerprint),
  ])

  // Parse multipart form data
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const body = {
    name: formData.get('name'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    address: formData.get('address'),
    kelurahan: formData.get('kelurahan') || undefined,
    kecamatan: formData.get('kecamatan') || undefined,
    kabupaten: formData.get('kabupaten'),
    provinsi: formData.get('provinsi'),
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || undefined,
  }

  const parsed = SubmitPointSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  const data = parsed.data
  const photo = formData.get('photo') as File | null

  // Validate photo if provided
  if (photo && photo.size > 0) {
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran foto maksimum 5MB' }, { status: 400 })
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(photo.type)) {
      return NextResponse.json(
        { error: 'Format foto harus JPEG, PNG, atau WebP' },
        { status: 400 }
      )
    }
  }

  const supabase = createServerClient()

  // Insert the point
  const { data: point, error: insertError } = await supabase
    .from('koperasi_points')
    .insert({
      name: data.name,
      location: `POINT(${data.longitude} ${data.latitude})`,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      kelurahan: data.kelurahan ?? null,
      kecamatan: data.kecamatan ?? null,
      kabupaten: data.kabupaten,
      provinsi: data.provinsi,
      phone: data.phone ?? null,
      email: data.email || null,
      status: 'pending',
      submitter_ip: hashedIP,
      submitter_fingerprint: hashedFingerprint,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('POST /api/points insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 503 })
  }

  // Upload photo if provided
  if (photo && photo.size > 0) {
    const ext = photo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const photoPath = `${point.id}/${crypto.randomUUID()}.${ext}`
    const photoBuffer = await photo.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('koperasi-photos')
      .upload(photoPath, photoBuffer, {
        contentType: photo.type,
        upsert: false,
      })

    if (!uploadError) {
      await supabase
        .from('koperasi_points')
        .update({ photo_path: photoPath })
        .eq('id', point.id)
    }
  }

  return NextResponse.json(
    {
      data: { id: point.id, status: 'pending' },
      message: 'Submission received. Awaiting community verification.',
    },
    { status: 201 }
  )
}
