import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { submitChartInput } from '../../app/chart/actions'
import { getResultSessionById } from '../../lib/repositories/result-session-repo'

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

describe('submitChartInput', () => {
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

  it('rejects submissions without city-level birthplace', async () => {
    await expect(
      submitChartInput({
        birthDate: '1995-08-18',
        birthTime: '09:30',
        calendarType: 'solar',
        gender: 'female',
        birthCityCode: '',
      }),
    ).rejects.toThrow('birthCityCode is required')
  })

  it('accepts a lunar plus shichen submission', async () => {
    const result = await submitChartInput({
      birthDate: '1995-07-23',
      birthTime: '巳时',
      calendarType: 'lunar',
      gender: 'female',
      birthCityCode: '310100',
    })

    expect(result).toMatchObject({ status: 'computed' })

    const storedSession = await getResultSessionById(result.sessionId)
    expect(storedSession).toMatchObject({ status: 'computed' })
    expect(storedSession?.interpretationOutput?.summary.title).toBeTruthy()
  })
})
