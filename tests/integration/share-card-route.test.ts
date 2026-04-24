import { describe, expect, it } from 'vitest'
import { GET } from '../../app/api/share-card/[sessionId]/route'
import { chartSessionStore } from '../../lib/repositories/chart-session-repo'

describe('share-card route', () => {
  it('returns 404 for missing sessions', async () => {
    const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ sessionId: 'missing-session' }) })
    expect(response.status).toBe(404)
  })

  it('returns persisted summary data for computed sessions', async () => {
    const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ sessionId: 'computed-session' }) })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      sessionId: 'computed-session',
      title: '你的核心气质更偏向关系与自我理解的联动',
      tags: ['人格优先', '关系承接', '真实排盘入口'],
      primaryPalace: '迁移宫',
      bodyPalace: '命宫',
      primaryStars: ['紫微', '天相'],
      focusTone: '关系映射',
      focusPalaces: ['迁移宫', '命宫', '官禄宫'],
    })
  })

  it('returns 404 when a computed session lacks persisted interpretation data', async () => {
    chartSessionStore.set('share-card-without-interpretation', {
      id: 'share-card-without-interpretation',
      status: 'computed',
      rawInput: {
        birthDate: '1995-08-18',
        birthTime: '09:30',
        calendarType: 'solar',
        gender: 'female',
        birthCityCode: '310100',
      },
      chartOutput: {
        ruleBasisId: 'ziwei-rule-basis-v1',
        chartId: 'share-card-without-interpretation',
        lifePalace: '迁移宫',
        bodyPalace: '命宫',
        primaryStars: ['紫微'],
        transformationSet: ['化禄'],
        palaces: [],
      },
    })

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ sessionId: 'share-card-without-interpretation' }),
    })

    expect(response.status).toBe(404)
  })
})
