import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChartForm } from '../../components/chart/chart-form'

const pushMock = vi.fn()
const submitChartInputMock = vi.fn()
const emitAnalyticsEventMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('@/app/chart/actions', () => ({
  submitChartInput: (...args: unknown[]) => submitChartInputMock(...args),
}))

vi.mock('@/lib/analytics/emit', () => ({
  emitAnalyticsEvent: (...args: unknown[]) => emitAnalyticsEventMock(...args),
}))

describe('ChartForm', () => {
  beforeEach(() => {
    pushMock.mockReset()
    submitChartInputMock.mockReset()
    emitAnalyticsEventMock.mockReset()
  })

  it('navigates to the persisted result page after a successful submit', async () => {
    submitChartInputMock.mockResolvedValue({ sessionId: 'session-123', status: 'computed' })
    emitAnalyticsEventMock.mockResolvedValue({ ok: true })

    render(<ChartForm />)

    fireEvent.change(screen.getByLabelText('出生日期'), { target: { value: '1995-08-18' } })
    fireEvent.change(screen.getByLabelText('出生时间'), { target: { value: '09:30' } })
    fireEvent.change(screen.getByLabelText('出生地（市级）'), { target: { value: '310100' } })
    fireEvent.click(screen.getByRole('button', { name: '进入真实命盘结果页' }))

    await waitFor(() => {
      expect(submitChartInputMock).toHaveBeenCalledWith({
        birthDate: '1995-08-18',
        birthTime: '09:30',
        calendarType: 'solar',
        gender: 'female',
        birthCityCode: '310100',
      })
      expect(emitAnalyticsEventMock).toHaveBeenCalledWith('chart_completed', { sessionId: 'session-123' })
      expect(pushMock).toHaveBeenCalledWith('/result/session-123')
    })
  })

  it('shows a retryable error when chart generation fails', async () => {
    submitChartInputMock.mockResolvedValue({ sessionId: 'session-456', status: 'failed' })

    render(<ChartForm />)

    fireEvent.change(screen.getByLabelText('出生日期'), { target: { value: '1995-08-18' } })
    fireEvent.change(screen.getByLabelText('出生时间'), { target: { value: '09:30' } })
    fireEvent.change(screen.getByLabelText('出生地（市级）'), { target: { value: '310100' } })
    fireEvent.click(screen.getByRole('button', { name: '进入真实命盘结果页' }))

    expect(await screen.findByText('排盘失败，请检查出生信息后重试。若你使用农历/时辰，请确认输入完整。')).toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()
  })
})
