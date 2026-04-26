import { randomUUID } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { getDb, getPersistenceMode } from '@/lib/db'
import { getPrivateJson, putPrivateJson } from '@/lib/blob/session-store'
import type { QuizAnswer } from '@/lib/validation/quiz'

export const quizSessionStore = new Map<string, QuizAnswer>()

export async function getQuizSessionById(sessionId: string) {
  if (getPersistenceMode() === 'blob') {
    const record = await getPrivateJson(`quiz-sessions/${sessionId}.json`)
    return isQuizSessionRecord(record) ? record : null
  }

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
  if (getPersistenceMode() === 'blob') {
    const id = randomUUID()
    const session = { id, answer }
    await putPrivateJson(`quiz-sessions/${id}.json`, session)
    return session
  }

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

function isQuizAnswer(value: unknown): value is QuizAnswer {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.selfView === 'string' &&
    typeof record.relationshipPattern === 'string' &&
    typeof record.pressureSource === 'string' &&
    typeof record.growthFocus === 'string' &&
    typeof record.contentPreference === 'string'
  )
}

function isQuizSessionRecord(value: unknown): value is { id: string; answer: QuizAnswer } {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  return typeof record.id === 'string' && isQuizAnswer(record.answer)
}
