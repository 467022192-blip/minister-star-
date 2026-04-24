import { describe, expect, it } from 'vitest'
import { POST } from '../../app/api/analytics/route'
import { analyticsStore } from '../../lib/repositories/analytics-repo'

describe('analytics ingest', () => {
  it('stores a funnel event', async () => {
    analyticsStore.length = 0

    const response = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ name: 'landing_view', payload: { source: 'test' } }),
      }),
    )

    expect(response.status).toBe(200)
    expect(analyticsStore).toHaveLength(1)
    expect(analyticsStore[0]).toMatchObject({
      name: 'landing_view',
      payload: { source: 'test' },
    })
  })
})
