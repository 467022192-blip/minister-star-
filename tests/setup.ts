import '@testing-library/jest-dom'
import { afterEach, beforeEach, vi } from 'vitest'

process.env.ZIWEI_PERSISTENCE_MODE = 'memory'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    }),
  )
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})
