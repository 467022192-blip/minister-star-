import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getResultSessionById } from '../../../lib/repositories/result-session-repo'

const getPrivateJsonMock = vi.fn()

vi.mock('../../../lib/blob/session-store', () => ({
  getPrivateJson: (...args: unknown[]) => getPrivateJsonMock(...args),
  putPrivateJson: vi.fn(),
}))

const originalNodeEnv = process.env.NODE_ENV
const originalPersistenceMode = process.env.ZIWEI_PERSISTENCE_MODE
const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN

describe('result session repository', () => {
  beforeEach(() => {
    getPrivateJsonMock.mockReset()
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

  it('returns null for unknown session ids', async () => {
    await expect(getResultSessionById('missing-session')).resolves.toBeNull()
  })

  it('reads a Blob-backed computed result session', async () => {
    process.env.NODE_ENV = 'production'
    process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'

    getPrivateJsonMock.mockResolvedValue({
      id: 'blob-computed-session',
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
        chartId: 'blob-computed-session',
        lifePalace: '迁移宫',
        bodyPalace: '命宫',
        primaryStars: ['紫微', '天相'],
        transformationSet: ['化禄'],
        palaces: [],
        structureSummary: {
          focusTone: '关系映射',
          title: '结构摘要',
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
          tags: ['人格优先', '关系承接'],
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

    await expect(getResultSessionById('blob-computed-session')).resolves.toMatchObject({
      id: 'blob-computed-session',
      status: 'computed',
    })
  })
})
