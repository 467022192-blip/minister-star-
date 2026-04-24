import { describe, expect, it } from 'vitest'
import { normalizeBirthInput } from '../../../lib/ziwei/normalize-birth-input'

describe('normalizeBirthInput', () => {
  it('returns a mainland-city normalized payload', () => {
    const result = normalizeBirthInput({
      birthDate: '1995-08-18',
      birthTime: '09:30',
      calendarType: 'solar',
      gender: 'female',
      birthCityCode: '310100',
    })

    expect(result.birthCityCode).toBe('310100')
    expect(result.timezone).toBe('Asia/Shanghai')
  })

  it('rejects unsupported city codes', () => {
    expect(() =>
      normalizeBirthInput({
        birthDate: '1995-08-18',
        birthTime: '09:30',
        calendarType: 'solar',
        gender: 'female',
        birthCityCode: '999999',
      }),
    ).toThrow('birthCityCode must be a supported mainland city')
  })
})
