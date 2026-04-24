import { TrackedLink } from '@/components/analytics/tracked-link'

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-stone bg-paper">
      <div className="mx-auto grid min-h-[78vh] max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-20">
        <div className="flex flex-col justify-between gap-10">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-white px-4 py-2 text-sm text-secondary shadow-sm">
              大陆中文用户 · 轻测试引导 · 真实紫微排盘
            </div>
            <h1 className="max-w-4xl font-heading text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-primary sm:text-7xl lg:text-[7rem]">
              先看懂你的
              <span className="block text-accent">人格与关系模式</span>
              再进入真实命盘。
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-secondary sm:text-xl">
              用更现代、易懂的表达方式，把紫微斗数从“门槛很高的命理工具”变成可理解、可分享、可回流的内容体验。
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <TrackedLink
              href="/quiz"
              eventName="quiz_started"
              eventPayload={{ source: 'landing-hero' }}
              className="inline-flex cursor-pointer items-center justify-center rounded-full bg-accent px-7 py-4 text-base font-medium text-white shadow-editorial transition-colors duration-200 hover:bg-[#db2777]"
            >
              先做一个轻测试
            </TrackedLink>
            <TrackedLink
              href="/chart"
              eventName="chart_started"
              eventPayload={{ source: 'landing-hero' }}
              className="inline-flex cursor-pointer items-center justify-center rounded-full border border-primary px-7 py-4 text-base font-medium text-primary transition-colors duration-200 hover:bg-primary hover:text-white"
            >
              直接进入真实排盘
            </TrackedLink>
          </div>
        </div>

        <div className="relative">
          <div className="grid h-full gap-4 sm:grid-cols-2">
            <article className="flex min-h-56 flex-col justify-between rounded-[2rem] border border-primary/10 bg-white p-6 shadow-editorial">
              <div className="text-sm text-secondary">优先主题</div>
              <div>
                <h2 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-primary">人格 / 天赋</h2>
                <p className="mt-3 text-sm leading-7 text-secondary">
                  先从最容易引发共鸣的自我认知切入，再延展到关系与人生阶段。
                </p>
              </div>
            </article>
            <article className="flex min-h-56 flex-col justify-between rounded-[2rem] border border-accent/20 bg-blush p-6">
              <div className="text-sm text-secondary">转化逻辑</div>
              <div>
                <h2 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-primary">轻测试 → 排盘</h2>
                <p className="mt-3 text-sm leading-7 text-secondary">
                  先建立兴趣，再让用户填写出生信息进入真实结果页，降低首次进入门槛。
                </p>
              </div>
            </article>
            <article className="rounded-[2rem] border border-primary/10 bg-primary p-6 text-white sm:col-span-2">
              <div className="mb-8 flex items-center justify-between text-sm text-white/70">
                <span>站外内容回流</span>
                <span>小红书 / 抖音 / 公众号</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ['摘要结果', '一句抓人 + 三个标签'],
                  ['中度深读', '人格、关系、事业财运模块展开'],
                  ['分享回流', '结果 URL + 分享卡片'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h3 className="font-medium text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">{desc}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
