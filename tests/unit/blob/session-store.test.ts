import { beforeEach, describe, expect, it, vi } from 'vitest'

const getMock = vi.fn()
const putMock = vi.fn()

vi.mock('@vercel/blob', () => ({
  get: (...args: unknown[]) => getMock(...args),
  put: (...args: unknown[]) => putMock(...args),
}))

describe('session-store', () => {
  beforeEach(() => {
    getMock.mockReset()
    putMock.mockReset()
  })

  it('writes private JSON blobs without random suffix', async () => {
    const { putPrivateJson } = await import('../../../lib/blob/session-store')

    putMock.mockResolvedValue({ url: 'https://blob.example/test.json' })

    await putPrivateJson('quiz-sessions/test.json', { ok: true })

    expect(putMock).toHaveBeenCalledWith(
      'quiz-sessions/test.json',
      JSON.stringify({ ok: true }),
      expect.objectContaining({
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: 'application/json; charset=utf-8',
      }),
    )
  })

  it('uses no-store semantics when reading private blobs', async () => {
    const { getPrivateJson } = await import('../../../lib/blob/session-store')

    getMock.mockResolvedValue({
      stream: new Response(JSON.stringify({ ok: true })).body,
    })

    await expect(getPrivateJson('quiz-sessions/test.json')).resolves.toEqual({ ok: true })
    expect(getMock).toHaveBeenCalledWith(
      'quiz-sessions/test.json',
      expect.objectContaining({
        access: 'private',
        useCache: false,
      }),
    )
  })

  it('forwards allowOverwrite when overwrite is requested', async () => {
    const { putPrivateJson } = await import('../../../lib/blob/session-store')

    putMock.mockResolvedValue({ url: 'https://blob.example/test.json' })

    await putPrivateJson('chart-sessions/test.json', { ok: true }, { allowOverwrite: true })

    expect(putMock).toHaveBeenCalledWith(
      'chart-sessions/test.json',
      JSON.stringify({ ok: true }),
      expect.objectContaining({
        allowOverwrite: true,
      }),
    )
  })

  it('returns null when the blob does not exist', async () => {
    const { getPrivateJson } = await import('../../../lib/blob/session-store')

    getMock.mockResolvedValue(null)

    await expect(getPrivateJson('quiz-sessions/missing.json')).resolves.toBeNull()
  })

  it('throws when blob JSON is malformed', async () => {
    const { getPrivateJson } = await import('../../../lib/blob/session-store')

    getMock.mockResolvedValue({
      stream: new Response('not-json').body,
    })

    await expect(getPrivateJson('quiz-sessions/bad.json')).rejects.toThrow()
  })
})
