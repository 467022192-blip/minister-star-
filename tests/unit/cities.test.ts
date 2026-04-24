import { describe, expect, it } from 'vitest'
import { getMainlandCityByCode, mainlandCityOptions } from '../../lib/cities'

describe('mainland city dataset', () => {
  it('contains a broad prefecture-level mainland city list', () => {
    expect(mainlandCityOptions.length).toBeGreaterThanOrEqual(300)
  })

  it('normalizes direct-controlled municipalities to real city names', () => {
    expect(getMainlandCityByCode('110100')).toMatchObject({ cityName: '北京市' })
    expect(getMainlandCityByCode('310100')).toMatchObject({ cityName: '上海市' })
    expect(getMainlandCityByCode('120100')).toMatchObject({ cityName: '天津市' })
    expect(getMainlandCityByCode('500100')).toMatchObject({ cityName: '重庆市' })
  })
})
