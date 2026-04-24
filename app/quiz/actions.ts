'use server'

import { saveQuizSession } from '@/lib/repositories/quiz-session-repo'
import { quizAnswerSchema, type QuizAnswer } from '@/lib/validation/quiz'

export async function submitQuizAnswers(answer: QuizAnswer) {
  const parsed = quizAnswerSchema.parse(answer)
  return saveQuizSession(parsed)
}
