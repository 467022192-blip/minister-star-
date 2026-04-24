import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResultSummary } from '../../components/result/result-summary'

const fetchMock = vi.fn()

vi.mock('next/link', () => ({
  default: ({ children, onClick, ...props }: Record<string, unknown>) => (
    <button type="button" onClick={onClick as (() => void) | undefined} {...props}>
      {children}
    </button>
  ),
}))

describe('result share analytics', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
  })

  it('emits result_shared when the user clicks the share entry', async () => {
    render(
      <ResultSummary
        sessionId="computed-session"
        title="你的核心气质更偏向关系与自我理解的联动"
        tags={['人格优先', '关系承接', '真实排盘入口']}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '生成分享页' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'result_shared',
          payload: { sessionId: 'computed-session', source: 'result-summary' },
        }),
      })
    })
  })
})
