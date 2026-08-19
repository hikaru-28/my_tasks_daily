import { describe, expect, it } from 'vitest'
import {
  taskCreateSchema,
  taskListResponseSchema,
  taskUpdateSchema,
} from './task'

describe('taskCreateSchema', () => {
  it('accepts a minimal valid input and defaults priority to MEDIUM', () => {
    const result = taskCreateSchema.parse({ title: '買い物に行く' })
    expect(result).toMatchObject({ title: '買い物に行く', priority: 'MEDIUM' })
  })

  it('rejects an empty title', () => {
    expect(() => taskCreateSchema.parse({ title: '' })).toThrow()
  })

  it('transforms dueAt from a string into a Date', () => {
    const result = taskCreateSchema.parse({
      title: 'タスク',
      dueAt: '2026-08-20T00:00:00.000Z',
    })
    expect(result.dueAt).toBeInstanceOf(Date)
    expect(result.dueAt?.toISOString()).toBe('2026-08-20T00:00:00.000Z')
  })
})

describe('taskUpdateSchema', () => {
  it('rejects an empty update payload', () => {
    expect(() => taskUpdateSchema.parse({})).toThrow()
  })

  it('accepts description: null to clear the field', () => {
    const result = taskUpdateSchema.parse({ description: null })
    expect(result.description).toBeNull()
  })

  it('rejects an invalid status value', () => {
    expect(() => taskUpdateSchema.parse({ status: 'INVALID' })).toThrow()
  })
})

describe('taskListResponseSchema', () => {
  it('accepts an empty item list', () => {
    const result = taskListResponseSchema.parse({ items: [], total: 0 })
    expect(result).toEqual({ items: [], total: 0 })
  })
})
