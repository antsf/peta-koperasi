/**
 * Zod validation schemas for all API route inputs.
 * Every route handler imports from here and validates at entry — return early on failure.
 */

import { z } from 'zod'

// Indonesia geographic bounds (per SPEC.md Appendix A)
const INDONESIA_LAT_MIN = -11.0
const INDONESIA_LAT_MAX = 6.0
const INDONESIA_LNG_MIN = 95.0
const INDONESIA_LNG_MAX = 141.0

export const ViewportSchema = z.object({
  north: z.coerce
    .number()
    .min(INDONESIA_LAT_MIN - 5)
    .max(INDONESIA_LAT_MAX + 5),
  south: z.coerce
    .number()
    .min(INDONESIA_LAT_MIN - 5)
    .max(INDONESIA_LAT_MAX + 5),
  east: z.coerce
    .number()
    .min(INDONESIA_LNG_MIN - 5)
    .max(INDONESIA_LNG_MAX + 5),
  west: z.coerce
    .number()
    .min(INDONESIA_LNG_MIN - 5)
    .max(INDONESIA_LNG_MAX + 5),
}).refine(d => d.south < d.north, {
  message: 'south must be less than north',
})

export const PointsQuerySchema = z.object({
  north: z.coerce.number(),
  south: z.coerce.number(),
  east: z.coerce.number(),
  west: z.coerce.number(),
  status: z.enum(['approved', 'pending']).optional().default('approved'),
  provinsi: z.string().trim().optional(),
  kabupaten: z.string().trim().optional(),
})

export const SubmitPointSchema = z.object({
  name: z.string().trim().min(1).max(200),
  latitude: z.coerce
    .number()
    .min(INDONESIA_LAT_MIN, 'Latitude out of Indonesia bounds')
    .max(INDONESIA_LAT_MAX, 'Latitude out of Indonesia bounds'),
  longitude: z.coerce
    .number()
    .min(INDONESIA_LNG_MIN, 'Longitude out of Indonesia bounds')
    .max(INDONESIA_LNG_MAX, 'Longitude out of Indonesia bounds'),
  address: z.string().trim().min(1).max(500),
  kelurahan: z.string().trim().max(100).optional(),
  kecamatan: z.string().trim().max(100).optional(),
  kabupaten: z.string().trim().min(1).max(100),
  provinsi: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
})

export const VoteSchema = z.object({
  vote_type: z.enum(['up', 'down']),
})

export type SubmitPointInput = z.infer<typeof SubmitPointSchema>
export type VoteInput = z.infer<typeof VoteSchema>
export type PointsQueryInput = z.infer<typeof PointsQuerySchema>
