'use client'

import { useState } from 'react'
import type { ChartInterpretation } from '@/lib/ziwei/types'

type SectionKey = keyof ChartInterpretation['sections']

const sectionOrder: Array<{ key: SectionKey; label: string }> = [
  { key: 'personality', label: '人格与天赋' },
  { key: 'relationship', label: '感情模式' },
  { key: 'careerWealth', label: '事业与财运' },
]

export function ResultSections({ sections }: { sections: ChartInterpretation['sections'] }) {
  const [active, setActive] = useState<SectionKey>('personality')
  const current = sections[active]

  return (
    <section className="rounded-[2rem] border border-primary/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-3 border-b border-primary/10 pb-5">
        {sectionOrder.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active === item.key}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm transition-colors duration-200 ${
              active === item.key ? 'bg-primary text-white' : 'bg-paper text-primary hover:bg-stone'
            }`}
            onClick={() => setActive(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <h2 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-primary">{current.title}</h2>
          <p className="mt-2 text-sm text-secondary">规则命中：{current.ruleIds.join(' / ')}</p>
        </div>
        {current.blocks.map((block) => (
          <article key={block} className="rounded-2xl border border-primary/10 bg-paper p-4 text-sm leading-7 text-secondary">
            {block}
          </article>
        ))}
      </div>
    </section>
  )
}
