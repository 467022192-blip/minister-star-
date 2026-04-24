import { z } from 'zod'

export const quizAnswerSchema = z.object({
  selfView: z.enum(['steady', 'sensitive', 'ambitious', 'curious']),
  relationshipPattern: z.enum(['slow-burn', 'direct', 'guarded', 'dependent']),
  pressureSource: z.enum(['uncertainty', 'relationships', 'money', 'self-doubt']),
  growthFocus: z.enum(['talent', 'love', 'career', 'timing']),
  contentPreference: z.enum(['summary', 'balanced', 'deep']),
})

export type QuizAnswer = z.infer<typeof quizAnswerSchema>

export function buildQuizPreview(answer: QuizAnswer) {
  const titleMap = {
    steady: '你像稳定推进型人格',
    sensitive: '你像高感知型人格',
    ambitious: '你像目标驱动型人格',
    curious: '你像探索变化型人格',
  } as const

  return {
    title: titleMap[answer.selfView],
    bullets: [
      `你最在意的主题是${answer.growthFocus}`,
      `关系表现更偏向${answer.relationshipPattern}`,
      '这是轻测试结果，不等同于真实紫微命盘。',
    ],
  }
}
