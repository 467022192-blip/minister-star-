import { describe, expect, it } from 'vitest'
import { normalizeBirthInput } from '../../../lib/ziwei/normalize-birth-input'

describe('normalizeBirthInput lunar support', () => {
  it('converts lunar input and shichen into an engine-ready normalized payload', () => {
    const result = normalizeBirthInput({
      birthDate: '1995-07-23',
      birthTime: '巳时',
      calendarType: 'lunar',
      gender: 'female',
      birthCityCode: '310100',
    })

    expect(result.calendarType).toBe('lunar')
    expect(result.normalizedSolarDate).toBeTruthy()
    expect(result.timeBranch).toBe('si')
  })
})
