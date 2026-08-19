import { describe, expect, it } from 'vitest'
import { API_BASE_PATH } from './index'

describe('API_BASE_PATH', () => {
  it('is /api/v1', () => {
    expect(API_BASE_PATH).toBe('/api/v1')
  })
})
