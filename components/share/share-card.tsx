import type { CalculatedChart } from '@/lib/ziwei/types'

type ShareCardProps = {
  title: string
  tags: string[]
  chart: CalculatedChart
}

export function ShareCard({ title, tags, chart }: ShareCardProps) {
  const structure = chart.structureSummary

  return (
    <div className="overflow-hidden rounded-[2rem] border border-primary/10 bg-primary text-white shadow-editorial">
      <div className="relative flex min-h-[420px] flex-col justify-between gap-8 p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.22),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(250,250,250,0.08),transparent_34%)]" />

        <div className="relative">
          <p className="text-sm uppercase tracking-[0.24em] text-white/60">紫微结果分享</p>
          <h1 className="mt-6 max-w-4xl font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
            {structure?.overview ?? `${chart.lifePalace}命宫，${chart.bodyPalace}身宫，先从主星与宫位轴线读取你的当前盘面重心。`}
          </p>
        </div>

        <div className="relative grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-white/48">盘面主轴</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <ShareMetric label="命宫" value={chart.lifePalace} hint={structure?.lifePalaceLabel ?? '人格主轴'} />
              <ShareMetric label="身宫" value={chart.bodyPalace} hint={structure?.bodyPalaceLabel ?? '行动重心'} />
              <ShareMetric label="四化" value={chart.transformationSet.join(' · ')} hint={structure?.transformationLabel ?? '变化线索'} />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-white/48">先读顺序</p>
            <div className="mt-4 space-y-3">
              {(structure?.focusPalaces ?? []).slice(0, 3).map((palace, index) => (
                <div key={palace.palaceName} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/10 p-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/12 text-xs text-white/70">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{palace.palaceName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">{palace.label}</p>
                    <p className="mt-2 text-sm leading-6 text-white/72">{palace.stars.length > 0 ? palace.stars.join(' · ') : palace.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex flex-wrap gap-3">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
              {tag}
            </span>
          ))}
          {structure?.focusTone ? (
            <span className="rounded-full border border-white/10 bg-[#EC4899]/20 px-4 py-2 text-sm text-white">{structure.focusTone}</span>
          ) : null}
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">{chart.primaryStars.join(' · ')}</span>
        </div>
      </div>
    </div>
  )
}

function ShareMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/46">{label}</p>
      <p className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/68">{hint}</p>
    </div>
  )
}
