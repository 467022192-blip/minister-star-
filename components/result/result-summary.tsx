import { TrackedLink } from '@/components/analytics/tracked-link'

type ResultSummaryProps = {
  title: string
  tags: string[]
  sessionId: string
}

export function ResultSummary({ title, tags, sessionId }: ResultSummaryProps) {
  return (
    <section className="rounded-[2rem] border border-primary/10 bg-primary p-6 text-white shadow-editorial">
      <p className="text-sm uppercase tracking-[0.24em] text-white/70">摘要结果</p>
      <h1 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
      <div className="mt-6 flex flex-wrap gap-3">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <TrackedLink
          href={`/share/${sessionId}`}
          eventName="result_shared"
          eventPayload={{ sessionId, source: 'result-summary' }}
          className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-paper"
        >
          生成分享页
        </TrackedLink>
        <TrackedLink
          href={`/api/share-card/${sessionId}`}
          eventName="result_shared"
          eventPayload={{ sessionId, source: 'share-card-api' }}
          className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/85 transition-colors duration-200 hover:bg-white/5"
        >
          查看分享卡片数据
        </TrackedLink>
      </div>
    </section>
  )
}
