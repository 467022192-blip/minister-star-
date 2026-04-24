import type { CalculatedChart } from '@/lib/ziwei/types'

type ChartStructureSummaryProps = {
  chart: CalculatedChart
}

const inputLabels = {
  solar: '公历',
  lunar: '农历',
  female: '女命',
  male: '男命',
  zi: '子时',
  chou: '丑时',
  yin: '寅时',
  mao: '卯时',
  chen: '辰时',
  si: '巳时',
  wu: '午时',
  wei: '未时',
  shen: '申时',
  you: '酉时',
  xu: '戌时',
  hai: '亥时',
} as const

export function ChartStructureSummary({ chart }: ChartStructureSummaryProps) {
  const structure = chart.structureSummary
  const importantPalaces = chart.palaces.filter(
    (palace) => palace.stars.length > 0 || palace.palaceName === chart.lifePalace || palace.palaceName === chart.bodyPalace,
  )

  const contextChips = [
    chart.inputContext?.calendarType ? inputLabels[chart.inputContext.calendarType] : null,
    chart.inputContext?.gender ? inputLabels[chart.inputContext.gender] : null,
    chart.inputContext?.timeBranch ? inputLabels[chart.inputContext.timeBranch] : null,
  ].filter(Boolean)

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[2rem] border border-primary/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">盘面结构摘要</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.03em] text-primary sm:text-4xl">
              {structure?.title ?? '先看命宫、身宫与主星落点'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
              {structure?.overview ?? '这部分直接读取已持久化的排盘结果，用来先判断人格重心、行动投射与当前 MVP 规则下已命中的关键星曜。'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-secondary">
            {contextChips.map((chip) => (
              <span key={chip} className="rounded-full border border-primary/10 bg-paper px-3 py-2">
                {chip}
              </span>
            ))}
            <span className="rounded-full border border-primary/10 bg-paper px-3 py-2">规则源 {chart.ruleBasisId}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="命宫" value={chart.lifePalace} hint={structure?.lifePalaceLabel ?? '人格主轴落点'} />
          <MetricCard label="身宫" value={chart.bodyPalace} hint={structure?.bodyPalaceLabel ?? '行动投射重心'} />
          <MetricCard label="主星" value={chart.primaryStars.join(' · ')} hint="当前规则已命中主星" />
          <MetricCard label="四化" value={chart.transformationSet.join(' · ')} hint={structure?.transformationLabel ?? '当前规则输出四化'} />
        </div>
      </div>

      <aside className="rounded-[2rem] border border-primary/10 bg-primary p-6 text-white shadow-editorial">
        <p className="text-sm uppercase tracking-[0.24em] text-white/65">重点宫位</p>
        <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.03em]">先读关键宫位</h3>

        <div className="mt-6 space-y-3">
          {(structure?.focusPalaces.length ?? 0) > 0 ? (
            structure?.focusPalaces.map((palace) => (
              <article key={palace.palaceName} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-medium text-white">{palace.palaceName}</p>
                  {palace.palaceName === chart.lifePalace ? <PalaceBadge label="命宫落点" /> : null}
                  {palace.palaceName === chart.bodyPalace ? <PalaceBadge label="身宫落点" /> : null}
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/52">{palace.label}</p>
                <p className="mt-2 text-sm leading-7 text-white/78">{palace.summary}</p>
                <p className="mt-3 text-sm leading-7 text-white/78">{palace.stars.length > 0 ? palace.stars.join(' · ') : '当前会话暂无已命中星曜摘要'}</p>
              </article>
            ))
          ) : importantPalaces.length > 0 ? (
            importantPalaces.map((palace) => (
              <article key={palace.palaceIndex} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-medium text-white">{palace.palaceName}</p>
                  {palace.palaceName === chart.lifePalace ? <PalaceBadge label="命宫落点" /> : null}
                  {palace.palaceName === chart.bodyPalace ? <PalaceBadge label="身宫落点" /> : null}
                </div>
                <p className="mt-2 text-sm leading-7 text-white/78">{palace.stars.length > 0 ? palace.stars.join(' · ') : '当前会话暂无已命中星曜摘要'}</p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/78">
              当前持久化会话未包含宫位明细，可先结合上方命宫、身宫与主星摘要阅读解读模块。
            </div>
          )}
        </div>
      </aside>

      <div className="rounded-[2rem] border border-primary/10 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 pb-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">宫位分布</p>
            <h3 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.03em] text-primary">十二宫位分布</h3>
          </div>
          <p className="text-sm text-secondary">先展示当前规则已命中的主星与辅助星，不做页面临时重算。</p>
        </div>

        {chart.palaces.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {chart.palaces.map((palace) => {
              const isLifePalace = palace.palaceName === chart.lifePalace
              const isBodyPalace = palace.palaceName === chart.bodyPalace

              return (
                <article
                  key={palace.palaceIndex}
                  className={`rounded-2xl border p-4 transition-colors duration-200 ${
                    isLifePalace || isBodyPalace ? 'border-primary bg-primary text-white' : 'border-primary/10 bg-paper text-primary'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-medium">{palace.palaceName}</p>
                    {isLifePalace ? <InlineMarker label="命宫" inverted={isLifePalace || isBodyPalace} /> : null}
                    {isBodyPalace ? <InlineMarker label="身宫" inverted={isLifePalace || isBodyPalace} /> : null}
                  </div>
                  <p className={`mt-3 text-sm leading-7 ${isLifePalace || isBodyPalace ? 'text-white/80' : 'text-secondary'}`}>
                    {palace.stars.length > 0 ? palace.stars.join(' · ') : '—'}
                  </p>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-primary/15 bg-paper p-5 text-sm leading-7 text-secondary">
            当前持久化会话缺少宫位数组，因此这里只展示上方核心摘要，不对页面做临时补算。
          </div>
        )}
      </div>
    </section>
  )
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="rounded-2xl border border-primary/10 bg-paper p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-secondary">{label}</p>
      <p className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-primary">{value}</p>
      <p className="mt-2 text-sm leading-6 text-secondary">{hint}</p>
    </article>
  )
}

function PalaceBadge({ label }: { label: string }) {
  return <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/78">{label}</span>
}

function InlineMarker({ label, inverted }: { label: string; inverted: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs ${
        inverted ? 'border border-white/15 bg-white/10 text-white/80' : 'border border-primary/10 bg-white text-secondary'
      }`}
    >
      {label}
    </span>
  )
}
