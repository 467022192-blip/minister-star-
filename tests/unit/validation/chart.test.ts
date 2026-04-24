import { describe, expect, it } from 'vitest'
import { chartInputSchema } from '../../../lib/validation/chart'

describe('chart input schema', () => {
  it('rejects missing birthplace city', () => {
    const result = chartInputSchema.safeParse({
      birthDate: '1995-08-18',
      birthTime: '09:30',
      calendarType: 'solar',
      gender: 'female',
    })

    expect(result.success).toBe(false)
  })

  it('rejects unsupported birthplace city codes', () => {
    const result = chartInputSchema.safeParse({
      birthDate: '1995-08-18',
      birthTime: '09:30',
      calendarType: 'solar',
      gender: 'female',
      birthCityCode: '999999',
    })

    expect(result.success).toBe(false)
  })
})
