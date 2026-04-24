import { randomUUID } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { getDb, getPersistenceMode } from '@/lib/db'
import type { QuizAnswer } from '@/lib/validation/quiz'

export const quizSessionStore = new Map<string, QuizAnswer>()

export async function getQuizSessionById(sessionId: string) {
  if (getPersistenceMode() === 'prisma') {
    const session = await getDb().quizSession.findUnique({ where: { id: sessionId } })

    return session
      ? {
          id: session.id,
          answer: session.payload as QuizAnswer,
        }
      : null
  }

  const answer = quizSessionStore.get(sessionId)
  return answer ? { id: sessionId, answer } : null
}

export async function saveQuizSession(answer: QuizAnswer) {
  if (getPersistenceMode() === 'prisma') {
    const session = await getDb().quizSession.create({
      data: {
        payload: answer as Prisma.InputJsonValue,
      },
    })

    return {
      id: session.id,
      answer: session.payload as QuizAnswer,
    }
  }

  const id = randomUUID()
  quizSessionStore.set(id, answer)
  return { id, answer }
}
