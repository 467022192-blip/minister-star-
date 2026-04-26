import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createDraftChartSession,
  getChartSessionById,
  markChartSessionFailed,
  saveComputedResult,
  type ChartSessionRecord,
} from '../../../lib/repositories/chart-session-repo'

const getPrivateJsonMock = vi.fn()
const putPrivateJsonMock = vi.fn()

vi.mock('../../../lib/blob/session-store', () => ({
  getPrivateJson: (...args: unknown[]) => getPrivateJsonMock(...args),
  putPrivateJson: (...args: unknown[]) => putPrivateJsonMock(...args),
}))

const originalNodeEnv = process.env.NODE_ENV
const originalPersistenceMode = process.env.ZIWEI_PERSISTENCE_MODE
const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN

describe('chart session repository', () => {
  beforeEach(() => {
    getPrivateJsonMock.mockReset()
    putPrivateJsonMock.mockReset()
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

  it('stores draft chart sessions via Blob in blob mode', async () => {
    process.env.NODE_ENV = 'production'
    process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'

    putPrivateJsonMock.mockResolvedValue({ url: 'https://blob.example/chart-session.json' })

    const session = await createDraftChartSession({
      birthDate: '1995-08-18',
      birthTime: '09:30',
      calendarType: 'solar',
      gender: 'female',
      birthCityCode: '310100',
    })

    expect(putPrivateJsonMock).toHaveBeenCalledWith(
      `chart-sessions/${session.id}.json`,
      expect.objectContaining({
        id: session.id,
        status: 'draft',
      }),
    )
  })

  it('overwrites the same Blob pathname when saving computed results', async () => {
    process.env.NODE_ENV = 'production'
    process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'

    const existing: ChartSessionRecord = {
      id: 'blob-computed',
      status: 'draft',
      rawInput: {
        birthDate: '1995-08-18',
        birthTime: '09:30',
        calendarType: 'solar',
        gender: 'female',
        birthCityCode: '310100',
      },
    }

    getPrivateJsonMock.mockResolvedValue(existing)
    putPrivateJsonMock.mockResolvedValue({ url: 'https://blob.example/chart-session.json' })

    await saveComputedResult({
      sessionId: existing.id,
      normalized: {
        ...existing.rawInput,
        timezone: 'Asia/Shanghai',
        normalizedSolarDate: '1995-08-18',
        timeBranch: 'si',
      },
      chart: {
        ruleBasisId: 'ziwei-rule-basis-v1',
        chartId: existing.id,
        lifePalace: '迁移宫',
        bodyPalace: '命宫',
        primaryStars: ['紫微'],
        transformationSet: ['化禄'],
        palaces: [],
      },
      interpretation: {
        summary: {
          title: '测试标题',
          tags: ['测试'],
        },
        sections: {
          personality: {
            title: '人格与天赋',
            ruleIds: ['test'],
            blocks: ['block'],
          },
          relationship: {
            title: '感情模式',
            ruleIds: ['test'],
            blocks: ['block'],
          },
          careerWealth: {
            title: '事业与财运',
            ruleIds: ['test'],
            blocks: ['block'],
          },
        },
      },
    })

    expect(getPrivateJsonMock).toHaveBeenCalledWith(`chart-sessions/${existing.id}.json`)
    expect(putPrivateJsonMock).toHaveBeenCalledWith(
      `chart-sessions/${existing.id}.json`,
      expect.objectContaining({
        id: existing.id,
        status: 'computed',
      }),
      { allowOverwrite: true },
    )
  })

  it('overwrites the same Blob pathname when marking failures', async () => {
    process.env.NODE_ENV = 'production'
    process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'

    const existing: ChartSessionRecord = {
      id: 'blob-failed',
      status: 'draft',
      rawInput: {
        birthDate: '1995-08-18',
        birthTime: '09:30',
        calendarType: 'solar',
        gender: 'female',
        birthCityCode: '310100',
      },
    }

    getPrivateJsonMock.mockResolvedValue(existing)
    putPrivateJsonMock.mockResolvedValue({ url: 'https://blob.example/chart-session.json' })

    await markChartSessionFailed({
      sessionId: existing.id,
      errorCode: 'UNSUPPORTED_INPUT',
      failureReason: 'unsupported input',
    })

    expect(getPrivateJsonMock).toHaveBeenCalledWith(`chart-sessions/${existing.id}.json`)
    expect(putPrivateJsonMock).toHaveBeenCalledWith(
      `chart-sessions/${existing.id}.json`,
      expect.objectContaining({
        id: existing.id,
        status: 'failed',
      }),
      { allowOverwrite: true },
    )
  })

  it('returns null when Blob chart data misses computed fields required by result pages', async () => {
    process.env.NODE_ENV = 'production'
    process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'

    getPrivateJsonMock.mockResolvedValue({
      id: 'broken-computed',
      status: 'computed',
      rawInput: {
        birthDate: '1995-08-18',
        birthTime: '09:30',
        calendarType: 'solar',
        gender: 'female',
        birthCityCode: '310100',
      },
      chartOutput: {
        lifePalace: '迁移宫',
      },
      interpretationOutput: {
        summary: {
          title: 'x',
        },
      },
    })

    await expect(getChartSessionById('broken-computed')).resolves.toBeNull()
  })
})
