import Link from 'next/link'
import { ChartForm } from '@/components/chart/chart-form'
import { getQuizSessionById } from '@/lib/repositories/quiz-session-repo'

const focusLabelMap = {
  talent: '人格与天赋',
  love: '感情与关系',
  career: '事业与财运',
  timing: '人生阶段与时机',
} as const

export default async function ChartPage({
  searchParams,
}: {
  searchParams: Promise<{ quizSessionId?: string }>
}) {
  const { quizSessionId } = await searchParams
  const quizSession = quizSessionId ? await getQuizSessionById(quizSessionId) : null

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">真实命盘入口</p>
            <h1 className="mt-3 font-heading text-5xl font-semibold tracking-[-0.04em] text-primary sm:text-6xl">
              进入真实紫微排盘
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-secondary">
              首版必须是真实排盘，不做“紫微风格内容生成站”。这一步收集关键出生信息，为后续结构化命盘和分层结果页做准备。
            </p>
          </div>
          <Link
            href="/quiz"
            className="inline-flex cursor-pointer items-center justify-center rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary hover:text-white"
          >
            还想先做轻测试
          </Link>
        </div>

        {quizSession ? (
          <section className="mb-8 rounded-[1.75rem] border border-accent/20 bg-blush px-6 py-5 text-sm leading-7 text-secondary shadow-sm">
            已承接轻测试偏好：你刚才更想先看
            <span className="mx-1 font-medium text-primary">{focusLabelMap[quizSession.answer.growthFocus]}</span>
            。现在继续补全真实出生信息，进入持久化结果页。
          </section>
        ) : null}

        <ChartForm />
      </div>
    </main>
  )
}
