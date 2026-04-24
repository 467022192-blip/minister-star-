import { describe, expect, it } from 'vitest'
import { getRequiredEventNames } from '../../../lib/analytics/events'

describe('analytics events', () => {
  it('defines the required P0 funnel events', () => {
    expect(getRequiredEventNames()).toEqual([
      'landing_view',
      'quiz_started',
      'quiz_completed',
      'chart_started',
      'chart_completed',
      'result_viewed',
      'result_shared',
    ])
  })
})
