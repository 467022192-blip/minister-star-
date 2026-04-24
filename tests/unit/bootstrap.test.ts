import { describe, expect, it } from 'vitest'
import pkg from '../../package.json'

describe('project bootstrap', () => {
  it('declares the expected app name', () => {
    expect(pkg.name).toBe('ziwei-growth-site')
  })
})
