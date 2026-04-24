'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitQuizAnswers } from '@/app/quiz/actions'
import { emitAnalyticsEvent } from '@/lib/analytics/emit'
import { buildQuizPreview, quizAnswerSchema, type QuizAnswer } from '@/lib/validation/quiz'

const initialState: QuizAnswer = {
  selfView: 'steady',
  relationshipPattern: 'slow-burn',
  pressureSource: 'uncertainty',
  growthFocus: 'talent',
  contentPreference: 'balanced',
}

const options = {
  selfView: [
    ['steady', '稳定推进'],
    ['sensitive', '高敏感知'],
    ['ambitious', '目标驱动'],
    ['curious', '探索变化'],
  ],
  relationshipPattern: [
    ['slow-burn', '慢热观察'],
    ['direct', '直接表达'],
    ['guarded', '先保护自己'],
    ['dependent', '容易投入依赖'],
  ],
  pressureSource: [
    ['uncertainty', '未来不确定'],
    ['relationships', '关系拉扯'],
    ['money', '金钱与现实'],
    ['self-doubt', '对自己不够确定'],
  ],
  growthFocus: [
    ['talent', '人格与天赋'],
    ['love', '感情与关系'],
    ['career', '事业与财运'],
    ['timing', '人生阶段与时机'],
  ],
  contentPreference: [
    ['summary', '先看摘要'],
    ['balanced', '摘要 + 中度深读'],
    ['deep', '尽可能详细'],
  ],
} as const

export function QuizForm() {
  const router = useRouter()
  const [answers, setAnswers] = useState<QuizAnswer>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const preview = useMemo(() => buildQuizPreview(quizAnswerSchema.parse(answers)), [answers])

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const session = await submitQuizAnswers(answers)
      await emitAnalyticsEvent('quiz_completed', {
        quizSessionId: session.id,
        growthFocus: answers.growthFocus,
      })
      router.push(`/chart?quizSessionId=${session.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.88fr]">
      <form className="space-y-8 rounded-[2rem] border border-primary/10 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-secondary">轻测试</p>
          <h2 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.03em] text-primary">
            用 5 个问题先建立兴趣
          </h2>
        </div>

        {(Object.keys(options) as Array<keyof typeof options>).map((key) => (
          <fieldset key={key} className="space-y-3">
            <legend className="mb-2 text-sm font-medium text-primary">{questionMap[key]}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {options[key].map(([value, label]) => {
                const active = answers[key] === value

                return (
                  <button
                    key={value}
                    type="button"
                    className={`cursor-pointer rounded-2xl border px-4 py-4 text-left transition-colors duration-200 ${
                      active
                        ? 'border-primary bg-primary text-white'
                        : 'border-primary/10 bg-paper text-primary hover:border-primary/30'
                    }`}
                    onClick={() => setAnswers((current) => ({ ...current, [key]: value } as QuizAnswer))}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            void handleSubmit()
          }}
          className="inline-flex cursor-pointer items-center justify-center rounded-full bg-primary px-7 py-4 text-base font-medium text-white transition-colors duration-200 hover:bg-secondary disabled:cursor-not-allowed disabled:bg-secondary/60"
        >
          {isSubmitting ? '正在保存轻测试...' : '带着这份兴趣进入真实排盘'}
        </button>
      </form>

      <aside className="rounded-[2rem] border border-accent/15 bg-blush p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-secondary">即时预览</p>
        <h3 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.03em] text-primary">
          {preview.title}
        </h3>
        <ul className="mt-6 space-y-3 text-sm leading-7 text-secondary">
          {preview.bullets.map((item) => (
            <li key={item} className="rounded-2xl border border-primary/10 bg-white px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}

const questionMap = {
  selfView: '你更像哪种自我驱动方式？',
  relationshipPattern: '你进入关系时更常见的状态？',
  pressureSource: '最近更容易卡住你的地方？',
  growthFocus: '你最想先展开哪个主题？',
  contentPreference: '你想看的结果深度？',
} as const
