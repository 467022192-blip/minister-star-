import { describe, expect, it } from 'vitest'
import { submitChartInput } from '../../app/chart/actions'
import { getResultSessionById } from '../../lib/repositories/result-session-repo'

describe('submitChartInput', () => {
  it('rejects submissions without city-level birthplace', async () => {
    await expect(
      submitChartInput({
        birthDate: '1995-08-18',
        birthTime: '09:30',
        calendarType: 'solar',
        gender: 'female',
        birthCityCode: '',
      }),
    ).rejects.toThrow('birthCityCode is required')
  })

  it('accepts a lunar plus shichen submission', async () => {
    const result = await submitChartInput({
      birthDate: '1995-07-23',
      birthTime: '巳时',
      calendarType: 'lunar',
      gender: 'female',
      birthCityCode: '310100',
    })

    expect(result).toMatchObject({ status: 'computed' })

    const storedSession = await getResultSessionById(result.sessionId)
    expect(storedSession).toMatchObject({ status: 'computed' })
    expect(storedSession?.interpretationOutput?.summary.title).toBeTruthy()
  })
})
