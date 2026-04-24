import { describe, expect, it } from 'vitest'
import { submitChartInput } from '../../app/chart/actions'
import { getResultSessionById } from '../../lib/repositories/result-session-repo'

describe('chart submit failure path', () => {
  it('stores failed status when time input is unsupported', async () => {
    const result = await submitChartInput({
      birthDate: '1995-07-23',
      birthTime: 'invalid-time',
      calendarType: 'lunar',
      gender: 'female',
      birthCityCode: '310100',
    })

    expect(result).toMatchObject({ status: 'failed' })

    const storedSession = await getResultSessionById(result.sessionId)
    expect(storedSession).toMatchObject({
      status: 'failed',
      errorCode: 'UNSUPPORTED_INPUT',
    })
  })
})
