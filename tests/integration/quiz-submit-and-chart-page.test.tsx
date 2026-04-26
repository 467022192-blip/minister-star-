import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChartPage from '../../app/chart/page'
import { submitQuizAnswers } from '../../app/quiz/actions'

vi.mock('@/components/chart/chart-form', () => ({
  ChartForm: () => <div data-testid="chart-form-stub" />,
}))

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

describe('quiz submit -> chart page flow', () => {
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

  it('persists quiz answers that ChartPage can read in blob mode', async () => {
    const quizSession = await submitQuizAnswers({
      selfView: 'steady',
      relationshipPattern: 'slow-burn',
      pressureSource: 'uncertainty',
      growthFocus: 'talent',
      contentPreference: 'balanced',
    })

    const page = await ChartPage({
      searchParams: Promise.resolve({ quizSessionId: quizSession.id }),
    })

    render(page)

    expect(screen.getByText(/已承接轻测试偏好/)).toBeInTheDocument()
    expect(screen.getByText('人格与天赋')).toBeInTheDocument()
    expect(getPrivateJsonMock).toHaveBeenCalledWith(`quiz-sessions/${quizSession.id}.json`)
  })
})
