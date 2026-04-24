import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SharePage from '../../app/share/[sessionId]/page'
import { chartSessionStore } from '../../lib/repositories/chart-session-repo'

describe('SharePage', () => {
  it('loads a persisted computed session', async () => {
    const page = await SharePage({ params: Promise.resolve({ sessionId: 'computed-session' }) })
    render(page)

    expect(screen.getByText('你的核心气质更偏向关系与自我理解的联动')).toBeInTheDocument()
    expect(screen.getByText('盘面主轴')).toBeInTheDocument()
    expect(screen.getByText('先读顺序')).toBeInTheDocument()
  })

  it('returns not found when a computed session lacks persisted interpretation data', async () => {
    chartSessionStore.set('share-computed-without-interpretation', {
      id: 'share-computed-without-interpretation',
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
        chartId: 'share-missing-interpretation',
        lifePalace: '迁移宫',
        bodyPalace: '命宫',
        primaryStars: ['紫微'],
        transformationSet: ['化禄'],
        palaces: [],
      },
    })

    await expect(SharePage({ params: Promise.resolve({ sessionId: 'share-computed-without-interpretation' }) })).rejects.toMatchObject({
      digest: expect.stringContaining('NEXT_HTTP_ERROR_FALLBACK;404'),
    })
  })
})
