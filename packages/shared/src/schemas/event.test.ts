import { describe, expect, it } from 'vitest'
import { eventCreateSchema, eventListResponseSchema, eventUpdateSchema } from './event'

describe('eventCreateSchema', () => {
  it('accepts a minimal valid input and defaults allDay to false', () => {
    const result = eventCreateSchema.parse({
      title: '打ち合わせ',
      startAt: '2026-08-20T01:00:00.000Z',
      endAt: '2026-08-20T02:00:00.000Z',
    })
    expect(result).toMatchObject({ title: '打ち合わせ', allDay: false })
  })

  it('rejects an empty title', () => {
    expect(() =>
      eventCreateSchema.parse({
        title: '',
        startAt: '2026-08-20T01:00:00.000Z',
        endAt: '2026-08-20T02:00:00.000Z',
      }),
    ).toThrow()
  })

  it('transforms startAt/endAt from strings into Dates', () => {
    const result = eventCreateSchema.parse({
      title: '打ち合わせ',
      startAt: '2026-08-20T01:00:00.000Z',
      endAt: '2026-08-20T02:00:00.000Z',
    })
    expect(result.startAt).toBeInstanceOf(Date)
    expect(result.endAt).toBeInstanceOf(Date)
  })

  it('does not reject endAt before startAt (business validation happens in the service layer)', () => {
    const result = eventCreateSchema.parse({
      title: '打ち合わせ',
      startAt: '2026-08-20T02:00:00.000Z',
      endAt: '2026-08-20T01:00:00.000Z',
    })
    expect(result.endAt.getTime()).toBeLessThan(result.startAt.getTime())
  })
})

describe('eventUpdateSchema', () => {
  it('rejects an empty update payload', () => {
    expect(() => eventUpdateSchema.parse({})).toThrow()
  })

  it('accepts description: null to clear the field', () => {
    const result = eventUpdateSchema.parse({ description: null })
    expect(result.description).toBeNull()
  })
})

describe('eventListResponseSchema', () => {
  it('accepts an empty item list', () => {
    const result = eventListResponseSchema.parse({ items: [], total: 0 })
    expect(result).toEqual({ items: [], total: 0 })
  })
})
