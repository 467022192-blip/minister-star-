import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { CtaCard } from '@/components/landing/cta-card'
import { Hero } from '@/components/landing/hero'

const contentModules = [
  {
    badge: '人格优先',
    title: '先看你为何会这样理解自己',
    description: '从人格与天赋切入，是最容易让泛兴趣用户快速产生共鸣的一层。',
    href: '/quiz',
  },
  {
    badge: '关系承接',
    title: '再展开你在关系里的模式',
    description: '把“我为什么在亲密关系里总会这样”做成更好传播的阅读结果。',
    href: '/quiz',
  },
  {
    badge: '真实排盘',
    title: '兴趣建立后再进入出生信息录入',
    description: '不是一上来就让用户填表，而是在兴趣被建立后引导进入真实命盘。',
    href: '/chart',
  },
]

export default function HomePage() {
  return (
    <main>
      <PageViewTracker eventName="landing_view" payload={{ page: 'home' }} />
      <Hero />

      <section className="border-b border-stone bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-secondary">内容增长结构</p>
              <h2 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.03em] text-primary sm:text-5xl">
                用内容、测试与真实结果页组成完整转化漏斗
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-secondary">
              这里不是传统命理工具站，而是一个先抓住兴趣、再引导进入真实排盘、最后靠结果页和分享卡片完成回流的内容型产品。
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {contentModules.map((item) => (
              <CtaCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
