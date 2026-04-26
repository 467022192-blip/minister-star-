import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '../../app/api/share-card/[sessionId]/route'
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
          {
            palaceName: '命宫',
            label: '自我定盘',
            summary: 'summary',
            stars: ['天相'],
          },
          {
            palaceName: '官禄宫',
            label: '目标推进',
            summary: 'summary',
            stars: ['禄存'],
          },
        ],
        readingOrder: ['迁移宫', '命宫', '官禄宫'],
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

describe('share-card route (blob mode)', () => {
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

  it('returns 404 for missing sessions', async () => {
    const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ sessionId: 'missing-blob-session' }) })
    expect(response.status).toBe(404)
  })

  it('returns persisted summary data for blob-backed computed sessions', async () => {
    const sessionId = 'blob-computed-session'
    blobStore.set(`chart-sessions/${sessionId}.json`, createComputedSession(sessionId))

    const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ sessionId }) })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      sessionId,
      title: '你的核心气质更偏向关系与自我理解的联动',
      tags: ['人格优先', '关系承接', '真实排盘入口'],
      primaryPalace: '迁移宫',
      bodyPalace: '命宫',
      primaryStars: ['紫微', '天相'],
      focusTone: '关系映射',
      focusPalaces: ['迁移宫', '命宫', '官禄宫'],
    })
    expect(getPrivateJsonMock).toHaveBeenCalledWith(`chart-sessions/${sessionId}.json`)
  })

  it('returns 404 when a blob computed session lacks persisted interpretation data', async () => {
    const sessionId = 'blob-share-card-without-interpretation'
    const broken: ChartSessionRecord = {
      ...createComputedSession(sessionId),
      interpretationOutput: undefined,
    }
    blobStore.set(`chart-sessions/${sessionId}.json`, broken)

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ sessionId }),
    })

    expect(response.status).toBe(404)
  })
})
