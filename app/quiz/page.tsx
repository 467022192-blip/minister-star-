import Link from 'next/link'
import { QuizForm } from '@/components/quiz/quiz-form'

export default function QuizPage() {
  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">Quiz-first landing</p>
            <h1 className="mt-3 font-heading text-5xl font-semibold tracking-[-0.04em] text-primary sm:text-6xl">
              先做一个轻测试
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-secondary">
              这一页只做兴趣建立，不冒充真实命盘。你会先得到一个轻量自我认知摘要，再决定是否进入真实排盘。
            </p>
          </div>
          <Link
            href="/chart"
            className="inline-flex cursor-pointer items-center justify-center rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary hover:text-white"
          >
            我已经准备好直接排盘
          </Link>
        </div>

        <QuizForm />
      </div>
    </main>
  )
}
