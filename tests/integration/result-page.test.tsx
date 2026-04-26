import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ResultPage from '../../app/result/[sessionId]/page'
import { chartSessionStore, type ChartSessionRecord } from '../../lib/repositories/chart-session-repo'

const blobStore = new Map<string, unknown>()
const getPrivateJsonMock = vi.fn(async (pathname: string) => blobStore.get(pathname) ?? null)
const putPrivateJsonMock = vi.fn(async (pathname: string, value: unknown) => {
  blobStore.set(pathname, structuredClone(value))
  return { url: `https://blob.example/${pathname}` }
})

vi.mock('../../lib/blob/session-store', () => ({
  getPrivateJson: (...args: unknown[]) => getPrivateJsonMock(...args),
  putPrivateJson: (...args: unknown[]) => putPrivateJsonMock(...args),
}))

const originalNodeEnv = process.env.NODE_ENV
const originalPersistenceMode = process.env.ZIWEI_PERSISTENCE_MODE
const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN

function createComputedSession(sessionId: string): ChartSessionRecord {
  return {
    id: sessionId,
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
      chartId: sessionId,
      lifePalace: '迁移宫',
      bodyPalace: '命宫',
      primaryStars: ['紫微', '天相'],
      transformationSet: ['化禄'],
      palaces: [],
      structureSummary: {
        focusTone: '关系映射',
        title: '这张盘先从关系映射线索读起',
        overview: 'overview',
        lifePalaceLabel: '外部场域',
        bodyPalaceLabel: '自我定盘',
        transformationLabel: '资源流入',
        focusPalaces: [
          {
            palaceName: '迁移宫',
            label: '外部场域',
            summary: 'summary',
            stars: ['紫微'],
          },
        ],
        readingOrder: ['迁移宫'],
      },
    },
    interpretationOutput: {
      summary: {
        title: '你的核心气质更偏向关系与自我理解的联动',
        tags: ['人格优先', '关系承接', '真实排盘入口'],
      },
      sections: {
        personality: {
          title: '人格与天赋',
          ruleIds: ['persisted-personality'],
          blocks: ['这里展示已持久化的人格模块。'],
        },
        relationship: {
          title: '感情模式',
          ruleIds: ['persisted-relationship'],
          blocks: ['这里展示已持久化的关系模块。'],
        },
        careerWealth: {
          title: '事业与财运',
          ruleIds: ['persisted-career'],
          blocks: ['这里展示已持久化的事业财运模块。'],
        },
      },
    },
  }
}

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

describe('ResultPage (blob mode)', () => {
  beforeEach(() => {
    blobStore.clear()
    getPrivateJsonMock.mockClear()
    putPrivateJsonMock.mockClear()

    process.env.NODE_ENV = 'production'
    process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv

    if (originalPersistenceMode === undefined) {
      delete process.env.ZIWEI_PERSISTENCE_MODE
    } else {
      process.env.ZIWEI_PERSISTENCE_MODE = originalPersistenceMode
    }

    if (originalBlobToken === undefined) {
      delete process.env.BLOB_READ_WRITE_TOKEN
    } else {
      process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken
    }
  })

  it('shows persisted summary plus topic sections from blob-backed session', async () => {
    const sessionId = 'blob-computed-session'
    blobStore.set(`chart-sessions/${sessionId}.json`, createComputedSession(sessionId))

    const page = await ResultPage({ params: Promise.resolve({ sessionId }) })
    render(page)

    expect(screen.getByRole('heading', { name: '你的核心气质更偏向关系与自我理解的联动' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '这张盘先从关系映射线索读起' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '人格与天赋' })).toBeInTheDocument()
    expect(getPrivateJsonMock).toHaveBeenCalledWith(`chart-sessions/${sessionId}.json`)
  })

  it('returns not found when blob computed session lacks interpretation data', async () => {
    const sessionId = 'blob-computed-without-interpretation'
    const broken: ChartSessionRecord = {
      ...createComputedSession(sessionId),
      interpretationOutput: undefined,
    }
    blobStore.set(`chart-sessions/${sessionId}.json`, broken)

    await expect(ResultPage({ params: Promise.resolve({ sessionId }) })).rejects.toMatchObject({
      digest: expect.stringContaining('NEXT_HTTP_ERROR_FALLBACK;404'),
    })
  })
})
