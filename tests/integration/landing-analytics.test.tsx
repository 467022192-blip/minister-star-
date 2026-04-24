import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HomePage from '../../app/page'

describe('landing analytics', () => {
  it('sends an analytics request when the landing page is viewed', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    render(<HomePage />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'landing_view',
          payload: { page: 'home' },
        }),
      })
    })
  })
})
