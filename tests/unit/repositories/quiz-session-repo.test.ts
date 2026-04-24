import { describe, expect, it } from 'vitest'
import { getQuizSessionById, saveQuizSession } from '../../../lib/repositories/quiz-session-repo'

describe('quiz session repository', () => {
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
})
