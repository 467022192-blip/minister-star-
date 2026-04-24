import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QuizForm } from '../../components/quiz/quiz-form'

const pushMock = vi.fn()
const submitQuizAnswersMock = vi.fn()
const emitAnalyticsEventMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('@/app/quiz/actions', () => ({
  submitQuizAnswers: (...args: unknown[]) => submitQuizAnswersMock(...args),
}))

vi.mock('@/lib/analytics/emit', () => ({
  emitAnalyticsEvent: (...args: unknown[]) => emitAnalyticsEventMock(...args),
}))

describe('QuizForm', () => {
  beforeEach(() => {
    pushMock.mockReset()
    submitQuizAnswersMock.mockReset()
    emitAnalyticsEventMock.mockReset()
  })

  it('persists the quiz session and routes users into chart input', async () => {
    submitQuizAnswersMock.mockResolvedValue({ id: 'quiz-123' })
    emitAnalyticsEventMock.mockResolvedValue({ ok: true })

    render(<QuizForm />)
    fireEvent.click(screen.getByRole('button', { name: '带着这份兴趣进入真实排盘' }))

    await waitFor(() => {
      expect(submitQuizAnswersMock).toHaveBeenCalledWith({
        selfView: 'steady',
        relationshipPattern: 'slow-burn',
        pressureSource: 'uncertainty',
        growthFocus: 'talent',
        contentPreference: 'balanced',
      })
      expect(emitAnalyticsEventMock).toHaveBeenCalledWith('quiz_completed', {
        quizSessionId: 'quiz-123',
        growthFocus: 'talent',
      })
      expect(pushMock).toHaveBeenCalledWith('/chart?quizSessionId=quiz-123')
    })
  })
})
