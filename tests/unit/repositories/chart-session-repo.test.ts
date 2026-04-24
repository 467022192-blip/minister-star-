import { describe, expect, it } from 'vitest'
import { createDraftChartSession, getChartSessionById } from '../../../lib/repositories/chart-session-repo'

describe('chart session repository', () => {
  it('requires city-level birthplace data', async () => {
    await expect(
      createDraftChartSession({
        birthDate: '1995-08-18',
        birthTime: '09:30',
        calendarType: 'solar',
        gender: 'female',
        birthCityCode: '',
      }),
    ).rejects.toThrow('birthCityCode is required')
  })

  it('stores draft sessions in the active persistence backend', async () => {
    const session = await createDraftChartSession({
      birthDate: '1995-08-18',
      birthTime: '09:30',
      calendarType: 'solar',
      gender: 'female',
      birthCityCode: '310100',
    })

    await expect(getChartSessionById(session.id)).resolves.toMatchObject({
      id: session.id,
      status: 'draft',
    })
  })

  it('rejects unsupported city codes even before chart calculation', async () => {
    await expect(
      createDraftChartSession({
        birthDate: '1995-08-18',
        birthTime: '09:30',
        calendarType: 'solar',
        gender: 'female',
        birthCityCode: '999999',
      }),
    ).rejects.toThrow('birthCityCode must be a supported mainland city')
  })
})
