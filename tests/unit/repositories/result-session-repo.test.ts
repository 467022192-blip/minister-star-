import { describe, expect, it } from 'vitest'
import { getResultSessionById } from '../../../lib/repositories/result-session-repo'

describe('result session repository', () => {
  it('returns null for unknown session ids', async () => {
    await expect(getResultSessionById('missing-session')).resolves.toBeNull()
  })
})
