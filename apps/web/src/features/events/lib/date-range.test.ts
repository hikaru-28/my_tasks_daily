import { describe, expect, it } from 'vitest'
import { addDays, getDayRange, getWeekRange } from './date-range'

describe('getDayRange', () => {
  it('returns the JST day boundaries for a UTC time within that JST day', () => {
    // 2026-08-19T10:00:00Z = 2026-08-19T19:00:00+09:00 (same JST date)
    const { from, to } = getDayRange(new Date('2026-08-19T10:00:00.000Z'))

    expect(from.toISOString()).toBe('2026-08-18T15:00:00.000Z')
    expect(to.toISOString()).toBe('2026-08-19T15:00:00.000Z')
  })

  it('uses the next JST date when the UTC time has already crossed into it', () => {
    // 2026-08-19T20:00:00Z = 2026-08-20T05:00:00+09:00 (JST date is already the 20th)
    const { from, to } = getDayRange(new Date('2026-08-19T20:00:00.000Z'))

    expect(from.toISOString()).toBe('2026-08-19T15:00:00.000Z')
    expect(to.toISOString()).toBe('2026-08-20T15:00:00.000Z')
  })
})

describe('getWeekRange', () => {
  it('returns Monday 00:00 JST to the following Monday 00:00 JST', () => {
    // 2026-08-19 is a Wednesday in JST
    const { from, to } = getWeekRange(new Date('2026-08-19T10:00:00.000Z'))

    expect(from.toISOString()).toBe('2026-08-16T15:00:00.000Z') // Mon 2026-08-17 00:00 JST
    expect(to.toISOString()).toBe('2026-08-23T15:00:00.000Z') // Mon 2026-08-24 00:00 JST
  })

  it('treats a Monday itself as the start of its own week', () => {
    // 2026-08-17 is a Monday in JST
    const { from } = getWeekRange(new Date('2026-08-17T01:00:00.000Z'))

    expect(from.toISOString()).toBe('2026-08-16T15:00:00.000Z')
  })
})

describe('addDays', () => {
  it('adds whole JST days without drifting across a UTC month boundary', () => {
    const result = addDays(new Date('2026-08-31T20:00:00.000Z'), 1)

    // 2026-08-31T20:00Z = 2026-09-01 05:00 JST -> +1 day JST date = 2026-09-02 00:00 JST
    expect(result.toISOString()).toBe('2026-09-01T15:00:00.000Z')
  })

  it('supports negative offsets', () => {
    const result = addDays(new Date('2026-08-20T00:00:00.000Z'), -3)

    expect(result.toISOString()).toBe('2026-08-16T15:00:00.000Z')
  })
})
