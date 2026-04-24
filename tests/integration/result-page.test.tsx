import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ResultPage from '../../app/result/[sessionId]/page'
import { chartSessionStore } from '../../lib/repositories/chart-session-repo'

describe('ResultPage', () => {
  it('shows persisted summary plus topic sections', async () => {
    const page = await ResultPage({ params: Promise.resolve({ sessionId: 'computed-session' }) })
    render(page)

    expect(screen.getByRole('heading', { name: '你的核心气质更偏向关系与自我理解的联动' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '这张盘先从关系映射线索读起' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '十二宫位分布' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '人格与天赋' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '感情模式' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '事业与财运' })).toBeInTheDocument()
  })

  it('does not recompute when persisted interpretation is missing', async () => {
    chartSessionStore.set('computed-without-interpretation', {
      id: 'computed-without-interpretation',
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
        chartId: 'missing-interpretation',
        lifePalace: '迁移宫',
        bodyPalace: '命宫',
        primaryStars: ['紫微'],
        transformationSet: ['化禄'],
        palaces: [],
      },
    })

    await expect(ResultPage({ params: Promise.resolve({ sessionId: 'computed-without-interpretation' }) })).rejects.toMatchObject({
      digest: expect.stringContaining('NEXT_HTTP_ERROR_FALLBACK;404'),
    })
  })
})
