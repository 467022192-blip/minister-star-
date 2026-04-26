import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getQuizSessionById, saveQuizSession } from '../../../lib/repositories/quiz-session-repo'

const getPrivateJsonMock = vi.fn()
const putPrivateJsonMock = vi.fn()

vi.mock('../../../lib/blob/session-store', () => ({
  getPrivateJson: (...args: unknown[]) => getPrivateJsonMock(...args),
  putPrivateJson: (...args: unknown[]) => putPrivateJsonMock(...args),
}))

const originalNodeEnv = process.env.NODE_ENV
const originalPersistenceMode = process.env.ZIWEI_PERSISTENCE_MODE
const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN

describe('quiz session repository', () => {
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

  it('stores and reads quiz sessions in the active persistence backend', async () => {
    const session = await saveQuizSession({
      selfView: 'steady',
      relationshipPattern: 'slow-burn',
      pressureSource: 'uncertainty',
      growthFocus: 'talent',
      contentPreference: 'balanced',
    })

    await expect(getQuizSessionById(session.id)).resolves.toMatchObject({
      id: session.id,
      answer: {
        growthFocus: 'talent',
      },
    })
  })

  it('stores and reads quiz sessions via Blob in blob mode', async () => {
    process.env.NODE_ENV = 'production'
    process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'

    putPrivateJsonMock.mockResolvedValue({ url: 'https://blob.example/quiz-session.json' })

    const session = await saveQuizSession({
      selfView: 'steady',
      relationshipPattern: 'slow-burn',
      pressureSource: 'uncertainty',
      growthFocus: 'talent',
      contentPreference: 'balanced',
    })

    getPrivateJsonMock.mockResolvedValue(session)

    await expect(getQuizSessionById(session.id)).resolves.toEqual(session)
    expect(putPrivateJsonMock).toHaveBeenCalledWith(
      `quiz-sessions/${session.id}.json`,
      session,
    )
    expect(getPrivateJsonMock).toHaveBeenCalledWith(`quiz-sessions/${session.id}.json`)
  })

  it('returns null when Blob quiz data has the wrong shape', async () => {
    process.env.NODE_ENV = 'production'
    process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'

    getPrivateJsonMock.mockResolvedValue({ nope: true })

    await expect(getQuizSessionById('bad-session')).resolves.toBeNull()
  })
})
