import { describe, it, expect } from 'vitest'
import { SubmitPointSchema, VoteSchema, PointsQuerySchema } from './validation'

// ---------------------------------------------------------------------------
// SubmitPointSchema
// ---------------------------------------------------------------------------
describe('SubmitPointSchema', () => {
  const valid = {
    name: 'Koperasi Desa Maju',
    latitude: -6.2088,
    longitude: 106.8456,
    address: 'Jl. Merdeka No. 1',
    kabupaten: 'Jakarta Pusat',
    provinsi: 'DKI Jakarta',
  }

  it('accepts valid payload', () => {
    expect(SubmitPointSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = SubmitPointSchema.safeParse({ ...valid, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name over 200 chars', () => {
    const result = SubmitPointSchema.safeParse({ ...valid, name: 'a'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('rejects latitude below Indonesia south bound (-11)', () => {
    const result = SubmitPointSchema.safeParse({ ...valid, latitude: -12 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/Indonesia bounds/)
    }
  })

  it('rejects latitude above Indonesia north bound (6)', () => {
    const result = SubmitPointSchema.safeParse({ ...valid, latitude: 7 })
    expect(result.success).toBe(false)
  })

  it('rejects longitude below Indonesia west bound (95)', () => {
    const result = SubmitPointSchema.safeParse({ ...valid, longitude: 94 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/Indonesia bounds/)
    }
  })

  it('rejects longitude above Indonesia east bound (141)', () => {
    const result = SubmitPointSchema.safeParse({ ...valid, longitude: 142 })
    expect(result.success).toBe(false)
  })

  it('rejects missing kabupaten', () => {
    const { kabupaten: _, ...rest } = valid
    const result = SubmitPointSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects missing provinsi', () => {
    const { provinsi: _, ...rest } = valid
    const result = SubmitPointSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('accepts valid email', () => {
    const result = SubmitPointSchema.safeParse({ ...valid, email: 'koperasi@desa.id' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = SubmitPointSchema.safeParse({ ...valid, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('accepts empty string email (optional blank)', () => {
    const result = SubmitPointSchema.safeParse({ ...valid, email: '' })
    expect(result.success).toBe(true)
  })

  it('coerces string latitude to number', () => {
    const result = SubmitPointSchema.safeParse({ ...valid, latitude: '-6.2088' })
    expect(result.success).toBe(true)
    if (result.success) expect(typeof result.data.latitude).toBe('number')
  })

  it('accepts coordinates at exact bounds (boundary values)', () => {
    expect(SubmitPointSchema.safeParse({ ...valid, latitude: -11.0, longitude: 95.0 }).success).toBe(true)
    expect(SubmitPointSchema.safeParse({ ...valid, latitude: 6.0, longitude: 141.0 }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// VoteSchema
// ---------------------------------------------------------------------------
describe('VoteSchema', () => {
  it('accepts "up"', () => {
    expect(VoteSchema.safeParse({ vote_type: 'up' }).success).toBe(true)
  })

  it('accepts "down"', () => {
    expect(VoteSchema.safeParse({ vote_type: 'down' }).success).toBe(true)
  })

  it('rejects invalid vote_type', () => {
    expect(VoteSchema.safeParse({ vote_type: 'sideways' }).success).toBe(false)
  })

  it('rejects missing vote_type', () => {
    expect(VoteSchema.safeParse({}).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// PointsQuerySchema
// ---------------------------------------------------------------------------
describe('PointsQuerySchema', () => {
  const valid = { north: '6', south: '-11', east: '141', west: '95' }

  it('accepts valid viewport params', () => {
    expect(PointsQuerySchema.safeParse(valid).success).toBe(true)
  })

  it('defaults status to "approved"', () => {
    const result = PointsQuerySchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('approved')
  })

  it('accepts status "pending"', () => {
    const result = PointsQuerySchema.safeParse({ ...valid, status: 'pending' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    expect(PointsQuerySchema.safeParse({ ...valid, status: 'removed' }).success).toBe(false)
  })

  it('coerces string coords to numbers', () => {
    const result = PointsQuerySchema.safeParse(valid)
    if (result.success) {
      expect(typeof result.data.north).toBe('number')
      expect(typeof result.data.south).toBe('number')
    }
  })

  it('rejects missing north', () => {
    const { north: _, ...rest } = valid
    expect(PointsQuerySchema.safeParse(rest).success).toBe(false)
  })
})
